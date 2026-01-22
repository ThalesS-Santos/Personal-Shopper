// geminiService.js - Now connecting to Python Backend (FastAPI)

const BACKEND_URL = "http://localhost:8000/chat";

export const startChatSession = async () => {
  // In the new architecture, session is stateless/managed by sending history.
  // We return a "ready" status or simple object to stay compatible with hooks if needed,
  // but mostly we just need the URL now.
  console.log("Conectado ao backend Python Gabi.");
  return { ready: true }; 
};

export const sendMessageToGemini = async (messagesHistory, newMessage) => {
  try {
    // Convert frontend history to backend format
    // Frontend: { type: 'bot' || 'user', text: '...' }
    // Backend expects: { role: 'bot' || 'user', content: '...' }
    const history = messagesHistory.map(msg => ({
      role: msg.type,
      content: msg.text
    }));

    const payload = {
      message: newMessage,
      history: history
    };

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Backend Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;

  } catch (error) {
    console.error("Erro na comunicação com o backend:", error);
    return "Desculpe, a Gabi está tirando um cochilo técnico (Erro de conexão com o servidor). Verifique se o backend Python está rodando!";
  }
};
