import { Controller, Post, Body, HttpException, HttpStatus, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body('password') password: string) {
    if (!password) {
      throw new HttpException('Password required', HttpStatus.BAD_REQUEST);
    }

    if (!this.authService.validatePassword(password)) {
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }

    const token = this.authService.generateToken();
    return { token };
  }

  @Get('verify')
  verify() {
    // If we get here, the token is valid (guard passed)
    return { valid: true };
  }
}
