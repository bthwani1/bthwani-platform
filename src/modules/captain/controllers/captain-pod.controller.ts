import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiParam } from '@nestjs/swagger';
import { CaptainPodService } from '../services/captain-pod.service';
import { SubmitPodCodeDto, SubmitPodPhotoDto } from '../dto/pod/pod.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Roles } from '../../../core/guards/rbac.guard';

@ApiTags('APP-CAPTAIN PoD')
@Controller('api/dls/jobs')
@UseGuards(JwtAuthGuard)
@Roles('captain')
@ApiBearerAuth()
export class CaptainPodController {
  constructor(private readonly podService: CaptainPodService) {}

  @Post(':id/pod/code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Submit PoD code (6-digit)',
    operationId: 'captain_dls_jobs_pod_code',
  })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async submitPodCode(
    @CurrentUser() user: JwtPayload,
    @Param('id') jobId: string,
    @Body() submitDto: SubmitPodCodeDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{ success: boolean; verified: boolean }> {
    return this.podService.submitPodCode(user.sub, jobId, submitDto, idempotencyKey);
  }

  @Post(':id/pod/photo')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Submit PoD photo (with masking)',
    operationId: 'captain_dls_jobs_pod_photo',
  })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async submitPodPhoto(
    @CurrentUser() user: JwtPayload,
    @Param('id') jobId: string,
    @Body() submitDto: SubmitPodPhotoDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{ success: boolean; photo_id: string }> {
    return this.podService.submitPodPhoto(user.sub, jobId, submitDto, idempotencyKey);
  }
}

