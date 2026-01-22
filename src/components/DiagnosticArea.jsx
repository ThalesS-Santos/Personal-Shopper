import React, { useState, useEffect, useRef } from 'react';
import { 
  Refrigerator, 
  WashingMachine, 
  ChefHat, 
  Wind, 
  Send, 
  Sparkles 
} from 'lucide-react';
import avatarImg from '../assets/avatar.png';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURATION ---
// SUBSTITUA PELA SUA CHAVE DE API REAL DO GEMINI
const API_KEY = "AIzaSyBWyzoit0iAb1wZ8fbc_sWhhVL_5SOf4jI"; 
const GEN_AI = new GoogleGenerativeAI(API_KEY);
const MODEL = GEN_AI.getGenerativeModel({ model: "gemini-2.5-flash" });

const categories = [
  { id: 'fridge', label: 'Geladeiras', icon: Refrigerator },
  { id: 'machine', label: 'Máquinas de Lavar', icon: WashingMachine },
  { id: 'airfryer', label: 'Airfryers', icon: ChefHat },
  { id: 'ac', label: 'Ar-Condicionado', icon: Wind },
];

export default function DiagnosticArea() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Olá! Sou sua consultora pessoal.' },
    { type: 'bot', text: 'O que vamos escolher para sua casa hoje?' }
  ]);
  
  // Chat session storage
  const [chatSession, setChatSession] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Initial Chat Session Setup
  useEffect(() => {
    const initChat = async () => {
      try {
        const chat = MODEL.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: "Você é uma assistente pessoal de compras especialista em eletrodomésticos. Seja simpática, breve e ajude o usuário a escolher o melhor produto." }],
            },
            {
              role: "model",
              parts: [{ text: "Entendido! Serei uma consultora de compras amigável e especialista." }],
            },
          ],
        });
        setChatSession(chat);
      } catch (error) {
        console.error("Erro ao iniciar chat:", error);
      }
    };
    initChat();
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    if (!isThinking) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  };

  const processResponse = async (userMessage) => {
    setIsTyping(false);
    setIsThinking(true);

    try {
      // 1. Min 3s Delay Promise
      const delayPromise = new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. API Call Promise
      const apiPromise = chatSession ? chatSession.sendMessage(userMessage) : Promise.resolve({ response: { text: () => "Erro: Chat não iniciado." } });

      // Wait for BOTH
      const [_, result] = await Promise.all([delayPromise, apiPromise]);
      const responseText = result.response.text();

      setMessages(prev => [...prev, { type: 'bot', text: responseText }]);

    } catch (error) {
      console.error("Erro na API:", error);
      setMessages(prev => [...prev, { type: 'bot', text: "Desculpe, tive um probleminha técnico. Podemos tentar de novo?" }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    const userText = `Estou procurando por ${category.label}.`;
    
    setMessages(prev => [...prev, { type: 'user', text: userText }]);
    processResponse(userText);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages(prev => [...prev, { type: 'user', text: userText }]);
    setInputValue('');
    
    processResponse(userText);
  };

  const getAvatarAnimation = () => {
    if (isThinking) return 'scale-[1.02] drop-shadow-2xl brightness-110';
    if (isTyping) return 'animate-sway';
    return 'animate-breathe';
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col md:flex-row max-w-7xl mx-auto px-4 gap-6 pb-20">
      
      {/* LEFT COLUMN: Immersion/Chat Area */}
      <div className="flex-1 flex flex-col relative z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden flex flex-col h-[700px]">
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

           {/* Messages Area */}
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
              
              {!selectedCategory && !isThinking && (
                <div className="grid grid-cols-2 gap-3 mt-4 animate-slide-up">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className="flex flex-col items-center justify-center p-6 bg-white border-2 border-transparent hover:border-accent/30 hover:bg-orange-50/30 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                    >
                      <cat.icon className="w-8 h-8 text-navy-800 group-hover:text-accent mb-3 transition-colors" />
                      <span className="font-semibold text-navy-900">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
           </div>

           {/* Input Area */}
           <div className="p-4 bg-white border-t border-gray-100">
             <form onSubmit={handleSend} className="relative flex items-center">
               <input
                 type="text"
                 value={inputValue}
                 onChange={handleInputChange}
                 placeholder="Digite sua resposta..."
                 className="w-full pl-6 pr-14 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all text-gray-700 placeholder-gray-400"
               />
               <button 
                 type="submit"
                 disabled={!inputValue.trim()}
                 className="absolute right-2 p-3 bg-navy-900 text-white rounded-xl hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <Send className="w-5 h-5" />
               </button>
             </form>
           </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Avatar Area (Fixed Desktop) */}
      <div className="hidden md:flex w-1/3 relative items-end justify-center z-10">
        <div className="sticky bottom-0 animate-slide-in-right">
             <div className="absolute bottom-[80%] -left-10 bg-white p-4 rounded-2xl rounded-br-none shadow-lg border border-gray-100 max-w-[200px] animate-bounce-slow z-20 transition-opacity duration-300" style={{ opacity: isThinking ? 0 : 1 }}>
                <p className="text-sm text-navy-900 font-medium">Estou aqui para ajudar!</p>
             </div>

             {isThinking && (
                <div className="absolute top-0 right-10 flex flex-col items-center space-y-1 animate-fade-in-up">
                    <div className="w-3 h-3 bg-white rounded-full shadow-md"></div>
                    <div className="w-4 h-4 bg-white rounded-full shadow-md ml-4"></div>
                    <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                      <span className="text-accent text-xs">...</span>
                    </div>
                </div>
             )}

             <img 
               src={avatarImg} 
               alt="Personal Shopper" 
               className={`w-full max-w-[400px] h-auto object-contain drop-shadow-2xl transition-all duration-500 ease-in-out ${getAvatarAnimation()}`}
             />
        </div>
      </div>

    </div>
  );
}
