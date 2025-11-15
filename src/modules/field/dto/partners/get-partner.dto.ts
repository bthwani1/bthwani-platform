import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPartnerDto {
  @ApiProperty({
    description: 'Partner ID',
    example: 'partner_123456789',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^partner_[a-zA-Z0-9_-]+$/, {
    message: 'Partner ID must match pattern: partner_*',
  })
  partner_id: string;
}

