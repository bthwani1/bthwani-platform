import { Injectable } from '@nestjs/common';
import { EsfDonorProfileRepository } from '../repositories/esf-donor-profile.repository';
import { EsfDonorProfileEntity } from '../entities/esf-donor-profile.entity';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { LoggerService } from '../../../core/services/logger.service';
import { EsfIdentityAdapter } from './esf-identity.adapter';
import { EsfAuditLogger } from './esf-audit-logger.service';

@Injectable()
export class EsfDonorProfileService {
  private readonly cooldownDays: number;

  constructor(
    private readonly donorProfileRepository: EsfDonorProfileRepository,
    private readonly identityAdapter: EsfIdentityAdapter,
    private readonly auditLogger: EsfAuditLogger,
    private readonly logger: LoggerService,
  ) {
    this.cooldownDays = parseInt(process.env.VAR_ESF_DONOR_COOLDOWN_DAYS || '90', 10);
  }

  async getProfile(userId: string): Promise<EsfDonorProfileEntity> {
    let profile = await this.donorProfileRepository.findByUserId(userId);
    if (!profile) {
      profile = new EsfDonorProfileEntity();
      profile.user_id = userId;
      const identityProfile = await this.identityAdapter.getProfile(userId);
      if (identityProfile?.abo_type && identityProfile?.rh_factor) {
        profile.abo_type = identityProfile.abo_type;
        profile.rh_factor = identityProfile.rh_factor;
      }
      profile = await this.donorProfileRepository.create(profile);
    } else {
      const identityProfile = await this.identityAdapter.getProfile(userId);
      if (identityProfile?.abo_type && identityProfile?.rh_factor) {
        if (!profile.abo_type || !profile.rh_factor) {
          profile.abo_type = identityProfile.abo_type;
          profile.rh_factor = identityProfile.rh_factor;
          await this.donorProfileRepository.create(profile);
        }
      }
    }
    return profile;
  }

  async updateAvailability(
    userId: string,
    updateDto: UpdateAvailabilityDto,
    idempotencyKey: string,
  ): Promise<EsfDonorProfileEntity> {
    let profile = await this.donorProfileRepository.findByUserId(userId);
    if (!profile) {
      profile = new EsfDonorProfileEntity();
      profile.user_id = userId;
    }

    const oldValues = {
      is_available: profile.is_available,
      abo_type: profile.abo_type,
      rh_factor: profile.rh_factor,
      city: profile.city,
    };

    if (updateDto.is_available !== undefined) {
      profile.is_available = updateDto.is_available;
    }

    if (updateDto.abo_type !== undefined) {
      profile.abo_type = updateDto.abo_type;
    }

    if (updateDto.rh_factor !== undefined) {
      profile.rh_factor = updateDto.rh_factor;
    }

    if (updateDto.city !== undefined) {
      profile.city = updateDto.city;
    }

    if (updateDto.district !== undefined) {
      profile.district = updateDto.district;
    }

    if (updateDto.location !== undefined) {
      profile.location = updateDto.location;
    }

    if (profile.abo_type && profile.rh_factor) {
      const identityProfile = await this.identityAdapter.getProfile(userId);
      if (identityProfile?.abo_type && identityProfile?.rh_factor) {
        if (
          identityProfile.abo_type !== profile.abo_type ||
          identityProfile.rh_factor !== profile.rh_factor
        ) {
          this.logger.warn('Blood type mismatch with identity service', {
            userId,
            esfProfile: { abo_type: profile.abo_type, rh_factor: profile.rh_factor },
            identityProfile: {
              abo_type: identityProfile.abo_type,
              rh_factor: identityProfile.rh_factor,
            },
          });
        }
      }
    }

    profile = await this.donorProfileRepository.create(profile);

    await this.auditLogger.log({
      entityType: 'donor_profile',
      entityId: profile.id,
      action: 'update_availability',
      userId,
      oldValues,
      newValues: {
        is_available: profile.is_available,
        abo_type: profile.abo_type,
        rh_factor: profile.rh_factor,
        city: profile.city,
      },
    });

    return profile;
  }

  async applyCooldown(userId: string): Promise<void> {
    const profile = await this.donorProfileRepository.findByUserId(userId);
    if (!profile) {
      return;
    }

    profile.is_available = false;
    profile.last_donation_at = new Date();
    const cooldownUntil = new Date();
    cooldownUntil.setDate(cooldownUntil.getDate() + this.cooldownDays);
    profile.cooldown_until = cooldownUntil;
    profile.cooldown_days = this.cooldownDays;

    await this.donorProfileRepository.create(profile);
  }
}
