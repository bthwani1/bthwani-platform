import { Injectable, NotFoundException } from '@nestjs/common';
import { FieldTaskEngineAdapter } from '../adapters/field-task-engine.adapter';
import { FieldNotificationsAdapter } from '../adapters/field-notifications.adapter';
import { LoggerService } from '../../../core/services/logger.service';
import { FieldAuditLogger } from './field-audit-logger.service';
import { UpdateTaskStatusDto } from '../dto/tasks/update-task-status.dto';
import { StartVisitDto } from '../dto/tasks/start-visit.dto';
import { TaskStatus } from '../dto/tasks/list-tasks.dto';

interface ListTasksOptions {
  cursor?: string;
  limit?: number;
  status?: TaskStatus;
  priority?: string;
}

/**
 * Field Tasks Service
 *
 * Orchestrates task management for field agents.
 */
@Injectable()
export class FieldTasksService {
  constructor(
    private readonly taskEngineAdapter: FieldTaskEngineAdapter,
    private readonly notificationsAdapter: FieldNotificationsAdapter,
    private readonly auditLogger: FieldAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async listTasks(agentId: string, options: ListTasksOptions): Promise<unknown> {
    return this.taskEngineAdapter.listTasks(agentId, options);
  }

  async getTodayTasks(agentId: string, options: ListTasksOptions): Promise<unknown> {
    return this.taskEngineAdapter.getTodayTasks(agentId, options);
  }

  async getTask(taskId: string, agentId: string): Promise<unknown> {
    const task = await this.taskEngineAdapter.getTask(taskId, agentId);

    if (!task) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/field/task_not_found',
        title: 'Task Not Found',
        status: 404,
        code: 'FIELD-404-TASK-NOT-FOUND',
        detail: `Task ${taskId} not found`,
      });
    }

    return task;
  }

  async updateTaskStatus(
    taskId: string,
    agentId: string,
    updateDto: UpdateTaskStatusDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Task status update', {
      taskId,
      agentId,
      status: updateDto.status,
    });

    const result = await this.taskEngineAdapter.updateTaskStatus(
      taskId,
      agentId,
      updateDto.status,
      updateDto.notes,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'task',
      entityId: taskId,
      action: 'update_status',
      userId: agentId,
      newValues: {
        status: updateDto.status,
        notes: updateDto.notes,
      },
    });

    return result;
  }

  async startVisit(
    taskId: string,
    agentId: string,
    startDto: StartVisitDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Visit started', { taskId, agentId });

    const visitData: {
      latitude?: number;
      longitude?: number;
      notes?: string;
    } = {};
    if (startDto.latitude !== undefined) visitData.latitude = startDto.latitude;
    if (startDto.longitude !== undefined) visitData.longitude = startDto.longitude;
    if (startDto.notes !== undefined) visitData.notes = startDto.notes;

    const result = await this.taskEngineAdapter.startVisit(
      taskId,
      agentId,
      visitData,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'task',
      entityId: taskId,
      action: 'start_visit',
      userId: agentId,
      metadata: {
        latitude: startDto.latitude,
        longitude: startDto.longitude,
      },
    });

    return result;
  }

  async finishVisit(
    taskId: string,
    agentId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Visit finished', { taskId, agentId });

    const result = await this.taskEngineAdapter.finishVisit(
      taskId,
      agentId,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'task',
      entityId: taskId,
      action: 'finish_visit',
      userId: agentId,
    });

    return result;
  }

  async getOptimizedRoute(agentId: string, options: ListTasksOptions): Promise<unknown> {
    return this.taskEngineAdapter.getOptimizedRoute(agentId, options);
  }
}

