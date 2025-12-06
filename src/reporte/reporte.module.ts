import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReporteController } from './reporte.controller';
import { ReporteService } from './reporte.service';
import { Usuario, UsuarioSchema } from '../usuario/usuario.model';
import { Proyecto, ProyectoSchema } from '../proyecto/proyecto.model';
import { Evaluacion, EvaluacionSchema } from '../evaluacion/evaluacion.model';
import { Reporte, ReporteSchema } from './reporte.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Proyecto.name, schema: ProyectoSchema },
      { name: Evaluacion.name, schema: EvaluacionSchema },
      { name: Reporte.name, schema: ReporteSchema },
    ]),
  ],
  controllers: [ReporteController],
  providers: [ReporteService],
  exports: [ReporteService],
})
export class ReporteModule {}
