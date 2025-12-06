import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AsignacionService } from './asignacion.service';
import {
  CrearAsignacionDto,
  ActualizarAsignacionDto,
  AsignarProyectoDto,
  AsignarProyectoFichaDto,
  CompletarAsignacionDto,
  FiltroAsignacionDto,
} from './asignacion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

@Controller('asignaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsignacionController {
  constructor(private readonly asignacionService: AsignacionService) {}

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() crearAsignacionDto: CrearAsignacionDto) {
    return await this.asignacionService.crear(crearAsignacionDto);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR)
  async obtenerTodas(@Query() filtros?: FiltroAsignacionDto) {
    return await this.asignacionService.obtenerTodas();
  }

  @Get('mis-asignaciones')
  @Roles(RolUsuario.EVALUADOR)
  async obtenerMisAsignaciones(@User() usuario: any) {
    return await this.asignacionService.obtenerPorEvaluador(usuario.id);
  }

  @Get('estudiante/mis-asignaciones')
  @Roles(RolUsuario.ESTUDIANTE)
  async obtenerMisAsignacionesEstudiante(@User() usuario: any) {
    return await this.asignacionService.obtenerPorEstudiante(usuario.id);
  }

  @Get('evaluador/:evaluadorId')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  async obtenerPorEvaluador(
    @Param('evaluadorId') evaluadorId: string,
    @User() usuario: any,
  ) {
    // Los evaluadores solo pueden ver sus propias asignaciones
    if (usuario.rol === RolUsuario.EVALUADOR && usuario.id !== evaluadorId) {
      throw new Error('No tienes permisos para ver estas asignaciones');
    }
    return await this.asignacionService.obtenerPorEvaluador(evaluadorId);
  }

  @Get('estudiante/:estudianteId')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async obtenerPorEstudiante(
    @Param('estudianteId') estudianteId: string,
    @User() usuario: any,
  ) {
    // Los estudiantes solo pueden ver sus propias asignaciones
    if (usuario.rol === RolUsuario.ESTUDIANTE && usuario.id !== estudianteId) {
      throw new Error('No tienes permisos para ver estas asignaciones');
    }
    return await this.asignacionService.obtenerPorEstudiante(estudianteId);
  }

  @Get('proyecto/:proyectoId')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  async obtenerPorProyecto(@Param('proyectoId') proyectoId: string) {
    return await this.asignacionService.obtenerPorProyecto(proyectoId);
  }

  @Get(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async obtenerPorId(@Param('id') id: string, @User() usuario: any) {
    const asignacion = await this.asignacionService.obtenerPorId(id);

    // Verificar permisos según el rol
    if (
      usuario.rol === RolUsuario.EVALUADOR &&
      asignacion.evaluadorId.toString() !== usuario.id
    ) {
      throw new Error('No tienes permisos para ver esta asignación');
    }

    if (
      usuario.rol === RolUsuario.ESTUDIANTE &&
      asignacion.estudianteId.toString() !== usuario.id
    ) {
      throw new Error('No tienes permisos para ver esta asignación');
    }

    return asignacion;
  }

  @Post('asignar-proyecto')
  @Roles(RolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  async asignarProyecto(@Body() asignarProyectoDto: AsignarProyectoDto) {
    const { proyectoId, evaluadorId, estudianteId } = asignarProyectoDto;
    return await this.asignacionService.asignarProyecto(
      proyectoId,
      evaluadorId,
      estudianteId,
    );
  }

  @Post('asignar-proyecto-ficha')
  @Roles(RolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  async asignarProyectoAFicha(@Body() dto: AsignarProyectoFichaDto) {
    const { proyectoId, evaluadorId, fichaId } = dto;
    return await this.asignacionService.asignarProyectoAFicha(
      proyectoId,
      evaluadorId,
      fichaId,
    );
  }

  @Put(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  async actualizar(
    @Param('id') id: string,
    @Body() actualizarAsignacionDto: ActualizarAsignacionDto,
    @User() usuario: any,
  ) {
    // Los evaluadores solo pueden actualizar sus propias asignaciones
    if (usuario.rol === RolUsuario.EVALUADOR) {
      const asignacion = await this.asignacionService.obtenerPorId(id);
      if (asignacion.evaluadorId.toString() !== usuario.id) {
        throw new Error('No tienes permisos para actualizar esta asignación');
      }
    }

    return await this.asignacionService.actualizar(id, actualizarAsignacionDto);
  }

  @Put(':id/completar')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  async completarAsignacion(
    @Param('id') id: string,
    @Body() completarAsignacionDto: CompletarAsignacionDto,
    @User() usuario: any,
  ) {
    // Los evaluadores solo pueden completar sus propias asignaciones
    if (usuario.rol === RolUsuario.EVALUADOR) {
      const asignacion = await this.asignacionService.obtenerPorId(id);
      if (asignacion.evaluadorId.toString() !== usuario.id) {
        throw new Error('No tienes permisos para completar esta asignación');
      }
    }

    return await this.asignacionService.completarAsignacion(
      id,
      completarAsignacionDto.evaluacionId,
    );
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(@Param('id') id: string) {
    await this.asignacionService.eliminar(id);
  }
}
