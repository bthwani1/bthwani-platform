import { Injectable, BadRequestException } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { AccountRepository } from '../repositories/account.repository';
import { AccountType } from '../entities/account.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';
import { OpaGuardService } from './opa-guard.service';

export interface ExportStatementRequest {
  accountIds?: string[];
  accountType?: AccountType;
  dateFrom: Date;
  dateTo: Date;
  privacyLevel?: 'masked' | 'unmasked';
  userId: string;
  userRole: string;
}

export interface ExportStatementResponse {
  exportId: string;
  signedUrl: string;
  expiresAt: Date;
  privacyLevel: string;
}

@Injectable()
export class ExportService {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly accountRepository: AccountRepository,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
    private readonly opaGuard: OpaGuardService,
  ) {}

  async exportStatement(request: ExportStatementRequest): Promise<ExportStatementResponse> {
    const {
      accountIds,
      accountType,
      dateFrom,
      dateTo,
      privacyLevel = 'masked',
      userId,
      userRole,
    } = request;

    const canExportUnmasked = await this.opaGuard.canExportUnmasked(userId, userRole);
    if (privacyLevel === 'unmasked' && !canExportUnmasked) {
      throw new BadRequestException('Unmasked export not allowed for this role');
    }

    const effectivePrivacyLevel =
      privacyLevel === 'unmasked' && canExportUnmasked ? 'unmasked' : 'masked';

    let accounts: string[] = [];
    if (accountIds !== undefined && accountIds.length > 0) {
      accounts = accountIds;
    }

    if (accountType !== undefined && accounts.length === 0) {
      const typeAccounts = await this.accountRepository.findByType(accountType, { limit: 1000 });
      accounts = typeAccounts.map((a) => a.id);
    }

    if (accounts.length === 0) {
      throw new BadRequestException('No accounts specified for export');
    }

    const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const statements = await Promise.all(
      accounts.map((accountId) =>
        this.balanceService.getStatement(accountId, dateFrom, dateTo, effectivePrivacyLevel),
      ),
    );

    const exportData = {
      exportId,
      accounts: statements,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      privacyLevel: effectivePrivacyLevel,
      exportedAt: new Date().toISOString(),
      exportedBy: userId,
    };

    const signedUrl = await this.generateSignedUrl(exportId, exportData);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.auditLogger.logExport({
      exportId,
      accountIds: accounts,
      privacyLevel: effectivePrivacyLevel,
      userId,
    });

    this.logger.log('Statement exported', {
      exportId,
      accountCount: accounts.length,
      privacyLevel: effectivePrivacyLevel,
    });

    return {
      exportId,
      signedUrl,
      expiresAt,
      privacyLevel: effectivePrivacyLevel,
    };
  }

  private async generateSignedUrl(exportId: string, exportData: unknown): Promise<string> {
    return `https://exports.bthwani.com/wlt/${exportId}?token=${exportId}`;
  }
}
