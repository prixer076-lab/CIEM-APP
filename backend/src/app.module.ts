import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './features/health/health.module';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { FeedModule } from './features/feed/feed.module';
import { MessagesModule } from './features/messages/messages.module';
import { ProfileModule } from './features/profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    FeedModule,
    MessagesModule,
    ProfileModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
