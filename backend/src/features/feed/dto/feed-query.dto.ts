import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class FeedQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['todo', 'ayudas', 'necesidades', 'comunidad'])
  filter?: 'todo' | 'ayudas' | 'necesidades' | 'comunidad';

  @IsOptional()
  @IsString()
  search?: string;
}
