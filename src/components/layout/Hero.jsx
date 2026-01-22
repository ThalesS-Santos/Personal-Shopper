import React from 'react';

export default function Hero() {
  return (
    <div className="bg-navy-900 text-white pt-20 pb-24 md:pt-28 md:pb-32 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-accent opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Não compre o eletrodoméstico errado. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-200">
            Deixe nossa IA escolher o ideal.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Analisamos milhares de especificações técnicas, avaliações e preços em tempo real para encontrar a opção perfeita para sua casa e seu bolso.
        </p>
      </div>
    </div>
  );
}
