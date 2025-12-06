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
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EvaluacionService } from './evaluacion.service';
import {
  CrearEvaluacionDto,
  ActualizarEvaluacionDto,
  FiltroEvaluacionDto,
  CambiarEstadoEvaluacionDto,
  AsignarEstudiantesDto,
  EstadisticasEvaluacionDto,
  BuscarEvaluacionesDto,
} from './evaluacion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';
import { EstadoEvaluacion, TipoEvaluacion } from './evaluacion.model';

@ApiTags('evaluaciones')
@ApiBearerAuth()
@Controller('evaluaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EvaluacionController {
  constructor(private readonly evaluacionService: EvaluacionService) {}

  @Post()
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear una nueva evaluación' })
  @ApiResponse({ status: 201, description: 'Evaluación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body() crearEvaluacionDto: CrearEvaluacionDto,
    @User('id') usuarioId: string,
  ) {
    return await this.evaluacionService.crear(crearEvaluacionDto, usuarioId);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({
    summary: 'Obtener todas las evaluaciones con filtros opcionales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones obtenida exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiQuery({
    name: 'evaluadorId',
    required: false,
    description: 'ID del evaluador',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: EstadoEvaluacion,
    description: 'Estado de la evaluación',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Tipo de evaluación',
  })
  @ApiQuery({
    name: 'activa',
    required: false,
    type: Boolean,
    description: 'Filtrar por evaluaciones activas',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio (desde)',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin (hasta)',
  })
  @ApiQuery({
    name: 'busqueda',
    required: false,
    description: 'Término de búsqueda',
  })
  @ApiQuery({
    name: 'limite',
    required: false,
    type: Number,
    description: 'Límite de resultados',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset para paginación',
  })
  async obtenerTodas(@Query() filtros: FiltroEvaluacionDto) {
    return await this.evaluacionService.obtenerTodas(filtros);
  }

  @Get('mis-evaluaciones')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Obtener evaluaciones creadas por el usuario actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones del usuario obtenida exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerMisEvaluaciones(
    @User('id') usuarioId: string,
    @Query() filtros: FiltroEvaluacionDto,
  ) {
    return await this.evaluacionService.obtenerPorEvaluador(usuarioId, filtros);
  }

  @Get('estudiante/:estudianteId')
  @Roles(RolUsuario.ESTUDIANTE, RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Obtener evaluaciones asignadas a un estudiante específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones del estudiante obtenida exitosamente',
  })
  @ApiResponse({ status: 400, description: 'ID de estudiante inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerPorEstudiante(
    @Param('estudianteId') estudianteId: string,
    @Query() filtros: FiltroEvaluacionDto,
    @User('id') usuarioId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    // Los estudiantes solo pueden ver sus propias evaluaciones
    if (rolUsuario === RolUsuario.ESTUDIANTE && estudianteId !== usuarioId) {
      throw new BadRequestException(
        'No tienes permisos para ver las evaluaciones de otro estudiante',
      );
    }

    return await this.evaluacionService.obtenerPorEstudiante(
      estudianteId,
      filtros,
    );
  }

  @Get('evaluador/:evaluadorId')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Obtener evaluaciones creadas por un evaluador específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones del evaluador obtenida exitosamente',
  })
  @ApiResponse({ status: 400, description: 'ID de evaluador inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerPorEvaluador(
    @Param('evaluadorId') evaluadorId: string,
    @Query() filtros: FiltroEvaluacionDto,
    @User('id') usuarioId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    // Los evaluadores solo pueden ver sus propias evaluaciones (excepto administradores)
    if (rolUsuario === RolUsuario.EVALUADOR && evaluadorId !== usuarioId) {
      throw new BadRequestException(
        'No tienes permisos para ver las evaluaciones de otro evaluador',
      );
    }

    return await this.evaluacionService.obtenerPorEvaluador(
      evaluadorId,
      filtros,
    );
  }

  @Get('activas')
  @Roles(RolUsuario.ESTUDIANTE, RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener evaluaciones activas disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones activas obtenida exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerEvaluacionesActivas() {
    return await this.evaluacionService.obtenerEvaluacionesActivas();
  }

  @Get('vencidas')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener evaluaciones vencidas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones vencidas obtenida exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerEvaluacionesVencidas() {
    return await this.evaluacionService.obtenerEvaluacionesVencidas();
  }

  @Get('estadisticas')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener estadísticas de evaluaciones' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiQuery({
    name: 'evaluadorId',
    required: false,
    description: 'ID del evaluador para estadísticas específicas',
  })
  @ApiQuery({
    name: 'agruparPorTipo',
    required: false,
    type: Boolean,
    description: 'Agrupar por tipo',
  })
  @ApiQuery({
    name: 'agruparPorEstado',
    required: false,
    type: Boolean,
    description: 'Agrupar por estado',
  })
  @ApiQuery({
    name: 'incluirInactivas',
    required: false,
    type: Boolean,
    description: 'Incluir inactivas',
  })
  async obtenerEstadisticas(
    @Query() estadisticasDto: EstadisticasEvaluacionDto,
    @User('id') usuarioId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    // Los evaluadores solo pueden ver sus propias estadísticas
    const evaluadorId =
      rolUsuario === RolUsuario.ADMINISTRADOR
        ? estadisticasDto.evaluadorId
        : usuarioId;

    return await this.evaluacionService.obtenerEstadisticas(evaluadorId);
  }

  @Get('dashboard/resumen')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Obtener resumen de evaluaciones para dashboard de administrador',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen de evaluaciones para dashboard',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerResumenDashboard() {
    return await this.evaluacionService.obtenerResumenDashboard();
  }

  @Get('dashboard/metricas-evaluador')
  @Roles(RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener métricas específicas para evaluador' })
  @ApiResponse({ status: 200, description: 'Métricas del evaluador' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerMetricasEvaluadorDashboard(@User('id') evaluadorId: string) {
    return await this.evaluacionService.obtenerMetricasEvaluador(evaluadorId);
  }

  @Get('dashboard/rendimiento')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener métricas de rendimiento de evaluaciones' })
  @ApiResponse({ status: 200, description: 'Métricas de rendimiento' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiQuery({
    name: 'periodo',
    required: false,
    enum: ['semana', 'mes', 'trimestre'],
    description: 'Período para las métricas',
  })
  async obtenerRendimiento(
    @Query('periodo') periodo: string = 'mes',
    @User('id') userId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    const evaluadorId =
      rolUsuario === RolUsuario.ADMINISTRADOR ? undefined : userId;
    return await this.evaluacionService.obtenerRendimiento(
      periodo,
      evaluadorId,
    );
  }

  @Post('buscar')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Buscar evaluaciones por término' })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda obtenidos exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Término de búsqueda inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @HttpCode(HttpStatus.OK)
  async buscarEvaluaciones(@Body() buscarDto: BuscarEvaluacionesDto) {
    const filtros = {
      ...buscarDto.filtros,
      busqueda: buscarDto.termino,
    };
    return await this.evaluacionService.obtenerTodas(filtros);
  }

  @Get('por-tipo/:tipo')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener evaluaciones por tipo específico' })
  @ApiParam({
    name: 'tipo',
    description: 'Tipo de evaluación',
    example: 'EXAMEN',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones del tipo especificado',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerPorTipo(
    @Param('tipo') tipo: TipoEvaluacion,
    @Query() filtros: FiltroEvaluacionDto,
  ) {
    const filtrosConTipo = { ...filtros, tipo };
    return await this.evaluacionService.obtenerTodas(filtrosConTipo);
  }

  @Get('por-estudiante/:estudianteId')
  @Roles(RolUsuario.ESTUDIANTE, RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary:
      'Obtener evaluaciones asignadas a un estudiante específico (mejorado)',
  })
  @ApiParam({
    name: 'estudianteId',
    description: 'ID del estudiante',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de evaluaciones del estudiante',
  })
  @ApiResponse({ status: 400, description: 'ID de estudiante inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerPorEstudianteMejorado(
    @Param('estudianteId') estudianteId: string,
    @Query() filtros: FiltroEvaluacionDto,
  ) {
    const filtrosConEstudiante = { ...filtros, estudianteId };
    return await this.evaluacionService.obtenerTodas(filtrosConEstudiante);
  }

  @Get(':id')
  @Roles(RolUsuario.ESTUDIANTE, RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener una evaluación por ID' })
  @ApiResponse({ status: 200, description: 'Evaluación obtenida exitosamente' })
  @ApiResponse({ status: 400, description: 'ID de evaluación inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  async obtenerPorId(@Param('id') id: string) {
    return await this.evaluacionService.obtenerPorId(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar una evaluación' })
  @ApiResponse({
    status: 200,
    description: 'Evaluación actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - Evaluación no se puede actualizar',
  })
  async actualizar(
    @Param('id') id: string,
    @Body() actualizarEvaluacionDto: ActualizarEvaluacionDto,
    @User('id') usuarioId: string,
  ) {
    return await this.evaluacionService.actualizar(
      id,
      actualizarEvaluacionDto,
      usuarioId,
    );
  }

  @Patch(':id/estado')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Cambiar el estado de una evaluación' })
  @ApiResponse({
    status: 200,
    description: 'Estado de evaluación cambiado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  async cambiarEstado(
    @Param('id') id: string,
    @Body() cambiarEstadoDto: CambiarEstadoEvaluacionDto,
    @User('id') usuarioId: string,
  ) {
    return await this.evaluacionService.cambiarEstado(
      id,
      cambiarEstadoDto.estado,
      usuarioId,
    );
  }

  @Patch(':id/estudiantes')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Asignar estudiantes a una evaluación' })
  @ApiResponse({
    status: 200,
    description: 'Estudiantes asignados exitosamente',
  })
  @ApiResponse({ status: 400, description: 'IDs de estudiantes inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  async asignarEstudiantes(
    @Param('id') id: string,
    @Body() asignarEstudiantesDto: AsignarEstudiantesDto,
    @User('id') usuarioId: string,
  ) {
    return await this.evaluacionService.asignarEstudiantes(
      id,
      asignarEstudiantesDto.estudiantesIds,
      usuarioId,
    );
  }

  @Delete(':id')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar una evaluación' })
  @ApiResponse({
    status: 204,
    description: 'Evaluación eliminada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'ID de evaluación inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto - Evaluación no se puede eliminar',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(@Param('id') id: string, @User('id') usuarioId: string) {
    await this.evaluacionService.eliminar(id, usuarioId);
  }
}
