import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { FavoriteEntity } from '../entities/favorite.entity';

@Injectable()
export class FavoriteRepository {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly repository: EntityRepository<FavoriteEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(favorite: FavoriteEntity): Promise<FavoriteEntity> {
    this.em.persist(favorite);
    await this.em.flush();
    return favorite;
  }

  async findOne(userId: string, listingId: string): Promise<FavoriteEntity | null> {
    return this.repository.findOne({ user_id: userId, listing_id: listingId });
  }

  async findByUser(
    userId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<FavoriteEntity[]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
      populate: ['listing_id'],
    });
  }

  async delete(userId: string, listingId: string): Promise<void> {
    const favorite = await this.repository.findOne({ user_id: userId, listing_id: listingId });
    if (favorite) {
      await this.em.removeAndFlush(favorite);
    }
  }

  async countByListing(listingId: string): Promise<number> {
    return this.repository.count({ listing_id: listingId });
  }

  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    const favorite = await this.repository.findOne({ user_id: userId, listing_id: listingId });
    return favorite !== null;
  }
}
