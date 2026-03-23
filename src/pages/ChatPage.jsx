import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import { useChat } from '../hooks/useChat';
import { useChatContext } from '../contexts/ChatContext';
import Navbar from '../components/layout/Navbar';
import { Moon, Sun, ArrowLeft, User, History, MessageSquarePlus, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DiagnosticArea from '../components/DiagnosticArea';
import { USE_MOCK_ERRORS } from '../services/geminiService';

export default function ChatPage() {
  const { messages, isThinking, isSearching, handleTyping, addUserMessage } = useChat();
  const { sessions, createNewSession, loadSession, currentSessionId, errorState } = useChatContext();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const navigate = useNavigate();

  // ATALHO SECRETO PARA MOCK ERRORS (Ctrl+Shift+E)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        USE_MOCK_ERRORS.active = !USE_MOCK_ERRORS.active;
        if (USE_MOCK_ERRORS.active) {
           const types = ["timeout", "offline", "rate_limit"];
           USE_MOCK_ERRORS.type = types[Math.floor(Math.random() * types.length)];
           alert(`🚨 MOCK ERRORS ATIVO! Tipo: ${USE_MOCK_ERRORS.type.toUpperCase()}`);
        } else {
           alert("✅ MOCK ERRORS DESATIVADO!");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

        <div className="flex items-center gap-2 md:gap-4">
          <button
              onClick={() => setIsHistoryOpen(true)}
              className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              title="Histórico de Conversas"
          >
              <History className="w-5 h-5" />
              <span className="hidden lg:inline text-sm font-medium">Histórico</span>
          </button>

          <button
              onClick={createNewSession}
              className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 ${isDarkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-navy-900 text-white hover:bg-navy-800'}`}
              title="Nova Conversa"
          >
              <MessageSquarePlus className="w-5 h-5" />
              <span className="hidden lg:inline text-sm font-medium">Novo Chat</span>
          </button>

          {/* User Profile Button */}
          <button
             onClick={() => navigate('/profile')}
             className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
             title="Meu Perfil"
          >
             <User className="w-5 h-5" />
             <span className="hidden md:inline text-sm font-medium">Perfil</span>
          </button>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/10 text-yellow-300 hover:bg-white/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* History Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-[60] w-80 transform transition-transform duration-300 ease-in-out backdrop-blur-xl border-r p-6 flex flex-col ${isDarkMode ? 'bg-navy-900/95 border-white/10' : 'bg-white/95 border-gray-200'} ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico
            </h2>
            <button 
              onClick={() => setIsHistoryOpen(false)}
              className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${isDarkMode ? 'hover:bg-white/10' : ''}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {sessions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>Nenhuma conversa ainda.</p>
              </div>
            ) : (
              sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => {
                    loadSession(session.id);
                    setIsHistoryOpen(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${currentSessionId === session.id 
                    ? (isDarkMode ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'bg-blue-50 border-blue-200 text-blue-700')
                    : (isDarkMode ? 'border-white/5 hover:bg-white/5 text-gray-300' : 'border-gray-100 hover:bg-gray-50 text-gray-600')}`}
                >
                  <p className="font-medium truncate text-sm mb-1">{session.title || 'Conversa sem título'}</p>
                  <p className="text-[10px] opacity-60">
                    {session.updatedAt?.toDate ? session.updatedAt.toDate().toLocaleDateString() : 'Recent'}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100/10">
            <button
              onClick={() => {
                createNewSession();
                setIsHistoryOpen(false);
              }}
              className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${isDarkMode ? 'bg-white text-navy-900 hover:bg-gray-200' : 'bg-navy-900 text-white hover:shadow-xl hover:translate-y-[-2px]'}`}
            >
              <MessageSquarePlus className="w-5 h-5" />
              Nova Conversa
            </button>
          </div>
        </aside>

        {/* Overlay for Sidebar */}
        {isHistoryOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden"
            onClick={() => setIsHistoryOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <main className={`flex-1 transition-all duration-300 flex flex-col p-4 md:p-6 relative`}>
          <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col h-full relative">
            <div className={`flex-1 flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 border relative ${isDarkMode ? 'bg-navy-800/50 border-white/10' : 'bg-white border-white/40'}`}>
                
                {/* Error Overlay */}
                {errorState && (
                  <div className="absolute inset-0 z-[45] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <DiagnosticArea />
                  </div>
                )}

                <ChatWindow 
                  messages={messages} 
                  isThinking={isThinking}
                  isSearching={isSearching}
                  isDarkMode={isDarkMode}
                />
                
                <div className={`p-4 md:p-6 relative z-40 ${isDarkMode ? 'bg-navy-800/80' : 'bg-white/80'}`}>
                  <ChatInput 
                    onSend={(text) => addUserMessage(text)} 
                    onType={handleTyping} 
                    disabled={isThinking || !!errorState} 
                    isDarkMode={isDarkMode}
                  />
                </div>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}
