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
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CertificadoService } from './certificado.service';
import {
  CrearCertificadoDto,
  ActualizarCertificadoDto,
  FiltroCertificadoDto,
  CambiarEstadoCertificadoDto,
  VerificarCertificadoDto,
  EstadisticasCertificadoDto,
} from './certificado.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

@ApiTags('certificados')
@Controller('certificados')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CertificadoController {
  constructor(private readonly certificadoService: CertificadoService) {}

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Crear un nuevo certificado' })
  @ApiResponse({ status: 201, description: 'Certificado creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para crear certificados',
  })
  async crear(
    @Body() crearCertificadoDto: CrearCertificadoDto,
    @User() usuario: any,
  ) {
    return await this.certificadoService.crear(crearCertificadoDto);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Obtener todos los certificados con filtros opcionales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de certificados obtenida exitosamente',
  })
  async obtenerTodos(
    @Query() filtros: FiltroCertificadoDto,
    @User() usuario: any,
  ) {
    if (Object.keys(filtros).length > 0) {
      // Implementar lógica de filtros en el servicio si es necesario
      return await this.certificadoService.obtenerTodos();
    }
    return await this.certificadoService.obtenerTodos();
  }

  @Get('mis-certificados')
  @Roles(RolUsuario.ESTUDIANTE)
  @ApiOperation({ summary: 'Obtener certificados del estudiante autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Certificados del estudiante obtenidos exitosamente',
  })
  async obtenerMisCertificados(@User() usuario: any) {
    return await this.certificadoService.obtenerPorEstudiante(usuario.id);
  }

  @Get('estudiante/:estudianteId')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({ summary: 'Obtener certificados de un estudiante específico' })
  @ApiResponse({
    status: 200,
    description: 'Certificados del estudiante obtenidos exitosamente',
  })
  @ApiResponse({ status: 400, description: 'ID de estudiante inválido' })
  async obtenerPorEstudiante(
    @Param('estudianteId') estudianteId: string,
    @User() usuario: any,
  ) {
    return await this.certificadoService.obtenerPorEstudiante(estudianteId);
  }

  @Get('evaluacion/:evaluacionId')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @ApiOperation({
    summary: 'Obtener certificados de una evaluación específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificados de la evaluación obtenidos exitosamente',
  })
  @ApiResponse({ status: 400, description: 'ID de evaluación inválido' })
  async obtenerPorEvaluacion(
    @Param('evaluacionId') evaluacionId: string,
    @User() usuario: any,
  ) {
    return await this.certificadoService.obtenerPorEvaluacion(evaluacionId);
  }

  @Get('estadisticas')
  @Roles(RolUsuario.ADMINISTRADOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Obtener estadísticas de certificados' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async obtenerEstadisticas(
    @Query() filtros: EstadisticasCertificadoDto,
    @User() usuario: any,
  ) {
    return await this.certificadoService.obtenerEstadisticas();
  }

  @Post('verificar')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Verificar la autenticidad de un certificado' })
  @ApiResponse({
    status: 200,
    description: 'Certificado verificado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  async verificarCertificado(@Body() verificarDto: VerificarCertificadoDto) {
    return await this.certificadoService.verificarCertificado(
      verificarDto.numeroCertificado,
    );
  }

  @Get(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  @ApiOperation({ summary: 'Obtener un certificado por ID' })
  @ApiResponse({
    status: 200,
    description: 'Certificado obtenido exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  async obtenerPorId(@Param('id') id: string, @User() usuario: any) {
    const certificado = await this.certificadoService.obtenerPorId(id);

    // Si es estudiante, solo puede ver sus propios certificados
    if (
      usuario.rol === RolUsuario.ESTUDIANTE &&
      certificado.estudianteId.toString() !== usuario.id
    ) {
      throw new Error('No tienes permisos para ver este certificado');
    }

    return certificado;
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Actualizar un certificado' })
  @ApiResponse({
    status: 200,
    description: 'Certificado actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async actualizar(
    @Param('id') id: string,
    @Body() actualizarCertificadoDto: ActualizarCertificadoDto,
    @User() usuario: any,
  ) {
    return await this.certificadoService.actualizar(
      id,
      actualizarCertificadoDto,
    );
  }

  @Patch(':id/estado')
  @Roles(RolUsuario.ADMINISTRADOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Cambiar el estado de un certificado' })
  @ApiResponse({
    status: 200,
    description: 'Estado del certificado actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  async cambiarEstado(
    @Param('id') id: string,
    @Body() cambiarEstadoDto: CambiarEstadoCertificadoDto,
    @User() usuario: any,
  ) {
    return await this.certificadoService.cambiarEstado(
      id,
      cambiarEstadoDto.estado,
    );
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un certificado' })
  @ApiResponse({
    status: 204,
    description: 'Certificado eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  async eliminar(@Param('id') id: string, @User() usuario: any) {
    await this.certificadoService.eliminar(id);
  }
}
