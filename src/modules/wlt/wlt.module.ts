import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { WltAccountsController } from './controllers/wlt-accounts.controller';
import { WltPaymentsController } from './controllers/wlt-payments.controller';
import { WltSettlementsController } from './controllers/wlt-settlements.controller';
import { WltConfigController } from './controllers/wlt-config.controller';
import { WltSupportController } from './controllers/wlt-support.controller';
import { WltCodController } from './controllers/wlt-cod.controller';
import { WltExportsController } from './controllers/wlt-exports.controller';
import { WltPartnersController } from './controllers/wlt-partners.controller';
import { WltSubscriptionsController } from './controllers/wlt-subscriptions.controller';
import { AccountService } from './services/account.service';
import { SubscriptionService } from './services/subscription.service';
import { CoaMappingService } from './services/coa-mapping.service';
import { LedgerEngine } from './services/ledger-engine.service';
import { TransferService } from './services/transfer.service';
import { HoldService } from './services/hold.service';
import { BalanceService } from './services/balance.service';
import { SettlementService } from './services/settlement.service';
import { ProvidersService } from './services/providers.service';
import { ReconciliationService } from './services/reconciliation.service';
import { CodPolicyService } from './services/cod-policy.service';
import { ConfigService } from './services/config.service';
import { ExportService } from './services/export.service';
import { AuditLoggerService } from './services/audit-logger.service';
import { MetricsAdapterService } from './services/metrics-adapter.service';
import { IdempotencyService } from './services/idempotency.service';
import { OpaGuardService } from './services/opa-guard.service';
import { AccountRepository } from './repositories/account.repository';
import { JournalEntryRepository } from './repositories/journal-entry.repository';
import { HoldRepository } from './repositories/hold.repository';
import { SettlementBatchRepository } from './repositories/settlement-batch.repository';
import { IdempotencyRepository } from './repositories/idempotency.repository';
import { RuntimeConfigRepository } from './repositories/runtime-config.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

@Module({
  imports: [CoreModule, SharedModule],
  controllers: [
    WltAccountsController,
    WltPaymentsController,
    WltSettlementsController,
    WltConfigController,
    WltSupportController,
    WltCodController,
    WltExportsController,
    WltPartnersController,
    WltSubscriptionsController,
  ],
  providers: [
    // Services
    AccountService,
    LedgerEngine,
    TransferService,
    HoldService,
    BalanceService,
    SettlementService,
    ProvidersService,
    ReconciliationService,
    CodPolicyService,
    ConfigService,
    ExportService,
    AuditLoggerService,
    MetricsAdapterService,
    IdempotencyService,
    OpaGuardService,
    SubscriptionService,
    CoaMappingService,
    // Repositories
    AccountRepository,
    JournalEntryRepository,
    HoldRepository,
    SettlementBatchRepository,
    IdempotencyRepository,
    RuntimeConfigRepository,
    AuditLogRepository,
  ],
  exports: [
    AccountService,
    TransferService,
    HoldService,
    BalanceService,
    SettlementService,
    ProvidersService,
    ConfigService,
    LedgerEngine,
    SubscriptionService,
    CoaMappingService,
  ],
})
export class WltModule {}
