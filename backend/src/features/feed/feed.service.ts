import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FeedQueryDto } from './dto/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(private readonly databaseService: DatabaseService) {}

  private resolveBadgeTone(category: 'ayudas' | 'necesidades' | 'comunidad') {
    if (category === 'ayudas') {
      return 'green';
    }

    if (category === 'necesidades') {
      return 'blue';
    }

    return 'purple';
  }

  private normalizePostId(postId: string) {
    const numericId = Number.parseInt(postId.replace('post-', ''), 10);

    if (Number.isNaN(numericId)) {
      throw new BadRequestException('La publicacion indicada no es valida.');
    }

    return numericId;
  }

  private async getPostOwner(postId: number) {
    const { rows } = await this.databaseService.query<{ user_id: string | null }>(
      `
        select user_id
        from feed_posts
        where id = $1
        limit 1
      `,
      [postId],
    );

    return rows[0]?.user_id ?? null;
  }

  private async assertPostOwnership(postId: number, userId: string) {
    const ownerId = await this.getPostOwner(postId);

    if (!ownerId) {
      throw new BadRequestException('No se encontro la publicacion a modificar.');
    }

    if (ownerId !== userId) {
      throw new BadRequestException('Solo puedes modificar tus propias publicaciones.');
    }
  }

  private async assertPostExists(postId: number) {
    const { rows } = await this.databaseService.query<{ id: number }>(
      'select id from feed_posts where id = $1 limit 1',
      [postId],
    );

    if (!rows[0]) {
      throw new BadRequestException('No se encontro la publicacion.');
    }
  }

  private async getCommentsByPostIds(postIds: number[]) {
    if (!postIds.length) {
      return new Map<number, Array<{
        id: string;
        author: string;
        text: string;
        time: string;
      }>>();
    }

    const { rows } = await this.databaseService.query<{
      id: number;
      post_id: number;
      author: string;
      body: string;
    }>(
      `
        select
          pc.id,
          pc.post_id,
          coalesce(u.full_name, 'Usuario eliminado') as author,
          pc.body
        from post_comments pc
        left join app_users u on u.id = pc.user_id
        where pc.post_id = any($1::bigint[])
        order by pc.id asc
      `,
      [postIds],
    );

    const commentsByPostId = new Map<number, Array<{
      id: string;
      author: string;
      text: string;
      time: string;
    }>>();

    for (const row of rows) {
      const currentComments = commentsByPostId.get(row.post_id) ?? [];
      currentComments.push({
        id: `comment-${row.id}`,
        author: row.author,
        text: row.body,
        time: 'Ahora',
      });
      commentsByPostId.set(row.post_id, currentComments);
    }

    return commentsByPostId;
  }

  async findAll(query: FeedQueryDto, viewerId?: string) {
    const normalizedSearch = query.search?.trim().toLowerCase() ?? null;
    const filter = !query.filter || query.filter === 'todo' ? null : query.filter;
    const { rows } = await this.databaseService.query<{
      id: number;
      user_id: string | null;
      author: string;
      role: string;
      category: 'ayudas' | 'necesidades' | 'comunidad';
      badge: string;
      body: string;
      hashtags: string[];
      is_sos: boolean;
      sos_title: string | null;
      time_label: string;
      likes_count: number;
      is_liked: boolean;
    }>(
      `
        select
          fp.id,
          fp.user_id,
          fp.author,
          fp.role,
          fp.category,
          fp.badge,
          fp.body,
          fp.hashtags,
          fp.is_sos,
          fp.sos_title,
          fp.time_label,
          (select count(*)::int from post_likes pl where pl.post_id = fp.id) as likes_count,
          exists(
            select 1
            from post_likes pl
            where pl.post_id = fp.id and pl.user_id = $3
          ) as is_liked
        from feed_posts fp
        where ($1::text is null or category = $1)
          and (
            $2::text is null
            or lower(fp.author) like '%' || $2 || '%'
            or lower(fp.body) like '%' || $2 || '%'
          )
        order by fp.id desc
      `,
      [filter, normalizedSearch, viewerId ?? null],
    );
    const commentsByPostId = await this.getCommentsByPostIds(rows.map((row) => row.id));

    return {
      items: rows.map((row) => ({
        id: `post-${row.id}`,
        userId: row.user_id,
        author: row.author,
        role: row.role,
        category: row.category,
        badge: row.badge,
        badgeTone: this.resolveBadgeTone(row.category),
        body: row.body,
        hashtags: row.hashtags ?? [],
        isSos: row.is_sos,
        sosTitle: row.sos_title ?? undefined,
        time: row.time_label,
        likes: row.likes_count,
        isLiked: row.is_liked,
        comments: commentsByPostId.get(row.id) ?? [],
      })),
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? rows.length,
        total: rows.length,
      },
    };
  }

  async create(
    userId: string,
    payload: CreatePostDto,
  ) {
    const { rows: users } = await this.databaseService.query<{
      full_name: string;
      role: string;
    }>(
      `
        select full_name, role
        from app_users
        where id = $1
        limit 1
      `,
      [userId],
    );

    const user = users[0];

    if (!user) {
      throw new Error('No se encontro el usuario autenticado para publicar.');
    }

    const { rows } = await this.databaseService.query<{
      id: number;
      user_id: string | null;
      author: string;
      role: string;
      category: 'ayudas' | 'necesidades' | 'comunidad';
      badge: string;
      body: string;
      hashtags: string[];
      is_sos: boolean;
      sos_title: string | null;
      time_label: string;
      likes: number;
    }>(
      `
        insert into feed_posts (user_id, author, role, category, badge, body, hashtags, is_sos, sos_title, time_label, likes)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Ahora', 0)
        returning id, user_id, author, role, category, badge, body, hashtags, is_sos, sos_title, time_label, likes
      `,
      [
        userId,
        user.full_name,
        user.role,
        payload.category,
        payload.badge ?? 'Contenido General',
        payload.body,
        payload.hashtags ?? [],
        payload.isSos ?? false,
        payload.isSos ? payload.sosTitle?.trim() || null : null,
      ],
    );

    const row = rows[0];
    return {
      id: `post-${row.id}`,
      userId: row.user_id,
      author: row.author,
      role: row.role,
      category: row.category,
      badge: row.badge,
      badgeTone: this.resolveBadgeTone(row.category),
      body: row.body,
      hashtags: row.hashtags ?? [],
      isSos: row.is_sos,
      sosTitle: row.sos_title ?? undefined,
      time: row.time_label,
      likes: row.likes,
      isLiked: false,
      comments: [],
    };
  }

  async update(
    userId: string,
    postId: string,
    payload: CreatePostDto,
  ) {
    const numericPostId = this.normalizePostId(postId);
    await this.assertPostOwnership(numericPostId, userId);

    const { rows } = await this.databaseService.query<{
      id: number;
      user_id: string | null;
      author: string;
      role: string;
      category: 'ayudas' | 'necesidades' | 'comunidad';
      badge: string;
      body: string;
      hashtags: string[];
      is_sos: boolean;
      sos_title: string | null;
      time_label: string;
      likes: number;
    }>(
      `
        update feed_posts
        set
          category = $2,
          badge = $3,
          body = $4,
          hashtags = $5,
          is_sos = $6,
          sos_title = $7
        where id = $1
        returning id, user_id, author, role, category, badge, body, hashtags, is_sos, sos_title, time_label, likes
      `,
      [
        numericPostId,
        payload.category,
        payload.badge ?? 'Contenido General',
        payload.body,
        payload.hashtags ?? [],
        payload.isSos ?? false,
        payload.isSos ? payload.sosTitle?.trim() || null : null,
      ],
    );

    const row = rows[0];

    return {
      id: `post-${row.id}`,
      userId: row.user_id,
      author: row.author,
      role: row.role,
      category: row.category,
      badge: row.badge,
      badgeTone: this.resolveBadgeTone(row.category),
      body: row.body,
      hashtags: row.hashtags ?? [],
      isSos: row.is_sos,
      sosTitle: row.sos_title ?? undefined,
      time: row.time_label,
      likes: row.likes,
      isLiked: false,
      comments: [],
    };
  }

  async remove(userId: string, postId: string) {
    const numericPostId = this.normalizePostId(postId);
    await this.assertPostOwnership(numericPostId, userId);

    await this.databaseService.query(
      `
        delete from feed_posts
        where id = $1
      `,
      [numericPostId],
    );

    return {
      deleted: true,
      id: postId,
    };
  }

  async like(userId: string, postId: string) {
    const numericPostId = this.normalizePostId(postId);
    await this.assertPostExists(numericPostId);

    await this.databaseService.query(
      `
        insert into post_likes (post_id, user_id)
        values ($1, $2)
        on conflict (post_id, user_id) do nothing
      `,
      [numericPostId, userId],
    );

    return this.getPostReactionState(numericPostId, userId);
  }

  async unlike(userId: string, postId: string) {
    const numericPostId = this.normalizePostId(postId);

    await this.databaseService.query(
      `
        delete from post_likes
        where post_id = $1 and user_id = $2
      `,
      [numericPostId, userId],
    );

    return this.getPostReactionState(numericPostId, userId);
  }

  async comment(userId: string, postId: string, payload: CreateCommentDto) {
    const numericPostId = this.normalizePostId(postId);
    const body = payload.body.trim();

    if (!body) {
      throw new BadRequestException('El comentario no puede estar vacio.');
    }

    await this.assertPostExists(numericPostId);

    const { rows } = await this.databaseService.query<{
      id: number;
      author: string;
      body: string;
    }>(
      `
        insert into post_comments (post_id, user_id, body)
        values ($1, $2, $3)
        returning
          id,
          (select full_name from app_users where id = $2) as author,
          body
      `,
      [numericPostId, userId, body],
    );

    const comment = rows[0];

    return {
      id: `comment-${comment.id}`,
      author: comment.author,
      text: comment.body,
      time: 'Ahora',
    };
  }

  async removeComment(userId: string, postId: string, commentId: string) {
    const numericPostId = this.normalizePostId(postId);
    const numericCommentId = this.normalizeCommentId(commentId);

    await this.databaseService.query(
      `
        delete from post_comments
        where id = $1 and post_id = $2 and user_id = $3
      `,
      [numericCommentId, numericPostId, userId],
    );

    return {
      deleted: true,
      id: commentId,
    };
  }

  private normalizeCommentId(commentId: string) {
    const numericId = Number.parseInt(commentId.replace('comment-', ''), 10);

    if (Number.isNaN(numericId)) {
      throw new BadRequestException('El comentario indicado no es valido.');
    }

    return numericId;
  }

  private async getPostReactionState(postId: number, userId: string) {
    const { rows } = await this.databaseService.query<{
      likes: number;
      is_liked: boolean;
    }>(
      `
        select
          (select count(*)::int from post_likes where post_id = $1) as likes,
          exists(
            select 1
            from post_likes
            where post_id = $1 and user_id = $2
          ) as is_liked
      `,
      [postId, userId],
    );

    return {
      likes: rows[0]?.likes ?? 0,
      isLiked: rows[0]?.is_liked ?? false,
    };
  }
}
