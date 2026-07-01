import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found.exception';
import { DatabaseService } from 'src/database/database.service';
import { UpdateProfessionsStudiesDto } from './dto/update-professions-studies.dto';
import { UpdateProfilePreferencesDto } from './dto/update-profile-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly databaseService: DatabaseService) {}

  private normalizeSkills(skills?: string[]) {
    if (!skills) {
      return null;
    }

    const uniqueSkills = Array.from(
      new Set(
        skills
          .map((skill) => skill.trim())
          .filter(Boolean),
      ),
    );

    return uniqueSkills;
  }

  async getProfile(userId: string) {
    const { rows } = await this.databaseService.query<{
      brand: string;
      avatar: string;
      full_name: string;
      email: string;
      role: string;
      headline: string;
      location: string;
      work_mode: string;
      history: string;
      contact_notes: string;
      skills: string[];
    }>(
      `
        select
          ps.brand,
          ps.avatar,
          u.full_name,
          u.email,
          u.role,
          ps.headline,
          u.location,
          ps.work_mode,
          ps.history,
          ps.contact_notes,
          ps.skills
        from app_users u
        join profile_settings ps on ps.user_id = u.id
        where u.id = $1
        limit 1
      `,
      [userId],
    );

    const profile = rows[0];

    if (!profile) {
      throw new ResourceNotFoundException('Perfil', 'userId', userId);
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
      [userId],
    );
    const metrics = await this.getProfileMetrics(userId);

    return {
      brand: profile.brand,
      avatar: profile.avatar,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      headline: profile.headline,
      location: profile.location,
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

  private async getProfileMetrics(userId: string) {
    const { rows } = await this.databaseService.query<{
      campaigns_count: number;
      following_count: number;
      followers_count: number;
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
          (select count(*)::int from user_follows where followed_id = $1) as followers_count
      `,
      [userId],
    );

    const metrics = rows[0] ?? {
      campaigns_count: 0,
      following_count: 0,
      followers_count: 0,
    };

    return {
      campaigns: metrics.campaigns_count,
      following: metrics.following_count,
      followers: metrics.followers_count,
    };
  }

  async updateProfile(userId: string, payload: UpdateProfileDto) {
    const normalizedEmail = payload.email?.trim().toLowerCase();
    const normalizedPassword = payload.password?.trim();
    const normalizedSkills = this.normalizeSkills(payload.skills);
    await this.databaseService.query(
      `
        update app_users
        set
          full_name = coalesce($2, full_name),
          email = coalesce($3, email),
          role = coalesce($4, role),
          location = coalesce($5, location),
          password = coalesce(nullif($6, ''), password)
        where id = $1
      `,
      [
        userId,
        payload.fullName ?? null,
        normalizedEmail ?? null,
        payload.role ?? null,
        payload.location ?? null,
        normalizedPassword ?? null,
      ],
    );
    await this.databaseService.query(
      `
        insert into profile_settings (user_id, headline, work_mode, history, contact_notes, skills)
        values (
          $1,
          coalesce($2, 'Influencer & Content Creator'),
          coalesce($3, 'Freelance'),
          coalesce($4, ''),
          coalesce($5, ''),
          coalesce($6, '{}'::text[])
        )
        on conflict (user_id) do update
        set
          headline = coalesce(excluded.headline, profile_settings.headline),
          work_mode = coalesce(excluded.work_mode, profile_settings.work_mode),
          history = coalesce(excluded.history, profile_settings.history),
          contact_notes = coalesce(excluded.contact_notes, profile_settings.contact_notes),
          skills = case
            when $6 is null then profile_settings.skills
            else excluded.skills
          end
      `,
      [
        userId,
        payload.headline ?? null,
        payload.workMode ?? null,
        payload.history ?? null,
        payload.contactNotes ?? null,
        normalizedSkills,
      ],
    );

    return this.getProfile(userId);
  }

  async getPreferences(userId: string) {
    const profile = await this.getProfile(userId);

    return {
      role: profile.role,
      headline: profile.headline,
      skills: profile.skills,
    };
  }

  async getProfessionsAndStudies(userId: string) {
    const profile = await this.getProfile(userId);

    return {
      items: profile.skills,
    };
  }

  async updatePreferences(userId: string, payload: UpdateProfilePreferencesDto) {
    const normalizedSkills = this.normalizeSkills(payload.skills);

    await this.databaseService.query(
      `
        update app_users
        set role = coalesce($2, role)
        where id = $1
      `,
      [userId, payload.role ?? null],
    );

    await this.databaseService.query(
      `
        insert into profile_settings (user_id, headline, skills)
        values (
          $1,
          coalesce($2, 'Influencer & Content Creator'),
          coalesce($3, '{}'::text[])
        )
        on conflict (user_id) do update
        set
          headline = coalesce(excluded.headline, profile_settings.headline),
          skills = coalesce(excluded.skills, profile_settings.skills)
      `,
      [userId, payload.headline ?? null, normalizedSkills],
    );

    return this.getPreferences(userId);
  }

  async updateProfessionsAndStudies(
    userId: string,
    payload: UpdateProfessionsStudiesDto,
  ) {
    const normalizedSkills = this.normalizeSkills(payload.items);

    await this.databaseService.query(
      `
        insert into profile_settings (user_id, skills)
        values (
          $1,
          coalesce($2, '{}'::text[])
        )
        on conflict (user_id) do update
        set skills = coalesce(excluded.skills, profile_settings.skills)
      `,
      [userId, normalizedSkills],
    );

    return this.getProfessionsAndStudies(userId);
  }

  async clearProjects(userId: string) {
    await this.databaseService.query(
      'delete from profile_projects where user_id = $1',
      [userId],
    );
    return [];
  }
}
