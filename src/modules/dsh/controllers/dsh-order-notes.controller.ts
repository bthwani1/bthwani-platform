import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DshOrderNotesService } from '../services/dsh-order-notes.service';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { Roles } from '../../../core/guards/rbac.guard';

@ApiTags('APP-PARTNER DSH Notes')
@Controller('dls/partner/orders/:order_id/notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles('partner')
export class DshOrderNotesController {
  constructor(private readonly notesService: DshOrderNotesService) {}

  @Get()
  @ApiOperation({ summary: 'List order notes' })
  async listNotes(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    const result = await this.notesService.getNotes(
      orderId,
      user.sub,
      cursor,
      limit ? Math.min(limit, 100) : 20,
    );

    return {
      items: result.items.map((note) => ({
        id: note.id,
        note: note.note,
        note_type: note.note_type,
        created_by: note.created_by,
        created_at: note.created_at.toISOString(),
      })),
      next_cursor: result.nextCursor || null,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create order note' })
  @HttpCode(HttpStatus.CREATED)
  async createNote(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Body() body: { note: string; note_type?: 'internal' | 'customer' | 'system' },
  ): Promise<unknown> {
    const note = await this.notesService.createNote(orderId, user.sub, {
      note: body.note,
      note_type: body.note_type,
    });

    return {
      id: note.id,
      note: note.note,
      note_type: note.note_type,
      created_by: note.created_by,
      created_at: note.created_at.toISOString(),
    };
  }
}

