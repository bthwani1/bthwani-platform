import {
  Controller,
  Patch,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CaptainAvailabilityService } from '../services/captain-availability.service';
import { UpdateAvailabilityDto } from '../dto/availability/availability.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Roles } from '../../../core/guards/rbac.guard';

@ApiTags('APP-CAPTAIN Availability')
@Controller('api')
@UseGuards(JwtAuthGuard)
@Roles('captain')
@ApiBearerAuth()
export class CaptainAvailabilityController {
  constructor(private readonly availabilityService: CaptainAvailabilityService) {}

  @Patch('dls/availability')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Update DSH availability',
    operationId: 'captain_dls_availability_update',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async updateDshAvailability(
    @CurrentUser() user: JwtPayload,
    @Body() updateDto: UpdateAvailabilityDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{ online: boolean; service: string }> {
    return this.availabilityService.updateDshAvailability(user.sub, updateDto, idempotencyKey);
  }

  @Patch('amn/availability')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({
    summary: 'Update AMN availability',
    operationId: 'captain_amn_availability_update',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async updateAmnAvailability(
    @CurrentUser() user: JwtPayload,
    @Body() updateDto: UpdateAvailabilityDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{ online: boolean; service: string }> {
    return this.availabilityService.updateAmnAvailability(user.sub, updateDto, idempotencyKey);
  }

  @Get('availability/status')
  @ApiOperation({
    summary: 'Get current availability status',
    operationId: 'captain_availability_status',
  })
  async getAvailabilityStatus(
    @CurrentUser() user: JwtPayload,
  ): Promise<{
    online: boolean;
    activeServices: string[];
    dsh: { online: boolean };
    amn: { online: boolean; eligible: boolean };
  }> {
    return this.availabilityService.getAvailabilityStatus(user.sub);
  }
}

