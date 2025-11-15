import { IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatMessageDto {
  @ApiProperty({ description: 'Listing ID' })
  @IsUUID()
  listing_id!: string;

  @ApiProperty({ description: 'Message body', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  body!: string;
}
