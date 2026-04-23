import { IsString, MinLength, MaxLength } from 'class-validator';

// This DTO is defined but never used - controllers use `body: any` instead
// Исправлено: DTO теперь используется в AppController.register — валидация включена через ValidationPipe
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}
