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
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProyectoService } from './proyecto.service';
import {
  CrearProyectoDto,
  ActualizarProyectoDto,
  FiltroProyectoDto,
  CambiarEstadoProyectoDto,
  AsignarEvaluadorDto,
  EstadisticasProyectoDto,
  BuscarProyectosDto,
  AsignarInstructorDto,
  DesasignarInstructorDto,
} from './proyecto.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';
import { EstadoProyecto } from '../common/enums/estado-proyecto.enum';

@ApiTags('Proyectos')
@Controller('proyectos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ProyectoController {
  constructor(private readonly proyectoService: ProyectoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo proyecto' })
  @ApiResponse({
    status: 201,
    description: 'Proyecto creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body() crearProyectoDto: CrearProyectoDto,
    @User('id') userId: string,
  ) {
    return await this.proyectoService.crear(crearProyectoDto, userId);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Obtener todos los proyectos (solo administradores)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los proyectos',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo administradores',
  })
  async obtenerTodos(@Query() filtros: FiltroProyectoDto) {
    return await this.proyectoService.obtenerTodos(filtros);
  }

  @Get('mis-proyectos')
  @ApiOperation({ summary: 'Obtener proyectos creados por el usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos del usuario',
  })
  async obtenerMisProyectos(
    @User('id') userId: string,
    @Query() filtros: FiltroProyectoDto,
  ) {
    return await this.proyectoService.obtenerPorCreador(userId, filtros);
  }

  @Get('asignados')
  @Roles(RolUsuario.EVALUADOR, RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener proyectos asignados al evaluador actual' })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos asignados',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo evaluadores y administradores',
  })
  async obtenerProyectosAsignados(
    @User('id') userId: string,
    @Query() filtros: FiltroProyectoDto,
  ) {
    return await this.proyectoService.obtenerPorEvaluador(userId, filtros);
  }

  @Get('disponibles')
  @Roles(RolUsuario.ESTUDIANTE, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener proyectos disponibles para estudiantes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos disponibles',
  })
  async obtenerDisponibles() {
    return await this.proyectoService.obtenerDisponibles();
  }

  @Get('estado/:estado')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener proyectos por estado' })
  @ApiParam({
    name: 'estado',
    enum: EstadoProyecto,
    description: 'Estado del proyecto',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos con el estado especificado',
  })
  async obtenerPorEstado(@Param('estado') estado: EstadoProyecto) {
    return await this.proyectoService.obtenerPorEstado(estado);
  }

  @Get('estadisticas')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener estadísticas de proyectos' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de proyectos',
  })
  async obtenerEstadisticas(
    @Query() estadisticasDto: EstadisticasProyectoDto,
    @User('id') userId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    // Solo administradores pueden ver estadísticas globales
    const creadorId =
      rolUsuario === RolUsuario.ADMINISTRADOR
        ? estadisticasDto.creadorId
        : userId;

    return await this.proyectoService.obtenerEstadisticas(creadorId);
  }

  @Get('dashboard/resumen')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener resumen para dashboard de administrador' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de proyectos para dashboard',
  })
  async obtenerResumenDashboard() {
    return await this.proyectoService.obtenerResumenDashboard();
  }

  @Get('dashboard/tendencias')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener tendencias de proyectos por período' })
  @ApiResponse({
    status: 200,
    description: 'Tendencias de proyectos',
  })
  @ApiQuery({
    name: 'periodo',
    required: false,
    enum: ['semana', 'mes', 'trimestre', 'año'],
    description: 'Período para las tendencias',
  })
  async obtenerTendencias(
    @Query('periodo') periodo: string = 'mes',
    @User('id') userId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    const creadorId =
      rolUsuario === RolUsuario.ADMINISTRADOR ? undefined : userId;
    return await this.proyectoService.obtenerTendencias(periodo, creadorId);
  }

  @Get('dashboard/metricas-evaluador')
  @Roles(RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener métricas específicas para evaluador' })
  @ApiResponse({
    status: 200,
    description: 'Métricas del evaluador',
  })
  async obtenerMetricasEvaluador(@User('id') evaluadorId: string) {
    return await this.proyectoService.obtenerMetricasEvaluador(evaluadorId);
  }

  @Post('buscar')
  @ApiOperation({ summary: 'Buscar proyectos por término' })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda de proyectos',
  })
  @HttpCode(HttpStatus.OK)
  async buscarProyectos(@Body() buscarDto: BuscarProyectosDto) {
    const filtros = {
      ...buscarDto.filtros,
      busqueda: buscarDto.termino,
    };
    return await this.proyectoService.obtenerTodos(filtros);
  }

  @Get('por-ficha/:fichaId')
  @ApiOperation({ summary: 'Obtener proyectos por ficha específica' })
  @ApiParam({
    name: 'fichaId',
    description: 'ID de la ficha',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos de la ficha',
  })
  async obtenerPorFicha(
    @Param('fichaId') fichaId: string,
    @Query() filtros: FiltroProyectoDto,
  ) {
    const filtrosConFicha = { ...filtros, fichaId };
    return await this.proyectoService.obtenerTodos(filtrosConFicha);
  }

  @Get('por-instructor')
  @ApiOperation({ summary: 'Obtener proyectos por instructor' })
  @ApiQuery({
    name: 'instructor',
    description: 'Nombre del instructor',
    example: 'Juan Pérez',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos del instructor',
  })
  async obtenerPorInstructor(
    @Query('instructor') instructor: string,
    @Query() filtros: FiltroProyectoDto,
  ) {
    const filtrosConInstructor = { ...filtros, instructor };
    return await this.proyectoService.obtenerTodos(filtrosConInstructor);
  }

  @Get(':id/ranking')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  @ApiOperation({ summary: 'Obtener ranking de grupos para un proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking de grupos con notas y posiciones',
  })
  async obtenerRanking(
    @Param('id') id: string,
    @Query('jornada') jornada?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return await this.proyectoService.obtenerRankingProyecto(id, {
      jornada,
      desde,
      hasta,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener proyecto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async obtenerPorId(@Param('id') id: string) {
    return await this.proyectoService.obtenerPorId(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto actualizado exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para actualizar este proyecto',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  async actualizar(
    @Param('id') id: string,
    @Body() actualizarProyectoDto: ActualizarProyectoDto,
    @User('id') userId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    return await this.proyectoService.actualizar(
      id,
      actualizarProyectoDto,
      userId,
      rolUsuario,
    );
  }

  @Put(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado del proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del proyecto cambiado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado inválida',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para cambiar el estado',
  })
  async cambiarEstado(
    @Param('id') id: string,
    @Body() cambiarEstadoDto: CambiarEstadoProyectoDto,
    @User('id') userId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    return await this.proyectoService.cambiarEstado(
      id,
      cambiarEstadoDto.estado,
      userId,
      rolUsuario,
    );
  }

  @Put(':id/asignar-evaluador')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Asignar evaluador a proyecto (solo administradores)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluador asignado exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo administradores',
  })
  async asignarEvaluador(
    @Param('id') id: string,
    @Body() asignarEvaluadorDto: AsignarEvaluadorDto,
    @User('id') userId: string,
  ) {
    return await this.proyectoService.asignarEvaluador(
      id,
      asignarEvaluadorDto.evaluadorId,
      userId,
    );
  }

  @Post(':id/instructores')
  @ApiOperation({ summary: 'Asignar instructor a proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor asignado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o instructor ya asignado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para asignar instructores',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto o instructor no encontrado',
  })
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  async asignarInstructor(
    @Param('id') id: string,
    @Body() asignarInstructorDto: AsignarInstructorDto,
    @User('id') userId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    const proyecto = await this.proyectoService.asignarInstructor(
      id,
      asignarInstructorDto.instructorId,
      userId,
      rolUsuario,
    );
    return {
      mensaje: 'Instructor asignado correctamente',
      proyecto,
    };
  }

  @Delete(':id/instructores/:instructorId')
  @ApiOperation({ summary: 'Desasignar instructor de proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'instructorId',
    description: 'ID del instructor',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Instructor desasignado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Instructor no está asignado al proyecto',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para desasignar instructores',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @HttpCode(HttpStatus.OK)
  async desasignarInstructor(
    @Param('id') id: string,
    @Param('instructorId') instructorId: string,
    @User('id') userId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    const proyecto = await this.proyectoService.desasignarInstructor(
      id,
      instructorId,
      userId,
      rolUsuario,
    );
    return {
      mensaje: 'Instructor desasignado correctamente',
      proyecto,
    };
  }

  @Get(':id/instructores')
  @ApiOperation({ summary: 'Obtener instructores de un proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de instructores del proyecto',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async obtenerInstructores(@Param('id') id: string) {
    const instructores = await this.proyectoService.obtenerInstructores(id);
    return {
      instructores,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar proyecto' })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyecto eliminado exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para eliminar este proyecto',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado',
  })
  @HttpCode(HttpStatus.OK)
  async eliminar(
    @Param('id') id: string,
    @User('id') userId: string,
    @User('rol') rolUsuario: RolUsuario,
  ) {
    await this.proyectoService.eliminar(id, userId, rolUsuario);
    return { mensaje: 'Proyecto eliminado correctamente' };
  }
}
