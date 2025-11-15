import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ThwaniRequestRepository } from '../repositories/thwani-request.repository';
import { ThwaniRequestEntity, ThwaniRequestStatus } from '../entities/thwani-request.entity';

export interface ListThwaniRequestsDto {
  status?: ThwaniRequestStatus;
  cursor?: string;
  limit?: number;
}

export interface ThwaniRequestListResult {
  items: ThwaniRequestEntity[];
  nextCursor?: string;
}

/**
 * Thwani Request Query Service
 *
 * Handles queries and listings for instant help requests.
 */
@Injectable()
export class ThwaniRequestQueryService {
  constructor(private readonly requestRepository: ThwaniRequestRepository) {}

  async findRequest(requestId: string, userId: string): Promise<ThwaniRequestEntity> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/thwani/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'THWANI-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;

    if (!isRequester && !isCaptain) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/thwani/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'THWANI-403-UNAUTHORIZED',
        detail: 'You are not authorized to view this request',
      });
    }

    return request;
  }

  async findRequestsByRequester(
    requesterId: string,
    query: ListThwaniRequestsDto,
  ): Promise<ThwaniRequestListResult> {
    const requestOptions: {
      status?: ThwaniRequestStatus;
      cursor?: string;
      limit?: number;
    } = {
      limit: query.limit ? query.limit + 1 : 21,
    };
    if (query.status !== undefined) {
      requestOptions.status = query.status;
    }
    if (query.cursor !== undefined) {
      requestOptions.cursor = query.cursor;
    }
    const requests = await this.requestRepository.findByRequester(requesterId, requestOptions);

    const hasMore = query.limit && requests.length > query.limit;
    const items = hasMore ? requests.slice(0, query.limit) : requests;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async findRequestsByCaptain(
    captainId: string,
    query: ListThwaniRequestsDto,
  ): Promise<ThwaniRequestListResult> {
    const requestOptions: {
      status?: ThwaniRequestStatus;
      cursor?: string;
      limit?: number;
    } = {
      limit: query.limit ? query.limit + 1 : 21,
    };
    if (query.status !== undefined) {
      requestOptions.status = query.status;
    }
    if (query.cursor !== undefined) {
      requestOptions.cursor = query.cursor;
    }
    const requests = await this.requestRepository.findByCaptain(captainId, requestOptions);

    const hasMore = query.limit && requests.length > query.limit;
    const items = hasMore ? requests.slice(0, query.limit) : requests;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async findPendingRequests(query?: {
    categoryId?: string;
    region?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ThwaniRequestListResult> {
    const requests = await this.requestRepository.findPendingRequests({
      categoryId: query?.categoryId,
      region: query?.region,
      cursor: query?.cursor,
      limit: query?.limit ? query.limit + 1 : 21,
    });

    const hasMore = query?.limit && requests.length > query.limit;
    const items = hasMore ? requests.slice(0, query.limit) : requests;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }
}

