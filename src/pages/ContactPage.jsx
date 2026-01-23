import React from 'react';
import Navbar from '../components/layout/Navbar';
import { Mail, MessageCircle, Instagram, Github } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16 md:py-24 relative z-10">
        
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Fale <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-200">Conosco</span>
          </h1>
          <p className="text-xl text-gray-400 font-light">
            Tem alguma dúvida ou sugestão? Entre em contato com nossa equipe!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Email Card */}
          <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-lg flex items-center gap-6 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
               <Mail className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">E-mail</h3>
              <p className="text-gray-400">contato@personalshopper.com</p>
            </div>
          </div>

          {/* WhatsApp Card */}
           <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-lg flex items-center gap-6 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
               <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">WhatsApp</h3>
              <p className="text-gray-400">(11) 99999-9999</p>
            </div>
          </div>

          {/* Instagram Card */}
           <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-lg flex items-center gap-6 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
               <Instagram className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Instagram</h3>
              <p className="text-gray-400">@personalshopper.ai</p>
            </div>
          </div>

          {/* Github/Dev Card */}
           <div className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-lg flex items-center gap-6 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center text-gray-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
               <Github className="w-8 h-8" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-white">Desenvolvedor</h3>
               <p className="text-gray-400">github.com/thales</p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
