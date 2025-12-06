import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalificacionController } from './calificacion.controller';
import { CalificacionService } from './calificacion.service';
import { Calificacion, CalificacionSchema } from './calificacion.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Calificacion.name, schema: CalificacionSchema },
    ]),
  ],
  controllers: [CalificacionController],
  providers: [CalificacionService],
  exports: [CalificacionService],
})
export class CalificacionModule {}
