import React from 'react';
import Navbar from '../components/layout/Navbar';
import { MessageSquare, Zap, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      title: "1. Converse com a Gabi",
      description: "Conte para nossa IA o que você precisa. Pode ser 'uma geladeira para família grande' ou 'um ar-condicionado econômico'. Ela entende sua linguagem!",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-8 h-8 text-white" />,
      title: "2. Receba Indicações Precisas",
      description: "A Gabi analisa milhares de produtos e traz apenas os melhores para o seu perfil, explicando os prós e contras de cada um de forma simples.",
      color: "from-orange-500 to-pink-500"
    },
    {
      icon: <Home className="w-8 h-8 text-white" />,
      title: "3. Transforme sua Casa",
      description: "Escolha o produto ideal com confiança e transforme seu lar. Tudo isso em questão de minutos, sem horas de pesquisa.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16 md:py-24 relative z-10">
        <div className="text-center mb-20 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Como funciona o <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-200">Personal Shopper</span>?
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            Simplificamos sua jornada de compra usando Inteligência Artificial de ponta. Veja como é fácil:
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting Line (Desktop) - Adjusted for dark theme */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-blue-900 via-orange-900 to-green-900 -z-10 rounded-full opacity-30"></div>

            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] transform group-hover:scale-110 transition-transform duration-300 mb-8 relative z-10`}>
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed font-light">{step.description}</p>
              </div>
            ))}
        </div>

        <div className="mt-24 text-center">
          <Link to="/chat" className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full hover:from-orange-400 hover:to-orange-500 hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]">
            <span className="mr-3">Começar Agora</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>
    </div>
  );
}
