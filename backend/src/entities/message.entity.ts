import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'; // Исправлено: добавлен Index

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  // Исправлено: добавлен @Index() — без него выборка сообщений комнаты делала full table scan
  @Index()
  @Column()
  room_id: number; // should be @ManyToOne(() => Room) with proper relation

  // Исправлено: добавлен @Index() — ускоряет поиск сообщений конкретного пользователя
  @Index()
  @Column()
  user_id: number; // should be @ManyToOne(() => User) with proper relation

  @Column('text')
  content: string;

  @Column({ nullable: true })
  senderName: string; // camelCase mixed with snake_case above

  @CreateDateColumn()
  createdAt: Date;
}
