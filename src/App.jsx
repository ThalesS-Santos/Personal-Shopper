import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DiagnosticArea from './components/chat/DiagnosticArea';
import WelcomePage from './pages/WelcomePage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/chat" element={
            <div className="animate-fade-in min-h-screen flex flex-col justify-center py-10 bg-gray-50">
               <DiagnosticArea />
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
