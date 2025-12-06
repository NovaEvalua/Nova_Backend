import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AsignacionController } from './asignacion.controller';
import { AsignacionService } from './asignacion.service';
import { Asignacion, AsignacionSchema } from './asignacion.model';
import { Ficha, FichaSchema } from '../ficha/schemas/ficha.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asignacion.name, schema: AsignacionSchema },
      { name: Ficha.name, schema: FichaSchema },
    ]),
  ],
  controllers: [AsignacionController],
  providers: [AsignacionService],
  exports: [AsignacionService],
})
export class AsignacionModule {}
