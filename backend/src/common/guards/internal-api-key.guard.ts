import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey) {
      return true;
    }

    if (request.headers['x-internal-api-key'] !== expectedKey) {
      throw new UnauthorizedException('Credencial interna invalida.');
    }

    return true;
  }
}
