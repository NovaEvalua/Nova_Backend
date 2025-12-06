import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CertificadoController } from './certificado.controller';
import { CertificadoService } from './certificado.service';
import { Certificado, CertificadoSchema } from './certificado.model';
import { Asignacion, AsignacionSchema } from '../asignacion/asignacion.model';
import { Grupo, GrupoSchema } from '../grupo/grupo.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Certificado.name, schema: CertificadoSchema },
      { name: Asignacion.name, schema: AsignacionSchema },
      { name: Grupo.name, schema: GrupoSchema },
    ]),
  ],
  controllers: [CertificadoController],
  providers: [CertificadoService],
  exports: [CertificadoService],
})
export class CertificadoModule {}
