import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import type { JwtPayload } from './auth.model';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@User() user: JwtPayload) {
    // En una implementación completa, aquí se invalidaría el token
    // Por ahora, simplemente retornamos un mensaje de éxito
    return {
      message: 'Sesión cerrada exitosamente',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    // En una implementación completa, aquí se validaría el refresh token
    // y se generaría un nuevo access token
    return {
      message: 'Funcionalidad de refresh token pendiente de implementación',
      refreshToken: refreshTokenDto.refreshToken,
    };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @User() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    // En una implementación completa, aquí se cambiaría la contraseña
    return {
      message:
        'Funcionalidad de cambio de contraseña pendiente de implementación',
      userId: user.sub,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@User() user: JwtPayload) {
    return {
      message: 'Perfil del usuario autenticado',
      user: {
        id: user.sub,
        correo: user.correo,
        rol: user.rol,
      },
    };
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyToken(@User() user: JwtPayload) {
    return {
      valid: true,
      user: {
        id: user.sub,
        correo: user.correo,
        rol: user.rol,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
