import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  Query,
} from '@nestjs/common';
import { FieldAuthService } from '../services/field-auth.service';
import { LoginDto } from '../dto/auth/login.dto';
import { VerifyOtpDto } from '../dto/auth/verify-otp.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Public } from '../../../core/decorators/public.decorator';
import { RateLimit } from '../../../core/guards/rate-limit.guard';

/**
 * Field Auth Controller
 *
 * Handles authentication for field agents:
 * - Login (phone/agent ID)
 * - OTP verification
 * - Profile and zone resolution
 * - Tutorial completion tracking
 */
@Controller('field/auth')
export class FieldAuthController {
  constructor(private readonly authService: FieldAuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 5 })
  async login(@Body() loginDto: LoginDto): Promise<unknown> {
    return this.authService.requestOtp(loginDto);
  }

  @Post('verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 300, limit: 3 })
  async verifyOtp(
    @Body() verifyDto: VerifyOtpDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<unknown> {
    return this.authService.verifyOtp(verifyDto, idempotencyKey);
  }

  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.authService.getProfile(user.sub);
  }

  @Get('zones')
  async getZones(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.authService.getAssignedZones(user.sub);
  }

  @Post('tutorial/complete')
  @HttpCode(HttpStatus.OK)
  async completeTutorial(
    @CurrentUser() user: JwtPayload,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<unknown> {
    return this.authService.completeTutorial(user.sub, idempotencyKey);
  }
}

