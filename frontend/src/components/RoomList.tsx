import React from 'react';

interface Room {
  id: number;
  name: string;
  description?: string;
}

// Исправлено: убраны пропы-артефакты prop drilling (token, socket, apiUrl) — они никогда не использовались в этом компоненте
interface Props {
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  // token: string;        // received but only passed down
  // socket: Socket;       // received but only passed down
  // apiUrl: string;       // received but only passed down
}

export default function RoomList({ rooms, selectedRoom, onSelectRoom }: Props) {
  // FLAW: inline function defined in JSX
  const renderRoom = (room: Room, index: number) => (
    <div
      key={room.id}
      onClick={() => onSelectRoom(room)}
      style={{
        padding: '8px',
        cursor: 'pointer',
        backgroundColor: selectedRoom?.id === room.id ? '#ddd' : 'transparent',
        borderRadius: '4px',
        marginBottom: '2px',
      }}
    >
      <div style={{ fontWeight: 'bold' }}>#{room.name}</div>
      {room.description && (
        <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {room.description}
        </div>
      )}
    </div>
  );

  if (rooms.length === 0) {
    return <p style={{ color: '#999', fontSize: '14px' }}>No rooms yet. Create one!</p>;
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {rooms.map((room, index) => renderRoom(room, index))}
    </div>
  );
}
