import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluacionController } from './evaluacion.controller';
import { EvaluacionService } from './evaluacion.service';
import { Evaluacion, EvaluacionSchema } from './evaluacion.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluacion.name, schema: EvaluacionSchema },
    ]),
  ],
  controllers: [EvaluacionController],
  providers: [EvaluacionService],
  exports: [EvaluacionService],
})
export class EvaluacionModule {}
