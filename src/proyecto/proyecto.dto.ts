import {
  IsString,
  IsEnum,
  IsOptional,
  IsMongoId,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoProyecto } from '../common/enums/estado-proyecto.enum';

export class CrearProyectoDto {
  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Sistema de Gestion de Inventario',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @ApiProperty({
    description: 'Descripcion detallada del proyecto',
    example:
      'Desarrollo de un sistema web para gestionar inventarios de productos',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString({ message: 'La descripcion debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripcion es obligatoria' })
  @MinLength(10, {
    message: 'La descripcion debe tener al menos 10 caracteres',
  })
  @MaxLength(2000, {
    message: 'La descripcion no puede exceder 2000 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  descripcion: string;

  @ApiPropertyOptional({
    description: 'Lista de instructores del proyecto',
    example: ['Juan Perez', 'Maria Garcia'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Los instructores deben ser un array' })
  @IsString({
    each: true,
    message: 'Cada instructor debe ser una cadena de texto',
  })
  instructores?: string[];

  @ApiPropertyOptional({
    description: 'Fecha de entrega del proyecto',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de entrega debe ser una fecha valida' },
  )
  fechaEntrega?: string;

  @ApiPropertyOptional({
    description: 'Formato del proyecto',
    example: 'Presencial',
  })
  @IsOptional()
  @IsString({ message: 'El formato debe ser una cadena de texto' })
  formato?: string;

  @ApiPropertyOptional({
    description: 'Parametros/requisitos a tener en cuenta para la evaluacion',
    minLength: 10,
    maxLength: 1500,
  })
  @IsOptional()
  @IsString({ message: 'Los requisitos deben ser una cadena de texto' })
  @MinLength(10, {
    message: 'Los requisitos deben tener al menos 10 caracteres',
  })
  @MaxLength(1500, {
    message: 'Los requisitos no pueden exceder 1500 caracteres',
  })
  requisitos?: string;

  @ApiPropertyOptional({
    description: 'ID de la ficha asociada al proyecto (compatibilidad)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID de la ficha debe ser un ObjectId valido' })
  fichaId?: string;

  @ApiPropertyOptional({
    description: 'IDs de las fichas asociadas al proyecto (minimo 1)',
    example: ['507f1f77bcf86cd799439011'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Las fichasIds deben ser un array' })
  @IsMongoId({
    each: true,
    message: 'Cada fichaId debe ser un ObjectId valido',
  })
  fichasIds?: string[];

  @ApiPropertyOptional({
    description: 'IDs de evaluadores responsables asignados al proyecto',
    example: ['507f1f77bcf86cd799439011'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Los evaluadores asignados deben ser un array' })
  @IsMongoId({
    each: true,
    message: 'Cada ID de evaluador debe ser un ObjectId valido',
  })
  evaluadoresAsignadosIds?: string[];

  @ApiPropertyOptional({
    description: 'ID de evaluador principal (compatibilidad)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId valido' })
  evaluadorAsignadoId?: string;

  @ApiPropertyOptional({
    description: 'Estado inicial del proyecto',
    enum: EstadoProyecto,
    default: EstadoProyecto.BORRADOR,
  })
  @IsOptional()
  @IsEnum(EstadoProyecto, { message: 'El estado debe ser un valor valido' })
  estadoInicial?: EstadoProyecto = EstadoProyecto.BORRADOR;
}

export class ActualizarProyectoDto {
  @ApiPropertyOptional({
    description: 'Titulo del proyecto',
    example: 'Sistema de Gestion de Inventario Actualizado',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'El titulo debe ser una cadena de texto' })
  @MinLength(3, { message: 'El titulo debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El titulo no puede exceder 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Descripcion detallada del proyecto',
    example: 'Desarrollo de un sistema web mejorado para gestionar inventarios',
    minLength: 10,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'La descripcion debe ser una cadena de texto' })
  @MinLength(10, {
    message: 'La descripcion debe tener al menos 10 caracteres',
  })
  @MaxLength(2000, {
    message: 'La descripcion no puede exceder 2000 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Requisitos tecnicos y funcionales del proyecto',
    example: 'Node.js, React, MongoDB, TypeScript',
    minLength: 10,
    maxLength: 1500,
  })
  @IsOptional()
  @IsString({ message: 'Los requisitos deben ser una cadena de texto' })
  @MinLength(10, {
    message: 'Los requisitos deben tener al menos 10 caracteres',
  })
  @MaxLength(1500, {
    message: 'Los requisitos no pueden exceder 1500 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  requisitos?: string;

  @ApiPropertyOptional({
    description: 'ID de la ficha asociada al proyecto (compatibilidad)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID de la ficha debe ser un ObjectId valido' })
  fichaId?: string;

  @ApiPropertyOptional({
    description: 'IDs de las fichas asociadas al proyecto (minimo 1)',
    example: ['507f1f77bcf86cd799439011'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Las fichasIds deben ser un array' })
  @IsMongoId({
    each: true,
    message: 'Cada fichaId debe ser un ObjectId valido',
  })
  fichasIds?: string[];

  @ApiPropertyOptional({
    description: 'IDs de evaluadores responsables asignados al proyecto',
    example: ['507f1f77bcf86cd799439011'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Los evaluadores asignados deben ser un array' })
  @IsMongoId({
    each: true,
    message: 'Cada ID de evaluador debe ser un ObjectId valido',
  })
  evaluadoresAsignadosIds?: string[];

  @ApiPropertyOptional({
    description: 'ID de evaluador principal (compatibilidad)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId valido' })
  evaluadorAsignadoId?: string;
}

export class FiltroProyectoDto {
  @ApiPropertyOptional({
    description: 'ID del creador para filtrar proyectos',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del creador debe ser un ObjectId valido' })
  creadorId?: string;

  @ApiPropertyOptional({
    description: 'ID del evaluador para filtrar proyectos',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId valido' })
  evaluadorAsignadoId?: string;

  @ApiPropertyOptional({
    description: 'Estado del proyecto para filtrar',
    enum: EstadoProyecto,
  })
  @IsOptional()
  @IsEnum(EstadoProyecto, { message: 'El estado debe ser un valor valido' })
  estado?: EstadoProyecto;

  @ApiPropertyOptional({
    description: 'Termino de busqueda en titulo, descripcion o requisitos',
    example: 'inventario',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'La busqueda debe ser una cadena de texto' })
  @MinLength(2, { message: 'La busqueda debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'La busqueda no puede exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  busqueda?: string;

  @ApiPropertyOptional({
    description:
      'Fecha de inicio para filtrar proyectos creados desde esta fecha',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha valida' })
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para filtrar proyectos creados hasta esta fecha',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha valida' })
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'Numero maximo de resultados a devolver',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El limite debe ser un numero' })
  @Min(1, { message: 'El limite debe ser al menos 1' })
  @Max(100, { message: 'El limite no puede exceder 100' })
  limite?: number = 20;

  @ApiPropertyOptional({
    description: 'Numero de resultados a omitir (para paginacion)',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El offset debe ser un numero' })
  @Min(0, { message: 'El offset debe ser al menos 0' })
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'ID de la ficha para filtrar proyectos',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID de la ficha debe ser un ObjectId valido' })
  fichaId?: string;

  @ApiPropertyOptional({
    description: 'Nombre del instructor para filtrar proyectos',
    example: 'Juan Perez',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({
    message: 'El nombre del instructor debe ser una cadena de texto',
  })
  @MinLength(2, {
    message: 'El nombre del instructor debe tener al menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'El nombre del instructor no puede exceder 100 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  instructor?: string;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar los resultados',
    example: 'fechaCreacion',
    enum: ['fechaCreacion', 'titulo', 'estado', 'fechaActualizacion'],
  })
  @IsOptional()
  @IsString({
    message: 'El campo de ordenamiento debe ser una cadena de texto',
  })
  @IsIn(['fechaCreacion', 'titulo', 'estado', 'fechaActualizacion'], {
    message:
      'El campo de ordenamiento debe ser uno de: fechaCreacion, titulo, estado, fechaActualizacion',
  })
  ordenarPor?: string = 'fechaCreacion';

  @ApiPropertyOptional({
    description: 'Direccion del ordenamiento',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString({
    message: 'La direccion de ordenamiento debe ser una cadena de texto',
  })
  @IsIn(['asc', 'desc'], {
    message: 'La direccion de ordenamiento debe ser asc o desc',
  })
  direccionOrden?: string = 'desc';

  @ApiPropertyOptional({
    description: 'Incluir proyectos archivados en los resultados',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Incluir archivados debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  incluirArchivados?: boolean = false;
}

export class CambiarEstadoProyectoDto {
  @ApiProperty({
    description: 'Nuevo estado del proyecto',
    enum: EstadoProyecto,
    example: EstadoProyecto.ACTIVO,
  })
  @IsEnum(EstadoProyecto, { message: 'El estado debe ser un valor valido' })
  estado: EstadoProyecto;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Proyecto aprobado por el comite de evaluacion',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  motivo?: string;
}

export class AsignarEvaluadorDto {
  @ApiProperty({
    description: 'ID del evaluador a asignar',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId valido' })
  evaluadorId: string;

  @ApiPropertyOptional({
    description: 'Comentarios sobre la asignacion',
    example: 'Evaluador especializado en desarrollo web',
    maxLength: 300,
  })
  @IsOptional()
  @IsString({ message: 'Los comentarios deben ser una cadena de texto' })
  @MaxLength(300, {
    message: 'Los comentarios no pueden exceder 300 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  comentarios?: string;
}

export class EstadisticasProyectoDto {
  @ApiPropertyOptional({
    description: 'ID del creador para filtrar estadisticas',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del creador debe ser un ObjectId valido' })
  creadorId?: string;

  @ApiPropertyOptional({
    description: 'Incluir proyectos inactivos en las estadisticas',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'incluirInactivos debe ser un valor booleano' })
  incluirInactivos?: boolean = false;

  @ApiPropertyOptional({
    description: 'Agrupar estadisticas por estado',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'agruparPorEstado debe ser un valor booleano' })
  agruparPorEstado?: boolean = true;
}

export class BuscarProyectosDto {
  @ApiProperty({
    description: 'Termino de busqueda',
    example: 'sistema gestion',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El termino de busqueda debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El termino de busqueda es obligatorio' })
  @MinLength(2, {
    message: 'El termino de busqueda debe tener al menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'El termino de busqueda no puede exceder 100 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  termino: string;

  @ApiPropertyOptional({
    description: 'Filtros adicionales para la busqueda',
    type: FiltroProyectoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FiltroProyectoDto)
  filtros?: FiltroProyectoDto;

  @ApiPropertyOptional({
    description: 'Incluir proyectos inactivos en la busqueda',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'incluirInactivos debe ser un valor booleano' })
  incluirInactivos?: boolean = false;
}

export class AsignarInstructorDto {
  @ApiProperty({
    description: 'ID del instructor a asignar',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'El ID del instructor debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El ID del instructor es obligatorio' })
  @IsMongoId({ message: 'El ID del instructor debe ser un ObjectId valido' })
  instructorId: string;
}

export class DesasignarInstructorDto {
  @ApiProperty({
    description: 'ID del instructor a desasignar',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString({ message: 'El ID del instructor debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El ID del instructor es obligatorio' })
  @IsMongoId({ message: 'El ID del instructor debe ser un ObjectId valido' })
  instructorId: string;
}
