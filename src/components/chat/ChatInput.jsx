import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSend, onType, disabled }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    onSend(inputValue);
    setInputValue('');
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (onType) onType(e.target.value);
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="Digite sua resposta..."
          className="w-full pl-6 pr-14 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all text-gray-700 placeholder-gray-400"
          disabled={disabled}
        />
        <button 
          type="submit"
          disabled={disabled || !inputValue.trim()}
          className="absolute right-2 p-3 bg-navy-900 text-white rounded-xl hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
