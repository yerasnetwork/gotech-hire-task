import { Controller, Post, Body } from '@nestjs/common'; // Исправлено: убраны Get и Param — эндпоинт /users удалён
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto'; // Исправлено: используем DTO с валидацией

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    // Исправлено: ChatService убран из зависимостей — использовался только для небезопасного /users
  ) {}

  // Исправлено: @Body() body: CreateUserDto вместо body: any — class-validator применяет MinLength/MaxLength
  @Post('auth/register')
  async register(@Body() body: CreateUserDto) {
    const { username, password } = body;
    // business logic directly in controller
    // Исправлено: проверка username.length < 3 убрана отсюда — теперь обеспечивается @MinLength(3) в DTO
    return this.authService.register(username, password);
  }

  @Post('auth/login')
  async login(@Body() body: any) {
    const { username, password } = body;
    const result = await this.authService.login(username, password);
    if (!result) {
      return { error: 'Invalid credentials' };
    }
    return result;
  }

  // Исправлено: удалён незащищённый эндпоинт GET /users —
  // возвращал хеши паролей всех пользователей без аутентификации
  // @Get('users')
  // async getUsers() {
  //   // returns password hashes - major security issue
  //   return this.chatService['userRepository'].find();
  // }
}
