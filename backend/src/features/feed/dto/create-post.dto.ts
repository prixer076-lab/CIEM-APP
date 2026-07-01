import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  body!: string;

  @IsIn(['ayudas', 'necesidades', 'comunidad'])
  category!: 'ayudas' | 'necesidades' | 'comunidad';

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsBoolean()
  isSos?: boolean;

  @IsOptional()
  @IsString()
  sosTitle?: string;
}
