import { supabase } from '../db/client.js';
import type { AuditQueueRow, ServiceRow, PlanRow, MarketRow } from '../types.js';

const STALE_DAYS = 30;
const MARKET_PRIORITY_WEIGHT: Record<string, number> = {
  P0: 3.0,
  P1: 2.0,
  P2: 1.0,
  P3: 0.5,
};
const SERVICE_PRIORITY_WEIGHT: Record<number, number> = {
  1: 3.0,
  2: 1.5,
  3: 0.5,
};

export interface AuditQueueItem {
  id: number;
  serviceSlug: string;
  serviceName: string;
  planSlug: string | null;
  planName: string | null;
  countryCode: string;
  priorityScore: number;
  lastVerifiedAt: string | null;
  nextCheckAt: string;
  auditStatus: string;
  attemptCount: number;
  collectorType: string;
}

export async function rebuildAuditQueue(countryCode?: string): Promise<number> {
  const { data: markets } = await supabase
    .from('pe_markets')
    .select('*')
    .eq('enabled', true);
  if (!markets) return 0;

  const { data: services } = await supabase
    .from('pe_services')
    .select('*')
    .eq('active', true);
  if (!services) return 0;

  const { data: plans } = await supabase
    .from('pe_plans')
    .select('*')
    .eq('active', true);
  if (!plans) return 0;

  const { data: existingPrices } = await supabase
    .from('pe_regional_prices')
    .select('service_id, plan_id, country_code, last_verified_at, status');

  const priceMap = new Map<string, string | null>();
  for (const p of existingPrices ?? []) {
    priceMap.set(`${p.service_id}:${p.plan_id}:${p.country_code}`, p.last_verified_at);
  }

  let inserted = 0;
  const now = new Date();
  const marketRows = markets as MarketRow[];
  const serviceRows = services as ServiceRow[];
  const planRows = plans as PlanRow[];

  for (const market of marketRows) {
    if (countryCode && market.country_code !== countryCode.toUpperCase()) continue;

    const marketWeight = MARKET_PRIORITY_WEIGHT[market.priority] ?? 0.5;
    const staleDays = market.default_audit_frequency_days || STALE_DAYS;

    for (const svc of serviceRows) {
      const svcWeight = SERVICE_PRIORITY_WEIGHT[svc.priority] ?? 0.5;
      const svcPlans = planRows.filter((p) => p.service_id === svc.id);

      for (const plan of svcPlans) {
        const key = `${svc.id}:${plan.id}:${market.country_code}`;
        const lastVerified = priceMap.get(key) ?? null;
        const lastVerifiedDate = lastVerified ? new Date(lastVerified) : null;
        const daysSinceVerification = lastVerifiedDate
          ? Math.floor((now.getTime() - lastVerifiedDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const staleness = Math.min(daysSinceVerification / staleDays, 3);
        const priorityScore = Math.round(svcWeight * marketWeight * (1 + staleness) * 100) / 100;

        const nextCheck = new Date(now.getTime() + Math.max(staleDays - daysSinceVerification, 1) * 24 * 60 * 60 * 1000);

        const { error } = await supabase
          .from('pe_audit_queue')
          .upsert({
            service_id: svc.id,
            plan_id: plan.id,
            country_code: market.country_code,
            priority_score: priorityScore,
            last_verified_at: lastVerified,
            next_check_at: nextCheck.toISOString(),
            audit_status: 'pending',
            attempt_count: 0,
            collector_type: 'manual',
          }, { onConflict: 'service_id,plan_id,country_code' });

        if (!error) inserted++;
      }
    }
  }

  return inserted;
}

export async function getAuditQueue(
  countryCode?: string,
  limit = 50,
): Promise<AuditQueueItem[]> {
  let query = supabase
    .from('pe_audit_queue')
    .select(`
      *,
      pe_services!inner(slug, name),
      pe_plans(slug, name)
    `)
    .order('priority_score', { ascending: false })
    .limit(limit);

  if (countryCode) {
    query = query.eq('country_code', countryCode.toUpperCase());
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as Array<AuditQueueRow & {
    pe_services: { slug: string; name: string };
    pe_plans: { slug: string; name: string } | null;
  }>).map((row) => ({
    id: row.id,
    serviceSlug: row.pe_services.slug,
    serviceName: row.pe_services.name,
    planSlug: row.pe_plans?.slug ?? null,
    planName: row.pe_plans?.name ?? null,
    countryCode: row.country_code,
    priorityScore: Number(row.priority_score),
    lastVerifiedAt: row.last_verified_at,
    nextCheckAt: row.next_check_at,
    auditStatus: row.audit_status,
    attemptCount: row.attempt_count,
    collectorType: row.collector_type,
  }));
}
