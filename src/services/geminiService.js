// geminiService.js - Now connecting to Python Backend (FastAPI)

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/chat";

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
    // Sanitize History:
    // 1. Map to backend format
    let history = messagesHistory.map(msg => ({
      role: msg.type, // 'user' or 'bot'
      content: msg.text
    }));

    // 2. Remove leading 'bot' messages (Greetings)
    // Gemini history should usually start with User.
    while (history.length > 0 && history[0].role === 'bot') {
      history.shift();
    }

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

    if (response.status === 429) {
      return "Epa! Calma aí, amigo. Estou processando muitas perguntas. Tenta de novo em um minutinho? ☕";
    }

    if (!response.ok) {
      throw new Error(`Backend Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;

  } catch (error) {
    console.error("Erro DETALHADO na comunicação:", error);
    // Return specific error to help diagnosis
    return `⚠️ Erro de Conexão: ${error.message || error}. \nVerifique se o backend está rodando em ${BACKEND_URL}`;
  }
};
