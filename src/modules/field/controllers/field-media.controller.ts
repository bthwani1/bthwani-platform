import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FieldMediaService } from '../services/field-media.service';
import { GetPresignedUrlDto } from '../dto/media/get-presigned-url.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { RateLimit } from '../../../core/guards/rate-limit.guard';

/**
 * Field Media Controller
 *
 * Handles media operations for field agents:
 * - Generate pre-signed URLs for uploads
 * - Verify upload completion
 * - List uploaded media for a partner
 */
@Controller('field/media')
export class FieldMediaController {
  constructor(private readonly mediaService: FieldMediaService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 20 })
  async getPresignedUrl(
    @Body() requestDto: GetPresignedUrlDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.mediaService.generatePresignedUrl(
      user.sub,
      requestDto.partner_id,
      requestDto.file_type,
      requestDto.file_name,
      requestDto.content_type,
    );
  }

  @Post(':media_id/verify')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 20 })
  async verifyUpload(
    @Param('media_id') mediaId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.mediaService.verifyUpload(mediaId, user.sub);
  }

  @Get('partners/:partner_id')
  async listPartnerMedia(
    @Param('partner_id') partnerId: string,
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: string,
  ): Promise<unknown> {
    return this.mediaService.listPartnerMedia(partnerId, user.sub, type);
  }
}

