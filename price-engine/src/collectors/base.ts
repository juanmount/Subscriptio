import type { CollectedPrice, CollectorType } from '../types.js';

export interface PriceCollector {
  readonly collectorId: string;
  readonly serviceSlug: string;
  readonly collectorType: CollectorType;

  collect(countryCode: string): Promise<CollectedPrice[]>;
}

export abstract class BaseCollector implements PriceCollector {
  abstract readonly collectorId: string;
  abstract readonly serviceSlug: string;
  abstract readonly collectorType: CollectorType;

  abstract collect(countryCode: string): Promise<CollectedPrice[]>;

  protected makePrice(
    planSlug: string,
    planName: string,
    countryCode: string,
    price: number,
    currency: string,
    period: 'month' | 'year',
    taxMode: CollectedPrice['taxMode'],
    sourceUrl: string,
    sourceType: CollectedPrice['sourceType'],
  ): CollectedPrice {
    return {
      serviceSlug: this.serviceSlug,
      planSlug,
      planName,
      countryCode,
      price,
      currency,
      period,
      taxMode,
      sourceUrl,
      sourceType,
      detectedAt: new Date().toISOString(),
    };
  }
}
