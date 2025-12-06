import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GrupoService } from './grupo.service';
import { CrearGrupoDto, ActualizarGrupoDto } from './grupo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';
import { User } from '../common/decorators/user.decorator';

@Controller('grupos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GrupoController {
  constructor(private readonly grupoService: GrupoService) {}

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  async crear(@Body() dto: CrearGrupoDto, @User('id') userId: string) {
    return await this.grupoService.crear(dto, userId);
  }

  @Get('proyecto/:proyectoId')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async listarPorProyecto(@Param('proyectoId') proyectoId: string) {
    return await this.grupoService.listarPorProyecto(proyectoId);
  }

  @Get(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async obtener(@Param('id') id: string) {
    return await this.grupoService.obtenerPorId(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarGrupoDto) {
    return await this.grupoService.actualizar(id, dto);
  }
}
