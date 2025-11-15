import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { FeeProfileRepository } from '../repositories/fee-profile.repository';
import {
  FeeProfileEntity,
  FeeProfileStatus,
  FeeProfileScope,
} from '../entities/fee-profile.entity';
import { CreateFeeProfileDto } from '../dto/fees/create-fee-profile.dto';
import { UpdateFeeProfileDto } from '../dto/fees/update-fee-profile.dto';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { Request } from 'express';

@Injectable()
export class FeesAdminService {
  constructor(
    private readonly feeProfileRepository: FeeProfileRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createFeeProfile(
    createDto: CreateFeeProfileDto,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<FeeProfileEntity> {
    const existing = await this.feeProfileRepository.findByCode(createDto.code);
    if (existing) {
      throw new ConflictException(`Fee profile with code ${createDto.code} already exists`);
    }

    this.validateScope(createDto);

    const feeProfile = new FeeProfileEntity();
    feeProfile.code = createDto.code;
    feeProfile.name = createDto.name;
    feeProfile.description = createDto.description;
    feeProfile.scope = createDto.scope;
    feeProfile.region_code = createDto.region_code;
    feeProfile.category_id = createDto.category_id;
    feeProfile.subcategory_id = createDto.subcategory_id;
    feeProfile.fee_percentage = createDto.fee_percentage;
    feeProfile.fee_overrides = createDto.fee_overrides?.map((override) => ({
      condition: override.condition,
      fee_percentage: override.fee_percentage,
      effective_from: override.effective_from,
      effective_until: override.effective_until,
    }));
    feeProfile.metadata = createDto.metadata;
    feeProfile.created_by = userId;
    feeProfile.updated_by = userId;

    const saved = await this.feeProfileRepository.create(feeProfile);

    await this.auditLogService.log({
      entityType: AuditEntityType.FEE_PROFILE,
      entityId: saved.id,
      action: AuditAction.CREATE,
      userId,
      userEmail,
      newValues: {
        code: saved.code,
        scope: saved.scope,
        fee_percentage: saved.fee_percentage,
      },
      request,
      reason: 'Fee profile created',
    });

    return saved;
  }

  async updateFeeProfile(
    feeProfileId: string,
    updateDto: UpdateFeeProfileDto,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<FeeProfileEntity> {
    const feeProfile = await this.feeProfileRepository.findOne(feeProfileId);
    if (!feeProfile) {
      throw new NotFoundException(`Fee profile ${feeProfileId} not found`);
    }

    const oldValues = {
      fee_percentage: feeProfile.fee_percentage,
      status: feeProfile.status,
    };

    if (updateDto.name !== undefined) {
      feeProfile.name = updateDto.name;
    }
    if (updateDto.description !== undefined) {
      feeProfile.description = updateDto.description;
    }
    if (updateDto.fee_percentage !== undefined) {
      feeProfile.fee_percentage = updateDto.fee_percentage;
    }
    if (updateDto.fee_overrides !== undefined) {
      feeProfile.fee_overrides = updateDto.fee_overrides.map((override) => ({
        condition: override.condition,
        fee_percentage: override.fee_percentage,
        effective_from: override.effective_from,
        effective_until: override.effective_until,
      }));
    }
    if (updateDto.status !== undefined) {
      feeProfile.status = updateDto.status;
    }
    if (updateDto.metadata !== undefined) {
      feeProfile.metadata = updateDto.metadata;
    }
    feeProfile.updated_by = userId;

    const updated = await this.feeProfileRepository.update(feeProfile);

    await this.auditLogService.log({
      entityType: AuditEntityType.FEE_PROFILE,
      entityId: updated.id,
      action: AuditAction.UPDATE,
      userId,
      userEmail,
      oldValues,
      newValues: {
        fee_percentage: updated.fee_percentage,
        status: updated.status,
      },
      request,
      reason: 'Fee profile updated',
    });

    return updated;
  }

  async getFeeProfile(feeProfileId: string): Promise<FeeProfileEntity> {
    const feeProfile = await this.feeProfileRepository.findOne(feeProfileId);
    if (!feeProfile) {
      throw new NotFoundException(`Fee profile ${feeProfileId} not found`);
    }
    return feeProfile;
  }

  async listFeeProfiles(options?: {
    status?: FeeProfileStatus;
    scope?: FeeProfileScope;
    limit?: number;
    offset?: number;
  }): Promise<FeeProfileEntity[]> {
    return this.feeProfileRepository.findAll(options);
  }

  async findByScope(options: {
    scope: FeeProfileScope;
    region_code?: string;
    category_id?: string;
    subcategory_id?: string;
    status?: FeeProfileStatus;
  }): Promise<FeeProfileEntity[]> {
    return this.feeProfileRepository.findByScope(options);
  }

  private validateScope(dto: CreateFeeProfileDto): void {
    switch (dto.scope) {
      case FeeProfileScope.REGION:
        if (!dto.region_code) {
          throw new ConflictException('region_code is required for region-scoped fee profile');
        }
        break;
      case FeeProfileScope.CATEGORY:
        if (!dto.category_id) {
          throw new ConflictException('category_id is required for category-scoped fee profile');
        }
        break;
      case FeeProfileScope.SUBCATEGORY:
        if (!dto.subcategory_id) {
          throw new ConflictException(
            'subcategory_id is required for subcategory-scoped fee profile',
          );
        }
        break;
      case FeeProfileScope.GLOBAL:
        break;
    }
  }
}
