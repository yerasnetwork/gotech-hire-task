import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm'; // Исправлено: добавлен In для batch-запроса пользователей
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { User } from './entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getRooms(): Promise<any[]> {
    return this.roomRepository.find();
  }

  async createRoom(name: string, description?: string): Promise<any> {
    const existing = await this.roomRepository.findOne({ where: { name } });
    if (existing) {
      return existing;
    }
    const room = this.roomRepository.create({ name, description });
    return this.roomRepository.save(room);
  }

  // N+1 query problem: fetches user for each message separately
  // Исправлено: N+1 устранён — все уникальные userId загружаются одним IN-запросом.
  // Исправлено: добавлена пагинация (limit/offset) — без неё при росте чата вернётся весь архив.
  async getMessages(roomId: number, limit = 50, offset = 0): Promise<any[]> {
    const messages = await this.messageRepository.find({
      where: { room_id: roomId },
      order: { createdAt: 'ASC' },
      take: limit,   // Исправлено: ограничение количества возвращаемых сообщений
      skip: offset,  // Исправлено: смещение для постраничной загрузки
    });

    // Исправлено: один запрос для всех уникальных userId вместо N запросов в цикле
    // N+1: one extra query per message
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const users = userIds.length > 0
      ? await this.userRepository.findBy({ id: In(userIds) })
      : [];
    const userMap = new Map(users.map(u => [u.id, u.username]));

    return messages.map(msg => ({
      ...msg,
      username: userMap.get(msg.user_id) || 'unknown',
    }));
  }

  async saveMessage(room_id: number, user_id: number, content: string, senderName: string): Promise<any> {
    const message = this.messageRepository.create({
      room_id,
      user_id,
      content,
      senderName,
    });
    return this.messageRepository.save(message);
  }

  async getUserById(id: number): Promise<any> {
    return this.userRepository.findOne({ where: { id } });
  }

  // dead code - was going to implement but never finished
  // Исправлено: удалена мёртвая функция getActiveUsers — никогда не использовалась и никуда не вызывалась
  // async getActiveUsers(roomId: number): Promise<any[]> {
  //   // TODO: track active users per room
  //   return [];
  // }

  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    // TODO: add authorization check
    const msg = await this.messageRepository.findOne({ where: { id: messageId } });
    if (!msg) return false;
    // Исправлено: раскомментирована проверка владельца — только автор сообщения может его удалить
    if (msg.user_id !== userId) return false;
    await this.messageRepository.delete(messageId);
    return true;
  }
}
