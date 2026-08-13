import { supabase } from '../db/client.js';

const now = () => new Date().toISOString();

async function replicateUsdToAr() {
  console.log('[Seed] Fetching US prices not yet in AR...');

  const { data: usPrices, error } = await supabase
    .from('pe_regional_prices')
    .select(`
      id, service_id, plan_id, currency, amount, period, tax_mode,
      source_url, source_type, status, confidence_score,
      pe_services!inner(slug)
    `)
    .eq('country_code', 'US');

  if (error || !usPrices) {
    console.error('[ERROR]', error?.message);
    return;
  }

  const { data: arPrices } = await supabase
    .from('pe_regional_prices')
    .select('service_id, plan_id')
    .eq('country_code', 'AR');

  const arKeys = new Set((arPrices ?? []).map((p) => `${p.service_id}:${p.plan_id}`));

  let inserted = 0;
  let skipped = 0;

  for (const p of usPrices) {
    const key = `${p.service_id}:${p.plan_id}`;
    if (arKeys.has(key)) {
      skipped++;
      continue;
    }

    const { error: upErr } = await supabase
      .from('pe_regional_prices')
      .upsert({
        service_id: p.service_id,
        plan_id: p.plan_id,
        country_code: 'AR',
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
      console.error(`  [ERROR] service_id=${p.service_id}: ${upErr.message}`);
    } else {
      inserted++;
    }
  }

  console.log(`[Seed] Inserted: ${inserted}, already existed: ${skipped}`);

  await supabase
    .from('pe_catalog_versions')
    .upsert({ country_code: 'AR', updated_at: now() }, { onConflict: 'country_code' });

  console.log('[Seed] Done. AR catalog version bumped.');
}

replicateUsdToAr().catch(console.error);
