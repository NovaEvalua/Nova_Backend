import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Import all modules
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ProyectoModule } from './proyecto/proyecto.module';
import { EvaluacionModule } from './evaluacion/evaluacion.module';
import { CalificacionModule } from './calificacion/calificacion.module';
import { CertificadoModule } from './certificado/certificado.module';
import { ReporteModule } from './reporte/reporte.module';
import { HistorialModule } from './historial/historial.module';
import { NotificacionModule } from './notificacion/notificacion.module';
import { AsignacionModule } from './asignacion/asignacion.module';
import { UploadModule } from './upload/upload.module';
import { FichaModule } from './ficha/ficha.module';

// Import app controller and service
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.env.develop' : '.env',
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        'mongodb://127.0.0.1:27017/nova',
    ),
    AuthModule,
    UsuarioModule,
    ProyectoModule,
    EvaluacionModule,
    CalificacionModule,
    CertificadoModule,
    ReporteModule,
    HistorialModule,
    NotificacionModule,
    AsignacionModule,
    UploadModule,
    FichaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
