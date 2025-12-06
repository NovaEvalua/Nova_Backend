import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FichaService } from './ficha.service';
import {
  CrearFichaDto,
  ActualizarFichaDto,
  FiltroFichaDto,
  AsignarInstructorDto,
  AsignarEstudianteDto,
} from './dto/ficha.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

@ApiTags('fichas')
@Controller('fichas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FichaController {
  constructor(private readonly fichaService: FichaService) {}

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear una nueva ficha' })
  @ApiResponse({ status: 201, description: 'Ficha creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una ficha con este número',
  })
  async crear(@Body() crearFichaDto: CrearFichaDto) {
    return await this.fichaService.crear(crearFichaDto);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  @ApiOperation({ summary: 'Obtener todas las fichas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de fichas obtenida exitosamente',
  })
  @ApiQuery({
    name: 'programa',
    required: false,
    description: 'Filtrar por programa',
  })
  @ApiQuery({
    name: 'nivel',
    required: false,
    description: 'Filtrar por nivel de formación',
  })
  @ApiQuery({
    name: 'modalidad',
    required: false,
    description: 'Filtrar por modalidad',
  })
  @ApiQuery({
    name: 'activa',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo',
  })
  @ApiQuery({
    name: 'coordinadorId',
    required: false,
    description: 'Filtrar por coordinador',
  })
  @ApiQuery({
    name: 'busqueda',
    required: false,
    description: 'Búsqueda general',
  })
  async obtenerTodas(@Query() filtros: FiltroFichaDto) {
    return await this.fichaService.obtenerTodas(filtros);
  }

  @Get('activas')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  @ApiOperation({ summary: 'Obtener fichas activas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de fichas activas obtenida exitosamente',
  })
  async obtenerFichasActivas() {
    return await this.fichaService.obtenerFichasActivas();
  }

  @Get('estadisticas')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener estadísticas de fichas' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async obtenerEstadisticas() {
    return await this.fichaService.obtenerEstadisticas();
  }

  @Get('numero/:numero')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  @ApiOperation({ summary: 'Obtener ficha por número' })
  @ApiResponse({ status: 200, description: 'Ficha encontrada' })
  @ApiResponse({ status: 404, description: 'Ficha no encontrada' })
  async obtenerPorNumero(@Param('numero') numero: string) {
    return await this.fichaService.obtenerPorNumero(numero);
  }

  @Get(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  @ApiOperation({ summary: 'Obtener ficha por ID' })
  @ApiResponse({ status: 200, description: 'Ficha encontrada' })
  @ApiResponse({ status: 404, description: 'Ficha no encontrada' })
  async obtenerPorId(@Param('id') id: string) {
    return await this.fichaService.obtenerPorId(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar una ficha' })
  @ApiResponse({ status: 200, description: 'Ficha actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Ficha no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una ficha con este número',
  })
  async actualizar(
    @Param('id') id: string,
    @Body() actualizarFichaDto: ActualizarFichaDto,
  ) {
    return await this.fichaService.actualizar(id, actualizarFichaDto);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una ficha' })
  @ApiResponse({ status: 204, description: 'Ficha eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Ficha no encontrada' })
  async eliminar(@Param('id') id: string) {
    await this.fichaService.eliminar(id);
  }

  @Post(':id/instructores')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Asignar instructor a una ficha' })
  @ApiResponse({ status: 200, description: 'Instructor asignado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ficha no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'El instructor ya está asignado a esta ficha',
  })
  async asignarInstructor(
    @Param('id') fichaId: string,
    @Body() asignarInstructorDto: AsignarInstructorDto,
  ) {
    return await this.fichaService.asignarInstructor(
      fichaId,
      asignarInstructorDto.instructorId,
    );
  }

  @Delete(':id/instructores/:instructorId')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Desasignar instructor de una ficha' })
  @ApiResponse({
    status: 200,
    description: 'Instructor desasignado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ficha no encontrada' })
  async desasignarInstructor(
    @Param('id') fichaId: string,
    @Param('instructorId') instructorId: string,
  ) {
    return await this.fichaService.desasignarInstructor(fichaId, instructorId);
  }

  @Post(':id/estudiantes')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Asignar estudiante a una ficha' })
  @ApiResponse({ status: 200, description: 'Estudiante asignado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ficha no encontrada' })
  @ApiResponse({
    status: 409,
    description:
      'El estudiante ya está asignado a esta ficha o la ficha ha alcanzado su capacidad máxima',
  })
  async asignarEstudiante(
    @Param('id') fichaId: string,
    @Body() asignarEstudianteDto: AsignarEstudianteDto,
  ) {
    return await this.fichaService.asignarEstudiante(
      fichaId,
      asignarEstudianteDto.estudianteId,
    );
  }

  @Delete(':id/estudiantes/:estudianteId')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Desasignar estudiante de una ficha' })
  @ApiResponse({
    status: 200,
    description: 'Estudiante desasignado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ficha no encontrada' })
  async desasignarEstudiante(
    @Param('id') fichaId: string,
    @Param('estudianteId') estudianteId: string,
  ) {
    return await this.fichaService.desasignarEstudiante(fichaId, estudianteId);
  }
}
