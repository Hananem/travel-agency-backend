import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateDestinationDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  country: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
