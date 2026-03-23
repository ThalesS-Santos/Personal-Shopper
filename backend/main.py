import os
import time
import uuid
import logging
import functools
from typing import List, Union
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, constr
from dotenv import load_dotenv
from pathlib import Path
from contextvars import ContextVar
import requests
import traceback
from url_sanitizer import sanitize_text

# Google Gemini New SDK
from google import genai
from google.genai import types, errors

# SlowAPI for Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- 1. Configuração de Variáveis Globais e Contexto ---
request_trace_id: ContextVar[str] = ContextVar("request_trace_id", default="SYSTEM")

# --- 2. Exceções Customizadas (Arquitetura de Erros) ---
class AppBaseException(Exception):
    def __init__(self, error_code: str, provider: str, suggested_action: str, trace_id: str, message: str = ""):
        self.error_code = error_code
        self.provider = provider
        self.suggested_action = suggested_action
        self.trace_id = trace_id
        self.message = message

class ProviderQuotaException(AppBaseException): pass
class ProviderTimeoutException(AppBaseException): pass
class IntegrationDataException(AppBaseException): pass

# --- 3. Configuração de Logging Profissional (Arquivo + Console) ---
LOG_FILE = "backend_error.log"

log_formatter = logging.Formatter(
    "%(asctime)s - [%(levelname)s] - %(name)s - (%(filename)s:%(lineno)d) - %(message)s"
)

file_handler = logging.FileHandler(LOG_FILE, mode='a', encoding='utf-8')
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.WARNING)

console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logging.INFO)

root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

logger = logging.getLogger("gabi_shopper_api")

# --- 4. Segurança e Variáveis de Ambiente ---
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
RAINFOREST_KEY = os.getenv("RAINFOREST_API_KEY")

if not API_KEY:
    logger.critical("Erro Crítico: GEMINI_API_KEY não encontrada no arquivo .env")
    raise ValueError("GEMINI_API_KEY must be set in .env")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# --- 5. Configuração do Rate Limiting ---
limiter = Limiter(key_func=get_remote_address)


# --- 6. Provider Registry Decorator ---
def with_provider_registry(provider_name: str):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            trace_id = request_trace_id.get()
            try:
                result = func(*args, **kwargs)
                
                # Tratamento específico Rainforest (Product Not Found vs Rate Limit)
                if provider_name == "Rainforest" and isinstance(result, dict) and "error" in result:
                    erro_msg = result["error"].lower()
                    if "not found" in erro_msg or "product not found" in erro_msg:
                        raise IntegrationDataException(
                            error_code="NOT_FOUND", provider=provider_name,
                            suggested_action="Verificar termo de busca", trace_id=trace_id, message="Produto não encontrado"
                        )
                    elif "rate limit" in erro_msg or "quota" in erro_msg:
                        raise ProviderQuotaException(
                            error_code="RATE_LIMIT", provider=provider_name,
                            suggested_action="Aguardar Reset de Limite", trace_id=trace_id, message="Quota excedida (Payload Error)"
                        )
                    else:
                        raise IntegrationDataException(
                            error_code="API_ERROR", provider=provider_name,
                            suggested_action="Verificar disponibilidade", trace_id=trace_id, message=result["error"]
                        )
                        
                latency = round((time.time() - start_time) * 1000, 2)
                logger.info(f"[TRACE:{trace_id}] PROVIDER_SUCCESS:{provider_name} LATENCY:{latency}ms")
                return result
                
            except requests.exceptions.Timeout as e:
                latency = round((time.time() - start_time) * 1000, 2)
                logger.error(f"[TRACE:{trace_id}] PROVIDER_ERROR:{provider_name} STATUS:408 LATENCY:{latency}ms ERROR: Timeout")
                raise ProviderTimeoutException(
                    error_code="TIMEOUT", provider=provider_name,
                    suggested_action="Tentar novamente mais tarde", trace_id=trace_id, message="Tempo limite atingido."
                )
            except requests.exceptions.HTTPError as e:
                latency = round((time.time() - start_time) * 1000, 2)
                http_status = e.response.status_code if e.response is not None else 500
                logger.error(f"[TRACE:{trace_id}] PROVIDER_ERROR:{provider_name} STATUS:{http_status} LATENCY:{latency}ms ERROR: {str(e)}")
                
                if http_status == 429:
                    raise ProviderQuotaException(
                        error_code="RATE_LIMIT", provider=provider_name,
                        suggested_action="Aguardar Reset de Limite", trace_id=trace_id, message="Muitas requisições enviadas."
                    )
                raise IntegrationDataException(
                    error_code="HTTP_ERROR", provider=provider_name,
                    suggested_action="Verificar dados enviados", trace_id=trace_id, message=f"Erro HTTP {http_status}"
                )
            except errors.ClientError as e:
                latency = round((time.time() - start_time) * 1000, 2)
                logger.warning(f"[TRACE:{trace_id}] PROVIDER_ERROR:{provider_name} STATUS:400 LATENCY:{latency}ms ERROR: {e}")
                raise IntegrationDataException(
                    error_code="BAD_REQUEST", provider=provider_name,
                    suggested_action="Mensagem bloqueada ou inválida. Tente mudar o assunto.", trace_id=trace_id, message=str(e)
                )
            except errors.ServerError as e:
                latency = round((time.time() - start_time) * 1000, 2)
                logger.error(f"[TRACE:{trace_id}] PROVIDER_ERROR:{provider_name} STATUS:500 LATENCY:{latency}ms ERROR: {e}")
                if "429" in str(e) or getattr(e, 'code', None) == 429:
                    raise ProviderQuotaException(
                        error_code="RATE_LIMIT", provider=provider_name,
                        suggested_action="Aguardar Reset de Limite", trace_id=trace_id, message="Quota excedida"
                    )
                raise IntegrationDataException(
                    error_code="SERVER_ERROR", provider=provider_name,
                    suggested_action="A Inteligência Artificial está processando muitas infos. Tente depois.", trace_id=trace_id, message=str(e)
                )
            except AppBaseException:
                raise
            except Exception as e:
                latency = round((time.time() - start_time) * 1000, 2)
                logger.error(f"[TRACE:{trace_id}] PROVIDER_ERROR:{provider_name} STATUS:500 LATENCY:{latency}ms ERROR: {str(e)}")
                raise IntegrationDataException(
                    error_code="INTERNAL_ERROR", provider=provider_name,
                    suggested_action="Tentar novamente mais tarde", trace_id=trace_id, message="Erro inesperado."
                )
        return wrapper
    return decorator

# --- 7. Ferramentas (Tools) refatoradas com o Decorator ---

@with_provider_registry(provider_name="SerpApi_Shopping")
def search_google_shopping(product_name: str):
    """Busca preços e lojas reais no Google Shopping via SerpApi."""
    if not SERPAPI_KEY: 
        logger.warning(f"[TRACE:{request_trace_id.get()}] SERPAPI_KEY não configurada.")
        return {"error": "SerpApi key missing"}
    
    url = "https://serpapi.com/search"
    params = {
        "engine": "google_shopping",
        "q": product_name,
        "hl": "pt-br",
        "gl": "br",
        "api_key": SERPAPI_KEY
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    results = data.get("shopping_results", [])[:3]
    return [{"title": r.get("title"), "price": r.get("price"), "source": r.get("source"), "link": r.get("link")} for r in results]

@with_provider_registry(provider_name="Rainforest")
def search_amazon_prices(product_name: str):
    """Busca preços e disponibilidade na Amazon via Rainforest API."""
    if not RAINFOREST_KEY: 
        logger.warning(f"[TRACE:{request_trace_id.get()}] RAINFOREST_API_KEY não configurada.")
        return {"error": "Rainforest key missing"}
    
    url = "https://api.rainforestapi.com/request"
    params = {
        "api_key": RAINFOREST_KEY,
        "type": "search",
        "amazon_domain": "amazon.com.br",
        "search_term": product_name
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    
    if "request_info" in data and not data["request_info"].get("success", True):
         return {"error": data["request_info"].get("message", "Unknown error")}
         
    results = data.get("search_results", [])[:2]
    return [{"title": r.get("title"), "price": r.get("price", {}).get("raw"), "link": r.get("link")} for r in results]

@with_provider_registry(provider_name="SerpApi_Technical")
def search_technical_specs(query: str):
    """Busca especificações técnicas, reviews e detalhes de durabilidade na web."""
    if not SERPAPI_KEY:
        logger.warning(f"[TRACE:{request_trace_id.get()}] SERPAPI_KEY não configurada (Specs).")
        return {"error": "SerpApi key missing"}
    
    url = "https://serpapi.com/search"
    params = {
        "engine": "google",
        "q": query + " especificações técnicas ficha técnica",
        "hl": "pt-br",
        "gl": "br",
        "api_key": SERPAPI_KEY
    }
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    results = data.get("organic_results", [])[:2]
    return [{"title": r.get("title"), "snippet": r.get("snippet"), "link": r.get("link")} for r in results]

TOOLS = [
    search_google_shopping,
    search_amazon_prices,
    search_technical_specs
]

client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = """
# PERSONA
Você é a 'Gabi', uma assistente pessoal de compras brasileira, expert em eletrodomésticos. Seu tom é amigável, como uma amiga próxima, mas com autoridade técnica. Você fala de forma 'abrasileirada', usa emojis ocasionalmente e é sempre breve.

# FLUXO DE DESCOBERTA NATURAL (Discovery)
Não faça um "interrogatório". Faça perguntas de descoberta naturalmente ao longo da conversa, APENAS quando relevante para o produto em questão.
Dados importantes para descobrir (não pergunte tudo de uma vez):
- **Voltagem**: 110v ou 220v? (Essencial para qualquer elétrico).
- **Tamanho da Família**: Mora sozinho? Casal? Tem filhos? (Essencial para geladeiras e máquinas de lavar).
- **Espaço**: Tem restrição de medida?

# VOCABULÁRIO ESPECÍFICO (ATENÇÃO MÁXIMA)
- **"Geladeira 2 Portas"**: Para este usuário, isso geralmente significa **French Door** (duas portas lado a lado em cima e freezer embaixo) ou **Side-by-Side**.
- **NÃO confunda** com "Duplex" (uma porta em cima da outra). Se o usuário pedir "2 portas", confirme se ele quer "aquelas que abrem para os lados (French Door)".
- **Inverse**: Geladeira com freezer embaixo.

# DIRETRIZES RAG (OBRIGATÓRIO)
- **NÃO DIGA** "Vou pesquisar" ou "Aguarde um momento". **Apenas pesquise** silenciosamente e já traga a resposta com os dados.
- Antes de recomendar qualquer produto, SEMPRE valide preços e estoque real usando `search_google_shopping` ou `search_amazon_prices`.
- Use `search_technical_specs` para validar detalhes técnicos.
- Se houver divergência de preços, aponte a melhor oportunidade de custo-benefício.

# MECANISMOS DE SEGURANÇA (GUARDRAILS)
1. FOCO TOTAL: Se o usuário perguntar sobre qualquer assunto fora de eletrodomésticos, desconverse educadamente. EXCEÇÃO: Você pode responder perguntas sobre quem é você (Gabi) ou sobre o usuário (nome, preferências) se ele perguntar.
2. COMPORTAMENTO: Nunca use palavras de baixo calão.
3. PRIVACIDADE: Nunca peça dados sensíveis (CPF, cartão).
4. FORMATAÇÃO:
   - Destaque produtos e preços em negrito.
   - **LINKS MÁXIMA PRIORIDADE**: Você deve usar APENAS formato Markdown `[Texto do Item](URL)` e NUNCA exibir a URL nua (crua).
   - **FALLBACK DE BUSCA**: Se o ID do produto não for retornado pela API de busca com 100% de confiança ou tiver dúvidas sobre o link, gere o link para a página de resultados de busca do site. Ex: `[Nome do Produto](https://www.google.com/search?tbm=shop&q=nome+do+produto)`.
"""

SAFETY_SETTINGS = [
    types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_MEDIUM_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_MEDIUM_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_MEDIUM_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_MEDIUM_AND_ABOVE"),
]

CHAT_CONFIG = types.GenerateContentConfig(
    system_instruction=SYSTEM_INSTRUCTION,
    safety_settings=SAFETY_SETTINGS,
    tools=TOOLS,
    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=False, maximum_remote_calls=30),
    temperature=0.2,   
    top_p=0.8,
    max_output_tokens=1024,
)

class Message(BaseModel):
    role: str = Field(..., pattern="^(user|bot)$")
    content: constr(min_length=1, max_length=2000)

class ChatRequest(BaseModel):
    message: constr(min_length=1, max_length=1000)
    history: List[Message]
    user_context: Union[dict, None] = None

class ChatResponse(BaseModel):
    response: str
    trace_id: str

# --- 8. Inicialização do FastAPI e Handlers de Erro ---
app = FastAPI(title="Gabi Personal Shopper - API Produção")
app.state.limiter = limiter

@app.middleware("http")
async def add_trace_id_middleware(request: Request, call_next):
    trace_id = str(uuid.uuid4())
    request_trace_id.set(trace_id)
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["X-Trace-ID"] = trace_id
    return response

@app.exception_handler(AppBaseException)
async def app_base_exception_handler(request: Request, exc: AppBaseException):
    return JSONResponse(
        status_code=400 if exc.error_code in ["BAD_REQUEST"] else (429 if exc.error_code == "RATE_LIMIT" else 500),
        content={
            "error_code": exc.error_code,
            "provider": exc.provider,
            "suggested_action": exc.suggested_action,
            "trace_id": exc.trace_id
        }
    )

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    trace_id = getattr(request.state, 'trace_id', "UNKNOWN")
    logger.warning(f"[TRACE:{trace_id}] Rate Limit Excedido IP: {request.client.host}")
    return JSONResponse(
        status_code=429,
        content={
            "error_code": "RATE_LIMIT_EXCEEDED",
            "provider": "Backend_Limiter",
            "suggested_action": "Você enviou muitas mensagens rápido demais. Aguarde um minuto.",
            "trace_id": trace_id
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    trace_id = getattr(request.state, 'trace_id', request_trace_id.get("SYSTEM"))
    logger.critical(f"[TRACE:{trace_id}] Erro Interno Não Tratado: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "provider": "Backend_Core",
            "suggested_action": "Ocorreu um erro letal no sistema. Considere reportar com o Trace ID.",
            "trace_id": trace_id
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Gabi Personal Shopper API is running!", "endpoints": ["/chat", "/health"]}

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": MODEL_NAME}

@with_provider_registry(provider_name="Gemini")
def do_gemini_call(chat, message):
    return chat.send_message(message)

@app.post("/chat", response_model=ChatResponse)
@limiter.limit("60/minute") 
async def chat_endpoint(request: Request, chat_req: ChatRequest):
    trace_id = request.state.trace_id
    logger.info(f"CHAT_REQ [TRACE:{trace_id}]: IP={request.client.host} | Msg='{chat_req.message[:50]}...'")
    
    gemini_history = []
    
    if chat_req.user_context:
        context_str = f"""
        CONTEXTO DO USUÁRIO ATUAL:
        - Nome: {chat_req.user_context.get('displayName', 'Amigo(a)')}
        - Preferências/Estilo: {chat_req.user_context.get('stylePreference', 'Não informado')}
        - Telefone: {chat_req.user_context.get('phoneNumber', 'Não informado')}
        
        Use essas informações para personalizar o atendimento. Se o usuário tiver um estilo definido, leve isso em conta nas recomendações.
        """
        gemini_history.append(types.Content(
            role="user",
            parts=[types.Part(text=f"SYSTEM_NOTE: {context_str}")]
        ))
        gemini_history.append(types.Content(
            role="model",
            parts=[types.Part(text="Entendido! Vou personalizar o atendimento para este usuário.")]
        ))

    for msg in chat_req.history:
        role = "model" if msg.role == "bot" else "user"
        gemini_history.append(types.Content(
            role=role,
            parts=[types.Part(text=msg.content)]
        ))

    chat = client.chats.create(
        model=MODEL_NAME,
        config=CHAT_CONFIG,
        history=gemini_history
    )
    
    response = do_gemini_call(chat, chat_req.message)
    
    if not response or not response.text:
        logger.error(f"[TRACE:{trace_id}] Gemini retornou resposta vazia: {response.model_dump_json() if response else 'None'}")
        raise IntegrationDataException(
            error_code="EMPTY_RESPONSE", provider="Gemini",
            suggested_action="O modelo gerou uma resposta nula. Tente novamente.", trace_id=trace_id, message="Empty response"
        )

    logger.info(f"CHAT_RES [TRACE:{trace_id}]: Sucesso.")
    sanitized_response = sanitize_text(response.text)
    return {"response": sanitized_response, "trace_id": trace_id}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Iniciando API Gabi Personal Shopper na porta 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
