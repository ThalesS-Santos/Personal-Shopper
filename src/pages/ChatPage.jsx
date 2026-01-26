import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import { useChat } from '../hooks/useChat';
import Navbar from '../components/layout/Navbar';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
  const { messages, isThinking, isSearching, isTyping, handleTyping, addUserMessage } = useChat();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  // Toggle Dark Mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ease-in-out ${isDarkMode ? 'bg-navy-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header / Config Bar */}
      <header className={`px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md ${isDarkMode ? 'bg-navy-900/80 border-b border-white/5' : 'bg-white/80 border-b border-gray-200'}`}>
        <button 
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-navy-900'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/10 text-yellow-300 hover:bg-white/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-80px)]">
        
        <div className={`flex-1 flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 border ${isDarkMode ? 'bg-navy-800/50 border-white/10' : 'bg-white border-white/40'}`}>
            
            <ChatWindow 
              messages={messages} 
              isThinking={isThinking}
              isSearching={isSearching}
              isDarkMode={isDarkMode}
            />
            
            <div className={`p-4 md:p-6 ${isDarkMode ? 'bg-navy-800/80' : 'bg-white/80'}`}>
              <ChatInput 
                 onSend={(text) => addUserMessage(text)} 
                 onType={handleTyping} 
                 disabled={isThinking} 
                 isDarkMode={isDarkMode}
               />
            </div>

        </div>

      </main>

    </div>
  );
}
