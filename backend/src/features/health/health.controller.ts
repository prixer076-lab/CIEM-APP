import { Controller, Get, Version } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  @Version('1')
  async getHealth() {
    await this.databaseService.query('select 1');
    return {
      service: 'CIEM API',
      status: 'healthy',
      uptime: process.uptime(),
    };
  }
}
