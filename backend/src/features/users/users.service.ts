import { BadRequestException, Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found.exception';
import { DatabaseService } from 'src/database/database.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(viewerId?: string) {
    const { rows } = await this.databaseService.query<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      location: string;
      avatar: string;
      headline: string;
      history: string;
      is_following: boolean;
    }>(
      `
        select
          u.id,
          u.full_name,
          u.email,
          u.role,
          u.location,
          ps.avatar,
          ps.headline,
          ps.history,
          exists(
            select 1
            from user_follows uf
            where uf.follower_id = $1 and uf.followed_id = u.id
          ) as is_following
        from app_users u
        join profile_settings ps on ps.user_id = u.id
        order by full_name asc
      `,
      [viewerId ?? null],
    );

    return rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      location: row.location,
      avatar: row.avatar,
      headline: row.headline,
      history: row.history,
      isFollowing: row.is_following,
    }));
  }

  async findById(id: string) {
    const { rows } = await this.databaseService.query<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      location: string;
    }>(
      `
        select id, full_name, email, role, location
        from app_users
        where id = $1
        limit 1
      `,
      [id],
    );

    const user = rows[0];

    if (!user) {
      throw new ResourceNotFoundException('Usuario', 'id', id);
    }

    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      location: user.location,
    };
  }

  async findPublicProfileById(id: string, viewerId?: string) {
    const { rows } = await this.databaseService.query<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      location: string;
      avatar: string;
      headline: string;
      work_mode: string;
      history: string;
      contact_notes: string;
      skills: string[];
    }>(
      `
        select
          u.id,
          u.full_name,
          u.email,
          u.role,
          u.location,
          ps.avatar,
          ps.headline,
          ps.work_mode,
          ps.history,
          ps.contact_notes,
          ps.skills
        from app_users u
        join profile_settings ps on ps.user_id = u.id
        where u.id = $1
        limit 1
      `,
      [id],
    );

    const profile = rows[0];

    if (!profile) {
      throw new ResourceNotFoundException('Usuario', 'id', id);
    }

    const { rows: projects } = await this.databaseService.query<{
      title: string;
      company: string;
      status: string;
      status_tone: 'green' | 'blue';
    }>(
      `
        select title, company, status, status_tone
        from profile_projects
        where user_id = $1
        order by id desc
      `,
      [id],
    );
    const metrics = await this.getProfileMetrics(id, viewerId);

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      location: profile.location,
      avatar: profile.avatar,
      headline: profile.headline,
      workMode: profile.work_mode,
      history: profile.history,
      contactNotes: profile.contact_notes,
      skills: profile.skills ?? [],
      stats: metrics,
      recentProjects: projects.map((project) => ({
        title: project.title,
        company: project.company,
        status: project.status,
        statusTone: project.status_tone,
      })),
    };
  }

  async follow(followerId: string, followedId: string) {
    if (followerId === followedId) {
      throw new BadRequestException('No puedes seguir tu propio perfil.');
    }

    await this.findById(followedId);

    await this.databaseService.query(
      `
        insert into user_follows (follower_id, followed_id)
        values ($1, $2)
        on conflict (follower_id, followed_id) do nothing
      `,
      [followerId, followedId],
    );

    return this.getProfileMetrics(followedId, followerId);
  }

  async unfollow(followerId: string, followedId: string) {
    await this.databaseService.query(
      `
        delete from user_follows
        where follower_id = $1 and followed_id = $2
      `,
      [followerId, followedId],
    );

    return this.getProfileMetrics(followedId, followerId);
  }

  private async getProfileMetrics(userId: string, viewerId?: string) {
    const { rows } = await this.databaseService.query<{
      campaigns_count: number;
      following_count: number;
      followers_count: number;
      is_following: boolean;
    }>(
      `
        select
          (
            (select count(*)::int from feed_posts where user_id = $1)
            +
            (
              select count(*)::int
              from campaign_collaborations
              where status = 'accepted'
                and (sender_user_id = $1 or receiver_user_id = $1)
            )
          ) as campaigns_count,
          (select count(*)::int from user_follows where follower_id = $1) as following_count,
          (select count(*)::int from user_follows where followed_id = $1) as followers_count,
          exists(
            select 1
            from user_follows
            where follower_id = $2 and followed_id = $1
          ) as is_following
      `,
      [userId, viewerId ?? null],
    );

    const metrics = rows[0] ?? {
      campaigns_count: 0,
      following_count: 0,
      followers_count: 0,
      is_following: false,
    };

    return {
      campaigns: metrics.campaigns_count,
      following: metrics.following_count,
      followers: metrics.followers_count,
      isFollowing: metrics.is_following,
    };
  }

  async update(id: string, payload: UpdateUserDto) {
    await this.findById(id);

    await this.databaseService.query(
      `
        update app_users
        set
          full_name = coalesce($2, full_name),
          email = coalesce($3, email),
          password = coalesce($4, password),
          role = coalesce($5, role),
          location = coalesce($6, location)
        where id = $1
      `,
      [id, payload.fullName, payload.email, payload.password, payload.role, null],
    );

    return this.findById(id);
  }
}
