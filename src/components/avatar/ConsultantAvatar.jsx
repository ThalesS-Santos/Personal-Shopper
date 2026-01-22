import React from 'react';
import avatarImg from '../../assets/avatar.png'; // Adjusted path for components/avatar/

export default function ConsultantAvatar({ isThinking, isTyping, className = "", bubbleContent }) {
  
  const getAnimation = () => {
    if (isThinking) return 'scale-[1.02] drop-shadow-2xl brightness-110';
    if (isTyping) return 'animate-sway';
    return 'animate-breathe';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Speech Bubble (Greeting) */}
      <div 
        className="absolute bottom-[80%] -left-10 bg-white p-4 rounded-2xl rounded-br-none shadow-lg border border-gray-100 max-w-[200px] animate-bounce-slow z-20 transition-opacity duration-300" 
        style={{ opacity: isThinking ? 0 : 1 }}
      >
        {bubbleContent || (
          <p className="text-sm text-navy-900 font-medium">Estou aqui para ajudar!</p>
        )}
      </div>

      {/* Thinking Bubbles */}
      {isThinking && (
        <div className="absolute top-0 right-10 flex flex-col items-center space-y-1 animate-fade-in-up md:right-20">
            <div className="w-3 h-3 bg-white rounded-full shadow-md"></div>
            <div className="w-4 h-4 bg-white rounded-full shadow-md ml-4"></div>
            <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
              <span className="text-accent text-xs">...</span>
            </div>
        </div>
      )}

      {/* Avatar Image */}
      <img 
        src={avatarImg} 
        alt="Personal Shopper" 
        className={`w-full max-w-[400px] h-auto object-contain drop-shadow-2xl transition-all duration-500 ease-in-out ${getAnimation()}`}
      />
    </div>
  );
}
