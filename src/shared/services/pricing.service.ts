import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/services/logger.service';
import { CatalogService } from './catalog.service';

export interface PricingRequest {
  items: Array<{ sku: string; quantity: number }>;
  deliveryAddress?: {
    location?: { lat: number; lon: number };
  };
}

export interface PricingResponse {
  subtotal: { amount: string; currency: string };
  deliveryFee: { amount: string; currency: string };
  tax?: { amount: string; currency: string };
  total: { amount: string; currency: string };
  breakdown: Array<{
    sku: string;
    quantity: number;
    unitPrice: { amount: string; currency: string };
    total: { amount: string; currency: string };
  }>;
}

@Injectable()
export class PricingService {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly logger: LoggerService,
  ) {}

  async calculatePricing(request: PricingRequest): Promise<PricingResponse> {
    this.logger.log('Calculating pricing', {
      itemCount: request.items.length,
    });

    const skus = request.items.map((item) => item.sku);
    const products = await this.catalogService.getProducts(skus);

    let subtotalAmount = 0;
    const breakdown: PricingResponse['breakdown'] = [];

    for (const item of request.items) {
      const product = products.get(item.sku);
      if (!product) {
        throw new Error(`Product ${item.sku} not found in catalog`);
      }

      const unitPrice = parseInt(product.unitPrice.amount);
      const itemTotal = unitPrice * item.quantity;
      subtotalAmount += itemTotal;

      breakdown.push({
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
        total: {
          amount: itemTotal.toString(),
          currency: product.unitPrice.currency,
        },
      });
    }

    // Calculate delivery fee (simplified - should use distance calculation)
    const deliveryFeeAmount = this.calculateDeliveryFee(request.deliveryAddress);

    const totalAmount = subtotalAmount + deliveryFeeAmount;

    return {
      subtotal: {
        amount: subtotalAmount.toString(),
        currency: 'YER',
      },
      deliveryFee: {
        amount: deliveryFeeAmount.toString(),
        currency: 'YER',
      },
      total: {
        amount: totalAmount.toString(),
        currency: 'YER',
      },
      breakdown,
    };
  }

  private calculateDeliveryFee(_deliveryAddress?: PricingRequest['deliveryAddress']): number {
    // TODO: Implement actual distance-based calculation
    // For now, return fixed fee
    return 5000; // 5000 fils = 5 YER
  }
}
