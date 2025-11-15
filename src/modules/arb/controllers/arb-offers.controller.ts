import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OfferService } from '../services/offer.service';
import { SearchOffersDto } from '../dto/offers/search-offers.dto';
import { CreateOfferDto } from '../dto/offers/create-offer.dto';
import { UpdateOfferDto } from '../dto/offers/update-offer.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Request } from 'express';

@Controller('api/arb/offers')
export class ArbOffersController {
  constructor(private readonly offerService: OfferService) {}

  @Get()
  async searchOffers(@Query() query: SearchOffersDto): Promise<unknown> {
    return this.offerService.search(query);
  }

  @Get(':offer_id')
  async getOffer(@Param('offer_id') offerId: string): Promise<unknown> {
    return this.offerService.findOne(offerId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createOffer(
    @Body() createDto: CreateOfferDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.offerService.create(user.sub, createDto, idempotencyKey, req);
  }

  @Patch(':offer_id')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async updateOffer(
    @Param('offer_id') offerId: string,
    @Body() updateDto: UpdateOfferDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.offerService.update(offerId, user.sub, updateDto, idempotencyKey, req);
  }
}
