import { useState, useRef, useEffect } from 'react';
import { startChatSession, sendMessageToGemini } from '../services/geminiService';

export const useChat = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Olá! Sou a Gabi, sua Personal Shopper.' },
    { type: 'bot', text: 'Como posso ajudar você a transformar sua casa hoje?' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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
    if (!isThinking && !isSearching) {
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
    setIsSearching(true); // Gabi is now looking on the web

    try {
      // 3. For RAG, we use a slightly longer delay to show "Searching" status
      const delayPromise = new Promise(resolve => setTimeout(resolve, 4000));
      const apiPromise = sendMessageToGemini(messages, text);

      const [_, responseText] = await Promise.all([delayPromise, apiPromise]);

      // 4. Add Bot Response
      setMessages(prev => [...prev, { type: 'bot', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { type: 'bot', text: "Ih, tive um probleminha na pesquisa! Pode tentar de novo? 😅" }]);
    } finally {
      setIsThinking(false);
      setIsSearching(false);
    }
  };

  return {
    messages,
    isThinking,
    isSearching,
    isTyping,
    handleTyping,
    addUserMessage
  };
};
