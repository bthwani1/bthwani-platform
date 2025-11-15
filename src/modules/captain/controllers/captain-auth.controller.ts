import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CaptainAuthService } from '../services/captain-auth.service';
import { LoginDto, VerifyOtpDto } from '../dto/auth/login.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Public } from '../../../core/decorators/public.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { RateLimit } from '../../../core/guards/rate-limit.guard';

@ApiTags('APP-CAPTAIN Auth')
@Controller('auth')
export class CaptainAuthController {
  constructor(private readonly authService: CaptainAuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start OTP flow', operationId: 'captain_auth_login' })
  @RateLimit({ ttl: 60, limit: 5 })
  async login(@Body() loginDto: LoginDto): Promise<{ expires_in: number }> {
    return this.authService.requestOtp(loginDto.phone);
  }

  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({ summary: 'Verify OTP and issue JWT', operationId: 'captain_auth_verify_otp' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @RateLimit({ ttl: 300, limit: 3 })
  async verifyOtp(
    @Body() verifyDto: VerifyOtpDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    captain: {
      id: string;
      name?: string;
      phone: string;
      services: string[];
    };
  }> {
    return this.authService.verifyOtp(verifyDto, idempotencyKey);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({ summary: 'Refresh access token', operationId: 'captain_auth_refresh' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async refresh(
    @Body() body: { refresh_token: string },
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    return this.authService.refresh(body.refresh_token, idempotencyKey);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdempotencyGuard)
  @ApiOperation({ summary: 'Logout captain', operationId: 'captain_auth_logout' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{ success: boolean }> {
    return this.authService.logout(user.sub, idempotencyKey);
  }
}

