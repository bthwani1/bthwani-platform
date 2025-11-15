import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingRepository } from '../repositories/listing.repository';
import { KnzOrderRepository } from '../repositories/knz-order.repository';
import { AbuseReportRepository } from '../repositories/abuse-report.repository';
import { ListingEntity } from '../entities/listing.entity';
import { KnzOrderEntity } from '../entities/knz-order.entity';
import { AbuseReportEntity } from '../entities/abuse-report.entity';
import { ListListingsDto } from '../dto/reporting/list-listings.dto';
import { ListOrdersDto } from '../dto/reporting/list-orders.dto';
import { ListAbuseReportsDto } from '../dto/reporting/list-abuse-reports.dto';
import { GetMetricsDto } from '../dto/reporting/get-metrics.dto';

@Injectable()
export class ReportingQueryService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly orderRepository: KnzOrderRepository,
    private readonly abuseReportRepository: AbuseReportRepository,
  ) {}

  async getListing(listingId: string): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(listingId);
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }
    return listing;
  }

  async listListings(
    query: ListListingsDto,
    userId?: string,
  ): Promise<{
    items: ListingEntity[];
    nextCursor?: string;
  }> {
    const limit = query.limit || 20;
    const listings = await this.listingRepository.findAll({
      status: query.status,
      seller_id: query.seller_id,
      category_id: query.category_id,
      cursor: query.cursor,
      limit: limit + 1,
    });

    const hasMore = listings.length > limit;
    const items = hasMore ? listings.slice(0, limit) : listings;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items: this.maskListingPII(items, userId),
      ...(nextCursor && { nextCursor }),
    };
  }

  async getOrder(orderId: string, userId?: string): Promise<KnzOrderEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return this.maskOrderPII(order, userId);
  }

  async listOrders(
    query: ListOrdersDto,
    userId?: string,
  ): Promise<{
    items: KnzOrderEntity[];
    nextCursor?: string;
  }> {
    const limit = query.limit || 20;
    const orders = await this.orderRepository.findAll({
      status: query.status,
      cursor: query.cursor,
      limit: limit + 1,
    });

    const filteredOrders = query.buyer_id
      ? orders.filter((o) => o.buyer_id === query.buyer_id)
      : query.seller_id
        ? orders.filter((o) => o.seller_id === query.seller_id)
        : query.listing_id
          ? orders.filter((o) => o.listing_id === query.listing_id)
          : orders;

    const hasMore = filteredOrders.length > limit;
    const items = hasMore ? filteredOrders.slice(0, limit) : filteredOrders;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items: items.map((order) => this.maskOrderPII(order, userId)),
      ...(nextCursor && { nextCursor }),
    };
  }

  async getAbuseReport(reportId: string): Promise<AbuseReportEntity> {
    const report = await this.abuseReportRepository.findOne(reportId);
    if (!report) {
      throw new NotFoundException(`Abuse report ${reportId} not found`);
    }
    return this.maskReportPII(report);
  }

  async listAbuseReports(query: ListAbuseReportsDto): Promise<{
    items: AbuseReportEntity[];
    nextCursor?: string;
  }> {
    const limit = query.limit || 20;
    const reports = await this.abuseReportRepository.findAll({
      status: query.status,
      report_type: query.report_type,
      listing_id: query.listing_id,
      cursor: query.cursor,
      limit: limit + 1,
    });

    const hasMore = reports.length > limit;
    const items = hasMore ? reports.slice(0, limit) : reports;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items: items.map((report) => this.maskReportPII(report)),
      ...(nextCursor && { nextCursor }),
    };
  }

  async getMetrics(query?: GetMetricsDto): Promise<{
    active_listings: number;
    pending_review: number;
    flagged: number;
    reports_per_100: number;
    search_ctr?: number;
  }> {
    const metrics = await this.listingRepository.aggregateMetrics();
    const totalListings = metrics.total_listings || 1;
    const allReports = await this.abuseReportRepository.findAll({ limit: 10000 });
    const totalReports = allReports.length;

    const reportsPer100 = totalListings > 0 ? (totalReports / totalListings) * 100 : 0;

    return {
      active_listings: metrics.active_listings,
      pending_review: metrics.pending_review,
      flagged: metrics.flagged,
      reports_per_100: Math.round(reportsPer100 * 100) / 100,
    };
  }

  private maskListingPII(listings: ListingEntity[], userId?: string): ListingEntity[] {
    return listings.map((listing) => {
      if (!userId || userId !== listing.seller_id) {
        const masked = { ...listing };
        return masked;
      }
      return listing;
    });
  }

  private maskOrderPII(order: KnzOrderEntity, userId?: string): KnzOrderEntity {
    if (!userId || (userId !== order.buyer_id && userId !== order.seller_id)) {
      const masked = { ...order };
      if (masked.shipping_address) {
        masked.shipping_address = this.maskAddress(masked.shipping_address);
      }
      return masked;
    }
    return order;
  }

  private maskReportPII(report: AbuseReportEntity): AbuseReportEntity {
    const masked = { ...report };
    if (masked.reporter_email) {
      masked.reporter_email = this.maskEmail(masked.reporter_email);
    }
    return masked;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return '***@***';
    }
    const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***';
    return `${maskedLocal}@${domain}`;
  }

  private maskAddress(address: {
    city?: string;
    district?: string;
    street?: string;
    building?: string;
    unit?: string;
    notes?: string;
    location?: { lat: number; lon: number };
  }): typeof address {
    return {
      ...address,
      street: address.street ? '***' : undefined,
      building: address.building ? '***' : undefined,
      unit: address.unit ? '***' : undefined,
      notes: undefined,
      location: address.location ? { lat: 0, lon: 0 } : undefined,
    };
  }
}
