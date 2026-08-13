import {
  monthlyEquivalent,
  annualProjection,
  totalMonthly,
  totalAnnual,
  countActiveSubscriptions,
  groupByCategory,
  groupByCard,
  upcomingRenewals,
} from '@/domain/finance';
import type { Subscription } from '@/domain/types';

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 1,
    providerId: null,
    customName: 'Test',
    planId: null,
    customPlanName: null,
    confirmedPriceMinor: 1000,
    currencyCode: 'USD',
    convertedPriceMinor: null,
    convertedCurrencyCode: null,
    exchangeRate: null,
    exchangeRateDate: null,
    exchangeRateSource: null,
    frequency: 'monthly',
    nextRenewalDate: null,
    startDate: null,
    categoryId: null,
    cardId: null,
    creditsIncluded: null,
    dataOrigin: 'manual',
    isActive: true,
    notes: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('finance', () => {
  describe('monthlyEquivalent', () => {
    it('monthly returns same value', () => {
      expect(monthlyEquivalent(1000, 'monthly')).toBe(1000);
    });

    it('yearly divides by 12', () => {
      expect(monthlyEquivalent(12000, 'yearly')).toBe(1000);
    });

    it('quarterly divides by 3', () => {
      expect(monthlyEquivalent(3000, 'quarterly')).toBe(1000);
    });

    it('semiannual divides by 6', () => {
      expect(monthlyEquivalent(6000, 'semiannual')).toBe(1000);
    });
  });

  describe('annualProjection', () => {
    it('monthly multiplied by 12', () => {
      expect(annualProjection(1000, 'monthly')).toBe(12000);
    });

    it('yearly returns same value', () => {
      expect(annualProjection(12000, 'yearly')).toBe(12000);
    });
  });

  describe('totalMonthly', () => {
    it('sums active subscriptions', () => {
      const subs = [
        makeSub({ id: 1, confirmedPriceMinor: 1000, frequency: 'monthly' }),
        makeSub({ id: 2, confirmedPriceMinor: 12000, frequency: 'yearly' }),
      ];
      expect(totalMonthly(subs)).toBe(2000);
    });

    it('ignores inactive subscriptions', () => {
      const subs = [
        makeSub({ id: 1, confirmedPriceMinor: 1000, isActive: true }),
        makeSub({ id: 2, confirmedPriceMinor: 2000, isActive: false }),
      ];
      expect(totalMonthly(subs)).toBe(1000);
    });

    it('empty array returns 0', () => {
      expect(totalMonthly([])).toBe(0);
    });
  });

  describe('totalAnnual', () => {
    it('sums annual projections', () => {
      const subs = [
        makeSub({ id: 1, confirmedPriceMinor: 1000, frequency: 'monthly' }),
        makeSub({ id: 2, confirmedPriceMinor: 12000, frequency: 'yearly' }),
      ];
      expect(totalAnnual(subs)).toBe(24000);
    });
  });

  describe('countActiveSubscriptions', () => {
    it('counts only active', () => {
      const subs = [
        makeSub({ id: 1, isActive: true }),
        makeSub({ id: 2, isActive: true }),
        makeSub({ id: 3, isActive: false }),
      ];
      expect(countActiveSubscriptions(subs)).toBe(2);
    });
  });

  describe('groupByCategory', () => {
    it('groups by category id', () => {
      const subs = [
        makeSub({ id: 1, categoryId: 1, confirmedPriceMinor: 1000 }),
        makeSub({ id: 2, categoryId: 1, confirmedPriceMinor: 2000 }),
        makeSub({ id: 3, categoryId: 2, confirmedPriceMinor: 500 }),
      ];
      const categories = new Map([
        [1, 'Streaming'],
        [2, 'Productividad'],
      ]);
      const result = groupByCategory(subs, categories);
      expect(result.get(1)?.totalMinor).toBe(3000);
      expect(result.get(1)?.count).toBe(2);
      expect(result.get(2)?.totalMinor).toBe(500);
      expect(result.get(2)?.count).toBe(1);
    });

    it('skips subscriptions without category', () => {
      const subs = [makeSub({ id: 1, categoryId: null })];
      const result = groupByCategory(subs, new Map());
      expect(result.size).toBe(0);
    });
  });

  describe('groupByCard', () => {
    it('groups by card id', () => {
      const subs = [
        makeSub({ id: 1, cardId: 1, confirmedPriceMinor: 1000 }),
        makeSub({ id: 2, cardId: 2, confirmedPriceMinor: 2000 }),
      ];
      const cards = new Map([
        [1, 'Visa Galicia'],
        [2, 'Master Naranja'],
      ]);
      const result = groupByCard(subs, cards);
      expect(result.get(1)?.totalMinor).toBe(1000);
      expect(result.get(2)?.totalMinor).toBe(2000);
    });
  });

  describe('upcomingRenewals', () => {
    it('filters within date range', () => {
      const now = Date.now();
      const in3Days = now + 3 * 24 * 60 * 60 * 1000;
      const in30Days = now + 30 * 24 * 60 * 60 * 1000;
      const subs = [
        makeSub({ id: 1, nextRenewalDate: in3Days, isActive: true }),
        makeSub({ id: 2, nextRenewalDate: in30Days, isActive: true }),
        makeSub({ id: 3, nextRenewalDate: now - 1000, isActive: true }),
        makeSub({ id: 4, nextRenewalDate: in3Days, isActive: false }),
      ];
      const result = upcomingRenewals(subs, 7, now);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('sorts by date ascending', () => {
      const now = Date.now();
      const in5Days = now + 5 * 24 * 60 * 60 * 1000;
      const in2Days = now + 2 * 24 * 60 * 60 * 1000;
      const subs = [
        makeSub({ id: 1, nextRenewalDate: in5Days }),
        makeSub({ id: 2, nextRenewalDate: in2Days }),
      ];
      const result = upcomingRenewals(subs, 7, now);
      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(1);
    });
  });
});
