import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      navigate('/chat');
    }
  }, [currentUser, navigate]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/profile');
    } catch (error) {
      console.error("Failed to login", error);
      alert("Falha ao fazer login. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
           <LogIn className="text-white w-10 h-10" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo(a)</h2>
        <p className="text-gray-500 mb-8">Faça login para salvar seu perfil e preferências de compras.</p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
