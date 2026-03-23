import { useRef } from 'react';
import { useChatContext } from '../contexts/ChatContext';

export const useChat = () => {
  const { 
    messages, 
    isThinking, 
    isSearching, 
    addUserMessage,
    // We can also expose other things from context if needed
  } = useChatContext();
  
  const typingTimeoutRef = useRef(null);

  // Handle Typing Animation Logic (UI only, can stay here or move to context)
  const handleTyping = () => {
    // This is mostly for UI feedback, keep it simple
  };

  return {
    messages,
    isThinking,
    isSearching,
    isTyping: false, // Simplified for now as it was just a local state
    handleTyping,
    addUserMessage
  };
};
