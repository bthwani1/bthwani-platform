import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { EsfDonorProfileEntity } from '../entities/esf-donor-profile.entity';
import { BloodType, RhFactor } from '../entities/esf-request.entity';

@Injectable()
export class EsfDonorProfileRepository {
  constructor(
    @InjectRepository(EsfDonorProfileEntity)
    private readonly repository: EntityRepository<EsfDonorProfileEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(profile: EsfDonorProfileEntity): Promise<EsfDonorProfileEntity> {
    this.em.persist(profile);
    await this.em.flush();
    return profile;
  }

  async findOne(id: string): Promise<EsfDonorProfileEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByUserId(userId: string): Promise<EsfDonorProfileEntity | null> {
    return this.repository.findOne({ user_id: userId });
  }

  async findAvailableDonors(
    aboType: BloodType,
    rhFactor: RhFactor,
    city?: string,
    options?: { excludeUserIds?: string[]; limit?: number },
  ): Promise<EsfDonorProfileEntity[]> {
    const where: Record<string, unknown> = {
      is_available: true,
      abo_type: aboType,
      rh_factor: rhFactor,
    };

    if (city) {
      where.city = city;
    }

    if (options?.excludeUserIds && options.excludeUserIds.length > 0) {
      where.user_id = { $nin: options.excludeUserIds };
    }

    const now = new Date();
    const donors = await this.repository.find(where, {
      orderBy: { last_donation_at: 'ASC' },
    });

    const filtered = donors.filter((donor) => {
      if (donor.cooldown_until && donor.cooldown_until > now) {
        return false;
      }
      return true;
    });

    if (options?.limit) {
      return filtered.slice(0, options.limit);
    }

    return filtered;
  }

  async findAvailableDonorsInRadius(
    aboType: BloodType,
    rhFactor: RhFactor,
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    options?: { excludeUserIds?: string[]; limit?: number },
  ): Promise<EsfDonorProfileEntity[]> {
    const where: Record<string, unknown> = {
      is_available: true,
      abo_type: aboType,
      rh_factor: rhFactor,
    };

    if (options?.excludeUserIds && options.excludeUserIds.length > 0) {
      where.user_id = { $nin: options.excludeUserIds };
    }

    const donors = await this.repository.find(where, {
      orderBy: { last_donation_at: 'ASC' },
    });

    const now = new Date();
    const filtered = donors.filter((donor) => {
      if (donor.cooldown_until && donor.cooldown_until > now) {
        return false;
      }
      if (!donor.location) return false;
      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        donor.location.lat,
        donor.location.lon,
      );
      return distance <= radiusKm;
    });

    filtered.sort((a, b) => {
      if (!a.last_donation_at && !b.last_donation_at) return 0;
      if (!a.last_donation_at) return -1;
      if (!b.last_donation_at) return 1;
      return a.last_donation_at.getTime() - b.last_donation_at.getTime();
    });

    if (options?.limit) {
      return filtered.slice(0, options.limit);
    }

    return filtered;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
