import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FichaController } from './ficha.controller';
import { FichaService } from './ficha.service';
import { Ficha, FichaSchema } from './schemas/ficha.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ficha.name, schema: FichaSchema }]),
  ],
  controllers: [FichaController],
  providers: [FichaService],
  exports: [FichaService],
})
export class FichaModule {}
