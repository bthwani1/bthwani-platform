import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CreateChatMessageDto } from '../dto/public/create-chat-message.dto';
import { ListChatMessagesDto } from '../dto/public/list-chat-messages.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';

@ApiTags('KNZ Public Chat')
@Controller('knz/listings/:listing_id/chat')
@ApiBearerAuth()
export class PublicChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  @ApiOperation({ summary: 'List chat messages for a listing' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async listMessages(
    @Param('listing_id') listingId: string,
    @Query() query: Omit<ListChatMessagesDto, 'listing_id'>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getMessages({ ...query, listing_id: listingId }, user.sub);
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async sendMessage(
    @Param('listing_id') listingId: string,
    @Body() body: Omit<CreateChatMessageDto, 'listing_id'>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.createMessage({ ...body, listing_id: listingId }, user.sub);
  }

  @Put('messages/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(@Body('message_ids') messageIds: string[], @CurrentUser() user: JwtPayload) {
    await this.chatService.markAsRead(messageIds, user.sub);
    return { success: true };
  }
}
