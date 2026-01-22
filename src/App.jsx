import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DiagnosticArea from './components/chat/DiagnosticArea';
import WelcomePage from './pages/WelcomePage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
