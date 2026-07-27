import { Controller, Post, Get, Body, Res, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const validUser = await this.authService.validateUser(dto.email, dto.password);
    const { accessToken, user } = await this.authService.login(validUser);

    const cookieOptions = {
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      httpOnly: true,
    });

    res.cookie('is_logged_in', 'true', {
      ...cookieOptions,
      httpOnly: false,
    });

    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('is_logged_in', { path: '/' });
    return { message: 'ログアウトしました。' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.getProfile(req.user.userId);
    const { accessToken } = await this.authService.login(user);

    const cookieOptions = {
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      httpOnly: true,
    });

    res.cookie('is_logged_in', 'true', {
      ...cookieOptions,
      httpOnly: false,
    });

    return { user };
  }
}
