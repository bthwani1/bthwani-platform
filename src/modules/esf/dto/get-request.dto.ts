import { IsUUID } from 'class-validator';

export class GetRequestDto {
  @IsUUID()
  request_id!: string;
}
