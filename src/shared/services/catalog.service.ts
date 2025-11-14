import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/services/logger.service';

export interface ProductInfo {
  sku: string;
  name: string;
  unitPrice: { amount: string; currency: string };
  available: boolean;
}

@Injectable()
export class CatalogService {
  constructor(private readonly logger: LoggerService) {}

  async getProduct(sku: string): Promise<ProductInfo | null> {
    // TODO: Implement actual catalog service integration
    // For now, return mock data
    this.logger.log('Fetching product from catalog', { sku });

    // Mock implementation - replace with actual HTTP call to catalog service
    // const response = await this.httpService.get(`${this.catalogApiUrl}/products/${sku}`);

    // Mock product data
    const mockProducts: Record<string, ProductInfo> = {
      'PROD-001': {
        sku: 'PROD-001',
        name: 'Sample Product 1',
        unitPrice: { amount: '10000', currency: 'YER' },
        available: true,
      },
      'PROD-002': {
        sku: 'PROD-002',
        name: 'Sample Product 2',
        unitPrice: { amount: '15000', currency: 'YER' },
        available: true,
      },
    };

    return mockProducts[sku] || null;
  }

  async getProducts(skus: string[]): Promise<Map<string, ProductInfo>> {
    const products = new Map<string, ProductInfo>();
    for (const sku of skus) {
      const product = await this.getProduct(sku);
      if (product) {
        products.set(sku, product);
      }
    }
    return products;
  }

  async validateProducts(skus: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const sku of skus) {
      const product = await this.getProduct(sku);
      if (product && product.available) {
        valid.push(sku);
      } else {
        invalid.push(sku);
      }
    }

    return { valid, invalid };
  }
}
