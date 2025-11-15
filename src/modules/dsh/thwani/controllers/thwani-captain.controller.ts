import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThwaniRequestQueryService } from '../services/thwani-request-query.service';
import { ThwaniRequestCommandService } from '../services/thwani-request-command.service';
import { ThwaniChatService } from '../services/thwani-chat.service';
import { ThwaniProofCloseService } from '../services/thwani-proof-close.service';
import { ListThwaniRequestsDto } from '../dto/requests/list-thwani-requests.dto';
import { AcceptThwaniRequestDto } from '../dto/captain/accept-thwani-request.dto';
import { UpdateThwaniRequestStatusDto } from '../dto/requests/update-thwani-request-status.dto';
import { CreateThwaniMessageDto } from '../dto/chat/create-thwani-message.dto';
import { ListThwaniMessagesDto } from '../dto/chat/list-thwani-messages.dto';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../../core/guards/idempotency.guard';

/**
 * Thwani Captain Controller
 *
 * Endpoints for captains to manage instant help requests.
 * Path: /api/dls/thwani/captain/requests
 */
@ApiTags('APP-CAPTAIN')
@Controller('api/dls/thwani/captain/requests')
@UseGuards(JwtAuthGuard)
export class ThwaniCaptainController {
  constructor(
    private readonly requestQueryService: ThwaniRequestQueryService,
    private readonly requestCommandService: ThwaniRequestCommandService,
    private readonly chatService: ThwaniChatService,
    private readonly proofCloseService: ThwaniProofCloseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List instant requests for captain' })
  @ApiResponse({ status: 200, description: 'Requests listed' })
  async listRequests(@Query() query: ListThwaniRequestsDto, @CurrentUser() user: JwtPayload) {
    return this.requestQueryService.findRequestsByCaptain(user.sub, query);
  }

  @Get(':request_id')
  @ApiOperation({ summary: 'Get request details' })
  @ApiResponse({ status: 200, description: 'Request details' })
  async getRequest(@Param('request_id') requestId: string, @CurrentUser() user: JwtPayload) {
    return this.requestQueryService.findRequest(requestId, user.sub);
  }

  @Post(':request_id/accept')
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept instant request' })
  @ApiResponse({ status: 200, description: 'Request accepted' })
  async acceptRequest(
    @Param('request_id') requestId: string,
    @Body() acceptDto: AcceptThwaniRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestCommandService.acceptRequest(requestId, user.sub);
  }

  @Post(':request_id/status')
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update request status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('request_id') requestId: string,
    @Body() updateDto: UpdateThwaniRequestStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestCommandService.updateStatus(requestId, user.sub, updateDto);
  }

  @Post(':request_id/close-code')
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate close code' })
  @ApiResponse({ status: 200, description: 'Close code generated' })
  async generateCloseCode(@Param('request_id') requestId: string, @CurrentUser() user: JwtPayload) {
    return { close_code: await this.proofCloseService.generateCloseCode(requestId, user.sub) };
  }

  @Get(':request_id/messages')
  @ApiOperation({ summary: 'List chat messages' })
  @ApiResponse({ status: 200, description: 'Messages listed' })
  async listMessages(
    @Param('request_id') requestId: string,
    @Query() query: ListThwaniMessagesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getMessages(requestId, user.sub, query);
  }

  @Post(':request_id/messages')
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send chat message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async createMessage(
    @Param('request_id') requestId: string,
    @Body() createDto: CreateThwaniMessageDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.createMessage(requestId, user.sub, createDto, idempotencyKey);
  }
}

