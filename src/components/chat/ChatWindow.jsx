import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import avatarImg from '../../assets/avatar.png';
import { Sparkles, User, Search } from 'lucide-react';

export default function ChatWindow({ messages, isThinking, isSearching, isDarkMode }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isSearching]);

  return (
    <div className={`flex flex-col flex-1 h-full overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-navy-900' : 'bg-gray-50'}`}>
      
      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {/* AI Avatar Icon (Left) */}
            {msg.type !== 'user' && (
              <div className="flex-shrink-0 mr-4 self-end">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 p-[2px] shadow-lg">
                   <div className="w-full h-full rounded-full bg-white overflow-hidden">
                     <img src={avatarImg} alt="Gabi" className="w-full h-full object-cover object-top" />
                   </div>
                </div>
              </div>
            )}

            {/* Message Bubble */}
            <div 
              className={`max-w-[80%] md:max-w-[70%] p-5 md:p-6 text-base md:text-lg leading-relaxed shadow-md animate-fade-in-up transition-colors duration-300 ${
                msg.type === 'user' 
                  ? 'bg-gradient-to-br from-navy-700 to-navy-900 text-white rounded-2xl rounded-tr-none' 
                  : `rounded-2xl rounded-tl-none border ${isDarkMode ? 'bg-navy-800 border-navy-700 text-gray-100' : 'bg-white border-gray-100 text-gray-800'}`
              }`}
            >
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-orange-600 dark:text-orange-400" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-2" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>

            {/* User Icon (Right) - Optional, just a placeholder or initials */}
            {msg.type === 'user' && (
              <div className="flex-shrink-0 ml-4 self-end">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-navy-700 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <User className="w-5 h-5" />
                 </div>
              </div>
            )}
          </div>
        ))}

        {/* Thinking/Searching Indicator */}
        {(isThinking || isSearching) && (
          <div className="flex flex-col gap-2 items-start justify-start w-full animate-pulse">
            <div className="flex items-end">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 p-[2px]">
                   <div className="w-full h-full rounded-full bg-white overflow-hidden">
                     <img src={avatarImg} alt="Gabi" className="w-full h-full object-cover object-top" />
                   </div>
                </div>
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-none border flex items-center space-x-2 ${isDarkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-gray-100'}`}>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            
            {isSearching && (
              <div className="ml-14 flex items-center gap-2 text-sm font-medium text-orange-500">
                <Search className="w-4 h-4 animate-spin-slow" />
                <span>Pesquisando preços e especificações técnicas...</span>
              </div>
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

    </div>
  );
}
