import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Camera, Save, LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clothingSize, setClothingSize] = useState('');
  const [stylePreference, setStylePreference] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setDisplayName(data.displayName || '');
      setPhoneNumber(data.phoneNumber || '');
      setClothingSize(data.clothingSize || '');
      setStylePreference(data.stylePreference || '');
      setPhotoURL(data.photoURL || currentUser.photoURL);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `profiles/${currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
      
      // Update immediately in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { photoURL: url });
      setLoading(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      setLoading(false);
      alert("Erro ao fazer upload da imagem.");
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        displayName,
        phoneNumber,
        clothingSize,
        stylePreference,
        photoURL
      });
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate('/chat')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5"/> Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium">
                <LogOut className="w-5 h-5"/> Sair
            </button>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative w-32 h-32 mb-4">
                    <img 
                        src={photoURL || "https://uiavatars.com/api/?name=User"} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover border-4 border-orange-100 shadow-sm"
                    />
                    <label className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 cursor-pointer shadow-md transition-colors">
                        <Camera className="w-5 h-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                </div>
                <p className="text-sm text-gray-500">Clique na câmera para alterar a foto</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                        placeholder="Seu nome"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Celular / WhatsApp</label>
                        <input 
                            type="tel" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho de Roupa Usual</label>
                         <select 
                            value={clothingSize}
                            onChange={(e) => setClothingSize(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white"
                        >
                            <option value="">Selecione...</option>
                            <option value="PP">PP</option>
                            <option value="P">P</option>
                            <option value="M">M</option>
                            <option value="G">G</option>
                            <option value="GG">GG</option>
                            <option value="XG">XG</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferências de Estilo / Observações</label>
                    <textarea 
                        value={stylePreference}
                        onChange={(e) => setStylePreference(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all h-32 resize-none"
                        placeholder="Ex: Gosto de tons pastéis, prefiro roupas de algodão, busco conforto..."
                    />
                </div>

                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Salvando..." : (
                        <>
                            <Save className="w-5 h-5" />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}
