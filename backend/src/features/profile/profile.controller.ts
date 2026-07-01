import { BadRequestException, Body, Controller, Delete, Get, Headers, Patch, Version } from '@nestjs/common';
import { UpdateProfessionsStudiesDto } from './dto/update-professions-studies.dto';
import { UpdateProfilePreferencesDto } from './dto/update-profile-preferences.dto';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthService } from '../auth/auth.service';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
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

  @Get('me')
  @Version('1')
  async getProfile(
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.profileService.getProfile(resolvedUserId);
  }

  @Patch('me')
  @Version('1')
  async updateProfile(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() payload: UpdateProfileDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.profileService.updateProfile(resolvedUserId, payload);
  }

  @Get('me/preferences')
  @Version('1')
  async getPreferences(
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.profileService.getPreferences(resolvedUserId);
  }

  @Get('me/professions-studies')
  @Version('1')
  async getProfessionsAndStudies(
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.profileService.getProfessionsAndStudies(resolvedUserId);
  }

  @Patch('me/preferences')
  @Version('1')
  async updatePreferences(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() payload: UpdateProfilePreferencesDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.profileService.updatePreferences(resolvedUserId, payload);
  }

  @Patch('me/professions-studies')
  @Version('1')
  async updateProfessionsAndStudies(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-user-id') userId: string | undefined,
    @Body() payload: UpdateProfessionsStudiesDto,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.profileService.updateProfessionsAndStudies(resolvedUserId, payload);
  }

  @Delete('me/projects')
  @Version('1')
  async clearProjects(
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const resolvedUserId = await this.resolveUserId(authorization, userId);
    return this.profileService.clearProjects(resolvedUserId);
  }
}
