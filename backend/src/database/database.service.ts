import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow, types } from 'pg';
import { getDatabaseConfig } from './database.config';

types.setTypeParser(20, (value) => Number(value));

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool = new Pool(getDatabaseConfig());

  async onModuleInit() {
    try {
      await this.query('select 1');
      await this.initializeSchema();
      await this.seedData();
    } catch (error) {
      throw this.mapConnectionError(error);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  private mapConnectionError(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '28P01'
    ) {
      return new Error(
        [
          'No se pudo autenticar con PostgreSQL.',
          'Revisa el usuario y password en backend/.env.',
          'Puedes usar DATABASE_URL o DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD.',
        ].join(' '),
      );
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '3D000'
    ) {
      return new Error(
        'La base de datos indicada no existe. Crea la BD en PostgreSQL y actualiza backend/.env.',
      );
    }

    return error instanceof Error ? error : new Error('Error desconocido conectando a PostgreSQL.');
  }

  private async initializeSchema() {
    await this.query(`
      create table if not exists app_users (
        id text primary key,
        full_name text not null,
        email text not null unique,
        password text not null,
        role text not null,
        location text not null default 'Trujillo, Peru'
      );

      create table if not exists profile_settings (
        user_id text primary key references app_users(id) on delete cascade,
        brand text not null default 'CIEM',
        avatar text not null default 'M',
        headline text not null default 'Influencer & Content Creator',
        work_mode text not null default 'Freelance',
        history text not null default '',
        contact_notes text not null default '',
        skills text[] not null default '{}'
      );

      create table if not exists profile_projects (
        id bigserial primary key,
        user_id text not null references app_users(id) on delete cascade,
        title text not null,
        company text not null,
        status text not null,
        status_tone text not null
      );

      create table if not exists feed_posts (
        id bigserial primary key,
        user_id text references app_users(id) on delete set null,
        author text not null,
        role text not null,
        category text not null,
        badge text not null,
        body text not null,
        hashtags text[] not null default '{}',
        is_sos boolean not null default false,
        sos_title text,
        time_label text not null,
        likes integer not null default 0
      );

      create table if not exists user_follows (
        follower_id text not null references app_users(id) on delete cascade,
        followed_id text not null references app_users(id) on delete cascade,
        created_at timestamptz not null default now(),
        primary key (follower_id, followed_id),
        check (follower_id <> followed_id)
      );

      create table if not exists post_likes (
        post_id bigint not null references feed_posts(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        created_at timestamptz not null default now(),
        primary key (post_id, user_id)
      );

      create table if not exists post_comments (
        id bigserial primary key,
        post_id bigint not null references feed_posts(id) on delete cascade,
        user_id text references app_users(id) on delete set null,
        body text not null,
        created_at timestamptz not null default now()
      );

      create table if not exists conversations (
        id text primary key,
        author text not null,
        avatar text not null,
        last_message text not null,
        time_label text not null,
        unread_count integer not null default 0,
        is_online boolean not null default false
      );

      create table if not exists conversation_messages (
        id text primary key,
        conversation_id text not null references conversations(id) on delete cascade,
        sender_user_id text references app_users(id) on delete set null,
        sender text not null,
        type text not null,
        text text,
        campaign_type text,
        campaign_name text,
        campaign_description text,
        campaign_requirements text,
        campaign_deadline text,
        time_label text not null,
        created_at timestamptz not null default now()
      );

      create table if not exists conversation_participants (
        conversation_id text not null references conversations(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        unread_count integer not null default 0,
        created_at timestamptz not null default now(),
        primary key (conversation_id, user_id)
      );

      create table if not exists campaign_collaborations (
        id bigserial primary key,
        conversation_id text not null references conversations(id) on delete cascade,
        message_id text unique references conversation_messages(id) on delete set null,
        sender_user_id text not null references app_users(id) on delete cascade,
        receiver_user_id text not null references app_users(id) on delete cascade,
        campaign_type text not null,
        title text not null,
        description text,
        requirements text,
        deadline text,
        status text not null default 'pending',
        created_at timestamptz not null default now(),
        accepted_at timestamptz,
        declined_at timestamptz,
        deleted_at timestamptz,
        check (sender_user_id <> receiver_user_id),
        check (status in ('pending', 'accepted', 'declined', 'deleted'))
      );
    `);

    await this.query(`
      alter table profile_settings
        add column if not exists brand text not null default 'CIEM',
        add column if not exists avatar text not null default 'M',
        add column if not exists headline text not null default 'Influencer & Content Creator',
        add column if not exists work_mode text not null default 'Freelance',
        add column if not exists history text not null default '',
        add column if not exists contact_notes text not null default '',
        add column if not exists skills text[] not null default '{}';
    `);

    await this.query(`
      alter table feed_posts
        add column if not exists user_id text references app_users(id) on delete set null,
        add column if not exists hashtags text[] not null default '{}',
        add column if not exists is_sos boolean not null default false,
        add column if not exists sos_title text;
    `);

    await this.query(`
      alter table conversation_messages
        add column if not exists sender_user_id text references app_users(id) on delete set null,
        add column if not exists created_at timestamptz not null default now();
    `);

    await this.query(`
      alter table conversation_participants
        add column if not exists unread_count integer not null default 0;
    `);
  }

  private async seedData() {
    const { rows: users } = await this.query<{ count: number }>(
      'select count(*)::int as count from app_users',
    );

    if (users[0]?.count > 0) {
      return;
    }

  }
}
