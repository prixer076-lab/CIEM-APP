import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { API_MESSAGES } from '../constants/api-messages';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawResponse = isHttpException ? exception.getResponse() : null;

    const errorBody =
      typeof rawResponse === 'object' && rawResponse !== null
        ? rawResponse
        : {
            success: false,
            message: isHttpException ? String(rawResponse) : 'Error interno del servidor.',
          };

    response.status(status).json({
      success: false,
      statusCode: status,
      message:
        (errorBody as { message?: string }).message ??
        API_MESSAGES.validationError,
      errorCode:
        (errorBody as { errorCode?: string }).errorCode ??
        'UNEXPECTED_ERROR',
      details: (errorBody as { details?: unknown }).details ?? null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
