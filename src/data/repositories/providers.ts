import { supabase } from '@/services/supabaseClient';
import { getUserCountry } from '@/services/userCountry';

export type ProviderWithCategory = {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  pricingUrl: string | null;
  categoryId: number | null;
  isCustom: boolean;
  createdAt: number;
  category: { id: number; name: string; icon: string | null; color: string | null } | null;
};

export type PlanRow = {
  id: number;
  providerId: number;
  name: string;
  frequency: string;
  suggestedPriceMinor: number;
  currencyCode: string;
  creditsIncluded: number | null;
  isSuggested: boolean;
  createdAt: number;
};

type RawProvider = {
  id: number;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  pricing_url: string | null;
  category_id: number | null;
  is_custom: boolean;
  created_at: number;
  category: { id: number; name: string; icon: string | null; color: string | null } | null;
};

type RawPlan = {
  id: number;
  provider_id: number;
  name: string;
  frequency: string;
  suggested_price_minor: number;
  currency_code: string;
  credits_included: number | null;
  is_suggested: boolean;
  created_at: number;
};

function toProviderDomain(row: RawProvider): ProviderWithCategory {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    pricingUrl: row.pricing_url,
    categoryId: row.category_id,
    isCustom: row.is_custom,
    createdAt: row.created_at,
    category: row.category,
  };
}

function toPlanDomain(row: RawPlan): PlanRow {
  return {
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    frequency: row.frequency,
    suggestedPriceMinor: row.suggested_price_minor,
    currencyCode: row.currency_code,
    creditsIncluded: row.credits_included,
    isSuggested: row.is_suggested,
    createdAt: row.created_at,
  };
}

export async function listProviders(): Promise<ProviderWithCategory[]> {
  const all: RawProvider[] = [];
  let offset = 0;
  const pageSize = 1000;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('*, category:categories(*)')
      .order('name')
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as RawProvider[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all.map(toProviderDomain);
}

export async function listProvidersWithPlans(): Promise<ProviderWithCategory[]> {
  // Paginate providers (Supabase caps at 1000 rows per request)
  const all: RawProvider[] = [];
  let offset = 0;
  const pageSize = 1000;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('*, category:categories(*)')
      .order('name')
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as RawProvider[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  // Paginate plans to get all provider_ids that have plans
  const idsWithPlans = new Set<number>();
  offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: page, error: planError } = await supabase
      .from('plans')
      .select('provider_id')
      .range(offset, offset + pageSize - 1);
    if (planError) {
      console.log('[listProvidersWithPlans] plan query error:', planError.message);
      break;
    }
    if (!page || page.length === 0) break;
    for (const p of page as { provider_id: number }[]) {
      idsWithPlans.add(p.provider_id);
    }
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  const filtered = all.filter((p) => idsWithPlans.has(p.id));
  console.log('[listProvidersWithPlans] providers:', all.length, 'plan IDs:', idsWithPlans.size, 'filtered:', filtered.length);
  return filtered.map(toProviderDomain);
}

export async function searchProviders(query: string): Promise<ProviderWithCategory[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*, category:categories(*)')
    .ilike('name', `%${query}%`)
    .order('name');
  if (error) throw error;
  return (data as RawProvider[]).map(toProviderDomain);
}

export async function getPlansForProvider(providerId: number, providerName?: string): Promise<PlanRow[]> {
  const userCountry = await getUserCountry();

  // ─── Try price-engine tables first (pe_services + pe_plans + pe_regional_prices) ───
  if (providerName) {
    const { data: peService } = await supabase
      .from('pe_services')
      .select('id')
      .eq('name', providerName)
      .eq('active', true)
      .maybeSingle();

    if (peService) {
      const { data: pePlans, error: peErr } = await supabase
        .from('pe_plans')
        .select('id, service_id, slug, name, period, active')
        .eq('service_id', peService.id)
        .eq('active', true)
        .order('name');

      if (peErr) console.error('[providers] pe_plans error:', peErr.message);

      if (pePlans && pePlans.length > 0) {
        const planIds = pePlans.map((p) => p.id);
        const { data: pePrices } = await supabase
          .from('pe_regional_prices')
          .select('plan_id, currency, amount, period, tax_mode, status')
          .eq('service_id', peService.id)
          .in('plan_id', planIds)
          .eq('country_code', userCountry);

        const priceMap = new Map<number, { currency: string; amount: number; period: string }>();
        for (const pr of pePrices ?? []) {
          priceMap.set(pr.plan_id, { currency: pr.currency, amount: pr.amount, period: pr.period });
        }

        const mapped: PlanRow[] = [];
        for (const plan of pePlans) {
          const price = priceMap.get(plan.id);
          if (!price) continue;

          // Resolve or create this plan in the app's plans table
          const freq = price.period === 'year' ? 'yearly' : price.period === 'month' ? 'monthly' : price.period;
          const { data: existingPlan } = await supabase
            .from('plans')
            .select('id')
            .eq('provider_id', providerId)
            .eq('name', plan.name)
            .eq('frequency', freq)
            .maybeSingle();

          let appPlanId = existingPlan?.id ?? null;

          if (!appPlanId) {
            const { data: newPlan, error: planErr } = await supabase
              .from('plans')
              .insert({
                provider_id: providerId,
                name: plan.name,
                frequency: freq,
                suggested_price_minor: price.amount,
                currency_code: price.currency,
                is_suggested: true,
                created_at: Date.now(),
              })
              .select('id')
              .single();
            if (planErr) {
              console.error(`[providers] Error creating plan "${plan.name}": ${planErr.message}`);
              continue;
            }
            appPlanId = newPlan.id;
          } else {
            // Update price if different
            await supabase
              .from('plans')
              .update({
                suggested_price_minor: price.amount,
                currency_code: price.currency,
              })
              .eq('id', appPlanId);
          }

          mapped.push({
            id: appPlanId,
            providerId: providerId,
            name: plan.name,
            frequency: freq,
            suggestedPriceMinor: price.amount,
            currencyCode: price.currency,
            creditsIncluded: null,
            isSuggested: true,
            createdAt: 0,
          });
        }

        if (mapped.length > 0) {
          console.log(`[providers] Resolved ${mapped.length} plans for "${providerName}" (${userCountry})`);
          return mapped;
        }
      }
    }
  }

  // ─── Fallback: app's own plans table ───
  console.log(`[providers] Falling back to app plans table for provider ${providerId}`);
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('provider_id', providerId)
    .order('name');
  if (error) throw error;
  return (data as RawPlan[]).map(toPlanDomain);
}

export async function insertCustomProvider(name: string, categoryId?: number): Promise<number> {
  const { data, error } = await supabase
    .from('providers')
    .insert({
      name,
      category_id: categoryId ?? null,
      is_custom: true,
      created_at: Date.now(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

type RawPeService = {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  category: string | null;
  active: boolean;
};

export type PeServiceWithPrice = {
  id: number;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  category: string | null;
  minPriceMinor: number;
  currency: string;
  planCount: number;
};

export async function listPriceEngineServices(): Promise<PeServiceWithPrice[]> {
  const userCountry = await getUserCountry();

  const { data: services, error } = await supabase
    .from('pe_services')
    .select('id, name, slug, website_url, logo_url, category, active')
    .eq('active', true)
    .order('name');

  if (error || !services) return [];

  const serviceIds = (services as RawPeService[]).map((s) => s.id);

  const { data: prices } = await supabase
    .from('pe_regional_prices')
    .select('service_id, currency, amount, period')
    .in('service_id', serviceIds)
    .eq('country_code', userCountry)
    .gt('amount', 0);

  const priceMap = new Map<number, { min: number; currency: string; count: number }>();
  for (const p of prices ?? []) {
    const existing = priceMap.get(p.service_id);
    if (!existing || p.amount < existing.min) {
      priceMap.set(p.service_id, {
        min: p.amount,
        currency: p.currency,
        count: (existing?.count ?? 0) + 1,
      });
    } else {
      existing.count++;
    }
  }

  return (services as RawPeService[])
    .map((s) => {
      const price = priceMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        websiteUrl: s.website_url,
        logoUrl: s.logo_url,
        category: s.category,
        minPriceMinor: price?.min ?? 0,
        currency: price?.currency ?? 'USD',
        planCount: price?.count ?? 0,
      };
    });
}

export async function searchPriceEngineServices(query: string): Promise<PeServiceWithPrice[]> {
  const all = await listPriceEngineServices();
  const lower = query.toLowerCase();
  return all.filter((s) => s.name.toLowerCase().includes(lower));
}
