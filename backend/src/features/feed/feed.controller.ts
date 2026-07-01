import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, Version } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('feed')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly authService: AuthService,
  ) {}

  private async resolveUserId(authorization?: string, fallbackUserId?: string) {
    const session = await this.authService.getCurrentUser(authorization, fallbackUserId);

    if (!session.authenticated && !fallbackUserId) {
      throw new BadRequestException('No se pudo identificar al usuario de la sesion.');
    }

    const resolvedUserId = session.user?.id ?? fallbackUserId;

    if (!resolvedUserId) {
      throw new BadRequestException('No se pudo identificar al usuario de la sesion.');
    }

    return resolvedUserId;
  }

  @Get('posts')
  @Version('1')
  async findAll(
    @Query() query: FeedQueryDto,
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const session = await this.authService.getCurrentUser(authorization, userId);
    return this.feedService.findAll(query, session.user?.id ?? userId);
  }

  @Post('posts')
  @Version('1')
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() payload: CreatePostDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.feedService.create(resolvedUserId, payload);
  }

  @Patch('posts/:postId')
  @Version('1')
  async update(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('postId') postId: string,
    @Body() payload: CreatePostDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.feedService.update(resolvedUserId, postId, payload);
  }

  @Delete('posts/:postId')
  @Version('1')
  async remove(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('postId') postId: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.feedService.remove(resolvedUserId, postId);
  }

  @Post('posts/:postId/likes')
  @Version('1')
  async like(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('postId') postId: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.feedService.like(resolvedUserId, postId);
  }

  @Delete('posts/:postId/likes')
  @Version('1')
  async unlike(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('postId') postId: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.feedService.unlike(resolvedUserId, postId);
  }

  @Post('posts/:postId/comments')
  @Version('1')
  async comment(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('postId') postId: string,
    @Body() payload: CreateCommentDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.feedService.comment(resolvedUserId, postId, payload);
  }

  @Delete('posts/:postId/comments/:commentId')
  @Version('1')
  async removeComment(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.feedService.removeComment(resolvedUserId, postId, commentId);
  }
}
