import { Controller } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';

@Controller('notificaciones')
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) {}
}
