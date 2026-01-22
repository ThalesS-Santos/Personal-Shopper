import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import ConsultantAvatar from '../avatar/ConsultantAvatar';
import { useChat } from '../../hooks/useChat';

export default function DiagnosticArea() {
  const { messages, isThinking, isTyping, handleTyping, addUserMessage } = useChat();
  const [showCategories, setShowCategories] = useState(true);

  const handleCategorySelect = (category) => {
    setShowCategories(false);
    addUserMessage(`Estou procurando por ${category.label}.`);
  };

  const handleSend = (text) => {
    setShowCategories(false);
    addUserMessage(text);
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col md:flex-row max-w-7xl mx-auto px-4 gap-6 pb-20">
      
      {/* LEFT COLUMN: Chat Area */}
      <div className="flex-1 flex flex-col relative z-20">
        <div className="flex flex-col h-[700px] shadow-xl rounded-3xl overflow-hidden border border-white/20">
          <ChatWindow 
            messages={messages} 
            isThinking={isThinking} 
            showCategories={showCategories}
            onCategorySelect={handleCategorySelect}
          />
          <ChatInput 
             onSend={handleSend} 
             onType={handleTyping} 
             disabled={isThinking} 
           />
        </div>
      </div>

      {/* RIGHT COLUMN: Avatar Area */}
      <div className="hidden md:flex w-1/3 relative items-end justify-center z-10">
        <div className="sticky bottom-0 animate-slide-in-right">
             <ConsultantAvatar isThinking={isThinking} isTyping={isTyping} />
        </div>
      </div>

    </div>
  );
}
