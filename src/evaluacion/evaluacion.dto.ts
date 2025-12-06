import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsMongoId,
  Length,
  IsInt,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TipoEvaluacion, EstadoEvaluacion } from './evaluacion.model';

export class ConfiguracionEvaluacionDto {
  @ApiPropertyOptional({
    description: 'Permitir reintentos de la evaluación',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Permitir reintentos debe ser verdadero o falso' })
  permitirReintentos?: boolean;

  @ApiPropertyOptional({
    description: 'Número máximo de reintentos permitidos',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber(
    {},
    { message: 'El número máximo de reintentos debe ser un número' },
  )
  @IsInt({
    message: 'El número máximo de reintentos debe ser un número entero',
  })
  @Min(1, { message: 'Mínimo 1 reintento' })
  @Max(10, { message: 'Máximo 10 reintentos' })
  numeroMaximoReintentos?: number;

  @ApiPropertyOptional({
    description: 'Mostrar resultados inmediatamente después de completar',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Mostrar resultados inmediatos debe ser verdadero o falso',
  })
  mostrarResultadosInmediatos?: boolean;

  @ApiPropertyOptional({
    description: 'Barajar el orden de las preguntas',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Barajar preguntas debe ser verdadero o falso' })
  barajarPreguntas?: boolean;

  @ApiPropertyOptional({
    description: 'Aplicar límite de tiempo estricto',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Límite de tiempo debe ser verdadero o falso' })
  limiteTiempo?: boolean;

  @ApiPropertyOptional({
    description: 'Requiere supervisión durante la evaluación',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Requiere supervisión debe ser verdadero o falso' })
  requiereSupervision?: boolean;
}

export class CrearEvaluacionDto {
  @ApiProperty({
    description: 'Título de la evaluación',
    example: 'Examen Final de Matemáticas',
    maxLength: 200,
  })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @Length(3, 200, { message: 'El título debe tener entre 3 y 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  titulo: string;

  @ApiProperty({
    description: 'Descripción detallada de la evaluación',
    example:
      'Examen que evalúa los conocimientos adquiridos durante el semestre',
    maxLength: 1000,
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @Length(10, 1000, {
    message: 'La descripción debe tener entre 10 y 1000 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  descripcion: string;

  @ApiProperty({
    description: 'Tipo de evaluación',
    enum: TipoEvaluacion,
    example: TipoEvaluacion.EXAMEN,
  })
  @IsEnum(TipoEvaluacion, { message: 'El tipo de evaluación debe ser válido' })
  tipo: TipoEvaluacion;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la evaluación',
    example: '2024-12-01T09:00:00.000Z',
  })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  fechaInicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la evaluación',
    example: '2024-12-01T11:00:00.000Z',
  })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  fechaFin: string;

  @ApiProperty({
    description: 'Duración de la evaluación en minutos',
    example: 120,
    minimum: 1,
    maximum: 1000,
  })
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(1, { message: 'La duración mínima es 1 minuto' })
  @Max(1000, { message: 'La duración máxima es 1000 minutos' })
  duracionMinutos: number;

  @ApiProperty({
    description: 'Puntaje máximo de la evaluación',
    example: 100,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber({}, { message: 'El puntaje máximo debe ser un número' })
  @Min(1, { message: 'El puntaje máximo mínimo es 1' })
  @Max(100, { message: 'El puntaje máximo es 100' })
  puntajeMaximo: number;

  @ApiPropertyOptional({
    description: 'Puntaje mínimo para aprobar la evaluación',
    example: 60,
    minimum: 0,
    maximum: 100,
    default: 60,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El puntaje mínimo debe ser un número' })
  @Min(0, { message: 'El puntaje mínimo no puede ser negativo' })
  @Max(100, { message: 'El puntaje mínimo máximo es 100' })
  puntajeMinimo?: number;

  @ApiPropertyOptional({
    description: 'Lista de instrucciones para la evaluación',
    example: [
      'Lea cuidadosamente cada pregunta',
      'Responda todas las preguntas',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Las instrucciones deben ser un arreglo' })
  @IsString({
    each: true,
    message: 'Cada instrucción debe ser una cadena de texto',
  })
  @ArrayMaxSize(10, { message: 'Máximo 10 instrucciones permitidas' })
  instrucciones?: string[];

  @ApiPropertyOptional({
    description: 'Configuración adicional de la evaluación',
    example: {
      permitirReintentos: true,
      numeroMaximoReintentos: 3,
      mostrarResultadosInmediatos: false,
      barajarPreguntas: true,
      limiteTiempo: true,
      requiereSupervision: false,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguracionEvaluacionDto)
  configuracion?: ConfiguracionEvaluacionDto;

  @ApiPropertyOptional({
    description: 'Etiquetas para categorizar la evaluación',
    example: ['matemáticas', 'álgebra', 'final'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Las etiquetas deben ser un arreglo' })
  @IsString({
    each: true,
    message: 'Cada etiqueta debe ser una cadena de texto',
  })
  @ArrayMaxSize(20, { message: 'Máximo 20 etiquetas permitidas' })
  etiquetas?: string[];

  @ApiPropertyOptional({
    description: 'Observaciones adicionales sobre la evaluación',
    example: 'Esta evaluación requiere calculadora científica',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  @Length(0, 500, {
    message: 'Las observaciones no pueden exceder 500 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  observaciones?: string;
}

export class ActualizarEvaluacionDto extends PartialType(CrearEvaluacionDto) {
  @ApiPropertyOptional({
    description: 'Estado de la evaluación',
    enum: EstadoEvaluacion,
    example: EstadoEvaluacion.PUBLICADA,
  })
  @IsOptional()
  @IsEnum(EstadoEvaluacion, {
    message: 'El estado de evaluación debe ser válido',
  })
  estado?: EstadoEvaluacion;

  @ApiPropertyOptional({
    description: 'Indica si la evaluación está activa',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Activa debe ser verdadero o falso' })
  activa?: boolean;
}

export class FiltroEvaluacionDto {
  @ApiPropertyOptional({
    description: 'ID del evaluador para filtrar',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId válido' })
  evaluadorId?: string;

  @ApiPropertyOptional({
    description: 'Estado de la evaluación para filtrar',
    enum: EstadoEvaluacion,
    example: EstadoEvaluacion.PUBLICADA,
  })
  @IsOptional()
  @IsEnum(EstadoEvaluacion, { message: 'El estado debe ser válido' })
  estado?: EstadoEvaluacion;

  @ApiPropertyOptional({
    description: 'Tipo de evaluación para filtrar',
    enum: TipoEvaluacion,
    example: TipoEvaluacion.EXAMEN,
  })
  @IsOptional()
  @IsEnum(TipoEvaluacion, { message: 'El tipo debe ser válido' })
  tipo?: TipoEvaluacion;

  @ApiPropertyOptional({
    description: 'Filtrar por evaluaciones activas o inactivas',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Activa debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  activa?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de inicio para filtrar (desde)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para filtrar (hasta)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'Término de búsqueda en título y descripción',
    example: 'matemáticas',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser una cadena de texto' })
  @Length(2, 100, {
    message: 'La búsqueda debe tener entre 2 y 100 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Número máximo de resultados a retornar',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(value);
    return Number.isNaN(n) ? undefined : n;
  })
  limite?: number;

  @ApiPropertyOptional({
    description: 'Número de resultados a omitir (para paginación)',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El offset debe ser un número' })
  @IsInt({ message: 'El offset debe ser un número entero' })
  @Min(0, { message: 'El offset no puede ser negativo' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseInt(value);
    return Number.isNaN(n) ? undefined : n;
  })
  offset?: number;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar los resultados',
    example: 'fechaCreacion',
    enum: ['fechaCreacion', 'titulo', 'fechaInicio', 'fechaFin', 'estado'],
  })
  @IsOptional()
  @IsString({
    message: 'El campo de ordenamiento debe ser una cadena de texto',
  })
  @IsIn(['fechaCreacion', 'titulo', 'fechaInicio', 'fechaFin', 'estado'], {
    message:
      'El campo de ordenamiento debe ser uno de: fechaCreacion, titulo, fechaInicio, fechaFin, estado',
  })
  ordenarPor?: string = 'fechaCreacion';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString({
    message: 'La dirección de ordenamiento debe ser una cadena de texto',
  })
  @IsIn(['asc', 'desc'], {
    message: 'La dirección de ordenamiento debe ser asc o desc',
  })
  direccionOrden?: string = 'desc';

  @ApiPropertyOptional({
    description: 'Incluir evaluaciones inactivas en los resultados',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Incluir inactivas debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  incluirInactivas?: boolean = false;

  @ApiPropertyOptional({
    description: 'ID del estudiante asignado para filtrar evaluaciones',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del estudiante debe ser un ObjectId válido' })
  estudianteId?: string;
}

export class CambiarEstadoEvaluacionDto {
  @ApiProperty({
    description: 'Nuevo estado de la evaluación',
    enum: EstadoEvaluacion,
    example: EstadoEvaluacion.PUBLICADA,
  })
  @IsEnum(EstadoEvaluacion, { message: 'El estado debe ser válido' })
  estado: EstadoEvaluacion;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Evaluación lista para ser tomada por los estudiantes',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @Length(0, 500, { message: 'El motivo no puede exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  motivo?: string;
}

export class AsignarEstudiantesDto {
  @ApiProperty({
    description: 'Lista de IDs de estudiantes a asignar',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray({ message: 'Los estudiantes deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe asignar al menos un estudiante' })
  @ArrayMaxSize(100, { message: 'Máximo 100 estudiantes por evaluación' })
  @IsMongoId({
    each: true,
    message: 'Cada ID de estudiante debe ser un ObjectId válido',
  })
  estudiantesIds: string[];
}

export class EstadisticasEvaluacionDto {
  @ApiPropertyOptional({
    description: 'ID del evaluador para obtener estadísticas específicas',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId válido' })
  evaluadorId?: string;

  @ApiPropertyOptional({
    description: 'Agrupar estadísticas por tipo de evaluación',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Agrupar por tipo debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  agruparPorTipo?: boolean;

  @ApiPropertyOptional({
    description: 'Agrupar estadísticas por estado de evaluación',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Agrupar por estado debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  agruparPorEstado?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir evaluaciones inactivas en las estadísticas',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Incluir inactivas debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  incluirInactivas?: boolean;
}

export class BuscarEvaluacionesDto {
  @ApiProperty({
    description: 'Término de búsqueda',
    example: 'matemáticas examen final',
  })
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El término de búsqueda es obligatorio' })
  @Length(2, 100, {
    message: 'El término de búsqueda debe tener entre 2 y 100 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  termino: string;

  @ApiPropertyOptional({
    description: 'Filtros adicionales para la búsqueda',
    type: FiltroEvaluacionDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FiltroEvaluacionDto)
  filtros?: FiltroEvaluacionDto;
}
