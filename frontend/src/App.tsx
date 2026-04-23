import React, { useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client'; // Исправлено: добавлен тип Socket
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ChatPage from './components/ChatPage';

// FLAW: hardcoded URL (occurrence 1 of 4)
// Исправлено: URL читается из переменной окружения Vite (VITE_API_URL) с fallback на localhost
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userId, setUserId] = useState<number | null>(
    localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!) : null
  );

  // FLAW: socket created on every render, not in useRef
  // Исправлено: socket хранится в useRef — создаётся один раз, не пересоздаётся при каждом рендере
  const socketRef = useRef<Socket | null>(null);
  // Создаём сокет синхронно при наличии токена (guard !socketRef.current предотвращает дублирование)
  // Исправлено: токен передаётся в auth handshake для верификации на сервере при подключении
  if (token && !socketRef.current) {
    socketRef.current = io(API_URL, { auth: { token } });
  }

  const handleLogin = (newToken: string, newUserId: number) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', String(newUserId));
    // Исправлено: пересоздаём сокет с новым токеном после логина
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    socketRef.current = io(API_URL, { auth: { token: newToken } });
    setToken(newToken);
    setUserId(newUserId);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    // Исправлено: сокет явно отключается при выходе — нет утечки соединения
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setToken(null);
    setUserId(null);
  };

  return (
    // No ErrorBoundary wrapping the app
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/chat" /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={token ? <Navigate to="/chat" /> : <RegisterPage onLogin={handleLogin} />} />
        <Route
          path="/chat"
          element={
            token && socketRef.current ? (
              <ChatPage token={token} userId={userId!} socket={socketRef.current} apiUrl={API_URL} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<Navigate to={token ? '/chat' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
