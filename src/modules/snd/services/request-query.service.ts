import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SndRequestRepository } from '../repositories/request.repository';
import {
  SndRequestEntity,
  SndRequestStatus,
  SndRequestType,
  SndRoutingType,
} from '../entities/request.entity';
import { ListRequestsDto } from '../dto/requests/list-requests.dto';

export interface RequestListResult {
  items: SndRequestEntity[];
  nextCursor?: string;
}

@Injectable()
export class SndRequestQueryService {
  constructor(private readonly requestRepository: SndRequestRepository) {}

  async findRequest(requestId: string, userId: string): Promise<SndRequestEntity> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/snd/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'SND-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;
    const isProvider = request.assigned_provider_id === userId;

    if (!isRequester && !isCaptain && !isProvider) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/snd/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'SND-403-UNAUTHORIZED',
        detail: 'You are not authorized to view this request',
      });
    }

    return request;
  }

  async findRequestsByRequester(
    requesterId: string,
    query: ListRequestsDto,
  ): Promise<RequestListResult> {
    const requestOptions: {
      status?: SndRequestStatus;
      type?: SndRequestType;
      cursor?: string;
      limit?: number;
    } = {
      limit: query.limit ? query.limit + 1 : 21,
    };
    if (query.status !== undefined) {
      requestOptions.status = query.status;
    }
    if (query.type !== undefined) {
      requestOptions.type = query.type;
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
    query: ListRequestsDto,
  ): Promise<RequestListResult> {
    const requestOptions: {
      status?: SndRequestStatus;
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

  async findPendingInstantRequests(query: {
    categoryId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<RequestListResult> {
    const requestOptions: {
      categoryId?: string;
      cursor?: string;
      limit?: number;
    } = {
      limit: query.limit ? query.limit + 1 : 21,
    };
    if (query.categoryId !== undefined) {
      requestOptions.categoryId = query.categoryId;
    }
    if (query.cursor !== undefined) {
      requestOptions.cursor = query.cursor;
    }
    const requests = await this.requestRepository.findPendingInstantRequests(requestOptions);

    const hasMore = query.limit && requests.length > query.limit;
    const items = hasMore ? requests.slice(0, query.limit) : requests;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async findSupportCases(
    query: ListRequestsDto & { categoryId?: string },
  ): Promise<RequestListResult> {
    const where: {
      status?: SndRequestStatus;
      type?: SndRequestType;
      categoryId?: string;
    } = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    let requests: SndRequestEntity[];

    if (where.status) {
      const statusOptions: {
        type?: SndRequestType;
        routingType?: SndRoutingType;
        cursor?: string;
        limit?: number;
      } = {
        limit: query.limit ? query.limit + 1 : 21,
      };
      if (where.type !== undefined) {
        statusOptions.type = where.type;
      }
      if (query.cursor !== undefined) {
        statusOptions.cursor = query.cursor;
      }
      requests = await this.requestRepository.findByStatus(where.status, statusOptions);
    } else {
      const requesterOptions: {
        status?: SndRequestStatus;
        type?: SndRequestType;
        cursor?: string;
        limit?: number;
      } = {
        limit: query.limit ? query.limit + 1 : 21,
      };
      if (where.type !== undefined) {
        requesterOptions.type = where.type;
      }
      if (query.cursor !== undefined) {
        requesterOptions.cursor = query.cursor;
      }
      requests = await this.requestRepository.findByRequester('', requesterOptions);
    }

    if (where.categoryId) {
      requests = requests.filter((r) => r.category_id === where.categoryId);
    }

    const hasMore = query.limit && requests.length > query.limit;
    const items = hasMore ? requests.slice(0, query.limit) : requests;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }
}
