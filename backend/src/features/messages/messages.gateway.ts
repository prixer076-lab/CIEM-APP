import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { MessagesService } from './messages.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';

type AuthenticatedSocket = Socket & {
  data: {
    userId?: string;
  };
};

type SendMessagePayload = {
  conversationId: string;
  text: string;
};

type CampaignActionPayload = {
  conversationId: string;
  campaignMessageId: string;
};

type SendCampaignPayload = CreateCampaignDto & {
  conversationId: string;
};

@WebSocketGateway({
  cors: {
    origin: getSocketAllowedOrigins(),
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection {
  private readonly logger = new Logger(MessagesGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth?.token as string | undefined;
    const userId = client.handshake.auth?.userId as string | undefined;
    let session = await this.authService.getCurrentUser(
      token ? `Bearer ${token}` : undefined,
      userId,
    );

    // In development the in-memory token store is lost when the backend restarts.
    // The REST API already falls back to x-user-id, so the socket should do the same.
    if (!session.authenticated && userId) {
      session = await this.authService.getCurrentUser(undefined, userId);
    }

    if (!session.authenticated || !session.user?.id) {
      client.disconnect(true);
      return;
    }

    client.data.userId = session.user.id;
    await client.join(this.getUserRoom(session.user.id));
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const userId = client.data.userId;

    if (!userId || !payload?.conversationId || !payload.text?.trim()) {
      return {
        success: false,
        message: 'No se pudo enviar el mensaje.',
      };
    }

    await this.messagesService.sendMessage(
      payload.conversationId,
      { text: payload.text },
      userId,
    );
    const conversation = await this.messagesService.findOne(payload.conversationId, userId);

    this.broadcastConversationSafely(payload.conversationId, userId);

    return {
      success: true,
      conversation,
    };
  }

  @SubscribeMessage('connection:create')
  async createConnection(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CreateConnectionDto,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return {
        success: false,
        message: 'No se pudo identificar al usuario.',
      };
    }

    const createdConversation = await this.messagesService.createConnection(payload, userId);
    this.broadcastConversationSafely(createdConversation.id, userId);

    return {
      success: true,
      conversation: createdConversation,
    };
  }

  @SubscribeMessage('campaign:send')
  async sendCampaign(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendCampaignPayload,
  ) {
    const userId = client.data.userId;

    if (!userId || !payload?.conversationId || !payload.projectName?.trim()) {
      return {
        success: false,
        message: 'No se pudo enviar la campana.',
      };
    }

    await this.messagesService.createCampaign(
      payload.conversationId,
      {
        type: payload.type,
        projectName: payload.projectName,
        description: payload.description,
        requirements: payload.requirements,
        deadline: payload.deadline,
      },
      userId,
    );
    const conversation = await this.messagesService.findOne(payload.conversationId, userId);
    this.broadcastConversationSafely(payload.conversationId, userId);

    return {
      success: true,
      conversation,
    };
  }

  @SubscribeMessage('campaign:accept')
  async acceptCampaign(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CampaignActionPayload,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return {
        success: false,
        message: 'No se pudo identificar al usuario.',
      };
    }

    await this.messagesService.acceptCampaign(
      payload.conversationId,
      payload.campaignMessageId,
      userId,
    );
    const conversation = await this.messagesService.findOne(payload.conversationId, userId);
    this.broadcastConversationSafely(payload.conversationId, userId);
    this.broadcastProfileUpdateSafely(payload.conversationId);

    return {
      success: true,
      conversation,
    };
  }

  @SubscribeMessage('campaign:decline')
  async declineCampaign(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CampaignActionPayload,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return {
        success: false,
        message: 'No se pudo identificar al usuario.',
      };
    }

    await this.messagesService.declineCampaign(
      payload.conversationId,
      payload.campaignMessageId,
      userId,
    );
    const conversation = await this.messagesService.findOne(payload.conversationId, userId);
    this.broadcastConversationSafely(payload.conversationId, userId);

    return {
      success: true,
      conversation,
    };
  }

  @SubscribeMessage('campaign:delete')
  async deleteCampaign(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CampaignActionPayload,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return {
        success: false,
        message: 'No se pudo identificar al usuario.',
      };
    }

    await this.messagesService.deleteCampaign(
      payload.conversationId,
      payload.campaignMessageId,
      userId,
    );
    const conversation = await this.messagesService.findOne(payload.conversationId, userId);
    this.broadcastConversationSafely(payload.conversationId, userId);

    return {
      success: true,
      conversation,
    };
  }

  private async broadcastConversation(conversationId: string, fallbackUserId: string) {
    const participantIds = await this.messagesService.findParticipantIds(conversationId);
    const receivers = participantIds.length > 0 ? participantIds : [fallbackUserId];

    await Promise.all(
      receivers.map(async (participantId) => {
        const conversation = await this.messagesService.findOne(conversationId, participantId);
        this.server.to(this.getUserRoom(participantId)).emit('conversation:updated', conversation);
      }),
    );
  }

  private broadcastConversationSafely(conversationId: string, fallbackUserId: string) {
    void this.broadcastConversation(conversationId, fallbackUserId).catch((error) => {
      this.logger.error('No se pudo emitir la conversacion por WebSocket.', error);
    });
  }

  private async broadcastProfileUpdate(conversationId: string) {
    const participantIds = await this.messagesService.findParticipantIds(conversationId);

    participantIds.forEach((participantId) => {
      this.server.to(this.getUserRoom(participantId)).emit('profile:updated');
    });
  }

  private broadcastProfileUpdateSafely(conversationId: string) {
    void this.broadcastProfileUpdate(conversationId).catch((error) => {
      this.logger.error('No se pudo emitir la actualizacion del perfil.', error);
    });
  }

  private getUserRoom(userId: string) {
    return `user:${userId}`;
  }
}

function getSocketAllowedOrigins() {
  return (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
