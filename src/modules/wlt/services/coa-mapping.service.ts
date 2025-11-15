import { Injectable } from '@nestjs/common';
import { EntryCategory } from '../entities/journal-entry.entity';

export interface CoAMapping {
  code: string;
  name: string;
  name_ar: string;
  category: string;
}

@Injectable()
export class CoaMappingService {
  private readonly coaMap: Record<string, CoAMapping> = {
    // Sales
    '4101': {
      code: '4101',
      name: 'DSH Sales Revenue',
      name_ar: 'إيرادات مبيعات التوصيل',
      category: 'sale',
    },
    '4102': {
      code: '4102',
      name: 'ARB Sales Revenue',
      name_ar: 'إيرادات مبيعات الحجوزات',
      category: 'sale',
    },
    '4100': {
      code: '4100',
      name: 'General Sales Revenue',
      name_ar: 'إيرادات المبيعات العامة',
      category: 'sale',
    },
    // Commissions
    '4200': {
      code: '4200',
      name: 'Platform Commission',
      name_ar: 'عمولة المنصة',
      category: 'commission',
    },
    '4201': {
      code: '4201',
      name: 'Subscription Fee',
      name_ar: 'رسوم الاشتراك',
      category: 'subscription_fee',
    },
    // Settlements
    '2001': {
      code: '2001',
      name: 'Settlement Receivable',
      name_ar: 'مستحقات التسوية',
      category: 'settlement',
    },
    // Refunds
    '2002': {
      code: '2002',
      name: 'Refund Payable',
      name_ar: 'مستحقات الاسترجاع',
      category: 'refund',
    },
    // Revenue
    '5001': {
      code: '5001',
      name: 'Platform Revenue',
      name_ar: 'إيرادات المنصة',
      category: 'revenue',
    },
  };

  getCoACode(category: EntryCategory, serviceRef?: string): string | null {
    if (category === EntryCategory.SALE) {
      if (serviceRef === 'DSH') {
        return '4101';
      } else if (serviceRef === 'ARB') {
        return '4102';
      }
      return '4100';
    }

    if (category === EntryCategory.COMMISSION) {
      return '4200';
    }

    if (category === EntryCategory.SUBSCRIPTION_FEE) {
      return '4201';
    }

    if (category === EntryCategory.SETTLEMENT) {
      return '2001';
    }

    if (category === EntryCategory.REFUND) {
      return '2002';
    }

    if (category === EntryCategory.REVENUE) {
      return '5001';
    }

    return null;
  }

  getCoAMapping(code: string): CoAMapping | null {
    return this.coaMap[code] || null;
  }

  getCoAMappingByCategory(
    category: EntryCategory,
    serviceRef?: string,
  ): CoAMapping | null {
    const code = this.getCoACode(category, serviceRef);
    if (!code) {
      return null;
    }
    return this.getCoAMapping(code);
  }
}

