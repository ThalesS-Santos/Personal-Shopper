import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Optional

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

# Configure Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env")

genai.configure(api_key=API_KEY)

# Configuration for the model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Persona System Instruction
SYSTEM_INSTRUCTION = "Você é uma assistente pessoal de compras especialista em eletrodomésticos chamada 'Gabi'. Seja simpática, breve, se não for coisas imporantes diga em 2 ou 3 frases, use emojis ocasionalmente e ajude o usuário a escolher o melhor produto. Responda sempre em português do Brasil, de forma abrasileirada, como se fosse uma amiga, evite repetir o que o usuário já disse, evite usar paranteses e coisas do tipo e palavras em negrito."

# Initialize Model
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config=generation_config,
    system_instruction=SYSTEM_INSTRUCTION,
)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str # 'user' or 'model' (mapped from 'bot')
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message]

@app.get("/")
def read_root():
    return {"status": "Gabi is online"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Construct history for Gemini
        # We need to convert the frontend 'messages' format to Gemini history format
        # Frontend: { type: 'bot'|'user', text: '...' }
        # Backend Request Model: { role: 'model'|'user', content: '...' }
        
        chat_history = []
        for msg in request.history:
            role = "model" if msg.role == "bot" else "user"
            chat_history.append({"role": role, "parts": [msg.content]})

        # Initialize chat with history
        chat = model.start_chat(history=chat_history)
        
        # Send new message
        response = chat.send_message(request.message)
        
        return {"response": response.text}

    except Exception as e:
        print(f"Error generating response: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
