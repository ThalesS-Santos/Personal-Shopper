import os
import logging
from typing import List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, constr
from dotenv import load_dotenv
from pathlib import Path
import requests

# Google Gemini New SDK
from google import genai
from google.genai import types, errors

# SlowAPI for Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- 1. Configuração de Logging Profissional ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("gabi_shopper_prod")

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

# --- 3. Ferramentas de Busca Real (RAG) ---

def search_google_shopping(product_name: str):
    """Busca preços e lojas reais no Google Shopping via SerpApi."""
    logger.info(f"RAG: Buscando no Google Shopping: {product_name}")
    if not SERPAPI_KEY: return {"error": "SerpApi key missing"}
    
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
        data = response.json()
        results = data.get("shopping_results", [])[:3]
        return [{"title": r.get("title"), "price": r.get("price"), "source": r.get("source"), "link": r.get("link")} for r in results]
    except Exception as e:
        logger.error(f"Erro SerpApi: {e}")
        return {"error": "Falha no Google Shopping"}

def search_amazon_prices(product_name: str):
    """Busca preços e disponibilidade na Amazon via Rainforest API."""
    logger.info(f"RAG: Buscando na Amazon: {product_name}")
    if not RAINFOREST_KEY: return {"error": "Rainforest key missing"}
    
    url = "https://api.rainforestapi.com/request"
    params = {
        "api_key": RAINFOREST_KEY,
        "type": "search",
        "amazon_domain": "amazon.com.br",
        "search_term": product_name
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        results = response.json().get("search_results", [])[:2]
        return [{"title": r.get("title"), "price": r.get("price", {}).get("raw"), "link": r.get("link")} for r in results]
    except Exception as e:
        logger.error(f"Erro Rainforest: {e}")
        return {"error": "Falha na Amazon"}

def search_technical_specs(query: str):
    """Busca especificações técnicas, reviews e detalhes de durabilidade na web."""
    logger.info(f"RAG: Buscando especificações técnicas: {query}")
    if not SERPAPI_KEY: return {"error": "SerpApi key missing"}
    
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
        data = response.json()
        results = data.get("organic_results", [])[:2]
        return [{"title": r.get("title"), "snippet": r.get("snippet"), "link": r.get("link")} for r in results]
    except Exception as e:
        logger.error(f"Erro Busca Técnica: {e}")
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
Você é a 'Gabi', uma assistente pessoal de compras brasileira, expert em eletrodomésticos. Seu tom é amigável, como uma amiga próxima, mas com autoridade técnica. Você fala de forma 'abrasileirada', usa emojis ocasionalmente e é sempre breve (máximo 3 frases, a menos que explique especificações complexas).

# DIRETRIZES RAG (OBRIGATÓRIO)
- Antes de recomendar qualquer produto, SEMPRE valide preços e estoque real usando `search_google_shopping` ou `search_amazon_prices`.
- Use `search_technical_specs` para validar detalhes técnicos, ler reviews reais ou pesquisar o que não encontrar sobre um modelo.
- Se houver divergência de preços, aponte a melhor oportunidade de custo-benefício.

# MECANISMOS DE SEGURANÇA (GUARDRAILS)
1. FOCO TOTAL: Se o usuário perguntar sobre qualquer assunto fora de eletrodomésticos, responda: "Ih, amigo(a), disso eu não entendo nada! 😅 Vamos voltar para os eletros?"
2. COMPORTAMENTO: Nunca use palavras de baixo calão.
3. PRIVACIDADE: Nunca peça dados pessoais.
4. FORMATAÇÃO: Use negrito para destacar nomes de produtos, preços ou termos importantes. Use listas para facilitar a leitura se houver muitos detalhes.
"""

# Configurações de Segurança Nativas do Modelo (Safety Settings)
SAFETY_SETTINGS = [
    types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_LOW_AND_ABOVE"),
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

class ChatResponse(BaseModel):
    response: str

# --- 6. Inicialização do FastAPI ---
app = FastAPI(title="Gabi Personal Shopper - API Produção")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    logger.info(f"Requisição recebida do IP: {request.client.host}")
    
    try:
        # Conversão do Histórico para o Formato do SDK Gemini
        gemini_history = []
        for msg in chat_req.history:
            role = "model" if msg.role == "bot" else "user"
            gemini_history.append(types.Content(
                role=role,
                parts=[types.Part(text=msg.content)]
            ))

        # Criação da Sessão de Chat utilizando o Client do SDK GenAI
        chat = client.chats.create(
            model=MODEL_NAME,
            config=CHAT_CONFIG,
            history=gemini_history
        )
        
        # Envio da mensagem e captura da resposta
        response = chat.send_message(chat_req.message)
        
        if not response.text:
            raise HTTPException(status_code=500, detail="O modelo não gerou uma resposta válida.")

        return {"response": response.text}

    except errors.ClientError as e:
        # Erros 4xx (Entrada inválida ou filtros de segurança disparados)
        logger.warning(f"Erro de Cliente (Gemini): {e}")
        raise HTTPException(status_code=400, detail="Mensagem bloqueada ou inválida. Tente mudar o assunto.")

    except errors.ServerError as e:
        # Erros 5xx (Servidor da Google sobrecarregado)
        logger.error(f"Erro de Servidor (Gemini): {e}")
        raise HTTPException(status_code=502, detail="A Gabi está processando muitas informações. Tente em instantes.")

    except Exception as e:
        # Erro genérico para evitar exposição de logs em produção
        logger.critical(f"Falha Crítica Interna: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Desculpe, a Gabi teve um imprevisto técnico.")

if __name__ == "__main__":
    import uvicorn
    # Configurado para rodar na porta 8001 para evitar conflitos de porta (8000 costuma ficar em TIME_WAIT)
    uvicorn.run(app, host="0.0.0.0", port=8001)