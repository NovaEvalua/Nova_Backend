import {
  IsArray,
  ArrayMinSize,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
} from 'class-validator';

export class CrearGrupoDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nombre: string;

  @IsMongoId()
  @IsNotEmpty()
  proyectoId: string;

  @IsMongoId()
  @IsNotEmpty()
  fichaId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  estudiantesIds: string[];
}

export class ActualizarGrupoDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nombre?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  estudiantesIds?: string[];
}
