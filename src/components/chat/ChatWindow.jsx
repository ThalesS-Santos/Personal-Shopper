import React, { useEffect, useRef } from 'react';
import { 
  Refrigerator, 
  WashingMachine, 
  ChefHat, 
  Wind,
  Sparkles 
} from 'lucide-react';

const categories = [
  { id: 'fridge', label: 'Geladeiras', icon: Refrigerator },
  { id: 'machine', label: 'Máquinas de Lavar', icon: WashingMachine },
  { id: 'airfryer', label: 'Airfryers', icon: ChefHat },
  { id: 'ac', label: 'Ar-Condicionado', icon: Wind },
];

export default function ChatWindow({ messages, isThinking, onCategorySelect, showCategories }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-t-3xl shadow-xl border border-white/20 overflow-hidden flex flex-col flex-1">
      {/* Header */}
      <div className="bg-white/80 p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="ml-3 text-xs font-semibold text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" /> IA Conectada
          </span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-4 rounded-2xl text-base leading-relaxed shadow-sm animate-fade-in-up ${
                msg.type === 'user' 
                  ? 'bg-navy-900 text-white rounded-br-none' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        
        {/* Category Selection */}
        {showCategories && !isThinking && (
          <div className="grid grid-cols-2 gap-3 mt-4 animate-slide-up">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat)}
                className="flex flex-col items-center justify-center p-6 bg-white border-2 border-transparent hover:border-accent/30 hover:bg-orange-50/30 rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <cat.icon className="w-8 h-8 text-navy-800 group-hover:text-accent mb-3 transition-colors" />
                <span className="font-semibold text-navy-900">{cat.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
