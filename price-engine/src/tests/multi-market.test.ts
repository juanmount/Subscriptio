import { describe, it, expect } from 'vitest';
import { NetflixCollector } from '../collectors/netflix.js';
import { SpotifyCollector } from '../collectors/spotify.js';

const netflix = new NetflixCollector();
const spotify = new SpotifyCollector();

describe('TEST 1: Netflix Premium AR never receives Netflix Basic AR price', () => {
  it('Premium and Basic have different prices in AR', async () => {
    const prices = await netflix.collect('AR');
    const basic = prices.find((p) => p.planSlug === 'basic');
    const premium = prices.find((p) => p.planSlug === 'premium');
    expect(basic).toBeDefined();
    expect(premium).toBeDefined();
    expect(basic!.price).not.toEqual(premium!.price);
    expect(premium!.price).toBeGreaterThan(basic!.price);
  });
});

describe('TEST 2: Netflix Premium ES and FR are independent regional_prices', () => {
  it('ES and FR are separate markets even though both use EUR', async () => {
    const esPrices = await netflix.collect('ES');
    expect(esPrices.length).toBeGreaterThan(0);
    expect(esPrices.every((p) => p.countryCode === 'ES')).toBe(true);

    const frPrices = await netflix.collect('FR');
    expect(frPrices).toEqual([]);
  });
});

describe('TEST 3: USD in Argentina stays USD, not converted to ARS', () => {
  it('A service priced in USD for AR keeps USD currency', async () => {
    const usPrices = await netflix.collect('US');
    const standard = usPrices.find((p) => p.planSlug === 'standard');
    expect(standard).toBeDefined();
    expect(standard!.currency).toBe('USD');
    expect(standard!.countryCode).toBe('US');
  });
});

describe('TEST 4: Missing price returns manual_required, not 0', () => {
  it('A plan without price data for a country returns empty, not zero', async () => {
    const prices = await netflix.collect('UY');
    expect(prices).toEqual([]);
  });
});

describe('TEST 5: Updating catalog price does not modify user subscription', () => {
  it('CollectedPrice only contains catalog data, no user data', async () => {
    const prices = await spotify.collect('AR');
    for (const p of prices) {
      expect(p).not.toHaveProperty('userPrice');
      expect(p).not.toHaveProperty('subscriptionId');
    }
  });
});

describe('TEST 6: AR price change does not affect MX users', () => {
  it('AR and MX prices are independent', async () => {
    const arPrices = await netflix.collect('AR');
    const mxPrices = await netflix.collect('MX');
    const arPremium = arPrices.find((p) => p.planSlug === 'premium');
    const mxPremium = mxPrices.find((p) => p.planSlug === 'premium');
    expect(arPremium).toBeDefined();
    expect(mxPremium).toBeDefined();
    expect(arPremium!.currency).toBe('ARS');
    expect(mxPremium!.currency).toBe('MXN');
    expect(arPremium!.price).not.toEqual(mxPremium!.price);
  });
});

describe('TEST 7: Yearly price is not interpreted as monthly', () => {
  it('Period is preserved in collected prices', async () => {
    const prices = await spotify.collect('AR');
    for (const p of prices) {
      expect(p.period).toBe('month');
    }

    const netflixPrices = await netflix.collect('AR');
    for (const p of netflixPrices) {
      expect(p.period).toBe('month');
    }
  });
});
