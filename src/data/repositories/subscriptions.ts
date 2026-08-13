import { supabase, getSupabaseAuthUid } from '@/services/supabaseClient';

export type SubscriptionWithRelations = {
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
  frequency: string;
  nextRenewalDate: number | null;
  startDate: number | null;
  categoryId: number | null;
  cardId: number | null;
  creditsIncluded: number | null;
  dataOrigin: string;
  isActive: boolean;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  provider: {
    id: number;
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    pricingUrl: string | null;
    categoryId: number | null;
    isCustom: boolean;
    createdAt: number;
  } | null;
  category: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  card: {
    id: number;
    alias: string;
    bank: string | null;
    brand: string | null;
    lastFour: string | null;
    closingDay: number | null;
    color: string | null;
    createdAt: number;
  } | null;
  currency: {
    code: string;
    symbol: string;
    name: string;
    minorUnit: number;
  };
};

type RawRow = {
  id: number;
  user_id: string;
  provider_id: number | null;
  custom_name: string | null;
  plan_id: number | null;
  custom_plan_name: string | null;
  confirmed_price_minor: number;
  currency_code: string;
  converted_price_minor: number | null;
  converted_currency_code: string | null;
  exchange_rate: number | null;
  exchange_rate_date: number | null;
  exchange_rate_source: string | null;
  frequency: string;
  next_renewal_date: number | null;
  start_date: number | null;
  category_id: number | null;
  card_id: number | null;
  credits_included: number | null;
  data_origin: string;
  is_active: boolean;
  notes: string | null;
  created_at: number;
  updated_at: number;
  provider: {
    id: number;
    name: string;
    logo_url: string | null;
    website_url: string | null;
    pricing_url: string | null;
    category_id: number | null;
    is_custom: boolean;
    created_at: number;
  } | null;
  category: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  card: {
    id: number;
    user_id: string;
    alias: string;
    bank: string | null;
    brand: string | null;
    last_four: string | null;
    closing_day: number | null;
    color: string | null;
    created_at: number;
  } | null;
  currency: {
    code: string;
    symbol: string;
    name: string;
    minor_unit: number;
  };
};

function toDomain(row: RawRow): SubscriptionWithRelations {
  return {
    id: row.id,
    providerId: row.provider_id,
    customName: row.custom_name,
    planId: row.plan_id,
    customPlanName: row.custom_plan_name,
    confirmedPriceMinor: row.confirmed_price_minor,
    currencyCode: row.currency_code,
    convertedPriceMinor: row.converted_price_minor,
    convertedCurrencyCode: row.converted_currency_code,
    exchangeRate: row.exchange_rate,
    exchangeRateDate: row.exchange_rate_date,
    exchangeRateSource: row.exchange_rate_source,
    frequency: row.frequency,
    nextRenewalDate: row.next_renewal_date,
    startDate: row.start_date,
    categoryId: row.category_id,
    cardId: row.card_id,
    creditsIncluded: row.credits_included,
    dataOrigin: row.data_origin,
    isActive: row.is_active,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    provider: row.provider ? {
      id: row.provider.id,
      name: row.provider.name,
      logoUrl: row.provider.logo_url,
      websiteUrl: row.provider.website_url,
      pricingUrl: row.provider.pricing_url,
      categoryId: row.provider.category_id,
      isCustom: row.provider.is_custom,
      createdAt: row.provider.created_at,
    } : null,
    category: row.category ? {
      id: row.category.id,
      name: row.category.name,
      icon: row.category.icon,
      color: row.category.color,
    } : null,
    card: row.card ? {
      id: row.card.id,
      alias: row.card.alias,
      bank: row.card.bank,
      brand: row.card.brand,
      lastFour: row.card.last_four,
      closingDay: row.card.closing_day,
      color: row.card.color,
      createdAt: row.card.created_at,
    } : null,
    currency: {
      code: row.currency.code,
      symbol: row.currency.symbol,
      name: row.currency.name,
      minorUnit: row.currency.minor_unit,
    },
  };
}

export type NewSubscription = {
  providerId?: number | null;
  customName?: string | null;
  planId?: number | null;
  customPlanName?: string | null;
  confirmedPriceMinor: number;
  currencyCode: string;
  convertedPriceMinor?: number | null;
  convertedCurrencyCode?: string | null;
  exchangeRate?: number | null;
  exchangeRateDate?: number | null;
  exchangeRateSource?: string | null;
  frequency: string;
  nextRenewalDate?: number | null;
  startDate?: number | null;
  categoryId?: number | null;
  cardId?: number | null;
  creditsIncluded?: number | null;
  dataOrigin?: string;
  isActive?: boolean;
  notes?: string | null;
};

function toDb(data: NewSubscription) {
  return {
    provider_id: data.providerId ?? null,
    custom_name: data.customName ?? null,
    plan_id: data.planId ?? null,
    custom_plan_name: data.customPlanName ?? null,
    confirmed_price_minor: data.confirmedPriceMinor,
    currency_code: data.currencyCode,
    converted_price_minor: data.convertedPriceMinor ?? null,
    converted_currency_code: data.convertedCurrencyCode ?? null,
    exchange_rate: data.exchangeRate ?? null,
    exchange_rate_date: data.exchangeRateDate ?? null,
    exchange_rate_source: data.exchangeRateSource ?? null,
    frequency: data.frequency,
    next_renewal_date: data.nextRenewalDate ?? null,
    start_date: data.startDate ?? null,
    category_id: data.categoryId ?? null,
    card_id: data.cardId ?? null,
    credits_included: data.creditsIncluded ?? null,
    data_origin: data.dataOrigin ?? 'manual',
    is_active: data.isActive ?? true,
    notes: data.notes ?? null,
  };
}

export async function listSubscriptions(): Promise<SubscriptionWithRelations[]> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, provider:providers(*), category:categories(*), card:cards(*), currency:currencies!subscriptions_currency_code_fkey(*)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RawRow[]).map(toDomain);
}

export async function insertSubscription(data: NewSubscription): Promise<number> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const now = Date.now();
  const { data: row, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: uid,
      ...toDb(data),
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();
  if (error) throw error;
  return row.id;
}

export async function updateSubscription(
  id: number,
  data: Partial<NewSubscription>,
): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const updateData: Record<string, unknown> = { updated_at: Date.now() };
  if (data.providerId !== undefined) updateData.provider_id = data.providerId;
  if (data.customName !== undefined) updateData.custom_name = data.customName;
  if (data.planId !== undefined) updateData.plan_id = data.planId;
  if (data.customPlanName !== undefined) updateData.custom_plan_name = data.customPlanName;
  if (data.confirmedPriceMinor !== undefined) updateData.confirmed_price_minor = data.confirmedPriceMinor;
  if (data.currencyCode !== undefined) updateData.currency_code = data.currencyCode;
  if (data.convertedPriceMinor !== undefined) updateData.converted_price_minor = data.convertedPriceMinor;
  if (data.convertedCurrencyCode !== undefined) updateData.converted_currency_code = data.convertedCurrencyCode;
  if (data.exchangeRate !== undefined) updateData.exchange_rate = data.exchangeRate;
  if (data.exchangeRateDate !== undefined) updateData.exchange_rate_date = data.exchangeRateDate;
  if (data.exchangeRateSource !== undefined) updateData.exchange_rate_source = data.exchangeRateSource;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.nextRenewalDate !== undefined) updateData.next_renewal_date = data.nextRenewalDate;
  if (data.startDate !== undefined) updateData.start_date = data.startDate;
  if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
  if (data.cardId !== undefined) updateData.card_id = data.cardId;
  if (data.creditsIncluded !== undefined) updateData.credits_included = data.creditsIncluded;
  if (data.dataOrigin !== undefined) updateData.data_origin = data.dataOrigin;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase.from('subscriptions').update(updateData).eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

export async function deleteSubscription(id: number): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase.from('subscriptions').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}
