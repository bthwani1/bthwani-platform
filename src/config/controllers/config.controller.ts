import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '../services/config.service';
import { RuntimeConfigEntity } from '../entities/runtime-config.entity';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RbacGuard } from '../../core/guards/rbac.guard';
import { UpdateConfigDto, CreateConfigDto } from '../dto/config.dto';

/**
 * Configuration management controller for admin control panel
 * Allows runtime configuration updates without code deployment
 */
@ApiTags('Config')
@Controller('admin/config')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all runtime configurations' })
  @ApiResponse({ status: 200, description: 'List of configurations' })
  async getAllConfigs(): Promise<RuntimeConfigEntity[]> {
    return this.configService.getAllConfigs();
  }

  @Get('placeholders')
  @ApiOperation({ summary: 'Get placeholder configurations that need to be set' })
  @ApiResponse({ status: 200, description: 'List of placeholder configurations' })
  async getPlaceholders(): Promise<RuntimeConfigEntity[]> {
    return this.configService.getPlaceholders();
  }

  @Get('validation')
  @ApiOperation({ summary: 'Validate critical configurations' })
  @ApiResponse({
    status: 200,
    description: 'Validation result for critical configurations',
  })
  async validateConfigs(): Promise<{ isValid: boolean; missing: string[] }> {
    return this.configService.validateCriticalConfigs();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get configuration by key' })
  @ApiResponse({ status: 200, description: 'Configuration value' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getConfig(@Param('key') key: string): Promise<{ key: string; value: any }> {
    const value = this.configService.get(key);
    if (value === undefined) {
      throw new Error(`Configuration '${key}' not found`);
    }
    return { key, value };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created/updated' })
  async createOrUpdateConfig(
    @Body() dto: CreateConfigDto,
  ): Promise<RuntimeConfigEntity> {
    return this.configService.updateConfig(dto.key, dto.value, {
      description: dto.description,
      isSensitive: dto.isSensitive,
      updatedBy: dto.updatedBy,
    });
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateConfig(
    @Param('key') key: string,
    @Body() dto: UpdateConfigDto,
  ): Promise<RuntimeConfigEntity> {
    return this.configService.updateConfig(key, dto.value, {
      description: dto.description,
      isSensitive: dto.isSensitive,
      updatedBy: dto.updatedBy,
    });
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete configuration (soft delete)' })
  @ApiResponse({ status: 204, description: 'Configuration deleted' })
  async deleteConfig(@Param('key') key: string): Promise<void> {
    return this.configService.deleteConfig(key);
  }
}

