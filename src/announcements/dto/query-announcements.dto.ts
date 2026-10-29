import { IsIn, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAnnouncementsDto {
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
  @IsIn(['news', 'offer', 'postponement', 'cancellation', 'other'])
  type?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  published?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: string = 'newest';
}
