import { Body, Controller, Get, Headers, Post, Version } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Version('1')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post('register')
  @Version('1')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Get('me')
  @Version('1')
  me(
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.authService.getCurrentUser(authorization, userId);
  }

  @Post('logout')
  @Version('1')
  logout(@Headers('authorization') authorization?: string) {
    return this.authService.logout(authorization);
  }
}
