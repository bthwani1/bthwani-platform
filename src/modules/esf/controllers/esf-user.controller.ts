import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EsfRequestService } from '../services/esf-request.service';
import { EsfDonorProfileService } from '../services/esf-donor-profile.service';
import { EsfMatchingService } from '../services/esf-matching.service';
import { EsfChatService } from '../services/esf-chat.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import { GetRequestDto } from '../dto/get-request.dto';
import { ListRequestsDto } from '../dto/list-requests.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { ListMatchesDto } from '../dto/list-matches.dto';
import { CreateMessageDto } from '../dto/create-message.dto';
import { ListMessagesDto } from '../dto/list-messages.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { RateLimit } from '../../../core/guards/rate-limit.guard';

@Controller('esf')
export class EsfUserController {
  constructor(
    private readonly requestService: EsfRequestService,
    private readonly donorProfileService: EsfDonorProfileService,
    private readonly matchingService: EsfMatchingService,
    private readonly chatService: EsfChatService,
  ) {}

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ ttl: 60, limit: 5 })
  async createRequest(
    @Body() createDto: CreateRequestDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.requestService.createRequest(createDto, user.sub, idempotencyKey);
  }

  @Get('requests/:request_id')
  async getRequest(
    @Param() params: GetRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.requestService.getRequest(params.request_id, user.sub);
  }

  @Get('requests')
  async listRequests(
    @Query() query: ListRequestsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.requestService.listRequests(user.sub, {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.limit !== undefined && { limit: query.limit }),
      ...(query.status !== undefined && { status: query.status }),
    });
  }

  @Get('matches/inbox')
  async getMatchesInbox(
    @Query() query: ListMatchesDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.matchingService.getMatchesForDonor(user.sub, {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.limit !== undefined && { limit: query.limit }),
    });
  }

  @Patch('me/availability')
  @HttpCode(HttpStatus.OK)
  async updateAvailability(
    @Body() updateDto: UpdateAvailabilityDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.donorProfileService.updateAvailability(user.sub, updateDto, idempotencyKey);
  }

  @Get('me/profile')
  async getProfile(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.donorProfileService.getProfile(user.sub);
  }

  @Get('requests/:request_id/messages')
  async listMessages(
    @Param() params: GetRequestDto,
    @Query() query: ListMessagesDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.chatService.getMessages(params.request_id, user.sub, query);
  }

  @Post('requests/:request_id/messages')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ ttl: 60, limit: 20 })
  async createMessage(
    @Param() params: GetRequestDto,
    @Body() createDto: CreateMessageDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.chatService.createMessage(params.request_id, user.sub, createDto, idempotencyKey);
  }
}
