export type Frequency = 'monthly' | 'yearly' | 'weekly' | 'quarterly' | 'semiannual';

export type DataOrigin = 'suggested' | 'manual' | 'screenshot' | 'connected';

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  minorUnit: number;
};

export type Subscription = {
  id: number;
  providerId: number | null;
  customName: string | null;
  planId: number | null;
  customPlanName: string | null;
  confirmedPriceMinor: number;
  currencyCode: string;
  convertedPriceMinor: number | null;
  convertedCurrencyCode: string | null;
  exchangeRate: number | null;
  exchangeRateDate: number | null;
  exchangeRateSource: string | null;
  frequency: Frequency;
  nextRenewalDate: number | null;
  startDate: number | null;
  categoryId: number | null;
  cardId: number | null;
  creditsIncluded: number | null;
  dataOrigin: DataOrigin;
  isActive: boolean;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type Card = {
  id: number;
  alias: string;
  bank: string | null;
  brand: string | null;
  lastFour: string | null;
  closingDay: number | null;
  color: string | null;
  createdAt: number;
};

export type Category = {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
};

export type Provider = {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  pricingUrl: string | null;
  categoryId: number | null;
  isCustom: boolean;
  createdAt: number;
};

export type Plan = {
  id: number;
  providerId: number;
  name: string;
  frequency: Frequency;
  suggestedPriceMinor: number;
  currencyCode: string;
  creditsIncluded: number | null;
  isSuggested: boolean;
  createdAt: number;
};

export type ExtraPurchase = {
  id: number;
  subscriptionId: number;
  description: string;
  amountMinor: number;
  currencyCode: string;
  purchasedAt: number;
  createdAt: number;
};
