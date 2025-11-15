import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '../services/config.service';
import { ConfigScope } from '../entities/runtime-config.entity';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { StepUpGuard } from '../../../core/guards/step-up.guard';

@ApiTags('WLT Config')
@Controller('wallet/admin/config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WltConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get WLT runtime config (scoped VARs)' })
  @ApiResponse({ status: 200, description: 'Config retrieved successfully' })
  async getConfig(
    @Query('key') key: string,
    @CurrentUser() user: JwtPayload,
    @Query('scope') scope?: ConfigScope,
    @Query('scope_value') scopeValue?: string,
  ): Promise<unknown> {
    const request: {
      key: string;
      scope?: ConfigScope;
      scopeValue?: string;
    } = { key };
    if (scope !== undefined) {
      request.scope = scope;
    }
    if (scopeValue !== undefined) {
      request.scopeValue = scopeValue;
    }
    return this.configService.getConfig(request);
  }

  @Patch()
  @UseGuards(StepUpGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Update WLT runtime config via preview/publish' })
  @ApiResponse({ status: 200, description: 'Config updated successfully' })
  async updateConfig(
    @Body()
    dto: {
      key: string;
      scope: ConfigScope;
      scope_value?: string;
      value: string;
      preview?: boolean;
    },
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const updateRequest: {
      key: string;
      scope: ConfigScope;
      scopeValue?: string;
      value: string;
      userId: string;
      preview?: boolean;
    } = {
      key: dto.key,
      scope: dto.scope,
      value: dto.value,
      userId: user.sub,
    };
    if (dto.scope_value !== undefined) {
      updateRequest.scopeValue = dto.scope_value;
    }
    if (dto.preview !== undefined) {
      updateRequest.preview = dto.preview;
    }
    return this.configService.updateConfig(updateRequest);
  }

  @Post('publish')
  @UseGuards(StepUpGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Publish draft config' })
  @ApiResponse({ status: 200, description: 'Config published successfully' })
  async publishConfig(
    @Body() dto: { key: string },
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.configService.publishConfig(dto.key, user.sub);
  }

  @Post('rollback')
  @UseGuards(StepUpGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Rollback published config' })
  @ApiResponse({ status: 200, description: 'Config rolled back successfully' })
  async rollbackConfig(
    @Body() dto: { key: string },
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.configService.rollbackConfig(dto.key, user.sub);
  }
}
