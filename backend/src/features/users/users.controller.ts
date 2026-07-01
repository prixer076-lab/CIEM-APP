import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post, Version } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
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

  @Get()
  @Version('1')
  async findAll(
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const session = await this.authService.getCurrentUser(authorization, userId);
    return this.usersService.findAll(session.user?.id ?? userId);
  }

  @Get(':id')
  @Version('1')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/profile')
  @Version('1')
  async findPublicProfileById(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const session = await this.authService.getCurrentUser(authorization, userId);
    return this.usersService.findPublicProfileById(id, session.user?.id ?? userId);
  }

  @Post(':id/follow')
  @Version('1')
  async follow(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const followerId = await this.resolveUserId(authorization, userId);
    return this.usersService.follow(followerId, id);
  }

  @Delete(':id/follow')
  @Version('1')
  async unfollow(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const followerId = await this.resolveUserId(authorization, userId);
    return this.usersService.unfollow(followerId, id);
  }

  @Patch(':id')
  @Version('1')
  update(@Param('id') id: string, @Body() payload: UpdateUserDto) {
    return this.usersService.update(id, payload);
  }
}
