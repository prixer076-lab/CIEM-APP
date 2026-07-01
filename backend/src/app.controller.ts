import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Version('1')
  getRoot() {
    return {
      service: 'CIEM API',
      status: 'ok',
      docsHint: 'Use /api/v1/health to verify the server.',
    };
  }
}
