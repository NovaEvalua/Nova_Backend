import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReporteService } from './reporte.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReporteController {
  constructor(private readonly reporteService: ReporteService) {}

  @Get('general')
  @Roles(RolUsuario.ADMINISTRADOR)
  async obtenerReporteGeneral() {
    return await this.reporteService.obtenerReporteGeneral();
  }

  @Get('evaluaciones')
  @Roles(RolUsuario.ADMINISTRADOR)
  async obtenerReporteEvaluaciones() {
    return await this.reporteService.obtenerReporteEvaluaciones();
  }
}
