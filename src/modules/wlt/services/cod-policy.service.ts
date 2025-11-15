import { Injectable } from '@nestjs/common';
import { ConfigService } from './config.service';
import { AccountRepository } from '../repositories/account.repository';
import { AccountType } from '../entities/account.entity';
import { LoggerService } from '../../../core/services/logger.service';

export interface CodLimitsResponse {
  captainId: string;
  codCap: number;
  floatMin: number;
  coverageRatio: number;
  currentExposure?: number;
  availableCapacity?: number;
}

@Injectable()
export class CodPolicyService {
  constructor(
    private readonly configService: ConfigService,
    private readonly accountRepository: AccountRepository,
    private readonly logger: LoggerService,
  ) {}

  async getCodLimits(
    captainId: string,
    cityId?: string,
    serviceRef?: string,
  ): Promise<CodLimitsResponse> {
    const codCap = await this.getConfigValue('VAR_RIDER_COD_CAP', cityId, serviceRef, 100000);
    const floatMin = await this.getConfigValue('VAR_COD_FLOAT_MIN', cityId, serviceRef, 50000);
    const coverageRatio = await this.getConfigValue(
      'VAR_COD_COVERAGE_RATIO',
      cityId,
      serviceRef,
      0.8,
    );

    const account = await this.accountRepository.findByOwnerAndType(captainId, AccountType.CAPTAIN);
    const currentExposure = account ? await this.computeExposure(account.id) : 0;
    const availableCapacity = codCap - currentExposure;

    return {
      captainId,
      codCap,
      floatMin,
      coverageRatio,
      currentExposure,
      availableCapacity,
    };
  }

  private async getConfigValue(
    key: string,
    cityId?: string,
    serviceRef?: string,
    defaultValue: number = 0,
  ): Promise<number> {
    let config = await this.configService.getConfig({ key });
    if (!config) {
      return defaultValue;
    }

    if (serviceRef) {
      const serviceConfig = await this.configService.getConfig({
        key,
        scope: 'service' as any,
        scopeValue: serviceRef,
      });
      if (serviceConfig) {
        config = serviceConfig;
      }
    }

    if (cityId) {
      const cityConfig = await this.configService.getConfig({
        key,
        scope: 'city' as any,
        scopeValue: cityId,
      });
      if (cityConfig) {
        config = cityConfig;
      }
    }

    return parseFloat(config.value) || defaultValue;
  }

  private async computeExposure(accountId: string): Promise<number> {
    return 0;
  }
}
