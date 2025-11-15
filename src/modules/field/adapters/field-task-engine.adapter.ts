import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';
import { TaskStatus } from '../dto/tasks/list-tasks.dto';

interface ListTasksOptions {
  cursor?: string;
  limit?: number;
  status?: TaskStatus;
  priority?: string;
}

/**
 * Field Task Engine Adapter
 *
 * Adapter for Task & Route Engine service.
 */
@Injectable()
export class FieldTaskEngineAdapter {
  private readonly taskEngineBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.taskEngineBaseUrl =
      this.configService.get<string>('TASK_ENGINE_SERVICE_URL') ||
      'http://localhost:3002';
  }

  async getAssignedZones(agentId: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.taskEngineBaseUrl}/agents/${agentId}/zones`),
      );
      return response.data.zones || [];
    } catch (error) {
      this.logger.error('Task engine adapter: Get zones failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
      });
      return [];
    }
  }

  async listTasks(agentId: string, options: ListTasksOptions): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.taskEngineBaseUrl}/tasks`, {
          params: {
            agent_id: agentId,
            ...options,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Task engine adapter: List tasks failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
      });
      throw error;
    }
  }

  async getTodayTasks(agentId: string, options: ListTasksOptions): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.taskEngineBaseUrl}/tasks/today`, {
          params: {
            agent_id: agentId,
            ...options,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Task engine adapter: Get today tasks failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
      });
      throw error;
    }
  }

  async getTask(taskId: string, agentId: string): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.taskEngineBaseUrl}/tasks/${taskId}`, {
          params: { agent_id: agentId },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Task engine adapter: Get task failed', error instanceof Error ? error.message : 'Unknown error', {
        taskId,
        agentId,
      });
      return null;
    }
  }

  async updateTaskStatus(
    taskId: string,
    agentId: string,
    status: TaskStatus,
    notes?: string,
    idempotencyKey?: string,
  ): Promise<unknown> {
    try {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['idempotency-key'] = idempotencyKey;
      }

      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.taskEngineBaseUrl}/tasks/${taskId}/status`,
          { status, notes },
          { headers, params: { agent_id: agentId } },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Task engine adapter: Update task status failed', error instanceof Error ? error.message : 'Unknown error', {
        taskId,
        agentId,
      });
      throw error;
    }
  }

  async startVisit(
    taskId: string,
    agentId: string,
    visitData: { latitude?: number; longitude?: number; notes?: string },
    idempotencyKey: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.taskEngineBaseUrl}/tasks/${taskId}/visit/start`,
          visitData,
          {
            headers: { 'idempotency-key': idempotencyKey },
            params: { agent_id: agentId },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Task engine adapter: Start visit failed', error instanceof Error ? error.message : 'Unknown error', {
        taskId,
        agentId,
      });
      throw error;
    }
  }

  async finishVisit(
    taskId: string,
    agentId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.taskEngineBaseUrl}/tasks/${taskId}/visit/finish`,
          {},
          {
            headers: { 'idempotency-key': idempotencyKey },
            params: { agent_id: agentId },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Task engine adapter: Finish visit failed', error instanceof Error ? error.message : 'Unknown error', {
        taskId,
        agentId,
      });
      throw error;
    }
  }

  async getOptimizedRoute(agentId: string, options: ListTasksOptions): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.taskEngineBaseUrl}/routes/optimize`, {
          params: {
            agent_id: agentId,
            ...options,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Task engine adapter: Get optimized route failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
      });
      throw error;
    }
  }

  async createFollowupTask(
    partnerId: string,
    agentId: string,
    notes: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.taskEngineBaseUrl}/tasks/followup`, {
          partner_id: partnerId,
          agent_id: agentId,
          notes,
        }),
      );
    } catch (error) {
      this.logger.error('Task engine adapter: Create followup task failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
        agentId,
      });
    }
  }
}

