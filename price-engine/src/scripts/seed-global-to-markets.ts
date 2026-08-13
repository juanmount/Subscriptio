import { supabase } from '../db/client.js';

const TARGET_COUNTRIES = ['BR', 'MX', 'ES'];
const AR_ONLY_SLUGS = new Set([
  'flow', 'personal-play', 'movistar-play', 'claro-video', 'dgo',
  'pedidosya-plus', 'rappi-pro', 'meli-plus',
]);

const now = () => new Date().toISOString();

async function replicateGlobalPrices() {
  console.log('[Seed] Fetching all US prices (global USD baseline)...');

  const { data: usPrices, error } = await supabase
    .from('pe_regional_prices')
    .select(`
      id, service_id, plan_id, currency, amount, period, tax_mode,
      source_url, source_type, status, confidence_score,
      pe_services!inner(slug)
    `)
    .eq('country_code', 'US');

  if (error || !usPrices) {
    console.error('[ERROR] Failed to fetch US prices:', error?.message);
    return;
  }

  console.log(`[Seed] Found ${usPrices.length} US prices to replicate`);

  let inserted = 0;
  let skipped = 0;

  for (const p of usPrices) {
    const svcSlug = (p.pe_services as unknown as { slug: string }).slug;

    if (AR_ONLY_SLUGS.has(svcSlug)) {
      skipped++;
      continue;
    }

    for (const country of TARGET_COUNTRIES) {
      const { error: upErr } = await supabase
        .from('pe_regional_prices')
        .upsert({
          service_id: p.service_id,
          plan_id: p.plan_id,
          country_code: country,
          currency: p.currency,
          amount: p.amount,
          period: p.period,
          tax_mode: p.tax_mode,
          source_url: p.source_url,
          source_type: p.source_type,
          last_verified_at: p.status === 'manual_required' ? null : now(),
          status: p.status,
          confidence_score: p.confidence_score ?? 0,
          valid_from: now(),
        }, { onConflict: 'service_id,plan_id,country_code,period' });

      if (upErr) {
        console.error(`  [ERROR] ${svcSlug} -> ${country}: ${upErr.message}`);
      } else {
        inserted++;
      }
    }
  }

  console.log(`[Seed] Inserted/upserted: ${inserted}, skipped AR-only: ${skipped}`);

  for (const country of [...TARGET_COUNTRIES, 'AR']) {
    await supabase
      .from('pe_catalog_versions')
      .upsert({ country_code: country, updated_at: now() }, { onConflict: 'country_code' });
  }

  console.log('[Seed] Done. Catalog versions bumped for AR, BR, MX, ES.');
}

replicateGlobalPrices().catch(console.error);
