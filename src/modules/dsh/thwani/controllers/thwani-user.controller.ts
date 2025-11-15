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
import { ThwaniRequestCommandService } from '../services/thwani-request-command.service';
import { ThwaniRequestQueryService } from '../services/thwani-request-query.service';
import { ThwaniChatService } from '../services/thwani-chat.service';
import { ThwaniProofCloseService } from '../services/thwani-proof-close.service';
import { CreateThwaniRequestDto } from '../dto/requests/create-thwani-request.dto';
import { ListThwaniRequestsDto } from '../dto/requests/list-thwani-requests.dto';
import { UpdateThwaniRequestStatusDto } from '../dto/requests/update-thwani-request-status.dto';
import { CloseThwaniRequestDto } from '../dto/requests/close-thwani-request.dto';
import { CreateThwaniMessageDto } from '../dto/chat/create-thwani-message.dto';
import { ListThwaniMessagesDto } from '../dto/chat/list-thwani-messages.dto';
import { CurrentUser } from '../../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../../core/guards/idempotency.guard';

/**
 * Thwani User Controller
 *
 * Endpoints for users to manage instant help requests.
 * Path: /api/dls/thwani/requests
 */
@ApiTags('APP-USER')
@Controller('api/dls/thwani/requests')
@UseGuards(JwtAuthGuard)
export class ThwaniUserController {
  constructor(
    private readonly requestCommandService: ThwaniRequestCommandService,
    private readonly requestQueryService: ThwaniRequestQueryService,
    private readonly chatService: ThwaniChatService,
    private readonly proofCloseService: ThwaniProofCloseService,
  ) {}

  @Post()
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Thwani instant help request' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async createRequest(
    @Body() createDto: CreateThwaniRequestDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestCommandService.createRequest(user.sub, createDto, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'List user Thwani requests' })
  @ApiResponse({ status: 200, description: 'Requests listed' })
  async listRequests(@Query() query: ListThwaniRequestsDto, @CurrentUser() user: JwtPayload) {
    return this.requestQueryService.findRequestsByRequester(user.sub, query);
  }

  @Get(':request_id')
  @ApiOperation({ summary: 'Get Thwani request details' })
  @ApiResponse({ status: 200, description: 'Request details' })
  async getRequest(@Param('request_id') requestId: string, @CurrentUser() user: JwtPayload) {
    return this.requestQueryService.findRequest(requestId, user.sub);
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

  @Post(':request_id/close')
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close request with 6-digit code' })
  @ApiResponse({ status: 200, description: 'Request closed' })
  async closeRequest(
    @Param('request_id') requestId: string,
    @Body() closeDto: CloseThwaniRequestDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.proofCloseService.verifyCloseCode(requestId, user.sub, closeDto, idempotencyKey);
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

