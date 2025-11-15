import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FieldTasksService } from '../services/field-tasks.service';
import { ListTasksDto } from '../dto/tasks/list-tasks.dto';
import { GetTaskDto } from '../dto/tasks/get-task.dto';
import { UpdateTaskStatusDto } from '../dto/tasks/update-task-status.dto';
import { StartVisitDto } from '../dto/tasks/start-visit.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { RateLimit } from '../../../core/guards/rate-limit.guard';

/**
 * Field Tasks Controller
 *
 * Handles task management for field agents:
 * - List today's tasks (with filters)
 * - Get task details
 * - Update task status
 * - Start/finish visits
 * - Get route optimization
 */
@Controller('field/tasks')
export class FieldTasksController {
  constructor(private readonly tasksService: FieldTasksService) {}

  @Get()
  async listTasks(
    @Query() query: ListTasksDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.tasksService.listTasks(user.sub, {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.limit !== undefined && { limit: query.limit }),
      ...(query.status !== undefined && { status: query.status }),
      ...(query.priority !== undefined && { priority: query.priority }),
    });
  }

  @Get('today')
  async getTodayTasks(
    @Query() query: ListTasksDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.tasksService.getTodayTasks(user.sub, {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.limit !== undefined && { limit: query.limit }),
      ...(query.status !== undefined && { status: query.status }),
    });
  }

  @Get(':task_id')
  async getTask(
    @Param() params: GetTaskDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.tasksService.getTask(params.task_id, user.sub);
  }

  @Patch(':task_id/status')
  @HttpCode(HttpStatus.OK)
  async updateTaskStatus(
    @Param() params: GetTaskDto,
    @Body() updateDto: UpdateTaskStatusDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.tasksService.updateTaskStatus(
      params.task_id,
      user.sub,
      updateDto,
      idempotencyKey,
    );
  }

  @Post(':task_id/visit/start')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 10 })
  async startVisit(
    @Param() params: GetTaskDto,
    @Body() startDto: StartVisitDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.tasksService.startVisit(
      params.task_id,
      user.sub,
      startDto,
      idempotencyKey,
    );
  }

  @Post(':task_id/visit/finish')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 10 })
  async finishVisit(
    @Param() params: GetTaskDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.tasksService.finishVisit(
      params.task_id,
      user.sub,
      idempotencyKey,
    );
  }

  @Get('route/optimize')
  async getOptimizedRoute(
    @Query() query: ListTasksDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.tasksService.getOptimizedRoute(user.sub, {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.limit !== undefined && { limit: query.limit }),
    });
  }
}

