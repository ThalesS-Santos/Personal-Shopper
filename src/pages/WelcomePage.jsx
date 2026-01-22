import ConsultantAvatar from '../components/avatar/ConsultantAvatar';
import { MessageSquare, Search, Sparkles, ArrowRight } from 'lucide-react';

export default function WelcomePage({ onStart }) {
  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[60px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto text-center z-10 space-y-16">
        
        {/* Hero Text */}
        <div className="space-y-6 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
            A forma inteligente de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-200">
              comprar para sua casa.
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed font-light">
            Nossa IA analisa milhares de especificações, preços e reviews para que você nunca mais erre na escolha de um eletrodoméstico.
          </p>
        </div>

        {/* How it Works - 3 Columns with Glassmorphism */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-10 text-left px-4">
          {/* Card 1 */}
          <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10 animate-fade-in-up delay-100">
            <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">1. Diga o que precisa</h3>
            <p className="text-gray-300 text-base leading-relaxed">
              Você conversa com nosso consultor digital sobre sua rotina. É como falar com um amigo expert em produtos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 animate-fade-in-up delay-200">
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(192,132,252,0.3)]">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">2. Nossa IA Pesquisa</h3>
            <p className="text-gray-300 text-base leading-relaxed">
              Cruzamos dados técnicos de +50 lojas em tempo real para encontrar a eficiência e o preço ideal.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/10 animate-fade-in-up delay-300">
            <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(251,146,60,0.3)]">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">3. Escolha Certa</h3>
            <p className="text-gray-300 text-base leading-relaxed">
              Receba o <strong>Top 3</strong> validado para sua casa, com links seguros e o porquê de cada escolha.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in-up delay-500 pb-10">
          <button 
            onClick={onStart}
            className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full hover:from-orange-400 hover:to-orange-500 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]"
          >
            <span className="mr-3">Começar Consultoria Gratuita</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            
            {/* Ping animation for attention */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
            </span>
          </button>
        </div>

        {/* Trust/Footer text */}
        <p className="text-sm text-gray-500 animate-fade-in-up delay-700">
          Mais de 10.000 escolhas inteligentes feitas este mês.
        </p>

      </div>

      {/* Floating Corner Avatar with Greeting */}
      <div className="fixed bottom-0 right-4 md:right-10 z-50 flex items-end animate-slide-up delay-1000">
         <ConsultantAvatar 
            bubbleContent={
                <>
                  <p className="font-semibold text-sm">Olá! Sou sua Personal Shopper.</p>
                  <p className="text-sm text-gray-600">Posso ajudar você a escolher o melhor produto hoje?</p>
                </>
            }
         />
      </div>
    </div>
  );
}
