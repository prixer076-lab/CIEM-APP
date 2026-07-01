import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConnectionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  author?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  avatar?: string;

  @IsString()
  @MinLength(1)
  initialMessage!: string;

  @IsOptional()
  @IsString()
  recipientUserId?: string;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}
