import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnifiedSearchService } from '../services/unified-search.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../core/strategies/jwt.strategy';

export class SearchQueryDto {
  q: string;
  service?: 'dsh' | 'knz' | 'arb' | 'amn' | 'kwd' | 'all';
  category?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  tags?: string[];
  limit?: number;
  cursor?: string;
}

export class SuggestionsQueryDto {
  q: string;
  region?: string;
  city?: string;
  service?: 'dsh' | 'knz' | 'arb' | 'all';
}

/**
 * Unified Search Controller
 *
 * Provides unified search endpoints across all services
 */
@ApiTags('APP-USER')
@Controller('api/search')
@UseGuards(JwtAuthGuard)
export class UnifiedSearchController {
  constructor(private readonly searchService: UnifiedSearchService) {}

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions (Typeahead)' })
  @ApiResponse({ status: 200, description: 'Suggestions returned' })
  async getSuggestions(
    @Query() query: SuggestionsQueryDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.searchService.getSuggestions(query.q, {
      region: query.region,
      city: query.city,
      service: query.service,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Perform unified search' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async search(@Query() query: SearchQueryDto, @CurrentUser() user?: JwtPayload) {
    return this.searchService.search({
      q: query.q,
      service: query.service,
      category: query.category,
      region: query.region,
      city: query.city,
      lat: query.lat,
      lon: query.lon,
      tags: query.tags,
      limit: query.limit,
      cursor: query.cursor,
    });
  }

  @Post('voice')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search using voice input' })
  @ApiResponse({ status: 200, description: 'Voice converted to text and searched' })
  async voiceSearch(
    @Body() body: { audio: string }, // Base64 encoded audio
    @Query() query: Omit<SearchQueryDto, 'q'>,
    @CurrentUser() user?: JwtPayload,
  ) {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(body.audio, 'base64');

    // Convert voice to text
    const text = await this.searchService.voiceToText(audioBuffer);

    // Perform search with converted text
    return this.searchService.search({
      q: text,
      ...query,
    });
  }

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search using image input' })
  @ApiResponse({ status: 200, description: 'Image converted to tags and searched' })
  async imageSearch(
    @Body() body: { image: string }, // Base64 encoded image
    @Query() query: Omit<SearchQueryDto, 'q'>,
    @CurrentUser() user?: JwtPayload,
  ) {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(body.image, 'base64');

    // Extract tags from image
    const tags = await this.searchService.imageToTags(imageBuffer);

    // Perform search with extracted tags
    // For now, join tags as search query
    const searchQuery = tags.join(' ');

    return this.searchService.search({
      q: searchQuery,
      ...query,
      tags,
    });
  }
}

