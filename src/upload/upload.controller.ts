import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Get,
  Param,
  Res,
  Delete,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { User } from '../common/decorators/user.decorator';
import type { Response } from 'express';
import { Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @ApiOperation({ summary: 'Subir un archivo único' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Archivo subido exitosamente' })
  @UseInterceptors(FileInterceptor('file'))
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @User('id') userId: string,
    @Query('type') type?: string,
    @Query('id') relatedId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    return this.uploadService.saveFileInfo(file, {
      uploadedBy: userId,
      relatedEntityType: type,
      relatedEntity: relatedId,
    });
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Subir múltiples archivos' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Archivos subidos exitosamente' })
  @UseInterceptors(FilesInterceptor('files', 10)) // máximo 10 archivos
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @User('id') userId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se han proporcionado archivos');
    }

    const results: any[] = [];
    for (const file of files) {
      const result = await this.uploadService.saveFileInfo(file, {
        uploadedBy: userId,
      });
      results.push(result);
    }

    return {
      message: 'Archivos subidos exitosamente',
      files: results,
    };
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Descargar archivo por nombre' })
  @ApiResponse({ status: 200, description: 'Archivo descargado exitosamente' })
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.uploadService.downloadFile(filename, res);
  }

  @Get('by-entity/:type/:id')
  @ApiOperation({ summary: 'Listar archivos asociados a una entidad' })
  @ApiResponse({ status: 200, description: 'Lista de archivos por entidad' })
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async listByEntity(@Param('type') type: string, @Param('id') id: string) {
    return this.uploadService.getFilesByEntity(type, id);
  }

  @Get('by-group/:id')
  @ApiOperation({ summary: 'Listar archivos asociados a un grupo' })
  @ApiResponse({ status: 200, description: 'Lista de archivos del grupo' })
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async listByGroup(@Param('id') id: string) {
    return this.uploadService.getFilesByEntity('grupo', id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar archivo por ID' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado exitosamente' })
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR, RolUsuario.ESTUDIANTE)
  async deleteFile(@Param('id') id: string) {
    return this.uploadService.deleteFile(id);
  }

  @Get('list')
  @ApiOperation({ summary: 'Listar todos los archivos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de archivos obtenida exitosamente',
  })
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.EVALUADOR)
  async listFiles() {
    return this.uploadService.getAllFiles();
  }
}
