import { supabase } from '../db/client.js';

const now = () => new Date().toISOString();

async function replicateToAllMarkets() {
  const { data: markets, error: mErr } = await supabase
    .from('pe_markets')
    .select('country_code')
    .eq('enabled', true);
  if (mErr || !markets) { console.error('[ERROR] markets:', mErr?.message); return; }

  const allCountries = (markets as { country_code: string }[]).map((m) => m.country_code);
  console.log(`[Seed] Markets: ${allCountries.join(', ')}`);

  const { data: usPrices, error } = await supabase
    .from('pe_regional_prices')
    .select('service_id, plan_id, currency, amount, period, tax_mode, source_url, source_type, status, confidence_score')
    .eq('country_code', 'US');

  if (error || !usPrices) { console.error('[ERROR] US prices:', error?.message); return; }
  console.log(`[Seed] US baseline: ${usPrices.length} prices`);

  let totalInserted = 0;

  for (const country of allCountries) {
    if (country === 'US') continue;

    const { data: existing } = await supabase
      .from('pe_regional_prices')
      .select('service_id, plan_id')
      .eq('country_code', country);

    const existingKeys = new Set((existing ?? []).map((p) => `${p.service_id}:${p.plan_id}`));

    let inserted = 0;
    for (const p of usPrices) {
      const key = `${p.service_id}:${p.plan_id}`;
      if (existingKeys.has(key)) continue;

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

      if (!upErr) inserted++;
    }

    totalInserted += inserted;
    console.log(`  ${country}: +${inserted} new`);

    await supabase
      .from('pe_catalog_versions')
      .upsert({ country_code: country, updated_at: now() }, { onConflict: 'country_code' });
  }

  console.log(`\n[Seed] Total inserted: ${totalInserted}`);
  console.log('[Seed] Done. All markets updated.');
}

replicateToAllMarkets().catch(console.error);
