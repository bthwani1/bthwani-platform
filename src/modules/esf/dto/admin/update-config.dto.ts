import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UpdateConfigDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  scope?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  key!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
