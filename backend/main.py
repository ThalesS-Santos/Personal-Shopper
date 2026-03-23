import os
import logging
from typing import List, Union
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, constr
from dotenv import load_dotenv
from pathlib import Path
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

# --- 1. Configuração de Logging Profissional (Arquivo + Console) ---
LOG_FILE = "backend_error.log"

# Formatador detalhado
log_formatter = logging.Formatter(
    "%(asctime)s - [%(levelname)s] - %(name)s - (%(filename)s:%(lineno)d) - %(message)s"
)

# Handler de Arquivo (guarda o histórico de erros)
file_handler = logging.FileHandler(LOG_FILE, mode='a', encoding='utf-8')
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.WARNING) # No arquivo salva apenas avisos e erros

# Handler de Console (para ver em tempo real)
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logging.INFO)

# Configuração do Logger Raiz
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

logger = logging.getLogger("gabi_shopper_api")

# --- 2. Segurança e Variáveis de Ambiente ---
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
RAINFOREST_KEY = os.getenv("RAINFOREST_API_KEY")

if not API_KEY:
    logger.critical("Erro Crítico: GEMINI_API_KEY não encontrada no arquivo .env")
    raise ValueError("GEMINI_API_KEY must be set in .env")

# Origens permitidas (CORS) - Recomendado configurar no .env para produção
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# --- 3. Configuração do Rate Limiting ---
# Limita o número de requisições por IP para evitar abusos e custos inesperados
limiter = Limiter(key_func=get_remote_address)

# --- 4. Ferramentas e Configuração do Gemini ---

# ... (Funções de busca RAG mantidas iguais, mas usando o novo logger)
def search_google_shopping(product_name: str):
    """Busca preços e lojas reais no Google Shopping via SerpApi."""
    logger.info(f"RAG: Buscando no Google Shopping: {product_name}")
    if not SERPAPI_KEY: 
        logger.warning("SERPAPI_KEY não configurada.")
        return {"error": "SerpApi key missing"}
    
    url = "https://serpapi.com/search"
    params = {
        "engine": "google_shopping",
        "q": product_name,
        "hl": "pt-br",
        "gl": "br",
        "api_key": SERPAPI_KEY
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        results = data.get("shopping_results", [])[:3]
        return [{"title": r.get("title"), "price": r.get("price"), "source": r.get("source"), "link": r.get("link")} for r in results]
    except Exception as e:
        logger.error(f"Erro SerpApi: {str(e)}", exc_info=True)
        return {"error": "Falha no Google Shopping"}

def search_amazon_prices(product_name: str):
    """Busca preços e disponibilidade na Amazon via Rainforest API."""
    logger.info(f"RAG: Buscando na Amazon: {product_name}")
    if not RAINFOREST_KEY: 
        logger.warning("RAINFOREST_API_KEY não configurada.")
        return {"error": "Rainforest key missing"}
    
    url = "https://api.rainforestapi.com/request"
    params = {
        "api_key": RAINFOREST_KEY,
        "type": "search",
        "amazon_domain": "amazon.com.br",
        "search_term": product_name
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        results = response.json().get("search_results", [])[:2]
        return [{"title": r.get("title"), "price": r.get("price", {}).get("raw"), "link": r.get("link")} for r in results]
    except Exception as e:
        logger.error(f"Erro Rainforest: {str(e)}", exc_info=True)
        return {"error": "Falha na Amazon"}

def search_technical_specs(query: str):
    """Busca especificações técnicas, reviews e detalhes de durabilidade na web."""
    logger.info(f"RAG: Buscando especificações técnicas: {query}")
    if not SERPAPI_KEY:
        logger.warning("SERPAPI_KEY não configurada (Specs).")
        return {"error": "SerpApi key missing"}
    
    url = "https://serpapi.com/search"
    params = {
        "engine": "google",
        "q": query + " especificações técnicas ficha técnica",
        "hl": "pt-br",
        "gl": "br",
        "api_key": SERPAPI_KEY
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        results = data.get("organic_results", [])[:2]
        return [{"title": r.get("title"), "snippet": r.get("snippet"), "link": r.get("link")} for r in results]
    except Exception as e:
        logger.error(f"Erro Busca Técnica: {str(e)}", exc_info=True)
        return {"error": "Falha na busca técnica"}

# 2. Definição das Tools (Unificadas para compatibilidade com 2.5-flash)
TOOLS = [
    search_google_shopping,
    search_amazon_prices,
    search_technical_specs
]


client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-flash"

# Persona Especialista com Guardrails e Instruções de Tools
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

# Configurações de Segurança Nativas do Modelo (Safety Settings)
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

# --- 5. Modelos de Dados (Pydantic) ---
class Message(BaseModel):
    role: str = Field(..., pattern="^(user|bot)$")
    content: constr(min_length=1, max_length=2000)

class ChatRequest(BaseModel):
    message: constr(min_length=1, max_length=1000)
    history: List[Message]
    user_context: Union[dict, None] = None

class ChatResponse(BaseModel):
    response: str

# --- 6. Inicialização do FastAPI e Handlers de Erro ---
app = FastAPI(title="Gabi Personal Shopper - API Produção")
app.state.limiter = limiter

# Tratamento Global de Exceções
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"Erro Interno Não Tratado: {str(exc)}"
    logger.critical(error_msg, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Desculpe, a Gabi teve um imprevisto técnico interno. Nossa equipe já foi notificada.", "error_code": "INTERNAL_SERVER_ERROR"}
    )

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate Limit Excedido IP: {request.client.host}")
    return JSONResponse(
        status_code=429,
        content={"detail": "Você está enviando muitas mensagens muito rápido! Espere um pouquinho.", "error_code": "RATE_LIMIT_EXCEEDED"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# --- 7. Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Gabi Personal Shopper API is running!", "endpoints": ["/chat", "/health"]}

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": MODEL_NAME}

@app.post("/chat", response_model=ChatResponse)
@limiter.limit("60/minute") # Rate limit de 60 mensagens por minuto
async def chat_endpoint(request: Request, chat_req: ChatRequest):
    logger.info(f"CHAT_REQ: IP={request.client.host} | Msg='{chat_req.message[:50]}...' | Context={chat_req.user_context}")
    
    try:
        # Conversão do Histórico
        gemini_history = []
        
        # [NOVO] Injeção de Contexto do Usuário (Sistema Dinâmico)
        if chat_req.user_context:
            context_str = f"""
            CONTEXTO DO USUÁRIO ATUAL:
            - Nome: {chat_req.user_context.get('displayName', 'Amigo(a)')}
            - Preferências/Estilo: {chat_req.user_context.get('stylePreference', 'Não informado')}
            - Telefone: {chat_req.user_context.get('phoneNumber', 'Não informado')}
            
            Use essas informações para personalizar o atendimento. Se o usuário tiver um estilo definido, leve isso em conta nas recomendações.
            """
            # Adiciona como instrução de sistema (role='user' ou 'model' dependendo da estratégia, aqui usamos 'user' como instrução inicial)
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

        # Criação da Sessão
        chat = client.chats.create(
            model=MODEL_NAME,
            config=CHAT_CONFIG,
            history=gemini_history
        )
        
        # Envio da mensagem
        response = chat.send_message(chat_req.message)
        
        if not response.text:
            logger.error(f"Gemini retornou resposta vazia: {response.model_dump_json()}")
            raise HTTPException(status_code=500, detail="O modelo não gerou uma resposta válida.")

        logger.info("CHAT_RES: Sucesso na geração de resposta.")
        sanitized_response = sanitize_text(response.text)
        return {"response": sanitized_response}

    except errors.ClientError as e:
        logger.warning(f"Gemini ClientError (400): {e}")
        raise HTTPException(status_code=400, detail="Mensagem bloqueada ou inválida. Tente mudar o assunto.")

    except errors.ServerError as e:
        logger.error(f"Gemini ServerError (502): {e}")
        raise HTTPException(status_code=502, detail="A Gabi está processando muitas informações. Tente em instantes.")

    # Exceções genéricas são capturadas pelo global_exception_handler

if __name__ == "__main__":
    import uvicorn
    # Log de inicialização
    logger.info(f"Iniciando API Gabi Personal Shopper na porta 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
