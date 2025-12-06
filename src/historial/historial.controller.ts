import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('historial')
@UseGuards(JwtAuthGuard)
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get('mi-historial')
  async obtenerMiHistorial(@Request() req: any) {
    const userId = req.user.id;
    return await this.historialService.obtenerPorUsuario(userId);
  }
}
