import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OfferRepository } from '../repositories/offer.repository';
import { OfferEntity, OfferStatus, DepositPolicy } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/offers/create-offer.dto';
import { UpdateOfferDto } from '../dto/offers/update-offer.dto';
import { SearchOffersDto } from '../dto/offers/search-offers.dto';
import { LoggerService } from '../../../core/services/logger.service';
import { ArbAuditLogger } from './audit-logger.service';
import { Request } from 'express';

@Injectable()
export class OfferService {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly auditLogger: ArbAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async search(query: SearchOffersDto): Promise<{ items: OfferEntity[]; nextCursor?: string }> {
    const offers = await this.offerRepository.search({
      ...(query.category_id !== undefined && { category_id: query.category_id }),
      ...(query.subcategory_id !== undefined && { subcategory_id: query.subcategory_id }),
      ...(query.region_code !== undefined && { region_code: query.region_code }),
      status: query.status || OfferStatus.ACTIVE,
      ...(query.q !== undefined && { q: query.q }),
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      limit: query.limit ? query.limit + 1 : 21,
    });

    const hasMore = query.limit && offers.length > query.limit;
    const items = hasMore ? offers.slice(0, query.limit) : offers;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async findOne(id: string): Promise<OfferEntity> {
    const offer = await this.offerRepository.findOne(id);
    if (!offer) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/arb/offer_not_found',
        title: 'Offer Not Found',
        status: 404,
        code: 'ARB-404-OFFER-NOT-FOUND',
        detail: `Offer ${id} not found`,
      });
    }
    return offer;
  }

  async create(
    partnerId: string,
    createDto: CreateOfferDto,
    idempotencyKey: string,
    req?: Request,
  ): Promise<OfferEntity> {
    const existing = await this.offerRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }

    const offer = new OfferEntity();
    offer.partner_id = partnerId;
    offer.title_ar = createDto.title_ar;
    offer.title_en = createDto.title_en;
    if (createDto.description_ar !== undefined) {
      offer.description_ar = createDto.description_ar;
    }
    if (createDto.description_en !== undefined) {
      offer.description_en = createDto.description_en;
    }
    offer.images = createDto.images;
    offer.price = {
      amount: createDto.price.amount,
      currency: createDto.price.currency || 'YER',
    };
    offer.deposit_amount = {
      amount: createDto.deposit_amount.amount,
      currency: createDto.deposit_amount.currency || 'YER',
    };
    if (createDto.category_id !== undefined) {
      offer.category_id = createDto.category_id;
    }
    if (createDto.subcategory_id !== undefined) {
      offer.subcategory_id = createDto.subcategory_id;
    }
    if (createDto.region_code !== undefined) {
      offer.region_code = createDto.region_code;
    }
    if (createDto.location !== undefined) {
      offer.location = createDto.location;
    }
    offer.deposit_policy = createDto.deposit_policy || DepositPolicy.FULL_REFUND;
    if (createDto.release_days !== undefined) {
      offer.release_days = createDto.release_days;
    }
    if (createDto.slots !== undefined) {
      offer.slots = createDto.slots;
    }
    if (createDto.calendar_config !== undefined) {
      offer.calendar_config = createDto.calendar_config;
    }
    offer.status = createDto.status || OfferStatus.DRAFT;
    offer.idempotency_key = idempotencyKey;

    if (offer.status === OfferStatus.ACTIVE) {
      offer.published_at = new Date();
    }

    const saved = await this.offerRepository.create(offer);

    await this.auditLogger.log({
      entityType: 'offer',
      entityId: saved.id,
      action: 'create',
      userId: partnerId,
      newValues: {
        title_ar: saved.title_ar,
        title_en: saved.title_en,
        status: saved.status,
      },
      ...(req && { request: req }),
    });

    return saved;
  }

  async update(
    id: string,
    partnerId: string,
    updateDto: UpdateOfferDto,
    idempotencyKey: string,
    req?: Request,
  ): Promise<OfferEntity> {
    const offer = await this.findOne(id);

    if (offer.partner_id !== partnerId) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'ARB-403-UNAUTHORIZED',
        detail: 'You are not authorized to update this offer',
      });
    }

    const oldValues = {
      title_ar: offer.title_ar,
      title_en: offer.title_en,
      status: offer.status,
    };

    if (updateDto.title_ar !== undefined) offer.title_ar = updateDto.title_ar;
    if (updateDto.title_en !== undefined) offer.title_en = updateDto.title_en;
    if (updateDto.description_ar !== undefined) offer.description_ar = updateDto.description_ar;
    if (updateDto.description_en !== undefined) offer.description_en = updateDto.description_en;
    if (updateDto.images !== undefined) offer.images = updateDto.images;
    if (updateDto.price !== undefined) {
      offer.price = {
        amount: updateDto.price.amount,
        currency: updateDto.price.currency || 'YER',
      };
    }
    if (updateDto.deposit_amount !== undefined) {
      offer.deposit_amount = {
        amount: updateDto.deposit_amount.amount,
        currency: updateDto.deposit_amount.currency || 'YER',
      };
    }
    if (updateDto.category_id !== undefined) offer.category_id = updateDto.category_id;
    if (updateDto.subcategory_id !== undefined) offer.subcategory_id = updateDto.subcategory_id;
    if (updateDto.region_code !== undefined) offer.region_code = updateDto.region_code;
    if (updateDto.location !== undefined) offer.location = updateDto.location;
    if (updateDto.deposit_policy !== undefined) offer.deposit_policy = updateDto.deposit_policy;
    if (updateDto.release_days !== undefined) offer.release_days = updateDto.release_days;
    if (updateDto.slots !== undefined) offer.slots = updateDto.slots;
    if (updateDto.calendar_config !== undefined) offer.calendar_config = updateDto.calendar_config;
    if (updateDto.status !== undefined) {
      const oldStatus = offer.status;
      offer.status = updateDto.status;
      if (updateDto.status === OfferStatus.ACTIVE && oldStatus !== OfferStatus.ACTIVE) {
        offer.published_at = new Date();
      }
    }

    offer.idempotency_key = idempotencyKey;

    const updated = await this.offerRepository.update(offer);

    await this.auditLogger.log({
      entityType: 'offer',
      entityId: updated.id,
      action: 'update',
      userId: partnerId,
      oldValues,
      newValues: {
        title_ar: updated.title_ar,
        title_en: updated.title_en,
        status: updated.status,
      },
      ...(req && { request: req }),
    });

    return updated;
  }

  async findByPartner(
    partnerId: string,
    options?: { status?: OfferStatus; cursor?: string; limit?: number },
  ): Promise<{ items: OfferEntity[]; nextCursor?: string }> {
    const offers = await this.offerRepository.findByPartner(partnerId, {
      ...(options?.status !== undefined && { status: options.status }),
      ...(options?.cursor !== undefined && { cursor: options.cursor }),
      limit: options?.limit ? options.limit + 1 : 21,
    });

    const hasMore = options?.limit && offers.length > options.limit;
    const items = hasMore ? offers.slice(0, options.limit) : offers;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }
}
