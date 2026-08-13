export type PriceWatchLog = {
  id: number;
  providerId: number | null;
  providerName: string;
  planName: string | null;
  oldPriceMinor: number | null;
  newPriceMinor: number;
  currencyCode: string;
  frequency: string | null;
  detectedAt: number;
  isRead: boolean;
  createdAt: number;
};

export type NewPriceWatchLog = Omit<PriceWatchLog, 'id' | 'createdAt'> & {
  createdAt?: number;
};

export type PriceChangeDirection = 'increase' | 'decrease' | 'new';

export type PriceAlert = {
  id: number;
  providerName: string;
  planName: string | null;
  oldPriceMinor: number | null;
  newPriceMinor: number;
  currencyCode: string;
  frequency: string | null;
  direction: PriceChangeDirection;
  detectedAt: number;
  isRead: boolean;
};

export function getChangeDirection(
  oldPrice: number | null,
  newPrice: number,
): PriceChangeDirection {
  if (oldPrice === null) return 'new';
  if (newPrice > oldPrice) return 'increase';
  if (newPrice < oldPrice) return 'decrease';
  return 'increase';
}

export function formatPriceChange(
  oldPrice: number | null,
  newPrice: number,
  currencyCode: string,
): string {
  if (oldPrice === null) return `Nuevo precio detectado`;
  const diff = newPrice - oldPrice;
  const sign = diff > 0 ? '+' : '';
  const absDiff = Math.abs(diff) / 100;
  return `${sign}$${absDiff.toFixed(2)} ${currencyCode}`;
}
