import { HttpStatus } from '@nestjs/common';
import { AppHttpException } from './app-http.exception';

export class ResourceNotFoundException extends AppHttpException {
  constructor(resource: string, field = 'id', value?: string | number) {
    super({
      message: `${resource} no encontrado.`,
      code: 'RESOURCE_NOT_FOUND',
      statusCode: HttpStatus.NOT_FOUND,
      details: value !== undefined ? { field, value } : { field },
    });
  }
}
