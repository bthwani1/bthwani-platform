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
import { SndRequestCommandService } from '../services/request-command.service';
import { SndRequestQueryService } from '../services/request-query.service';
import { SndChatService } from '../services/chat.service';
import { SndProofCloseService } from '../services/proof-close.service';
import { CreateRequestDto } from '../dto/requests/create-request.dto';
import { ListRequestsDto } from '../dto/requests/list-requests.dto';
import { UpdateRequestStatusDto } from '../dto/requests/update-request-status.dto';
import { CloseRequestDto } from '../dto/requests/close-request.dto';
import { CreateChatMessageDto } from '../dto/chat/create-message.dto';
import { ListChatMessagesDto } from '../dto/chat/list-messages.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';

@ApiTags('SND User')
@Controller('api/snd/requests')
@UseGuards(JwtAuthGuard)
export class SndUserController {
  constructor(
    private readonly requestCommandService: SndRequestCommandService,
    private readonly requestQueryService: SndRequestQueryService,
    private readonly chatService: SndChatService,
    private readonly proofCloseService: SndProofCloseService,
  ) {}

  @Post()
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create SND request (instant|specialized)' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async createRequest(
    @Body() createDto: CreateRequestDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requestCommandService.createRequest(user.sub, createDto, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'List user SND requests' })
  @ApiResponse({ status: 200, description: 'Requests listed' })
  async listRequests(@Query() query: ListRequestsDto, @CurrentUser() user: JwtPayload) {
    return this.requestQueryService.findRequestsByRequester(user.sub, query);
  }

  @Get(':request_id')
  @ApiOperation({ summary: 'Get SND request details' })
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
    @Body() updateDto: UpdateRequestStatusDto,
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
    @Body() closeDto: CloseRequestDto,
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
    @Query() query: ListChatMessagesDto,
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
    @Body() createDto: CreateChatMessageDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.createMessage(requestId, user.sub, createDto, idempotencyKey);
  }
}
