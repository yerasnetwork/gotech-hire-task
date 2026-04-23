import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import RoomList from './RoomList';
import MessageItem from './MessageItem';
import Header from '../class-components/Header.class';

interface Room {
  id: number;
  name: string;
  description?: string;
}

// Исправлено: добавлены поля room_id и user_id — нужны для фильтрации WS-сообщений и проверки isOwn
interface Message {
  id: number;
  room_id: number;
  content: string;
  username: string;
  senderName: string;
  createdAt: string;
  user_id: number;
}

interface Props {
  token: string;
  userId: number;
  socket: Socket;
  apiUrl: string;
  onLogout: () => void;
}

export default function ChatPage({ token, userId, socket, apiUrl, onLogout }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]); // Исправлено: тип Room[] вместо any[]
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // Исправлено: тип Message[] вместо any[]
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // FLAW: hardcoded URL (occurrence 4 of 4) - should use apiUrl prop
  // Исправлено: убрана HARDCODED_API константа — используется apiUrl проп
  const selectedRoomRef = useRef<Room | null>(null); // Исправлено: ref для доступа к selectedRoom внутри WS-обработчика без stale closure

  useEffect(() => {
    fetchRooms();
    fetchCurrentUser();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // FLAW: on every WS message, re-fetches ALL messages via REST instead of just appending
    // should just be: setMessages(prev => [...prev, message]);
    // Исправлено: новое сообщение добавляется в конец списка без повторной загрузки всех сообщений
    socket.on('newMessage', (message: any) => {
      // console.log('New message received:', message);
      if (selectedRoomRef.current && message.room_id === selectedRoomRef.current.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    // FLAW: no socket.off() cleanup - causes memory leaks and duplicate handlers
    // Исправлено: добавлена очистка обработчиков при размонтировании компонента
    return () => {
      socket.off('newMessage');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []); // Исправлено: [] намеренно — selectedRoomRef стабилен, stale closure устранена через ref

  // Исправлено: вместо запроса к /users (который раскрывал хеши паролей) — декодируем username из JWT
  const fetchCurrentUser = () => {
    // fetches all users just to find current user's username - very inefficient
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsername(payload.username || '');
    } catch {
      setUsername('');
    }
  };

  const fetchRooms = async () => {
    const res = await fetch(`${apiUrl}/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRooms(data);
  };

  const fetchMessages = async (roomId: number) => {
    setLoadingMessages(true);
    const res = await fetch(`${apiUrl}/chat/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMessages(data);
    setLoadingMessages(false);
  };

  const handleRoomSelect = (room: Room) => {
    if (selectedRoom) {
      socket.emit('leaveRoom', { roomId: selectedRoom.id });
    }
    setSelectedRoom(room);
    selectedRoomRef.current = room; // Исправлено: обновляем ref синхронно с state
    socket.emit('joinRoom', { roomId: room.id });
    fetchMessages(room.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    socket.emit('sendMessage', {
      roomId: selectedRoom.id,
      // FLAW: client supplies userId - no server-side verification
      // Исправлено: userId и senderName теперь берутся на сервере из JWT (client.data), клиент их не передаёт
      content: newMessage,
    });

    setNewMessage('');
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    await fetch(`${apiUrl}/chat/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newRoomName, description: newRoomDesc }),
    });

    setNewRoomName('');
    setNewRoomDesc('');
    setShowCreateRoom(false);
    fetchRooms();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // inline styles duplicated throughout - no CSS modules or styled-components
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
  };

  const sidebarStyle: React.CSSProperties = {
    width: '250px',
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    backgroundColor: '#f5f5f5',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  const messagesStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
  };

  const inputAreaStyle: React.CSSProperties = {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #ddd',
    gap: '10px',
  };

  return (
    <div style={containerStyle}>
      <div style={sidebarStyle}>
        <Header username={username} isConnected={isConnected} onLogout={onLogout} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Rooms</h3>
          <button onClick={() => setShowCreateRoom(!showCreateRoom)} style={{ fontSize: '20px', cursor: 'pointer', border: 'none', background: 'none' }}>+</button>
        </div>

        {showCreateRoom && (
          <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <input
              placeholder="Room name"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              style={{ padding: '5px' }}
            />
            <input
              placeholder="Description (optional)"
              value={newRoomDesc}
              onChange={e => setNewRoomDesc(e.target.value)}
              style={{ padding: '5px' }}
            />
            <button onClick={handleCreateRoom} style={{ padding: '5px', cursor: 'pointer' }}>Create</button>
          </div>
        )}

        {/* Prop drilling: passing token, socket, apiUrl down just to pass further */}
        {/* Исправлено: убраны пропы token, socket, apiUrl из RoomList — они там не использовались */}
        <RoomList
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={handleRoomSelect}
        />
      </div>

      <div style={mainStyle}>
        {selectedRoom ? (
          <>
            <div style={{ padding: '10px', borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <h3 style={{ margin: 0 }}>#{selectedRoom.name}</h3>
              {selectedRoom.description && <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>{selectedRoom.description}</p>}
            </div>

            <div style={messagesStyle}>
              {loadingMessages ? (
                <p>Loading messages...</p>
              ) : (
                messages.map((msg) => (
                  // FLAW: using array index as key
                  // Исправлено: key={msg.id} вместо index — React корректно отслеживает сообщения при обновлении списка
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    isOwn={msg.user_id === userId}
                  />
                ))
              )}
            </div>

            <div style={inputAreaStyle}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                style={{ flex: 1, padding: '8px', fontSize: '16px' }}
              />
              <button
                onClick={handleSendMessage}
                style={{ padding: '8px 16px', fontSize: '16px', cursor: 'pointer' }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <p style={{ color: '#666' }}>Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
