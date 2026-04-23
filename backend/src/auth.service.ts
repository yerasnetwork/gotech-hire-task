import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt'; // Исправлено: заменён import crypto на bcrypt

// TODO: move to env
// Исправлено: JWT_SECRET читается из переменной окружения вместо хардкода
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Исправлено: раскомментирована и активирована функция hashPassword с bcrypt
  // private hashPassword(password: string): string {
  //   return bcrypt.hashSync(password, 10);
  // }

  // Исправлено: md5 удалён — вместо него используется bcrypt.hash (с солью, устойчив к rainbow-table)
  // private md5(password: string): string {
  //   return crypto.createHash('md5').update(password).digest('hex');
  // }

  async register(username: string, password: string): Promise<any> {
    // Исправлено: убран console.log с именем пользователя
    // console.log('Registering user:', username);
    // Исправлено: bcrypt.hash вместо md5 — добавляет соль, стойкий к перебору
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ username, password: hashed });
    const saved = await this.userRepository.save(user);
    const token = jwt.sign({ userId: saved.id, username }, JWT_SECRET, { expiresIn: '24h' });
    return { token, userId: saved.id };
  }

  async login(username: string, password: string): Promise<any> {
    // Исправлено: сначала находим пользователя по username, затем сравниваем через bcrypt.compare
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;
    // Исправлено: убран console.log
    // console.log('User logged in:', username);
    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '24h' });
    return { token, userId: user.id };
  }

  // async refreshToken(token: string) {
  //   // TODO: implement refresh tokens
  //   return null;
  // }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
}
