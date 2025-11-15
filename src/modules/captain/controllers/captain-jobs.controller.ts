import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiParam } from '@nestjs/swagger';
import { CaptainJobsService } from '../services/captain-jobs.service';
import {
  ListOffersQueryDto,
  UpdateJobStatusDto,
  NegotiateFareDto,
} from '../dto/jobs/jobs.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Roles } from '../../../core/guards/rbac.guard';

@ApiTags('APP-CAPTAIN Jobs')
@Controller('api')
@UseGuards(JwtAuthGuard)
@Roles('captain')
@ApiBearerAuth()
export class CaptainJobsController {
  constructor(private readonly jobsService: CaptainJobsService) {}

  @Get('dls/jobs/offers')
  @ApiOperation({
    summary: 'List DSH job offers',
    operationId: 'captain_dls_jobs_offers',
  })
  async listDshOffers(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListOffersQueryDto,
  ): Promise<{
    items: unknown[];
    nextCursor?: string;
  }> {
    return this.jobsService.listDshOffers(user.sub, query);
  }

  @Post('dls/jobs/:id/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Accept DSH job offer',
    operationId: 'captain_dls_jobs_accept',
  })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async acceptDshJob(
    @CurrentUser() user: JwtPayload,
    @Param('id') jobId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return this.jobsService.acceptDshJob(user.sub, jobId, idempotencyKey);
  }

  @Post('dls/jobs/:id/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Reject DSH job offer',
    operationId: 'captain_dls_jobs_reject',
  })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async rejectDshJob(
    @CurrentUser() user: JwtPayload,
    @Param('id') jobId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{ success: boolean }> {
    return this.jobsService.rejectDshJob(user.sub, jobId, idempotencyKey);
  }

  @Patch('dls/jobs/:id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Update DSH job status',
    operationId: 'captain_dls_jobs_status_update',
  })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async updateDshJobStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') jobId: string,
    @Body() updateDto: UpdateJobStatusDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return this.jobsService.updateDshJobStatus(user.sub, jobId, updateDto, idempotencyKey);
  }

  @Get('amn/offers')
  @ApiOperation({
    summary: 'List AMN trip offers',
    operationId: 'captain_amn_offers',
  })
  async listAmnOffers(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListOffersQueryDto,
  ): Promise<{
    items: unknown[];
    nextCursor?: string;
  }> {
    return this.jobsService.listAmnOffers(user.sub, query);
  }

  @Post('amn/trips/:id/accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Accept AMN trip offer',
    operationId: 'captain_amn_trips_accept',
  })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async acceptAmnTrip(
    @CurrentUser() user: JwtPayload,
    @Param('id') tripId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return this.jobsService.acceptAmnTrip(user.sub, tripId, idempotencyKey);
  }

  @Patch('amn/trips/:id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Update AMN trip status',
    operationId: 'captain_amn_trips_status_update',
  })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async updateAmnTripStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') tripId: string,
    @Body() updateDto: UpdateJobStatusDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return this.jobsService.updateAmnTripStatus(user.sub, tripId, updateDto, idempotencyKey);
  }

  @Post('amn/trips/:id/negotiate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Negotiate AMN trip fare (80-120%)',
    operationId: 'captain_amn_trips_negotiate',
  })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async negotiateAmnFare(
    @CurrentUser() user: JwtPayload,
    @Param('id') tripId: string,
    @Body() negotiateDto: NegotiateFareDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{ fare: number; negotiated: boolean }> {
    return this.jobsService.negotiateAmnFare(user.sub, tripId, negotiateDto, idempotencyKey);
  }

  @Post('dls/location')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Update captain location',
    operationId: 'captain_dls_location_update',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async updateLocation(
    @CurrentUser() user: JwtPayload,
    @Body() locationDto: { lat: number; lng: number },
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{ success: boolean }> {
    return this.jobsService.updateLocation(user.sub, locationDto, idempotencyKey);
  }
}

