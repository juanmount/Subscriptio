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

const SPOTIFY_MARKETS: Record<string, MarketPlan[]> = {
  AR: [
    { slug: 'student', name: 'Student', price: 2299, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/ar/premium/' },
    { slug: 'individual', name: 'Individual', price: 4499, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/ar/premium/' },
    { slug: 'duo', name: 'Duo', price: 5999, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/ar/premium/' },
    { slug: 'family', name: 'Family', price: 7599, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/ar/premium/' },
  ],
  BR: [
    { slug: 'student', name: 'Student', price: 1199, currency: 'BRL', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/br/premium/' },
    { slug: 'individual', name: 'Individual', price: 2199, currency: 'BRL', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/br/premium/' },
    { slug: 'duo', name: 'Duo', price: 2799, currency: 'BRL', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/br/premium/' },
    { slug: 'family', name: 'Family', price: 3499, currency: 'BRL', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/br/premium/' },
  ],
  MX: [
    { slug: 'student', name: 'Student', price: 4900, currency: 'MXN', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/mx/premium/' },
    { slug: 'individual', name: 'Individual', price: 11500, currency: 'MXN', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/mx/premium/' },
    { slug: 'duo', name: 'Duo', price: 14900, currency: 'MXN', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/mx/premium/' },
    { slug: 'family', name: 'Family', price: 17900, currency: 'MXN', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/mx/premium/' },
  ],
  US: [
    { slug: 'student', name: 'Student', price: 599, currency: 'USD', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/us/premium/' },
    { slug: 'individual', name: 'Individual', price: 1199, currency: 'USD', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/us/premium/' },
    { slug: 'duo', name: 'Duo', price: 1699, currency: 'USD', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/us/premium/' },
    { slug: 'family', name: 'Family', price: 1999, currency: 'USD', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/us/premium/' },
  ],
  ES: [
    { slug: 'student', name: 'Student', price: 399, currency: 'EUR', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/es/premium/' },
    { slug: 'individual', name: 'Individual', price: 1099, currency: 'EUR', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/es/premium/' },
    { slug: 'duo', name: 'Duo', price: 1499, currency: 'EUR', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/es/premium/' },
    { slug: 'family', name: 'Family', price: 1799, currency: 'EUR', taxMode: 'tax_excluded', sourceUrl: 'https://www.spotify.com/es/premium/' },
  ],
};

export class SpotifyCollector extends BaseCollector {
  readonly collectorId = 'spotify-manual-v1';
  readonly serviceSlug = 'spotify';
  readonly collectorType = 'manual' as const;

  async collect(countryCode: string): Promise<CollectedPrice[]> {
    const plans = SPOTIFY_MARKETS[countryCode.toUpperCase()];
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
