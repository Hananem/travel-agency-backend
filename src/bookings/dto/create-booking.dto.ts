import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @IsString()
  @Matches(/^[0-9+\s()-]{8,20}$/, {
    message: 'Invalid phone number',
  })
  phone: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  companionsCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
