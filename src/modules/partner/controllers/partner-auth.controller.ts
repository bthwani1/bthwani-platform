import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartnerAuthService } from '../services/partner-auth.service';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { Roles } from '../../../core/guards/rbac.guard';

@ApiTags('APP-PARTNER Authentication')
@Controller('partner/auth')
export class PartnerAuthController {
  constructor(private readonly authService: PartnerAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Partner login' })
  async login(
    @Body() body: { phone: string; otp: string },
  ): Promise<unknown> {
    return this.authService.login({
      phone: body.phone,
      otp: body.otp,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  async refresh(
    @Body() body: { refresh_token: string },
  ): Promise<unknown> {
    return this.authService.refresh({
      refresh_token: body.refresh_token,
    });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles('partner')
  @ApiOperation({ summary: 'Get partner profile' })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.authService.getProfile(user.sub);
  }
}

