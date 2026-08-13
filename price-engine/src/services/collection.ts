import { supabase } from '../db/client.js';
import { getAllCollectors } from '../collectors/registry.js';
import { detectChanges } from './change-detection.js';
import type { CollectedPrice, ServiceRow, PlanRow } from '../types.js';

export interface CollectionResult {
  collectorId: string;
  serviceSlug: string;
  countryCode: string;
  pricesCollected: number;
  changes: Array<{
    planSlug: string;
    status: string;
    oldPrice: number | null;
    newPrice: number;
    percentChange: number | null;
  }>;
  errors: string[];
}

export async function runCollection(
  countryCode: string,
  serviceSlugs?: string[],
): Promise<CollectionResult[]> {
  const collectors = serviceSlugs
    ? getAllCollectors().filter((c) => serviceSlugs.includes(c.serviceSlug))
    : getAllCollectors();

  const results: CollectionResult[] = [];

  for (const collector of collectors) {
    const result: CollectionResult = {
      collectorId: collector.collectorId,
      serviceSlug: collector.serviceSlug,
      countryCode,
      pricesCollected: 0,
      changes: [],
      errors: [],
    };

    try {
      const prices = await collector.collect(countryCode);
      if (prices.length === 0) {
        results.push(result);
        continue;
      }

      for (const cp of prices) {
        await ensureServiceAndPlan(cp);
      }

      const detectionResults = await detectChanges(prices);

      result.pricesCollected = prices.length;
      for (let i = 0; i < detectionResults.length; i++) {
        const dr = detectionResults[i];
        result.changes.push({
          planSlug: prices[i].planSlug,
          status: dr.status,
          oldPrice: dr.oldPrice,
          newPrice: dr.newPrice,
          percentChange: dr.percentChange,
        });
      }

      await supabase.from('pe_audit_jobs').insert({
        service_slug: collector.serviceSlug,
        country: countryCode,
        scheduled_at: new Date().toISOString(),
        executed_at: new Date().toISOString(),
        result: 'success',
        collector_id: collector.collectorId,
      });
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));

      await supabase.from('pe_audit_jobs').insert({
        service_slug: collector.serviceSlug,
        country: countryCode,
        scheduled_at: new Date().toISOString(),
        executed_at: new Date().toISOString(),
        result: 'error',
        error: err instanceof Error ? err.message : String(err),
        collector_id: collector.collectorId,
      });
    }

    results.push(result);
  }

  return results;
}

async function ensureServiceAndPlan(cp: CollectedPrice): Promise<void> {
  const { data: existingService } = await supabase
    .from('pe_services')
    .select('id')
    .eq('slug', cp.serviceSlug)
    .maybeSingle();

  let serviceId: number;

  if (existingService) {
    serviceId = (existingService as ServiceRow).id;
  } else {
    const { data: newService, error } = await supabase
      .from('pe_services')
      .insert({
        slug: cp.serviceSlug,
        provider: cp.serviceSlug,
        name: cp.serviceSlug,
        official_url: cp.sourceUrl,
        priority: 1,
        active: true,
      })
      .select('id')
      .single();

    if (error || !newService) {
      throw new Error(`Failed to create service ${cp.serviceSlug}: ${error?.message}`);
    }
    serviceId = newService.id;
  }

  const { data: existingPlan } = await supabase
    .from('pe_plans')
    .select('id')
    .eq('service_id', serviceId)
    .eq('slug', cp.planSlug)
    .maybeSingle();

  if (!existingPlan) {
    await supabase.from('pe_plans').insert({
      service_id: serviceId,
      slug: cp.planSlug,
      name: cp.planName,
      period: cp.period,
      active: true,
    });
  }

  const { data: existingPrice } = await supabase
    .from('pe_regional_prices')
    .select('id')
    .eq('service_id', serviceId)
    .eq('plan_id', (existingPlan as PlanRow | null)?.id ?? 0)
    .eq('country_code', cp.countryCode)
    .maybeSingle();

  if (!existingPrice && existingPlan) {
    const planRow = existingPlan as PlanRow;
    await supabase.from('pe_regional_prices').insert({
      service_id: serviceId,
      plan_id: planRow.id,
      country_code: cp.countryCode,
      currency: cp.currency,
      amount: cp.price,
      period: cp.period,
      tax_mode: cp.taxMode,
      source_url: cp.sourceUrl,
      source_type: cp.sourceType,
      last_verified_at: cp.detectedAt,
      status: 'verified',
      confidence_score: 60,
    });

    await supabase.from('pe_price_history').insert({
      regional_price_id: 0, // will be set by trigger or re-fetched
      amount: cp.price,
      currency: cp.currency,
      detected_at: cp.detectedAt,
      verified_at: cp.detectedAt,
      source_url: cp.sourceUrl,
      previous_amount: null,
      change_percentage: null,
    });
  }
}
