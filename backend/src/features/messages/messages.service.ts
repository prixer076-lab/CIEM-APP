import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found.exception';
import { DatabaseService } from 'src/database/database.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly databaseService: DatabaseService) {}

  private getAvatar(value: string) {
    return value.trim().charAt(0).toUpperCase() || 'U';
  }

  private async findExistingConversation(userId: string, recipientUserId?: string) {
    if (!recipientUserId) {
      return undefined;
    }

    const { rows } = await this.databaseService.query<{ conversation_id: string }>(
      `
        select cp1.conversation_id
        from conversation_participants cp1
        inner join conversation_participants cp2
          on cp2.conversation_id = cp1.conversation_id
        where cp1.user_id = $1 and cp2.user_id = $2
        limit 1
      `,
      [userId, recipientUserId],
    );

    return rows[0]?.conversation_id;
  }

  async findParticipantIds(conversationId: string) {
    const { rows } = await this.databaseService.query<{ user_id: string }>(
      `
        select user_id
        from conversation_participants
        where conversation_id = $1
      `,
      [conversationId],
    );

    return rows.map((row) => row.user_id);
  }

  private async findReceiverId(conversationId: string, senderUserId: string) {
    const { rows } = await this.databaseService.query<{ user_id: string }>(
      `
        select user_id
        from conversation_participants
        where conversation_id = $1 and user_id <> $2
        order by created_at asc
        limit 1
      `,
      [conversationId, senderUserId],
    );

    const receiverId = rows[0]?.user_id;

    if (!receiverId) {
      throw new BadRequestException('No se encontro un receptor para esta campana.');
    }

    return receiverId;
  }

  private async getUserName(userId: string) {
    const { rows } = await this.databaseService.query<{ full_name: string }>(
      'select full_name from app_users where id = $1 limit 1',
      [userId],
    );

    return rows[0]?.full_name ?? 'Usuario CIEM';
  }

  private async getConnectionRecipient(payload: CreateConnectionDto) {
    if (!payload.recipientUserId) {
      return {
        author: payload.author?.trim() || 'Usuario CIEM',
        avatar: payload.avatar?.trim().charAt(0).toUpperCase() || 'U',
      };
    }

    const { rows } = await this.databaseService.query<{
      full_name: string;
    }>(
      'select full_name from app_users where id = $1 limit 1',
      [payload.recipientUserId],
    );
    const recipientName = rows[0]?.full_name?.trim() || payload.author?.trim() || 'Usuario CIEM';

    return {
      author: recipientName,
      avatar: this.getAvatar(recipientName),
    };
  }

  private async addParticipant(conversationId: string, userId?: string) {
    if (!userId) {
      return;
    }

    await this.databaseService.query(
      `
        insert into conversation_participants (conversation_id, user_id)
        values ($1, $2)
        on conflict do nothing
      `,
      [conversationId, userId],
    );
  }

  async createConnection(payload: CreateConnectionDto, userId: string) {
    const normalizedMessage = payload.initialMessage.trim();
    const recipient = await this.getConnectionRecipient(payload);
    const existingConversationId =
      (await this.findExistingConversation(userId, payload.recipientUserId)) ??
      undefined;

    if (existingConversationId) {
      await this.sendMessage(existingConversationId, { text: normalizedMessage }, userId);
      return this.findOne(existingConversationId, userId);
    }

    const conversationId = `conversation-${Date.now()}`;
    const messageId = `${conversationId}-message-${Date.now()}`;

    await this.databaseService.query('begin');
    try {
      await this.databaseService.query(
        `
          insert into conversations (id, author, avatar, last_message, time_label, unread_count, is_online)
          values ($1, $2, $3, $4, 'Ahora', 0, $5)
        `,
        [conversationId, recipient.author, recipient.avatar, normalizedMessage, payload.isOnline ?? true],
      );
      await this.databaseService.query(
        `
          insert into conversation_messages (id, conversation_id, sender_user_id, sender, type, text, time_label)
          values ($1, $2, $3, 'me', 'text', $4, 'Ahora')
        `,
        [messageId, conversationId, userId, normalizedMessage],
      );
      await this.addParticipant(conversationId, userId);
      await this.addParticipant(conversationId, payload.recipientUserId);
      await this.incrementUnreadForOtherParticipants(conversationId, userId);
      await this.databaseService.query('commit');
    } catch (error) {
      await this.databaseService.query('rollback');
      throw error;
    }

    return this.findOne(conversationId, userId);
  }

  async findAll(viewerUserId?: string) {
    const { rows } = await this.databaseService.query<{
      id: string;
      author: string;
      avatar: string;
      last_message: string;
      time_label: string;
      unread_count: number;
      is_online: boolean;
    }>(
      `
        select id, author, avatar, last_message, time_label, unread_count, is_online
        from conversations
        where exists (
          select 1
          from conversation_participants
          where conversation_participants.conversation_id = conversations.id
            and conversation_participants.user_id = $1
        )
        or not exists (
          select 1
          from conversation_participants
          where conversation_participants.conversation_id = conversations.id
        )
        order by id asc
      `,
      [viewerUserId],
    );

    const conversations = await Promise.all(rows.map((row) => this.findOne(row.id, viewerUserId)));
    return conversations;
  }

  async findOne(id: string, viewerUserId?: string) {
    const { rows } = await this.databaseService.query<{
      id: string;
      author: string;
      avatar: string;
      last_message: string;
      time_label: string;
      unread_count: number;
      is_online: boolean;
    }>(
      `
        select id, author, avatar, last_message, time_label, unread_count, is_online
        from conversations
        where id = $1
        limit 1
      `,
      [id],
    );

    const conversation = rows[0];

    if (!conversation) {
      throw new ResourceNotFoundException('Conversacion', 'id', id);
    }

    const { rows: otherParticipants } = await this.databaseService.query<{
      full_name: string;
    }>(
      `
        select app_users.full_name
        from conversation_participants
        inner join app_users on app_users.id = conversation_participants.user_id
        where conversation_participants.conversation_id = $1
          and conversation_participants.user_id <> $2
        order by app_users.full_name asc
        limit 1
      `,
      [id, viewerUserId],
    );
    const otherParticipantName = otherParticipants[0]?.full_name;
    const displayAuthor = otherParticipantName ?? conversation.author;

    const { rows: messages } = await this.databaseService.query<{
      id: string;
      sender_user_id: string | null;
      sender: 'me' | 'them';
      type: 'text' | 'campaign';
      text: string | null;
      campaign_type: 'collaboration' | 'talent' | null;
      campaign_name: string | null;
      campaign_description: string | null;
      campaign_requirements: string | null;
      campaign_deadline: string | null;
      campaign_status: 'pending' | 'accepted' | 'declined' | 'deleted' | null;
      campaign_sender_user_id: string | null;
      campaign_receiver_user_id: string | null;
      time_label: string;
      created_at: Date;
    }>(
      `
        select
          conversation_messages.id,
          conversation_messages.sender_user_id,
          conversation_messages.sender,
          conversation_messages.type,
          conversation_messages.text,
          conversation_messages.campaign_type,
          conversation_messages.campaign_name,
          conversation_messages.campaign_description,
          conversation_messages.campaign_requirements,
          conversation_messages.campaign_deadline,
          campaign_collaborations.status as campaign_status,
          campaign_collaborations.sender_user_id as campaign_sender_user_id,
          campaign_collaborations.receiver_user_id as campaign_receiver_user_id,
          conversation_messages.time_label,
          conversation_messages.created_at
        from conversation_messages
        left join campaign_collaborations
          on campaign_collaborations.message_id = conversation_messages.id
        where conversation_messages.conversation_id = $1
          and coalesce(campaign_collaborations.status, '') <> 'deleted'
        order by conversation_messages.created_at asc, conversation_messages.id asc
      `,
      [id],
    );
    const { rows: participantRows } = await this.databaseService.query<{
      unread_count: number;
    }>(
      `
        select unread_count
        from conversation_participants
        where conversation_id = $1 and user_id = $2
        limit 1
      `,
      [id, viewerUserId],
    );

    return {
      id: conversation.id,
      author: displayAuthor,
      avatar: otherParticipantName ? this.getAvatar(otherParticipantName) : conversation.avatar,
      lastMessage: conversation.last_message,
      time: conversation.time_label,
      unreadCount: participantRows[0]?.unread_count ?? conversation.unread_count,
      isOnline: conversation.is_online,
      messages: messages.map((message) => ({
        id: message.id,
        sender: message.sender_user_id
          ? message.sender_user_id === viewerUserId
            ? 'me'
            : 'them'
          : message.sender,
        type: message.type,
        text: message.text ?? undefined,
        campaignType: message.campaign_type ?? undefined,
        campaignName: message.campaign_name ?? undefined,
        campaignDescription: message.campaign_description ?? undefined,
        campaignRequirements: message.campaign_requirements ?? undefined,
        campaignDeadline: message.campaign_deadline ?? undefined,
        campaignStatus: message.campaign_status ?? undefined,
        campaignSenderUserId: message.campaign_sender_user_id ?? undefined,
        campaignReceiverUserId: message.campaign_receiver_user_id ?? undefined,
        time: message.time_label,
      })),
    };
  }

  async sendMessage(id: string, payload: SendMessageDto, userId: string) {
    await this.findOne(id, userId);
    const nextId = `${id}-message-${Date.now()}`;

    await this.addParticipant(id, userId);
    await this.databaseService.query(
      `
        insert into conversation_messages (id, conversation_id, sender_user_id, sender, type, text, time_label)
        values ($1, $2, $3, 'me', 'text', $4, 'Ahora')
      `,
      [nextId, id, userId, payload.text.trim()],
    );
    await this.databaseService.query(
      `
        update conversations
        set last_message = $2, time_label = 'Ahora'
        where id = $1
      `,
      [id, payload.text.trim()],
    );
    await this.incrementUnreadForOtherParticipants(id, userId);

    return {
      id: nextId,
      sender: 'me',
      type: 'text',
      text: payload.text.trim(),
      time: 'Ahora',
    };
  }

  async createCampaign(id: string, payload: CreateCampaignDto, userId: string) {
    const nextId = `${id}-campaign-${Date.now()}`;
    const projectName = payload.projectName.trim();
    const receiverId = await this.findReceiverId(id, userId);

    await this.databaseService.query('begin');
    try {
    await this.databaseService.query(
      `
        insert into conversation_messages (
          id,
          conversation_id,
          sender_user_id,
          sender,
          type,
          campaign_type,
          campaign_name,
          campaign_description,
          campaign_requirements,
          campaign_deadline,
          time_label
        )
        values ($1, $2, $3, 'me', 'campaign', $4, $5, $6, $7, $8, 'Ahora')
      `,
      [
        nextId,
        id,
        userId,
        payload.type,
        projectName,
        payload.description?.trim() ?? null,
        payload.requirements?.trim() ?? null,
        payload.deadline?.trim() ?? null,
      ],
    );
    await this.databaseService.query(
      `
        insert into campaign_collaborations (
          conversation_id,
          message_id,
          sender_user_id,
          receiver_user_id,
          campaign_type,
          title,
          description,
          requirements,
          deadline,
          status
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      `,
      [
        id,
        nextId,
        userId,
        receiverId,
        payload.type,
        projectName,
        payload.description?.trim() ?? null,
        payload.requirements?.trim() ?? null,
        payload.deadline?.trim() ?? null,
      ],
    );
    await this.databaseService.query(
      `
        update conversations
        set last_message = $2, time_label = 'Ahora'
        where id = $1
      `,
      [id, projectName],
    );
    await this.incrementUnreadForOtherParticipants(id, userId);
    await this.databaseService.query('commit');
    } catch (error) {
      await this.databaseService.query('rollback');
      throw error;
    }

    return {
      id: nextId,
      sender: 'me',
      type: 'campaign',
      campaignType: payload.type,
      campaignName: projectName,
      campaignDescription: payload.description?.trim(),
      campaignRequirements: payload.requirements?.trim(),
      campaignDeadline: payload.deadline?.trim(),
      campaignStatus: 'pending',
      campaignSenderUserId: userId,
      campaignReceiverUserId: receiverId,
      time: 'Ahora',
    };
  }

  async deleteCampaign(id: string, campaignId: string, userId: string) {
    await this.findOne(id, userId);
    const { rows } = await this.databaseService.query<{
      id: string;
      campaign_name: string | null;
      campaign_type: 'collaboration' | 'talent' | null;
      sender_user_id: string | null;
    }>(
      `
        select
          conversation_messages.id,
          conversation_messages.campaign_name,
          conversation_messages.campaign_type,
          campaign_collaborations.sender_user_id
        from conversation_messages
        left join campaign_collaborations
          on campaign_collaborations.message_id = conversation_messages.id
        where conversation_messages.id = $1
          and conversation_messages.conversation_id = $2
          and conversation_messages.type = 'campaign'
        limit 1
      `,
      [campaignId, id],
    );

    const campaign = rows[0];

    if (!campaign) {
      throw new ResourceNotFoundException('Campana', 'id', campaignId);
    }

    if (campaign.sender_user_id && campaign.sender_user_id !== userId) {
      throw new ForbiddenException('Solo el emisor puede eliminar esta campana.');
    }

    await this.databaseService.query(
      `
        update campaign_collaborations
        set status = 'deleted', deleted_at = now()
        where message_id = $1 and sender_user_id = $2 and status = 'pending'
      `,
      [campaignId, userId],
    );

    const { rows: lastRows } = await this.databaseService.query<{
      type: 'text' | 'campaign';
      text: string | null;
      campaign_name: string | null;
    }>(
      `
        select
          conversation_messages.type,
          conversation_messages.text,
          conversation_messages.campaign_name
        from conversation_messages
        left join campaign_collaborations
          on campaign_collaborations.message_id = conversation_messages.id
        where conversation_messages.conversation_id = $1
          and coalesce(campaign_collaborations.status, '') <> 'deleted'
        order by conversation_messages.created_at desc, conversation_messages.id desc
        limit 1
      `,
      [id],
    );

    const lastMessage = lastRows[0];
    await this.databaseService.query(
      `
        update conversations
        set last_message = $2, time_label = 'Ahora'
        where id = $1
      `,
      [
        id,
        lastMessage?.type === 'campaign'
          ? lastMessage.campaign_name ?? ''
          : lastMessage?.text ?? '',
      ],
    );

    return {
      id: campaign.id,
      campaignName: campaign.campaign_name ?? undefined,
      campaignType: campaign.campaign_type ?? undefined,
    };
  }

  async acceptCampaign(conversationId: string, campaignId: string, userId: string) {
    const campaign = await this.findCampaignActionTarget(conversationId, campaignId);

    if (campaign.receiver_user_id !== userId) {
      throw new ForbiddenException('Solo el receptor puede aceptar esta campana.');
    }

    if (campaign.status !== 'pending') {
      throw new BadRequestException('Esta campana ya fue atendida.');
    }

    const senderName = await this.getUserName(campaign.sender_user_id);
    const receiverName = await this.getUserName(campaign.receiver_user_id);
    const status = campaign.campaign_type === 'collaboration' ? 'Propuesta aceptada' : 'Convocatoria aceptada';

    await this.databaseService.query('begin');
    try {
      await this.databaseService.query(
        `
          update campaign_collaborations
          set status = 'accepted', accepted_at = now()
          where message_id = $1
        `,
        [campaignId],
      );
      await this.insertProfileProject(campaign.sender_user_id, campaign.title, receiverName, status);
      await this.insertProfileProject(campaign.receiver_user_id, campaign.title, senderName, status);
      await this.databaseService.query('commit');
    } catch (error) {
      await this.databaseService.query('rollback');
      throw error;
    }

    return this.findOne(conversationId, userId);
  }

  async declineCampaign(conversationId: string, campaignId: string, userId: string) {
    const campaign = await this.findCampaignActionTarget(conversationId, campaignId);

    if (campaign.receiver_user_id !== userId) {
      throw new ForbiddenException('Solo el receptor puede declinar esta campana.');
    }

    if (campaign.status !== 'pending') {
      throw new BadRequestException('Esta campana ya fue atendida.');
    }

    await this.databaseService.query(
      `
        update campaign_collaborations
        set status = 'declined', declined_at = now()
        where message_id = $1
      `,
      [campaignId],
    );

    return this.findOne(conversationId, userId);
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.findOne(conversationId, userId);
    await this.databaseService.query(
      `
        update conversation_participants
        set unread_count = 0
        where conversation_id = $1 and user_id = $2
      `,
      [conversationId, userId],
    );

    return this.findOne(conversationId, userId);
  }

  private async findCampaignActionTarget(conversationId: string, campaignId: string) {
    const { rows } = await this.databaseService.query<{
      message_id: string;
      sender_user_id: string;
      receiver_user_id: string;
      campaign_type: 'collaboration' | 'talent';
      title: string;
      status: 'pending' | 'accepted' | 'declined' | 'deleted';
    }>(
      `
        select message_id, sender_user_id, receiver_user_id, campaign_type, title, status
        from campaign_collaborations
        where conversation_id = $1 and message_id = $2
        limit 1
      `,
      [conversationId, campaignId],
    );

    const campaign = rows[0];

    if (!campaign) {
      throw new ResourceNotFoundException('Campana', 'id', campaignId);
    }

    return campaign;
  }

  private async insertProfileProject(
    userId: string,
    title: string,
    company: string,
    status: string,
  ) {
    await this.databaseService.query(
      `
        insert into profile_projects (user_id, title, company, status, status_tone)
        select $1, $2, $3, $4, 'green'
        where not exists (
          select 1
          from profile_projects
          where user_id = $1 and title = $2 and company = $3 and status = $4
        )
      `,
      [userId, title, company, status],
    );
  }

  private async incrementUnreadForOtherParticipants(conversationId: string, senderUserId: string) {
    await this.databaseService.query(
      `
        update conversation_participants
        set unread_count = unread_count + 1
        where conversation_id = $1 and user_id <> $2
      `,
      [conversationId, senderUserId],
    );
  }
}
