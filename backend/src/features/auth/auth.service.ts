import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly activeSessions = new Map<
    string,
    {
      userId: string;
      refreshToken: string;
    }
  >();

  constructor(private readonly databaseService: DatabaseService) {}

  private extractBearerToken(authorization?: string) {
    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme?.toLowerCase() !== 'bearer') {
      return undefined;
    }

    return token?.trim() || undefined;
  }

  private createSession(user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  }) {
    const accessToken = `dev-access-token-${randomUUID()}`;
    const refreshToken = `dev-refresh-token-${randomUUID()}`;

    this.activeSessions.set(accessToken, {
      userId: user.id,
      refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  private buildHeadline(role: string) {
    switch (role) {
      case 'emprendedor':
      case 'empresario':
        return 'Emprendedor';
      case 'marketing':
        return 'Experto/a en Marketing';
      case 'influencer':
        return 'Influencer';
      default:
        return role;
    }
  }

  async getCurrentUser(authorization?: string, fallbackUserId?: string) {
    const token = this.extractBearerToken(authorization);
    const activeSession = token ? this.activeSessions.get(token) : undefined;

    if (token && !activeSession) {
      return {
        authenticated: false,
        message: 'Sesion no valida.',
      };
    }

    const userId = activeSession?.userId ?? fallbackUserId;

    if (!userId) {
      return {
        authenticated: false,
        message: 'Sesion no valida.',
      };
    }

    const { rows } = await this.databaseService.query<{
      id: string;
      full_name: string;
      email: string;
      role: string;
    }>(
      `
        select id, full_name, email, role
        from app_users
        where id = $1
        limit 1
      `,
      [userId],
    );

    const user = rows[0];

    if (!user) {
      return {
        authenticated: false,
        message: 'Sesion no valida.',
      };
    }

    return {
      authenticated: true,
      accessToken: token ?? '',
      refreshToken: activeSession?.refreshToken ?? '',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(payload: LoginDto) {
    const { rows } = await this.databaseService.query<{
      id: string;
      full_name: string;
      email: string;
      role: string;
    }>(
      `
        select id, full_name, email, role
        from app_users
        where lower(email) = lower($1) and password = $2
        limit 1
      `,
      [payload.email.trim(), payload.password],
    );

    const user = rows[0];

    if (!user) {
      return {
        authenticated: false,
        message: 'Correo o contrasena incorrectos.',
      };
    }

    return {
      authenticated: true,
      ...this.createSession(user),
    };
  }

  async register(payload: RegisterDto) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const { rows: existingRows } = await this.databaseService.query<{ id: string }>(
      'select id from app_users where lower(email) = lower($1) limit 1',
      [normalizedEmail],
    );

    if (existingRows[0]) {
      return {
        created: false,
        message: 'Ya existe una cuenta con este correo.',
      };
    }

    const nextUserId = `user-${Date.now()}`;
    const fullName = payload.fullName.trim();
    const role = payload.role ?? 'influencer';
    const skills = payload.skills?.map((skill) => skill.trim()).filter(Boolean) ?? [];
    const history = payload.history?.trim() ?? '';
    const contactNotes = payload.contactNotes?.trim() ?? '';
    const avatar = fullName.trim().charAt(0).toUpperCase() || 'U';
    const headline = this.buildHeadline(role);

    await this.databaseService.query('begin');

    try {
      await this.databaseService.query(
        `
          insert into app_users (id, full_name, email, password, role, location)
          values ($1, $2, $3, $4, $5, $6)
        `,
        [nextUserId, fullName, normalizedEmail, payload.password, role, 'Trujillo, Peru'],
      );
      await this.databaseService.query(
        `
          insert into profile_settings (user_id, avatar, headline, history, contact_notes, skills)
          values ($1, $2, $3, $4, $5, $6)
        `,
        [nextUserId, avatar, headline, history, contactNotes, skills],
      );
      await this.databaseService.query('commit');
    } catch (error) {
      await this.databaseService.query('rollback');
      throw error;
    }

    const user = {
      id: nextUserId,
      full_name: fullName,
      email: normalizedEmail,
      role,
    };

    return {
      created: true,
      ...this.createSession(user),
    };
  }

  async logout(authorization?: string) {
    const token = this.extractBearerToken(authorization);

    if (token) {
      this.activeSessions.delete(token);
    }

    return {
      loggedOut: true,
    };
  }
}
