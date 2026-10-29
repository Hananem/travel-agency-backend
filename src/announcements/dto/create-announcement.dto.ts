import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content: string;

  @IsOptional()
  @IsIn(['news', 'offer', 'postponement', 'cancellation', 'other'])
  type?: string = 'news';

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  isPublished?: boolean;
}
