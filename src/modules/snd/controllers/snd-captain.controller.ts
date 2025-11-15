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
import { SndRequestQueryService } from '../services/request-query.service';
import { SndRequestCommandService } from '../services/request-command.service';
import { SndChatService } from '../services/chat.service';
import { SndProofCloseService } from '../services/proof-close.service';
import { ListRequestsDto } from '../dto/requests/list-requests.dto';
import { AcceptRequestDto } from '../dto/captain/accept-request.dto';
import { UpdateRequestStatusDto } from '../dto/requests/update-request-status.dto';
import { CreateChatMessageDto } from '../dto/chat/create-message.dto';
import { ListChatMessagesDto } from '../dto/chat/list-messages.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';

@ApiTags('SND Captain')
@Controller('api/snd/captain/requests')
@UseGuards(JwtAuthGuard)
export class SndCaptainController {
  constructor(
    private readonly requestQueryService: SndRequestQueryService,
    private readonly requestCommandService: SndRequestCommandService,
    private readonly chatService: SndChatService,
    private readonly proofCloseService: SndProofCloseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List instant requests for captain' })
  @ApiResponse({ status: 200, description: 'Requests listed' })
  async listRequests(@Query() query: ListRequestsDto, @CurrentUser() user: JwtPayload) {
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
    @Body() acceptDto: AcceptRequestDto,
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
    @Body() updateDto: UpdateRequestStatusDto,
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
