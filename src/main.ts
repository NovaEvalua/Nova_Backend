import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsuarioService } from './usuario/usuario.service';
import { RolUsuario } from './common/enums/rol-usuario.enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const envOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const localOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ];
  app.enableCors({
    origin: envOrigins.length ? envOrigins : localOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Bind strictly to PORT (default 3000). If busy, error out.
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`NestJS Backend running on port ${port}`);

  const usuarioService = app.get(UsuarioService);
  try {
    const admin = await usuarioService.obtenerPorCorreo('admin@sena.local');
    if (
      (admin as any)?.activo === false ||
      (admin as any)?.estado !== 'ACTIVO'
    ) {
      await usuarioService.actualizar(
        (admin as any)._id?.toString?.() || (admin as any)._id,
        {
          activo: true,
          estado: 'ACTIVO',
        } as any,
      );
    }
  } catch {
    await usuarioService.crear({
      correo: 'admin@sena.local',
      contrasena: 'Admin1234',
      nombre: 'Admin',
      apellidos: 'SENA',
      rol: RolUsuario.ADMINISTRADOR,
      estado: 'ACTIVO',
      activo: true,
    } as any);
  }
}

bootstrap();
