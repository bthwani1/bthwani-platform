import { Injectable, NotFoundException } from '@nestjs/common';
import { FieldPartnerOnboardingAdapter } from '../adapters/field-partner-onboarding.adapter';
import { FieldTaskEngineAdapter } from '../adapters/field-task-engine.adapter';
import { LoggerService } from '../../../core/services/logger.service';
import { FieldAuditLogger } from './field-audit-logger.service';
import { CreatePartnerLeadDto } from '../dto/partners/create-partner-lead.dto';
import { UpdatePartnerLeadDto } from '../dto/partners/update-partner-lead.dto';
import { SubmitSiteSurveyDto } from '../dto/partners/submit-site-survey.dto';
import { SubmitKycDocsDto } from '../dto/partners/submit-kyc-docs.dto';
import { SubmitConsentDto } from '../dto/partners/submit-consent.dto';
import { SubmitReadinessDto } from '../dto/partners/submit-readiness.dto';

interface ListPartnersOptions {
  cursor?: string;
  limit?: number;
  status?: string;
  search?: string;
}

/**
 * Field Partners Service
 *
 * Orchestrates partner onboarding flows.
 */
@Injectable()
export class FieldPartnersService {
  constructor(
    private readonly partnerOnboardingAdapter: FieldPartnerOnboardingAdapter,
    private readonly taskEngineAdapter: FieldTaskEngineAdapter,
    private readonly auditLogger: FieldAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async createPartnerLead(
    agentId: string,
    createDto: CreatePartnerLeadDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Partner lead creation', {
      agentId,
      tradeName: createDto.trade_name,
    });

    const partner = await this.partnerOnboardingAdapter.createPartnerLead(
      {
        legal_name: createDto.legal_name,
        trade_name: createDto.trade_name,
        category: createDto.category,
        address: createDto.address,
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        contacts: createDto.contacts,
        ...(createDto.notes !== undefined && { notes: createDto.notes }),
      },
      agentId,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'partner',
      entityId: partner.id,
      action: 'create_lead',
      userId: agentId,
      newValues: {
        trade_name: createDto.trade_name,
        category: createDto.category,
      },
    });

    return partner;
  }

  async updatePartnerLead(
    partnerId: string,
    agentId: string,
    updateDto: UpdatePartnerLeadDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Partner lead update', { partnerId, agentId });

    const updateData: Record<string, unknown> = {};
    if (updateDto.trade_name !== undefined) updateData.trade_name = updateDto.trade_name;
    if (updateDto.category !== undefined) updateData.category = updateDto.category;
    if (updateDto.address !== undefined) updateData.address = updateDto.address;
    if (updateDto.contacts !== undefined) updateData.contacts = updateDto.contacts;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;

    const partner = await this.partnerOnboardingAdapter.updatePartnerLead(
      partnerId,
      updateData,
      agentId,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'partner',
      entityId: partnerId,
      action: 'update_lead',
      userId: agentId,
      newValues: updateData,
    });

    return partner;
  }

  async submitSiteSurvey(
    partnerId: string,
    agentId: string,
    surveyDto: SubmitSiteSurveyDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Site survey submission', { partnerId, agentId });

    const surveyData: {
      verified_address: string;
      latitude: number;
      longitude: number;
      accuracy_meters?: number;
      facility_basics?: string;
      photo_media_ids?: string[];
      notes?: string;
    } = {
      verified_address: surveyDto.verified_address,
      latitude: surveyDto.latitude,
      longitude: surveyDto.longitude,
    };
    if (surveyDto.accuracy_meters !== undefined) surveyData.accuracy_meters = surveyDto.accuracy_meters;
    if (surveyDto.facility_basics !== undefined) surveyData.facility_basics = surveyDto.facility_basics;
    if (surveyDto.photo_media_ids !== undefined) surveyData.photo_media_ids = surveyDto.photo_media_ids;
    if (surveyDto.notes !== undefined) surveyData.notes = surveyDto.notes;

    const result = await this.partnerOnboardingAdapter.submitSiteSurvey(
      partnerId,
      surveyData,
      agentId,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'partner',
      entityId: partnerId,
      action: 'submit_site_survey',
      userId: agentId,
      metadata: {
        latitude: surveyDto.latitude,
        longitude: surveyDto.longitude,
      },
    });

    return result;
  }

  async submitKycDocs(
    partnerId: string,
    agentId: string,
    kycDto: SubmitKycDocsDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('KYC docs submission', { partnerId, agentId });

    const result = await this.partnerOnboardingAdapter.submitKycDocs(
      partnerId,
      kycDto.documents,
      agentId,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'partner',
      entityId: partnerId,
      action: 'submit_kyc_docs',
      userId: agentId,
      metadata: {
        document_count: kycDto.documents.length,
      },
    });

    return result;
  }

  async submitConsent(
    partnerId: string,
    agentId: string,
    consentDto: SubmitConsentDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Consent submission', { partnerId, agentId });

    const consentData: {
      consent_given: boolean;
      signature_media_id?: string;
      terms_version?: string;
    } = {
      consent_given: consentDto.consent_given,
    };
    if (consentDto.signature_media_id !== undefined) consentData.signature_media_id = consentDto.signature_media_id;
    if (consentDto.terms_version !== undefined) consentData.terms_version = consentDto.terms_version;

    const result = await this.partnerOnboardingAdapter.submitConsent(
      partnerId,
      consentData,
      agentId,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'partner',
      entityId: partnerId,
      action: 'submit_consent',
      userId: agentId,
      metadata: {
        consent_given: consentDto.consent_given,
      },
    });

    return result;
  }

  async submitReadiness(
    partnerId: string,
    agentId: string,
    readinessDto: SubmitReadinessDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Readiness submission', { partnerId, agentId });

    const readinessData: {
      checks: Array<{ item_id: string; passed: boolean; notes?: string }>;
      status: 'ready' | 'needs_followup';
      followup_notes?: string;
    } = {
      checks: readinessDto.checks.map((c) => ({
        item_id: c.item_id,
        passed: c.passed,
        ...(c.notes !== undefined && { notes: c.notes }),
      })),
      status: readinessDto.status,
    };
    if (readinessDto.followup_notes !== undefined) readinessData.followup_notes = readinessDto.followup_notes;

    const result = await this.partnerOnboardingAdapter.submitReadiness(
      partnerId,
      readinessData,
      agentId,
      idempotencyKey,
    );

    if (readinessDto.status === 'needs_followup' && readinessDto.followup_notes) {
      await this.taskEngineAdapter.createFollowupTask(
        partnerId,
        agentId,
        readinessDto.followup_notes,
      );
    }

    await this.auditLogger.log({
      entityType: 'partner',
      entityId: partnerId,
      action: 'submit_readiness',
      userId: agentId,
      metadata: {
        status: readinessDto.status,
      },
    });

    return result;
  }

  async listPartners(agentId: string, options: ListPartnersOptions): Promise<unknown> {
    return this.partnerOnboardingAdapter.listPartners(agentId, options);
  }

  async getPartner(partnerId: string, agentId: string): Promise<unknown> {
    const partner = await this.partnerOnboardingAdapter.getPartner(partnerId, agentId);

    if (!partner) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/field/partner_not_found',
        title: 'Partner Not Found',
        status: 404,
        code: 'FIELD-404-PARTNER-NOT-FOUND',
        detail: `Partner ${partnerId} not found`,
      });
    }

    return partner;
  }

  async createUnplannedVisit(
    partnerId: string,
    agentId: string,
    visitDto: { notes?: string; purpose: string },
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Unplanned visit creation', { partnerId, agentId });

    const visitData: {
      agent_id: string;
      purpose: string;
      notes?: string;
    } = {
      agent_id: agentId,
      purpose: visitDto.purpose,
    };
    if (visitDto.notes !== undefined) visitData.notes = visitDto.notes;

    const result = await this.partnerOnboardingAdapter.createUnplannedVisit(
      partnerId,
      visitData,
      idempotencyKey,
    );

    await this.auditLogger.log({
      entityType: 'partner',
      entityId: partnerId,
      action: 'create_unplanned_visit',
      userId: agentId,
      metadata: {
        purpose: visitDto.purpose,
      },
    });

    return result;
  }
}

