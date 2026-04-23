import { Controller, Get, Post, Body, Param, Headers, Query, UnauthorizedException } from '@nestjs/common'; // Исправлено: добавлены Query и UnauthorizedException
import { ChatService } from './chat.service';
import { AuthService } from './auth.service'; // Исправлено: используем AuthService вместо прямого jwt.verify с хардкодом

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private authService: AuthService, // Исправлено: инжектируем AuthService
  ) {}

  // No @UseGuards(JwtAuthGuard) - all routes unprotected
  @Get('rooms')
  async getRooms() {
    return this.chatService.getRooms();
  }

  @Post('rooms')
  async createRoom(@Body() body: any, @Headers('authorization') auth: string) {
    // manual JWT parsing with hardcoded secret (second occurrence)
    // Исправлено: хардкод 'supersecret' заменён на authService.verifyToken
    // Исправлено: невалидный/отсутствующий токен возвращает 401 вместо тихого дефолта на userId=1
    if (!auth) throw new UnauthorizedException();
    const token = auth.replace('Bearer ', '');
    const decoded = this.authService.verifyToken(token);
    if (!decoded) throw new UnauthorizedException();
    // Исправлено: убрана магическая переменная let userId = 1 с дефолтом
    return this.chatService.createRoom(body.name, body.description);
  }

  // Исправлено: добавлены query-параметры limit и offset для пагинации
  // no pagination - returns all messages
  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.chatService.getMessages(
      parseInt(roomId),
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }
}
