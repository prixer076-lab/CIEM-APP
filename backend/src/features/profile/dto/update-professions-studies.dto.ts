import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProfessionsStudiesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  items?: string[];
}
