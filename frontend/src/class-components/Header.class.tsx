import React from 'react';

interface Props {
  username: string;
  isConnected: boolean;
  onLogout: () => void;
}

// FLAW: class component in an otherwise functional React codebase
// Исправлено: переписан как функциональный компонент — единообразие с остальной кодовой базой

// FLAW: magic number - 2 means "connected", 1 means "disconnected"
// Исправлено: magic numbers 1/2 устранены — используется isConnected boolean напрямую
export default function Header({ username, isConnected, onLogout }: Props) {
  return (
    <div style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{username || 'Loading...'}</div>
      <div style={{ fontSize: '12px', color: isConnected ? 'green' : 'gray', marginBottom: '8px' }}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <button
        onClick={onLogout}
        style={{ fontSize: '12px', padding: '4px 8px', cursor: 'pointer', width: '100%' }}
      >
        Logout
      </button>
    </div>
  );
}
