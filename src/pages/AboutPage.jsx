import React from 'react';
import Navbar from '../components/layout/Navbar';
import { Heart, ShieldCheck, Cpu } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16 md:py-24 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-exhibit tracking-tight">
            Sobre o <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-200">Personal Shopper</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed font-light">
            Nascemos com uma missão simples: acabar com a indecisão na hora de comprar eletrodomésticos. Acreditamos que a tecnologia deve servir para simplificar sua vida, não complicá-la.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-1 gap-6 mb-16">
          <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-orange-500/20 p-4 rounded-2xl text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Tecnologia com Propósito</h3>
              <p className="text-gray-400 font-light">
                Utilizamos a mais avançada IA Generativa para entender suas necessidades reais, não apenas filtros de preço. Nosso foco é encontrar o que resolve o <strong>seu</strong> problema.
              </p>
            </div>
          </div>

          <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
             <div className="bg-pink-500/20 p-4 rounded-2xl text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Feito para Pessoas</h3>
              <p className="text-gray-400 font-light">
                Sabemos que comprar uma geladeira ou fogão é um investimento importante. Por isso, a Gabi foi treinada para ser honesta, direta e empática. Sem "malícia" de vendedor, apenas ajuda real.
              </p>
            </div>
          </div>

           <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
             <div className="bg-green-500/20 p-4 rounded-2xl text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Confiança e Segurança</h3>
              <p className="text-gray-400 font-light">
                Não vendemos seus dados. Nossa prioridade é criar uma experiência segura e privada onde você pode tirar suas dúvidas sem medo.
              </p>
            </div>
          </div>
        </div>

        {/* Footer/Quote */}
        <div className="text-center border-t border-white/10 pt-12 animate-fade-in-up delay-200">
           <p className="italic text-gray-500 text-lg font-light">
             "O melhor eletrodoméstico é aquele que você compra e nunca se arrepende."
           </p>
           <p className="font-bold text-white mt-4 tracking-wide">- Equipe Personal Shopper</p>
        </div>

      </main>
    </div>
  );
}
