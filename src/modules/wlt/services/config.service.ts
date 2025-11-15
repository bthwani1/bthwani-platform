import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { RuntimeConfigRepository } from '../repositories/runtime-config.repository';
import { RuntimeConfigEntity, ConfigScope, ConfigStatus } from '../entities/runtime-config.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';

export interface GetConfigRequest {
  key: string;
  scope?: ConfigScope;
  scopeValue?: string;
}

export interface UpdateConfigRequest {
  key: string;
  scope: ConfigScope;
  scopeValue?: string;
  value: string;
  userId: string;
  preview?: boolean;
}

@Injectable()
export class ConfigService {
  constructor(
    private readonly nestConfigService: NestConfigService,
    private readonly runtimeConfigRepository: RuntimeConfigRepository,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async getConfig(request: GetConfigRequest): Promise<RuntimeConfigEntity | null> {
    const { key, scope, scopeValue } = request;

    if (scope && scopeValue) {
      return this.runtimeConfigRepository.findByKey(key, scope, scopeValue);
    }

    const published = await this.runtimeConfigRepository.findPublished(key);
    if (published.length === 0) {
      return null;
    }

    return published[0] || null;
  }

  async updateConfig(request: UpdateConfigRequest): Promise<RuntimeConfigEntity> {
    const { key, scope, scopeValue, value, userId, preview = false } = request;

    const existing = preview
      ? await this.runtimeConfigRepository.findDraft(key)
      : await this.runtimeConfigRepository.findByKey(key, scope, scopeValue);

    if (existing) {
      if (preview && existing.status === ConfigStatus.DRAFT) {
        existing.value = value;
        existing.updated_at = new Date();
        await this.runtimeConfigRepository.update(existing);
        return existing;
      }

      if (!preview && existing.status === ConfigStatus.PUBLISHED) {
        const draft = new RuntimeConfigEntity();
        draft.key = key;
        draft.scope = scope;
        if (scopeValue !== undefined) {
          draft.scope_value = scopeValue;
        }
        draft.value = value;
        draft.status = ConfigStatus.DRAFT;
        draft.previous_value = existing.value;
        await this.runtimeConfigRepository.create(draft);
        return draft;
      }
    }

    const config = new RuntimeConfigEntity();
    config.key = key;
    config.scope = scope;
    if (scopeValue !== undefined) {
      config.scope_value = scopeValue;
    }
    config.value = value;
    config.status = preview ? ConfigStatus.DRAFT : ConfigStatus.PUBLISHED;

    if (!preview) {
      config.published_by = userId;
      config.published_at = new Date();
    }

    const created = await this.runtimeConfigRepository.create(config);

    const auditParams: {
      configId: string;
      key: string;
      scope: string;
      newValue: string;
      userId: string;
      previousValue?: string;
      isPreview?: boolean;
    } = {
      configId: created.id,
      key,
      scope,
      newValue: value,
      userId,
      isPreview: preview,
    };
    if (existing?.value !== undefined) {
      auditParams.previousValue = existing.value;
    }
    await this.auditLogger.logConfigUpdate(auditParams);

    this.logger.log('Config updated', {
      configId: created.id,
      key,
      scope,
      preview,
    });

    return created;
  }

  async publishConfig(key: string, userId: string): Promise<RuntimeConfigEntity> {
    const draft = await this.runtimeConfigRepository.findDraft(key);
    if (!draft) {
      throw new NotFoundException(`Draft config not found: ${key}`);
    }

    const existing = await this.runtimeConfigRepository.findByKey(
      key,
      draft.scope,
      draft.scope_value,
    );
    if (existing && existing.status === ConfigStatus.PUBLISHED) {
      existing.previous_value = existing.value;
      existing.status = ConfigStatus.ROLLED_BACK;
      existing.rolled_back_by = userId;
      existing.rolled_back_at = new Date();
      await this.runtimeConfigRepository.update(existing);
    }

    draft.status = ConfigStatus.PUBLISHED;
    draft.published_by = userId;
    draft.published_at = new Date();
    await this.runtimeConfigRepository.update(draft);

    await this.auditLogger.logConfigPublish({
      configId: draft.id,
      key,
      userId,
    });

    this.logger.log('Config published', {
      configId: draft.id,
      key,
    });

    return draft;
  }

  async rollbackConfig(key: string, userId: string): Promise<RuntimeConfigEntity> {
    const published = await this.runtimeConfigRepository.findPublished(key);
    if (published.length === 0) {
      throw new NotFoundException(`Published config not found: ${key}`);
    }

    const current = published[0];
    if (!current) {
      throw new NotFoundException(`Published config not found: ${key}`);
    }

    if (current.previous_value) {
      current.value = current.previous_value;
      current.status = ConfigStatus.ROLLED_BACK;
      current.rolled_back_by = userId;
      current.rolled_back_at = new Date();
      await this.runtimeConfigRepository.update(current);

      await this.auditLogger.logConfigRollback({
        configId: current.id,
        key,
        userId,
      });

      this.logger.log('Config rolled back', {
        configId: current.id,
        key,
      });
    }

    return current;
  }
}
