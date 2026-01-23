import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSend, onType, disabled, isDarkMode }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Auto-focus logic:
  // 1. When component mounts
  // 2. When disabled state changes to false (Bot finished thinking)
  useEffect(() => {
    if (!disabled) {
      // Small timeout to ensure DOM is ready and prevent racing with UI updates
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    onSend(inputValue);
    setInputValue('');
    
    // Keep focus after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (onType) onType(e.target.value);
  };

  return (
    <div className={`p-0 w-full rounded-2xl transition-colors duration-300 ${isDarkMode ? 'bg-navy-800' : 'bg-white'}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center shadow-lg rounded-2xl overflow-visible ring-1 ring-black/5 dark:ring-white/10">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="Digite sua resposta..."
          className={`w-full pl-6 pr-16 py-5 border-none rounded-2xl focus:ring-2 focus:ring-orange-500/50 transition-all text-base md:text-lg 
            ${isDarkMode 
              ? 'bg-navy-700 text-white placeholder-gray-500 focus:bg-navy-600' 
              : 'bg-gray-50 text-gray-800 placeholder-gray-400 focus:bg-white'
            }`}
          disabled={disabled}
        />
        <button 
          type="submit"
          disabled={disabled || !inputValue.trim()}
          className={`absolute right-2 p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md
            ${isDarkMode 
              ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:brightness-110' 
              : 'bg-navy-900 text-white hover:bg-navy-800'
            }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
