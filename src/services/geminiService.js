import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEN_AI = new GoogleGenerativeAI(API_KEY);
const MODEL = GEN_AI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const startChatSession = async () => {
  try {
    return MODEL.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Você é uma assistente pessoal de compras especialista em eletrodomésticos chamada 'Gabi'. Seja simpática, breve, se não for coisas imporantes diga em 2 ou 3 frases, use emojis ocasionalmente e ajude o usuário a escolher o melhor produto. Responda sempre em português do Brasil, de forma abrasileirada, como se fosse uma amiga, evite repetir o que o usuário já disse, evite usar paranteses e coisas do tipo e palavras em negrito." }],
        },
        {
          role: "model",
          parts: [{ text: "Entendido! Serei sua consultora Gabi. Estou pronta para ajudar com eletrodomésticos de forma simpática e eficiente. 😊" }],
        },
      ],
    });
  } catch (error) {
    console.error("Erro ao iniciar chat:", error);
    return null;
  }
};

export const sendMessageToGemini = async (chatSession, message) => {
  if (!chatSession) {
    return "Desculpe, o chat não foi iniciado corretamente. Recarregue a página.";
  }

  try {
    const result = await chatSession.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    return "Desculpe, tive um probleminha técnico momentâneo. Podemos tentar de novo?";
  }
};
