import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTripsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 10;

  @IsOptional() @IsString() @MaxLength(100)
  search?: string;

  @IsOptional() @IsString() @MaxLength(120)
  destination?: string;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  maxPrice?: number;

  @IsOptional() @IsString() @MaxLength(100)
  duration?: string;

  @IsOptional() @IsIn(['price_asc', 'price_desc', 'newest', 'oldest'])
  sort: string = 'newest';

  @IsOptional() @IsIn(['true', 'false'])
  published?: string;
}
