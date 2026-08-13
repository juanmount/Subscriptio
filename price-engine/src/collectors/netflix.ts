import { BaseCollector } from './base.js';
import type { CollectedPrice } from '../types.js';

interface MarketPlan {
  slug: string;
  name: string;
  price: number;
  currency: string;
  taxMode: CollectedPrice['taxMode'];
  sourceUrl: string;
}

const NETFLIX_MARKETS: Record<string, MarketPlan[]> = {
  AR: [
    { slug: 'basic', name: 'Básico', price: 8999, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/ar/' },
    { slug: 'standard', name: 'Estándar', price: 14999, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/ar/' },
    { slug: 'premium', name: 'Premium', price: 19999, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/ar/' },
  ],
  BR: [
    { slug: 'basic', name: 'Básico', price: 2590, currency: 'BRL', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/br/' },
    { slug: 'standard', name: 'Padrão', price: 3990, currency: 'BRL', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/br/' },
    { slug: 'premium', name: 'Premium', price: 5590, currency: 'BRL', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/br/' },
  ],
  MX: [
    { slug: 'basic', name: 'Básico', price: 13900, currency: 'MXN', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/mx/' },
    { slug: 'standard', name: 'Estándar', price: 21900, currency: 'MXN', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/mx/' },
    { slug: 'premium', name: 'Premium', price: 29900, currency: 'MXN', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/mx/' },
  ],
  US: [
    { slug: 'standard-ads', name: 'Standard with Ads', price: 699, currency: 'USD', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/' },
    { slug: 'standard', name: 'Standard', price: 1554, currency: 'USD', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/' },
    { slug: 'premium', name: 'Premium', price: 2299, currency: 'USD', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/' },
  ],
  ES: [
    { slug: 'standard-ads', name: 'Estándar con anuncios', price: 599, currency: 'EUR', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/es/' },
    { slug: 'standard', name: 'Estándar', price: 1299, currency: 'EUR', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/es/' },
    { slug: 'premium', name: 'Premium', price: 1799, currency: 'EUR', taxMode: 'tax_excluded', sourceUrl: 'https://www.netflix.com/es/' },
  ],
};

export class NetflixCollector extends BaseCollector {
  readonly collectorId = 'netflix-manual-v1';
  readonly serviceSlug = 'netflix';
  readonly collectorType = 'manual' as const;

  async collect(countryCode: string): Promise<CollectedPrice[]> {
    const plans = NETFLIX_MARKETS[countryCode.toUpperCase()];
    if (!plans) return [];

    return plans.map((plan) =>
      this.makePrice(
        plan.slug,
        plan.name,
        countryCode.toUpperCase(),
        plan.price,
        plan.currency,
        'month',
        plan.taxMode,
        plan.sourceUrl,
        'manual_verified',
      ),
    );
  }
}
