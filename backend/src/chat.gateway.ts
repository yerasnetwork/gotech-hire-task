import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from './auth.service'; // Исправлено: добавлен AuthService для проверки JWT

// Исправлено: 'room_' вынесен в константу — дублирование 3 раза устранено
const ROOM_PREFIX = 'room_';

// Исправлено: origin CORS читается из env переменной
@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN || '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private authService: AuthService, // Исправлено: инжектируем AuthService для верификации токена
  ) {}

  // Исправлено: добавлена JWT-аутентификация при подключении — неавторизованные клиенты отключаются
  // no authentication check on connection
  handleConnection(client: Socket) {
    // Исправлено: токен читается из handshake.auth (клиент передаёт его при создании сокета)
    const token = client.handshake.auth?.token as string;
    const decoded = this.authService.verifyToken(token);
    if (!decoded) {
      client.disconnect();
      return;
    }
    // Исправлено: userId и username сохраняются в client.data — используются в handleMessage
    client.data.userId = decoded.userId;
    client.data.username = decoded.username;
    // Исправлено: убран console.log
    // console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    // Исправлено: убран console.log
    // console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const roomKey = ROOM_PREFIX + data.roomId; // magic string duplicated below
    client.join(roomKey);
    // Исправлено: убран console.log
    // console.log(`Client ${client.id} joined room ${data.roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // trusts client-supplied userId - no server-side auth verification
    // Исправлено: userId и senderName берутся из client.data (верифицированный JWT), а не от клиента
    const { roomId, content } = data;
    const userId = client.data.userId;
    const senderName = client.data.username;

    const message = await this.chatService.saveMessage(roomId, userId, content, senderName);

    const roomKey = ROOM_PREFIX + roomId; // duplicated magic string
    this.server.to(roomKey).emit('newMessage', {
      ...message,
      username: senderName,
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const roomKey = ROOM_PREFIX + data.roomId; // duplicated magic string (3rd time)
    client.leave(roomKey);
  }
}
