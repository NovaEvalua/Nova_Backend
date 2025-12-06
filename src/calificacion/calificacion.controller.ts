import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { CalificacionService } from './calificacion.service';
import { CalificacionDocument } from './calificacion.model';
import {
  CrearCalificacionDto,
  ActualizarCalificacionDto,
  FiltroCalificacionDto,
  CalificacionMasivaDto,
  EstadisticasCalificacionDto,
} from './calificacion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

@Controller('calificaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalificacionController {
  constructor(private readonly calificacionService: CalificacionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  async crear(
    @Body(ValidationPipe) crearCalificacionDto: CrearCalificacionDto,
    @User() user: any,
  ) {
    return await this.calificacionService.crear(crearCalificacionDto, user.id);
  }

  @Post('masiva')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  async crearMasiva(
    @Body(ValidationPipe) calificacionMasivaDto: CalificacionMasivaDto,
    @User() user: any,
  ) {
    const calificaciones: CalificacionDocument[] = [];
    for (const calificacion of calificacionMasivaDto.calificaciones) {
      const nuevaCalificacion = await this.calificacionService.crear(
        {
          evaluacionId: calificacionMasivaDto.evaluacionId,
          ...calificacion,
        },
        user.id,
      );
      calificaciones.push(nuevaCalificacion);
    }
    return {
      mensaje: 'Calificaciones creadas correctamente',
      calificaciones,
      total: calificaciones.length,
    };
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR)
  async obtenerTodas(@Query() filtros?: FiltroCalificacionDto) {
    return await this.calificacionService.obtenerTodas();
  }

  @Get('mis-calificaciones')
  @Roles(RolUsuario.EVALUADOR)
  async obtenerMisCalificaciones(@User() user: any) {
    return await this.calificacionService.obtenerPorCalificador(user.id);
  }

  @Get('evaluacion/:evaluacionId')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR, RolUsuario.ESTUDIANTE)
  async obtenerPorEvaluacion(
    @Param('evaluacionId') evaluacionId: string,
    @User() user: any,
  ) {
    return await this.calificacionService.obtenerPorEvaluacion(evaluacionId);
  }

  @Get('evaluacion/:evaluacionId/promedio')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR, RolUsuario.ESTUDIANTE)
  async obtenerPromedioEvaluacion(@Param('evaluacionId') evaluacionId: string) {
    const promedio =
      await this.calificacionService.calcularPromedioEvaluacion(evaluacionId);
    return {
      evaluacionId,
      promedio: Math.round(promedio * 100) / 100,
      mensaje: `Promedio de la evaluación: ${Math.round(promedio * 100) / 100}%`,
    };
  }

  @Get('evaluacion/:evaluacionId/estadisticas')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  async obtenerEstadisticasEvaluacion(
    @Param('evaluacionId') evaluacionId: string,
  ) {
    const estadisticas =
      await this.calificacionService.obtenerEstadisticasEvaluacion(
        evaluacionId,
      );
    return {
      evaluacionId,
      estadisticas,
      porcentajeGeneral: estadisticas
        ? Math.round(
            (estadisticas.puntajeTotalObtenido /
              estadisticas.puntajeTotalMaximo) *
              10000,
          ) / 100
        : 0,
    };
  }

  @Get(':id')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR, RolUsuario.ESTUDIANTE)
  async obtenerPorId(@Param('id') id: string) {
    return await this.calificacionService.obtenerPorId(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  async actualizar(
    @Param('id') id: string,
    @Body(ValidationPipe) actualizarCalificacionDto: ActualizarCalificacionDto,
    @User() user: any,
  ) {
    return await this.calificacionService.actualizar(
      id,
      actualizarCalificacionDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RolUsuario.ADMINISTRADOR)
  async eliminar(@Param('id') id: string) {
    await this.calificacionService.eliminar(id);
    return {
      mensaje: 'Calificación eliminada correctamente',
      id,
    };
  }

  @Delete('evaluacion/:evaluacionId')
  @HttpCode(HttpStatus.OK)
  @Roles(RolUsuario.ADMINISTRADOR)
  async eliminarPorEvaluacion(@Param('evaluacionId') evaluacionId: string) {
    const calificaciones =
      await this.calificacionService.obtenerPorEvaluacion(evaluacionId);

    for (const calificacion of calificaciones) {
      await this.calificacionService.eliminar(
        (calificacion._id as any).toString(),
      );
    }

    return {
      mensaje: 'Todas las calificaciones de la evaluación han sido eliminadas',
      evaluacionId,
      eliminadas: calificaciones.length,
    };
  }
}
