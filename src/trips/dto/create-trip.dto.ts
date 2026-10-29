import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class TripCompanionDto {
  @IsString() @IsNotEmpty()
  teamMemberId!: string;

  @IsOptional() @IsString() @MaxLength(50)
  role?: string;
}

export class CreateTripDto {
  @IsString() @MinLength(3) @MaxLength(150)
  title!: string;

  @IsString() @MinLength(3) @MaxLength(180)
  slug!: string;

  @IsString() @MinLength(2) @MaxLength(120)
  destination!: string;

  @IsString() @MinLength(10)
  description!: string;

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  price!: number;

  @IsString() @MinLength(1) @MaxLength(100)
  duration!: string;

  @IsOptional() @IsUrl({ require_protocol: true })
  imageUrl?: string;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;

  @Type(() => Date) @IsDate()
  startDate!: Date;

  @IsOptional() @Type(() => Date) @IsDate()
  endDate?: Date;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  capacity?: number;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => String(v).trim()).filter(Boolean)
      : value,
  )
  @IsArray() @ArrayMaxSize(20)
  @IsString({ each: true }) @MaxLength(100, { each: true })
  features?: string[];

  @IsOptional() @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripCompanionDto)
  companions?: TripCompanionDto[];
}