import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProyectoController } from './proyecto.controller';
import { ProyectoService } from './proyecto.service';
import { Proyecto, ProyectoSchema } from './proyecto.model';
import { Usuario, UsuarioSchema } from '../usuario/usuario.model';
import { Asignacion, AsignacionSchema } from '../asignacion/asignacion.model';
import {
  Calificacion,
  CalificacionSchema,
} from '../calificacion/calificacion.model';
import { Ficha, FichaSchema } from '../ficha/schemas/ficha.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proyecto.name, schema: ProyectoSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Asignacion.name, schema: AsignacionSchema },
      { name: Calificacion.name, schema: CalificacionSchema },
      { name: Ficha.name, schema: FichaSchema },
    ]),
  ],
  controllers: [ProyectoController],
  providers: [ProyectoService],
  exports: [ProyectoService],
})
export class ProyectoModule {}
