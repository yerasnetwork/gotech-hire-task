import React, { useState } from 'react';

// FLAW: hardcoded URL (occurrence 2 of 4)
// Исправлено: URL читается из переменной окружения Vite с fallback на localhost
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface Props {
  onLogin: (token: string, userId: number) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // FLAW: no try/catch, no loading state, no error display
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.token) {
      // FLAW: storing JWT in localStorage (XSS vulnerable)
      // Исправлено: localStorage.setItem убран отсюда — сохранение токена делается в App.handleLogin (единственное место)
      onLogin(data.token, data.userId);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        <h2>Login</h2>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ padding: '8px', fontSize: '16px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: '8px', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}>Login</button>
        <a href="/register">Don't have an account? Register</a>
      </form>
    </div>
  );
}
