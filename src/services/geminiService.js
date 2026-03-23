// geminiService.js - Robust API Client connecting to Python Backend

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/chat";

// FLAG TEMPORÁRIA PARA TESTES DE ERRO NO FRONTEND
export const USE_MOCK_ERRORS = { active: false, type: "RATE_LIMIT" }; // types: timeout, offline, rate_limit

// Human Intelligence Mapping
const ERROR_MAPPINGS = {
  "RATE_LIMIT": "Limitação de frequência do modelo ou provedor atingida. Tente novamente em 60s.",
  "TIMEOUT": "O provedor demorou muito para responder. Tente novamente.",
  "NOT_FOUND": "O produto procurado não foi encontrado nas bases de dados.",
  "INFRA_CONNECTION_ERROR": "Falha de Conexão: Seu dispositivo ou nosso backend está offline.",
  "INTERNAL_SERVER_ERROR": "Ocorreu um erro letal no sistema. Nossa equipe técnica já foi notificada.",
  "BAD_REQUEST": "Houve um problema com a sua mensagem. Tente reformular.",
};

export class ProviderTimeoutException extends Error {
  constructor(message) {
    super(message);
    this.name = "ProviderTimeoutException";
    this.details = {
        error_code: "TIMEOUT",
        provider: "Client_Timeout",
        human_message: ERROR_MAPPINGS["TIMEOUT"],
        trace_id: "BROWSER-LOCAL"
    };
  }
}

export class InfraConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "InfraConnectionError";
    this.details = {
        error_code: "INFRA_CONNECTION_ERROR",
        provider: "Browser_Network",
        human_message: ERROR_MAPPINGS["INFRA_CONNECTION_ERROR"],
        trace_id: "BROWSER-LOCAL"
    };
  }
}

// Interceptor-like API wrapper
export const robustJsonFetch = async (url, options = {}) => {
  // Simulação de Erros Mockados
  if (USE_MOCK_ERRORS.active) {
    await new Promise(r => setTimeout(r, 1000)); // Simula delay
    if (USE_MOCK_ERRORS.type === "timeout") throw new ProviderTimeoutException("Simulação de timeout.");
    if (USE_MOCK_ERRORS.type === "offline") throw new InfraConnectionError("Simulação de queda de rede.");
    
    // Simula erro de backend estruturado
    const err = new Error("Simulação de Quota Excedida");
    err.details = {
      error_code: "RATE_LIMIT",
      provider: "Gemini_Simulate",
      human_message: "Limite de cota simulado frontend.",
      suggested_action: "Aguarde o reset dos testes.",
      trace_id: "BROWSER-MOCK"
    };
    throw err;
  }

  // 1. Validate connectivity
  if (!navigator.onLine) {
    throw new InfraConnectionError("Sem conexão com a internet.");
  }

  // 2. Declarative Timeout (15s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { 
          error_code: "UNKNOWN", 
          provider: "Backend", 
          message: `Erro HTTP ${response.status}`,
          trace_id: "UNKNOWN"
        };
      }
      
      const humanMessage = ERROR_MAPPINGS[errorData.error_code] || errorData.suggested_action || "Erro desconhecido na requisição.";
      
      const error = new Error(humanMessage);
      error.details = {
        ...errorData,
        human_message: humanMessage,
        http_status: response.status
      };
      throw error;
    }

    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new ProviderTimeoutException("A requisição demorou mais de 15 segundos.");
    }
    
    if (error.details || error instanceof InfraConnectionError) {
      throw error;
    }

    const err = new InfraConnectionError("O servidor não respondeu. Pode estar offline.");
    throw err;
  }
};

export const startChatSession = async () => {
  return { ready: true }; 
};

export const sendMessageToGemini = async (messagesHistory, newMessage, userContext = null) => {
  const history = messagesHistory
    .filter(msg => msg.text.trim() !== '') 
    .map(msg => ({
      role: msg.type === 'bot' ? 'bot' : 'user',
      content: msg.text
    }));

  while (history.length > 0 && history[0].role === 'bot') {
    history.shift();
  }

  const payload = {
    message: newMessage,
    history: history,
    user_context: userContext
  };

  const data = await robustJsonFetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return data.response; 
};
