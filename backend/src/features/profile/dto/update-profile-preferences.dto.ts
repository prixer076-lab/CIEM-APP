import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProfilePreferencesDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}
