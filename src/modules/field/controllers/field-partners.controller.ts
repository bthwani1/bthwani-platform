import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FieldPartnersService } from '../services/field-partners.service';
import { CreatePartnerLeadDto } from '../dto/partners/create-partner-lead.dto';
import { UpdatePartnerLeadDto } from '../dto/partners/update-partner-lead.dto';
import { SubmitSiteSurveyDto } from '../dto/partners/submit-site-survey.dto';
import { SubmitKycDocsDto } from '../dto/partners/submit-kyc-docs.dto';
import { SubmitConsentDto } from '../dto/partners/submit-consent.dto';
import { SubmitReadinessDto } from '../dto/partners/submit-readiness.dto';
import { GetPartnerDto } from '../dto/partners/get-partner.dto';
import { ListPartnersDto } from '../dto/partners/list-partners.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { RateLimit } from '../../../core/guards/rate-limit.guard';

/**
 * Field Partners Controller
 *
 * Handles partner onboarding flows:
 * - Lead capture
 * - Site survey
 * - KYC/document collection
 * - Consent/contract acknowledgment
 * - Readiness checklist
 * - Partner profile viewing
 */
@Controller('field/partners')
export class FieldPartnersController {
  constructor(private readonly partnersService: FieldPartnersService) {}

  @Post('leads')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ ttl: 60, limit: 10 })
  async createPartnerLead(
    @Body() createDto: CreatePartnerLeadDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.createPartnerLead(
      user.sub,
      createDto,
      idempotencyKey,
    );
  }

  @Patch('leads/:partner_id')
  @HttpCode(HttpStatus.OK)
  async updatePartnerLead(
    @Param() params: GetPartnerDto,
    @Body() updateDto: UpdatePartnerLeadDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.updatePartnerLead(
      params.partner_id,
      user.sub,
      updateDto,
      idempotencyKey,
    );
  }

  @Post(':partner_id/site-survey')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 5 })
  async submitSiteSurvey(
    @Param() params: GetPartnerDto,
    @Body() surveyDto: SubmitSiteSurveyDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.submitSiteSurvey(
      params.partner_id,
      user.sub,
      surveyDto,
      idempotencyKey,
    );
  }

  @Post(':partner_id/kyc-docs')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 5 })
  async submitKycDocs(
    @Param() params: GetPartnerDto,
    @Body() kycDto: SubmitKycDocsDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.submitKycDocs(
      params.partner_id,
      user.sub,
      kycDto,
      idempotencyKey,
    );
  }

  @Post(':partner_id/consent')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 3 })
  async submitConsent(
    @Param() params: GetPartnerDto,
    @Body() consentDto: SubmitConsentDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.submitConsent(
      params.partner_id,
      user.sub,
      consentDto,
      idempotencyKey,
    );
  }

  @Post(':partner_id/readiness')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ ttl: 60, limit: 3 })
  async submitReadiness(
    @Param() params: GetPartnerDto,
    @Body() readinessDto: SubmitReadinessDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.submitReadiness(
      params.partner_id,
      user.sub,
      readinessDto,
      idempotencyKey,
    );
  }

  @Get()
  async listPartners(
    @Query() query: ListPartnersDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.listPartners(user.sub, {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.limit !== undefined && { limit: query.limit }),
      ...(query.status !== undefined && { status: query.status }),
      ...(query.search !== undefined && { search: query.search }),
    });
  }

  @Get(':partner_id')
  async getPartner(
    @Param() params: GetPartnerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.getPartner(params.partner_id, user.sub);
  }

  @Post(':partner_id/visits')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ ttl: 60, limit: 5 })
  async createUnplannedVisit(
    @Param() params: GetPartnerDto,
    @Body() visitDto: { notes?: string; purpose: string },
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.partnersService.createUnplannedVisit(
      params.partner_id,
      user.sub,
      visitDto,
      idempotencyKey,
    );
  }
}

