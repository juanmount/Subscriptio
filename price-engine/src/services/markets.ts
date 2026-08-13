import { supabase } from '../db/client.js';
import type { MarketRow, MarketResponse, CoverageResponse } from '../types.js';

function toMarketResponse(row: MarketRow): MarketResponse {
  return {
    countryCode: row.country_code,
    name: row.name,
    defaultCurrency: row.default_currency,
    locale: row.locale,
    enabled: row.enabled,
    priority: row.priority,
    priceWatchEnabled: row.price_watch_enabled,
    defaultAuditFrequencyDays: row.default_audit_frequency_days,
    fallbackCurrency: row.fallback_currency,
  };
}

export async function getMarkets(enabledOnly = false): Promise<MarketResponse[]> {
  let query = supabase.from('pe_markets').select('*').order('priority, country_code');
  if (enabledOnly) query = query.eq('enabled', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data as MarketRow[]).map(toMarketResponse);
}

export async function getMarket(countryCode: string): Promise<MarketResponse | null> {
  const { data, error } = await supabase
    .from('pe_markets')
    .select('*')
    .eq('country_code', countryCode.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toMarketResponse(data as MarketRow);
}

export async function getCoverage(countryCode: string): Promise<CoverageResponse> {
  const cc = countryCode.toUpperCase();

  const { data: market } = await supabase
    .from('pe_markets')
    .select('default_audit_frequency_days')
    .eq('country_code', cc)
    .maybeSingle();

  if (!market) {
    return {
      country: cc,
      servicesTotal: 0,
      plansTotal: 0,
      pricesVerified: 0,
      pricesPending: 0,
      pricesStale: 0,
      pricesManualRequired: 0,
      pricesReviewRequired: 0,
      coveragePercentage: 0,
      lastCatalogUpdate: null,
    };
  }

  const { data: services } = await supabase
    .from('pe_services')
    .select('id')
    .eq('active', true);
  const servicesTotal = services?.length ?? 0;

  const { data: plans } = await supabase
    .from('pe_plans')
    .select('id')
    .eq('active', true);
  const plansTotal = plans?.length ?? 0;

  const { data: prices } = await supabase
    .from('pe_regional_prices')
    .select('status')
    .eq('country_code', cc);

  const priceList = prices ?? [];
  const pricesVerified = priceList.filter((p) => p.status === 'verified').length;
  const pricesPending = priceList.filter((p) => p.status === 'pending').length;
  const pricesStale = priceList.filter((p) => p.status === 'stale').length;
  const pricesManualRequired = priceList.filter((p) => p.status === 'manual_required').length;
  const pricesReviewRequired = priceList.filter((p) => p.status === 'review_required').length;

  const totalPrices = priceList.length;
  const coveragePercentage = totalPrices > 0
    ? Math.round((pricesVerified / totalPrices) * 100)
    : 0;

  const { data: versionRow } = await supabase
    .from('pe_catalog_versions')
    .select('updated_at')
    .eq('country_code', cc)
    .maybeSingle();

  return {
    country: cc,
    servicesTotal,
    plansTotal,
    pricesVerified,
    pricesPending,
    pricesStale,
    pricesManualRequired,
    pricesReviewRequired,
    coveragePercentage,
    lastCatalogUpdate: versionRow?.updated_at ?? null,
  };
}
