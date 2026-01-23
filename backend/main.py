import os
import logging
from typing import List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, constr
from dotenv import load_dotenv

# Google Gemini New SDK
from google import genai
from google.genai import types, errors

# SlowAPI for Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- 1. Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("personal_shopper_prod")

# --- 2. Security & Environment ---
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.critical("GEMINI_API_KEY missing.")
    raise ValueError("GEMINI_API_KEY must be set in .env")

# Ensure both localhost variations are present to avoid CORS 400
# ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
ALLOWED_ORIGINS = ["*"] # Temporarily allow all for diagnosis

# --- 3. Rate Limiting Setup ---
limiter = Limiter(key_func=get_remote_address)

# --- 4. Gemini Configuration ---
client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-flash"  # Strict Version Lock

SYSTEM_INSTRUCTION = """
Você é a 'Gabi', uma Personal Shopper especialista em eletrodomésticos.
Objetivo: Ajudar o usuário a escolher o melhor produto (Geladeira, Máquina de Lavar, etc.).

Diretrizes:
1. Recuse educadamente perguntas fora do tema de compras/casa ("Desculpe, só entendo de eletros!").
2. Seja breve (2-3 frases) e use linguagem natural brasileira.
3. Não invente dados técnicos.
"""

CHAT_CONFIG = types.GenerateContentConfig(
    system_instruction=SYSTEM_INSTRUCTION,
    temperature=0.7,   # Balanced
    top_p=0.8,         # Focused
    top_k=40,
    max_output_tokens=1024,
)

# --- 5. Validated Models ---
class Message(BaseModel):
    role: str = Field(..., pattern="^(user|bot)$")
    content: constr(min_length=1, max_length=2000)

class ChatRequest(BaseModel):
    message: constr(min_length=1, max_length=1000)
    history: List[Message]

class ChatResponse(BaseModel):
    response: str

# --- 6. FastAPI App ---
app = FastAPI(title="Gabi Personal Shopper PROD")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"START Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"END Request: {request.method} {request.url} Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"FAILED Request: {request.method} {request.url} Error: {e}")
        raise

# --- 7. Endpoints ---
@app.get("/")
def read_root():
    return {"status": "online", "message": "Gabi Personal Shopper Backend PROD is Running"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "Gabi Production"}

@app.post("/chat", response_model=ChatResponse)
@limiter.limit("60/minute")
async def chat_endpoint(request: Request, chat_req: ChatRequest):
    logger.info(f"Incoming Chat Request from {request.client.host}")
    try:
        # Convert Frontend History -> Google SDK Content
        gemini_history = []
        for msg in chat_req.history:
            role = "model" if msg.role == "bot" else "user"
            gemini_history.append(types.Content(
                role=role,
                parts=[types.Part(text=msg.content)]
            ))

        # Create Chat Session
        chat = client.chats.create(
            model=MODEL_NAME,
            config=CHAT_CONFIG,
            history=gemini_history
        )
        
        # Send Message
        response = chat.send_message(chat_req.message)
        return {"response": response.text}

    except errors.ClientError as e:
        # 4xx Errors (Invalid Input, SafeSettings blocked, etc)
        logger.warning(f"Gemini ClientError: {e}")
        raise HTTPException(status_code=400, detail="Não consegui processar sua mensagem. Tente reformular.")

    except errors.ServerError as e:
        # 5xx Errors (Overloaded, Internal Error)
        logger.error(f"Gemini ServerError: {e}")
        raise HTTPException(status_code=502, detail="Gabi está indisponível no momento. Tente novamente.")

    except Exception as e:
        # General Fallback
        logger.critical(f"Critical Backend Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erro interno no servidor.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
