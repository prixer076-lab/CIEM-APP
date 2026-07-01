import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @IsIn(['collaboration', 'talent'])
  type!: 'collaboration' | 'talent';

  @IsString()
  @MinLength(3)
  projectName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  deadline?: string;
}
