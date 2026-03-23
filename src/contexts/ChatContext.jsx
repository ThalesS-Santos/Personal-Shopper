import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { sendMessageToGemini } from '../services/geminiService';

const ChatContext = createContext();

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Olá! Sou a Gabi, sua Personal Shopper.' },
    { type: 'bot', text: 'Como posso ajudar você a transformar sua casa hoje?' }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userContext, setUserContext] = useState(null);

  // Load User Context from Firestore
  useEffect(() => {
    const loadUserContext = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserContext(docSnap.data());
          } else {
            setUserContext({ displayName: currentUser.displayName });
          }
        } catch (error) {
          console.error("Error loading user context:", error);
        }
      }
    };
    loadUserContext();
  }, [currentUser]);

  // Load User Chat Sessions from Firestore
  useEffect(() => {
    if (!currentUser) {
       setSessions([]);
       return;
    }

    const q = query(
      collection(db, "chats"),
      where("userId", "==", currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionsList);
    });

    return unsubscribe;
  }, [currentUser]);

  // Persistence logic for the CURRENT active session across navigation in the same tab
  useEffect(() => {
    const savedSessionId = sessionStorage.getItem('currentChatSessionId');
    if (savedSessionId && !currentSessionId) {
       loadSession(savedSessionId);
    }
  }, []);

  const createNewSession = useCallback(async () => {
    setMessages([
      { type: 'bot', text: 'Olá! Sou a Gabi, sua Personal Shopper.' },
      { type: 'bot', text: 'Como posso ajudar você a transformar sua casa hoje?' }
    ]);
    setCurrentSessionId(null);
    sessionStorage.removeItem('currentChatSessionId');
  }, []);

  const loadSession = useCallback(async (sessionId) => {
    try {
      const docRef = doc(db, "chats", sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages);
        setCurrentSessionId(sessionId);
        sessionStorage.setItem('currentChatSessionId', sessionId);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  }, []);

  const addUserMessage = async (text) => {
    const newUserMessage = { type: 'user', text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    setIsThinking(true);
    setIsSearching(true);

    try {
      // 1. Get Response from Gemini
      const responseText = await sendMessageToGemini(messages, text, userContext);
      const botResponse = { type: 'bot', text: responseText, timestamp: new Date().toISOString() };
      const finalMessages = [...updatedMessages, botResponse];
      
      setMessages(finalMessages);

      // 2. Persist to Firestore
      if (currentUser) {
        if (!currentSessionId) {
          // Create new session in Firestore
          const docRef = await addDoc(collection(db, "chats"), {
            userId: currentUser.uid,
            title: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
            messages: finalMessages,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setCurrentSessionId(docRef.id);
          sessionStorage.setItem('currentChatSessionId', docRef.id);
        } else {
          // Update existing session
          const docRef = doc(db, "chats", currentSessionId);
          await updateDoc(docRef, {
            messages: finalMessages,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Error in chat flow:", error);
      setMessages(prev => [...prev, { type: 'bot', text: "Ih, tive um probleminha na pesquisa! Pode tentar de novo? 😅" }]);
    } finally {
      setIsThinking(false);
      setIsSearching(false);
    }
  };

  const value = {
    messages,
    sessions,
    currentSessionId,
    isThinking,
    isSearching,
    createNewSession,
    loadSession,
    addUserMessage,
    userContext
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
