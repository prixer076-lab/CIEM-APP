import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_MESSAGES } from '../constants/api-messages';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { url: string }>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: API_MESSAGES.success,
        path: request.url,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
