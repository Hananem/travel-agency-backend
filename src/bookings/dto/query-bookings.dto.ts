import { IsOptional, IsString } from 'class-validator';

export class QueryBookingsDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  tripId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
