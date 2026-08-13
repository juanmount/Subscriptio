import type { Frequency, Subscription } from './types';

const MONTHS_IN_YEAR = 12;
const MONTHS_IN_QUARTER = 3;
const MONTHS_IN_SEMIANNUAL = 6;
const WEEKS_IN_MONTH = 4.345;

export function frequencyToMonths(frequency: Frequency): number {
  switch (frequency) {
    case 'monthly':
      return 1;
    case 'yearly':
      return MONTHS_IN_YEAR;
    case 'quarterly':
      return MONTHS_IN_QUARTER;
    case 'semiannual':
      return MONTHS_IN_SEMIANNUAL;
    case 'weekly':
      return WEEKS_IN_MONTH;
  }
}

export function monthlyEquivalent(priceMinor: number, frequency: Frequency): number {
  const months = frequencyToMonths(frequency);
  return Math.round(priceMinor / months);
}

export function annualProjection(priceMinor: number, frequency: Frequency): number {
  const monthly = monthlyEquivalent(priceMinor, frequency);
  return monthly * MONTHS_IN_YEAR;
}

export function totalMonthly(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, sub) => {
    if (!sub.isActive) return sum;
    return sum + monthlyEquivalent(sub.confirmedPriceMinor, sub.frequency);
  }, 0);
}

export function totalMonthlyByCurrency(
  subscriptions: Subscription[],
): Map<string, { totalMinor: number; count: number }> {
  const result = new Map<string, { totalMinor: number; count: number }>();
  for (const sub of subscriptions) {
    if (!sub.isActive) continue;
    const monthly = monthlyEquivalent(sub.confirmedPriceMinor, sub.frequency);
    const existing = result.get(sub.currencyCode);
    if (existing) {
      existing.totalMinor += monthly;
      existing.count += 1;
    } else {
      result.set(sub.currencyCode, { totalMinor: monthly, count: 1 });
    }
  }
  return result;
}

export function totalAnnualByCurrency(
  subscriptions: Subscription[],
): Map<string, { totalMinor: number; count: number }> {
  const result = new Map<string, { totalMinor: number; count: number }>();
  for (const sub of subscriptions) {
    if (!sub.isActive) continue;
    const annual = annualProjection(sub.confirmedPriceMinor, sub.frequency);
    const existing = result.get(sub.currencyCode);
    if (existing) {
      existing.totalMinor += annual;
      existing.count += 1;
    } else {
      result.set(sub.currencyCode, { totalMinor: annual, count: 1 });
    }
  }
  return result;
}

export function totalAnnual(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, sub) => {
    if (!sub.isActive) return sum;
    return sum + annualProjection(sub.confirmedPriceMinor, sub.frequency);
  }, 0);
}

export function countActiveSubscriptions(subscriptions: Subscription[]): number {
  return subscriptions.filter((s) => s.isActive).length;
}

export function groupByCategory(
  subscriptions: Subscription[],
  categories: Map<number, string>,
): Map<number, { name: string; totalMinor: number; count: number; currencyCode: string }> {
  const result = new Map<number, { name: string; totalMinor: number; count: number; currencyCode: string }>();
  // track per-category per-currency totals to pick dominant currency
  const currencyTotals = new Map<number, Map<string, number>>();

  for (const sub of subscriptions) {
    if (!sub.isActive) continue;
    const catId = sub.categoryId ?? 0;
    const name = catId === 0 ? 'Sin categoría' : (categories.get(catId) ?? 'Sin categoría');
    const monthly = monthlyEquivalent(sub.confirmedPriceMinor, sub.frequency);

    const existing = result.get(catId);
    if (existing) {
      existing.totalMinor += monthly;
      existing.count += 1;
    } else {
      result.set(catId, { name, totalMinor: monthly, count: 1, currencyCode: sub.currencyCode });
    }

    // track currency totals
    if (!currencyTotals.has(catId)) currencyTotals.set(catId, new Map());
    const ct = currencyTotals.get(catId)!;
    ct.set(sub.currencyCode, (ct.get(sub.currencyCode) ?? 0) + monthly);
  }

  // assign dominant currency per category
  for (const [catId, entry] of result.entries()) {
    const ct = currencyTotals.get(catId);
    if (ct) {
      let maxCurrency = entry.currencyCode;
      let maxAmount = 0;
      for (const [code, amount] of ct.entries()) {
        if (amount > maxAmount) { maxAmount = amount; maxCurrency = code; }
      }
      entry.currencyCode = maxCurrency;
    }
  }

  return result;
}

export function groupByCard(
  subscriptions: Subscription[],
  cards: Map<number, string>,
): Map<number, { name: string; totalMinor: number; count: number }> {
  const result = new Map<number, { name: string; totalMinor: number; count: number }>();
  for (const sub of subscriptions) {
    if (!sub.isActive || sub.cardId === null) continue;
    const existing = result.get(sub.cardId);
    const name = cards.get(sub.cardId) ?? 'Sin tarjeta';
    if (existing) {
      existing.totalMinor += monthlyEquivalent(sub.confirmedPriceMinor, sub.frequency);
      existing.count += 1;
    } else {
      result.set(sub.cardId, {
        name,
        totalMinor: monthlyEquivalent(sub.confirmedPriceMinor, sub.frequency),
        count: 1,
      });
    }
  }
  return result;
}

export function upcomingRenewals(
  subscriptions: Subscription[],
  withinDays: number,
  now: number = Date.now(),
): Subscription[] {
  const maxMs = now + withinDays * 24 * 60 * 60 * 1000;
  return subscriptions
    .filter((s) => s.isActive && s.nextRenewalDate !== null)
    .filter((s) => s.nextRenewalDate! >= now && s.nextRenewalDate! <= maxMs)
    .sort((a, b) => a.nextRenewalDate! - b.nextRenewalDate!);
}
