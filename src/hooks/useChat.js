import { useState, useRef, useEffect } from 'react';
import { startChatSession, sendMessageToGemini } from '../services/geminiService';

export const useChat = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Olá! Sou sua consultora pessoal.' },
    { type: 'bot', text: 'O que vamos escolher para sua casa hoje?' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  
  const typingTimeoutRef = useRef(null);

  // Initialize Chat Session
  useEffect(() => {
    const init = async () => {
      const session = await startChatSession();
      setChatSession(session);
    };
    init();
  }, []);

  // Handle Typing Animation Logic
  const handleTyping = () => {
    if (!isThinking) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };

  // Add a User Message and Process Response
  const addUserMessage = async (text) => {
    // 1. Add User Message
    setMessages(prev => [...prev, { type: 'user', text }]);
    
    // 2. Set States
    setIsTyping(false);
    setIsThinking(true);

    try {
      // 3. Minimum 3s Delay + API Call
      const delayPromise = new Promise(resolve => setTimeout(resolve, 3000));
      // Pass 'messages' (history) and 'text' (new message)
      const apiPromise = sendMessageToGemini(messages, text);

      const [_, responseText] = await Promise.all([delayPromise, apiPromise]);

      // 4. Add Bot Response
      setMessages(prev => [...prev, { type: 'bot', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { type: 'bot', text: "Erro ao processar resposta." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return {
    messages,
    isThinking,
    isTyping,
    handleTyping,
    addUserMessage
  };
};
