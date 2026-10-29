import { IsIn, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTeamMembersDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  published?: string;

  @IsOptional()
  @IsIn(['order_asc', 'order_desc', 'newest', 'oldest'])
  sort?: string = 'order_asc';
}
