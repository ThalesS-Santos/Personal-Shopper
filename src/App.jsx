import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero';
import DiagnosticArea from './components/chat/DiagnosticArea';
import WelcomePage from './pages/WelcomePage';

function App() {
  const [started, setStarted] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {!started ? (
        <WelcomePage onStart={() => setStarted(true)} />
      ) : (
        <div className="animate-fade-in">
          <Navbar />
          <main>
            <Hero />
            <DiagnosticArea />
          </main>
          
          <footer className="bg-white border-t border-gray-100 py-12 mt-12">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
              <p>&copy; 2026 Personal Shopper IA. Todos os direitos reservados.</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
