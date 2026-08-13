import { Hono } from 'hono';
import { getCatalog, getPrice, getPriceHistory, getPriceChanges } from '../services/catalog.js';
import { runCollection } from '../services/collection.js';
import { approveCandidate, rejectCandidate } from '../services/change-detection.js';
import { getMarkets, getMarket, getCoverage } from '../services/markets.js';
import { rebuildAuditQueue, getAuditQueue } from '../services/audit-queue.js';
import { supabase } from '../db/client.js';
import { ADMIN_HTML } from '../admin/dashboard.js';

export const apiRoutes = new Hono();

// ─── Health check ────────────────────────────────────────────
apiRoutes.get('/health', (c) => c.json({ status: 'ok', service: 'stack-price-engine' }));

// ─── Admin Dashboard ────────────────────────────────────────
apiRoutes.get('/admin', (c) => c.html(ADMIN_HTML));

// ─── Markets ────────────────────────────────────────────────
apiRoutes.get('/v1/markets', async (c) => {
  const enabledOnly = c.req.query('enabled') === 'true';
  const markets = await getMarkets(enabledOnly);
  return c.json({ markets });
});

apiRoutes.get('/v1/markets/:country', async (c) => {
  const country = c.req.param('country');
  const market = await getMarket(country);
  if (!market) return c.json({ error: 'Market not found' }, 404);
  return c.json(market);
});

apiRoutes.get('/v1/markets/:country/coverage', async (c) => {
  const country = c.req.param('country');
  const coverage = await getCoverage(country);
  return c.json(coverage);
});

// ─── Catalog ────────────────────────────────────────────────
apiRoutes.get('/v1/catalog', async (c) => {
  const country = c.req.query('country') ?? 'AR';
  const catalog = await getCatalog(country);
  return c.json(catalog);
});

// ─── Service detail ─────────────────────────────────────────
apiRoutes.get('/v1/services/:slug', async (c) => {
  const slug = c.req.param('slug');
  const country = c.req.query('country') ?? 'AR';

  const { data: service } = await supabase
    .from('pe_services')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!service) return c.json({ error: 'Service not found' }, 404);

  const { data: plans } = await supabase
    .from('pe_plans')
    .select('*')
    .eq('service_id', service.id)
    .eq('active', true);

  const { data: prices } = await supabase
    .from('pe_regional_prices')
    .select('*')
    .eq('service_id', service.id)
    .eq('country_code', country);

  return c.json({ service, plans: plans ?? [], prices: prices ?? [] });
});

// ─── Plans for a service ────────────────────────────────────
apiRoutes.get('/v1/services/:slug/plans', async (c) => {
  const slug = c.req.param('slug');
  const country = c.req.query('country') ?? 'AR';

  const { data: service } = await supabase
    .from('pe_services')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!service) return c.json({ error: 'Service not found' }, 404);

  const { data: plans } = await supabase
    .from('pe_plans')
    .select('*')
    .eq('service_id', service.id)
    .eq('active', true);

  const { data: prices } = await supabase
    .from('pe_regional_prices')
    .select('*')
    .eq('service_id', service.id)
    .eq('country_code', country);

  const planMap = new Map<number, typeof prices>();
  for (const p of prices ?? []) {
    planMap.set(p.plan_id, p);
  }

  const result = (plans ?? []).map((plan) => ({
    ...plan,
    price: planMap.get(plan.id) ?? null,
  }));

  return c.json({ plans: result });
});

// ─── Single price ───────────────────────────────────────────
apiRoutes.get('/v1/prices/:serviceSlug/:planSlug', async (c) => {
  const serviceSlug = c.req.param('serviceSlug');
  const planSlug = c.req.param('planSlug');
  const country = c.req.query('country') ?? 'AR';

  const price = await getPrice(serviceSlug, planSlug, country);
  if (!price) return c.json({ error: 'Price not found' }, 404);
  return c.json(price);
});

// ─── Price history ──────────────────────────────────────────
apiRoutes.get('/v1/prices/:serviceSlug/:planSlug/history', async (c) => {
  const serviceSlug = c.req.param('serviceSlug');
  const planSlug = c.req.param('planSlug');
  const country = c.req.query('country') ?? 'AR';

  const history = await getPriceHistory(serviceSlug, planSlug, country);
  if (!history) return c.json({ error: 'Not found' }, 404);
  return c.json(history);
});

// ─── Price changes ──────────────────────────────────────────
apiRoutes.get('/v1/price-changes', async (c) => {
  const country = c.req.query('country') ?? 'AR';
  const since = c.req.query('since') ?? '2026-01-01';

  const changes = await getPriceChanges(country, since);
  return c.json({ changes });
});

// ─── Admin: trigger collection ──────────────────────────────
apiRoutes.post('/admin/collect', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const country = body.country ?? 'AR';
  const services = body.services;

  const results = await runCollection(country, services);
  return c.json({ results });
});

// ─── Admin: approve change candidate ────────────────────────
apiRoutes.post('/admin/candidates/:id/approve', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json().catch(() => ({}));
  const reviewer = body.reviewer ?? 'admin';

  try {
    await approveCandidate(id, reviewer);
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed' }, 500);
  }
});

// ─── Admin: reject change candidate ─────────────────────────
apiRoutes.post('/admin/candidates/:id/reject', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const body = await c.req.json().catch(() => ({}));
  const reviewer = body.reviewer ?? 'admin';
  const notes = body.notes;

  try {
    await rejectCandidate(id, reviewer, notes);
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed' }, 500);
  }
});

// ─── Admin: list change candidates ──────────────────────────
apiRoutes.get('/admin/candidates', async (c) => {
  const status = c.req.query('status');

  let query = supabase
    .from('pe_change_candidates')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(50);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ candidates: data });
});

// ─── Admin: list all services with prices ───────────────────
apiRoutes.get('/admin/services', async (c) => {
  const country = c.req.query('country') ?? 'AR';

  const { data: services } = await supabase
    .from('pe_services')
    .select('*')
    .order('name');

  const { data: prices } = await supabase
    .from('pe_regional_prices')
    .select('*, pe_plans!inner(name, slug), pe_services!inner(name, slug, category)')
    .eq('country_code', country);

  return c.json({ services: services ?? [], prices: prices ?? [] });
});

// ─── Admin: manual price entry ──────────────────────────────
apiRoutes.post('/admin/prices', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { serviceSlug, planSlug, countryCode, amount, currency, period, taxMode, sourceUrl } = body;

  if (!serviceSlug || !planSlug || !countryCode || amount === undefined || !currency) {
    return c.json({ error: 'Missing required fields: serviceSlug, planSlug, countryCode, amount, currency' }, 400);
  }

  const { data: service } = await supabase
    .from('pe_services')
    .select('id')
    .eq('slug', serviceSlug)
    .maybeSingle();
  if (!service) return c.json({ error: 'Service not found' }, 404);

  const { data: plan } = await supabase
    .from('pe_plans')
    .select('id')
    .eq('service_id', service.id)
    .eq('slug', planSlug)
    .maybeSingle();
  if (!plan) return c.json({ error: 'Plan not found' }, 404);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('pe_regional_prices')
    .upsert({
      service_id: service.id,
      plan_id: plan.id,
      country_code: countryCode.toUpperCase(),
      currency,
      amount,
      period: period ?? 'month',
      tax_mode: taxMode ?? 'tax_excluded',
      source_url: sourceUrl ?? null,
      source_type: 'manual_verified',
      last_verified_at: now,
      status: 'verified',
      confidence_score: 70,
      valid_from: now,
    }, { onConflict: 'service_id,plan_id,country_code,period' })
    .select('id')
    .single();

  if (error) return c.json({ error: error.message }, 500);

  await supabase.from('pe_price_history').insert({
    regional_price_id: data.id,
    amount,
    currency,
    detected_at: now,
    verified_at: now,
    source_url: sourceUrl ?? null,
    previous_amount: null,
    change_percentage: null,
  });

  await supabase
    .from('pe_catalog_versions')
    .upsert({
      country_code: countryCode.toUpperCase(),
      updated_at: now,
    }, { onConflict: 'country_code' });

  return c.json({ ok: true, id: data.id });
});

// ─── Admin: audit queue ─────────────────────────────────────
apiRoutes.get('/admin/audit-queue', async (c) => {
  const country = c.req.query('country');
  const limit = parseInt(c.req.query('limit') ?? '50', 10);
  const items = await getAuditQueue(country, limit);
  return c.json({ items });
});

apiRoutes.post('/admin/audit-queue/rebuild', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const countryCode = body.country;
  const count = await rebuildAuditQueue(countryCode);
  return c.json({ ok: true, inserted: count });
});

// ─── Health ─────────────────────────────────────────────────
apiRoutes.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }));
