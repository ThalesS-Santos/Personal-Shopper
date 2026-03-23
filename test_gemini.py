import sys
import os
import copy
sys.path.insert(0, './backend')
from dotenv import load_dotenv
from google import genai
from google.genai import types
from backend.main import CHAT_CONFIG, MODEL_NAME

load_dotenv('./backend/.env')
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

user_context = {'displayName': 'Thales Sena', 'createdAt': '2026-02-02T23:18:08.491Z', 'photoURL': 'https://', 'clothingSize': 'M', 'uid': 'K40', 'email': 'thalessena272006@gmail.com', 'shoppingPreferences': [], 'stylePreference': 'gosto de tons de branco\n', 'phoneNumber': '7199999999'}

gemini_history = []
context_str = f"""
CONTEXTO DO USUÁRIO ATUAL:
- Nome: {user_context.get('displayName', 'Amigo(a)')}
- Preferências/Estilo: {user_context.get('stylePreference', 'Não informado')}
- Telefone: {user_context.get('phoneNumber', 'Não informado')}

Use essas informações para personalizar o atendimento. Se o usuário tiver um estilo definido, leve isso em conta nas recomendações.
"""
gemini_history.append(types.Content(role='user', parts=[types.Part(text=f'SYSTEM_NOTE: {context_str}')]))
gemini_history.append(types.Content(role='model', parts=[types.Part(text='Entendido! Vou personalizar o atendimento para este usuário.')]))

gemini_history.append(types.Content(role='user', parts=[types.Part(text='ola...')]))
gemini_history.append(types.Content(role='model', parts=[types.Part(text='Oi, Thales! Amigo, o que você tá procurando hoje? Alguma coisa específica ou só dando uma olhadinha?')]))

gemini_history.append(types.Content(role='user', parts=[types.Part(text='quero um microondas 110v para 3 pessoas aqui em ca...')]))
gemini_history.append(types.Content(role='model', parts=[types.Part(text='Legal! Para 3 pessoas em casa, um micro-ondas entre 20 e 30 litros costuma ser o ideal.')]))

msg = 'cade?...'

cfg = copy.deepcopy(CHAT_CONFIG)

chat = client.chats.create(model=MODEL_NAME, config=cfg, history=gemini_history)
response = chat.send_message(msg)

if not response.text:
    print('EMPTY:', response.model_dump_json(indent=2))
else:
    print('OK:', response.text)
