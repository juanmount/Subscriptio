import { supabase } from '../db/client.js';
import type {
  CatalogResponse,
  CatalogService,
  CatalogPlan,
  PriceResponse,
  PriceHistoryResponse,
  PriceChangeResponse,
  ServiceRow,
  PlanRow,
  RegionalPriceRow,
  PriceHistoryRow,
  ChangeCandidateRow,
} from '../types.js';

export async function getCatalog(countryCode: string): Promise<CatalogResponse> {
  const { data: services } = await supabase
    .from('pe_services')
    .select('*')
    .eq('active', true)
    .order('name');

  const { data: plans } = await supabase
    .from('pe_plans')
    .select('*')
    .eq('active', true)
    .order('name');

  const { data: prices } = await supabase
    .from('pe_regional_prices')
    .select('*')
    .eq('country_code', countryCode);

  const { data: versionRow } = await supabase
    .from('pe_catalog_versions')
    .select('version, updated_at')
    .eq('country_code', countryCode)
    .single();

  if (!services || !plans || !prices) {
    return { country: countryCode, version: 0, updatedAt: new Date().toISOString(), services: [] };
  }

  const planMap = new Map<number, PlanRow[]>();
  for (const p of plans as PlanRow[]) {
    const arr = planMap.get(p.service_id) ?? [];
    arr.push(p);
    planMap.set(p.service_id, arr);
  }

  const priceMap = new Map<string, RegionalPriceRow>();
  for (const pr of prices as RegionalPriceRow[]) {
    priceMap.set(`${pr.service_id}:${pr.plan_id}`, pr);
  }

  const catalogServices: CatalogService[] = (services as ServiceRow[])
    .map((svc) => {
      const svcPlans = planMap.get(svc.id) ?? [];
      const catalogPlans: CatalogPlan[] = svcPlans
        .map((plan) => {
          const rp = priceMap.get(`${svc.id}:${plan.id}`);
          if (!rp) return null;
          return {
            slug: plan.slug,
            name: plan.name,
            period: plan.period,
            price: rp.amount,
            currency: rp.currency,
            taxMode: rp.tax_mode,
            status: rp.status,
            sourceUrl: rp.source_url,
            lastVerifiedAt: rp.last_verified_at,
          };
        })
        .filter((p): p is CatalogPlan => p !== null);

      return {
        slug: svc.slug,
        name: svc.name,
        provider: svc.provider,
        category: svc.category,
        officialUrl: svc.official_url,
        plans: catalogPlans,
      };
    })
    .filter((s) => s.plans.length > 0);

  return {
    country: countryCode,
    version: versionRow?.version ?? 1,
    updatedAt: versionRow?.updated_at ?? new Date().toISOString(),
    services: catalogServices,
  };
}

export async function getPrice(
  serviceSlug: string,
  planSlug: string,
  countryCode: string,
): Promise<PriceResponse | null> {
  const { data: service } = await supabase
    .from('pe_services')
    .select('id, name')
    .eq('slug', serviceSlug)
    .single();

  if (!service) return null;

  const { data: plan } = await supabase
    .from('pe_plans')
    .select('id, name')
    .eq('service_id', service.id)
    .eq('slug', planSlug)
    .single();

  if (!plan) return null;

  const { data: rp } = await supabase
    .from('pe_regional_prices')
    .select('*')
    .eq('service_id', service.id)
    .eq('plan_id', plan.id)
    .eq('country_code', countryCode)
    .single();

  if (!rp) return null;

  const row = rp as RegionalPriceRow;

  return {
    service: service.name,
    plan: plan.name,
    country: countryCode,
    price: row.amount,
    currency: row.currency,
    period: row.period,
    tax_mode: row.tax_mode,
    source_type: row.source_type,
    source_url: row.source_url,
    last_verified_at: row.last_verified_at,
    status: row.status,
  };
}

export async function getPriceHistory(
  serviceSlug: string,
  planSlug: string,
  countryCode: string,
): Promise<PriceHistoryResponse | null> {
  const { data: service } = await supabase
    .from('pe_services')
    .select('id, name')
    .eq('slug', serviceSlug)
    .single();

  if (!service) return null;

  const { data: plan } = await supabase
    .from('pe_plans')
    .select('id, name')
    .eq('service_id', service.id)
    .eq('slug', planSlug)
    .single();

  if (!plan) return null;

  const { data: rp } = await supabase
    .from('pe_regional_prices')
    .select('id')
    .eq('service_id', service.id)
    .eq('plan_id', plan.id)
    .eq('country_code', countryCode)
    .single();

  if (!rp) return null;

  const { data: history } = await supabase
    .from('pe_price_history')
    .select('*')
    .eq('regional_price_id', rp.id)
    .order('detected_at', { ascending: false })
    .limit(50);

  if (!history) return null;

  return {
    service: service.name,
    plan: plan.name,
    country: countryCode,
    history: (history as PriceHistoryRow[]).map((h) => ({
      amount: h.amount,
      currency: h.currency,
      detectedAt: h.detected_at,
      changePercentage: h.change_percentage,
      previousAmount: h.previous_amount,
    })),
  };
}

export async function getPriceChanges(
  countryCode: string,
  sinceDate: string,
): Promise<PriceChangeResponse[]> {
  const { data: candidates } = await supabase
    .from('pe_change_candidates')
    .select('*, pe_regional_prices!inner(country_code, service_id, plan_id)')
    .gte('detected_at', sinceDate)
    .order('detected_at', { ascending: false })
    .limit(100);

  if (!candidates) return [];

  const results: PriceChangeResponse[] = [];

  for (const c of candidates as unknown as Array<ChangeCandidateRow & {
    regional_prices: { country_code: string; service_id: number; plan_id: number };
  }>) {
    if (c.regional_prices.country_code !== countryCode) continue;

    const { data: svc } = await supabase
      .from('pe_services')
      .select('name')
      .eq('id', c.regional_prices.service_id)
      .single();

    const { data: plan } = await supabase
      .from('pe_plans')
      .select('name')
      .eq('id', c.regional_prices.plan_id)
      .single();

    results.push({
      id: c.id,
      service: svc?.name ?? '—',
      plan: plan?.name ?? '—',
      country: countryCode,
      oldAmount: c.old_amount,
      newAmount: c.new_amount,
      oldCurrency: c.old_currency,
      newCurrency: c.new_currency,
      detectedAt: c.detected_at,
      status: c.status,
      confidenceScore: c.confidence_score,
      sourceUrl: c.source_url,
    });
  }

  return results;
}
