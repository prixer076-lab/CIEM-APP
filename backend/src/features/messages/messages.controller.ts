import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post, Version } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateConnectionDto } from './dto/create-connection.dto';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly authService: AuthService,
  ) {}

  private async resolveUserId(authorization?: string, fallbackUserId?: string) {
    const session = await this.authService.getCurrentUser(authorization, fallbackUserId);
    const resolvedUserId = session.user?.id ?? fallbackUserId;

    if (!resolvedUserId) {
      throw new BadRequestException('No se pudo identificar al usuario de la sesion.');
    }

    return resolvedUserId;
  }

  @Get('conversations')
  @Version('1')
  async findAll(
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.messagesService.findAll(resolvedUserId);
  }

  @Post('connections')
  @Version('1')
  async createConnection(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() payload: CreateConnectionDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.messagesService.createConnection(payload, resolvedUserId);
  }

  @Get('conversations/:id')
  @Version('1')
  async findOne(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.messagesService.findOne(id, resolvedUserId);
  }

  @Post('conversations/:id/messages')
  @Version('1')
  async sendMessage(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
    @Body() payload: SendMessageDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.messagesService.sendMessage(id, payload, resolvedUserId);
  }

  @Patch('conversations/:id/read')
  @Version('1')
  async markAsRead(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.messagesService.markAsRead(id, resolvedUserId);
  }

  @Post('conversations/:id/campaigns')
  @Version('1')
  async createCampaign(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
    @Body() payload: CreateCampaignDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.messagesService.createCampaign(id, payload, resolvedUserId);
  }

  @Delete('conversations/:id/campaigns/:campaignId')
  @Version('1')
  async deleteCampaign(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
    @Param('campaignId') campaignId: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.messagesService.deleteCampaign(id, campaignId, resolvedUserId);
  }
}
