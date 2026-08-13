import type { PriceCollector } from './base.js';
import { NetflixCollector } from './netflix.js';
import { SpotifyCollector } from './spotify.js';

const collectors: PriceCollector[] = [
  new NetflixCollector(),
  new SpotifyCollector(),
];

const byServiceSlug = new Map<string, PriceCollector>();
for (const c of collectors) {
  byServiceSlug.set(c.serviceSlug, c);
}

export function getCollector(serviceSlug: string): PriceCollector | undefined {
  return byServiceSlug.get(serviceSlug);
}

export function getAllCollectors(): PriceCollector[] {
  return collectors;
}

export function getCollectorsForCountry(countryCode: string): PriceCollector[] {
  return collectors.filter((c) => {
    const prices = c.collect(countryCode);
    return prices;
  });
}
