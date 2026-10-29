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

class UpdateTripCompanionDto {
  @IsString() @IsNotEmpty()
  teamMemberId!: string;

  @IsOptional() @IsString() @MaxLength(50)
  role?: string;
}

export class UpdateTripDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(150)
  title?: string;

  @IsOptional() @IsString() @MinLength(3) @MaxLength(180)
  slug?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  destination?: string;

  @IsOptional() @IsString() @MinLength(10)
  description?: string;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  price?: number;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(100)
  duration?: string;

  @IsOptional() @IsUrl({ require_protocol: true })
  imageUrl?: string;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;

  @IsOptional() @Type(() => Date) @IsDate()
  startDate?: Date;

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
  @Type(() => UpdateTripCompanionDto)
  companions?: UpdateTripCompanionDto[];
}