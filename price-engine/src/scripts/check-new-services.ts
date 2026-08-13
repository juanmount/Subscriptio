import { supabase } from '../db/client.js';

const now = () => new Date().toISOString();

// Audited prices (USD minor units)
// slug: [{ name, period, amount }]
const AUDITED: Record<string, Array<{ name: string; period: 'month' | 'year'; amount: number }>> = {
  'garmin-connect-plus': [
    { name: 'Monthly', period: 'month', amount: 699 },
    { name: 'Annual', period: 'year', amount: 6999 },
  ],
  'peloton-app': [
    { name: 'App One', period: 'month', amount: 1299 },
    { name: 'App+', period: 'month', amount: 2899 },
  ],
  'freeletics': [
    { name: 'Training Coach', period: 'month', amount: 3499 },
    { name: 'Training Coach', period: 'year', amount: 8999 },
  ],
  'alltrails-plus': [
    { name: 'Plus', period: 'year', amount: 3599 },
    { name: 'Peak', period: 'year', amount: 7999 },
  ],
  'komoot-premium': [
    { name: 'Premium', period: 'month', amount: 499 },
    { name: 'Premium', period: 'year', amount: 5999 },
  ],
  'surfline-premium': [
    { name: 'Premium', period: 'month', amount: 1599 },
    { name: 'Premium', period: 'year', amount: 11999 },
    { name: 'Premium+', period: 'year', amount: 14999 },
  ],
  'carrot-weather': [
    { name: 'Premium', period: 'month', amount: 499 },
    { name: 'Premium', period: 'year', amount: 1999 },
    { name: 'Premium Ultra', period: 'month', amount: 999 },
    { name: 'Premium Ultra', period: 'year', amount: 3999 },
  ],
  'windy-premium': [
    { name: 'Premium', period: 'year', amount: 2499 },
  ],
  'snow-forecast-premium': [
    { name: 'Premium', period: 'month', amount: 599 },
    { name: 'Premium', period: 'year', amount: 2999 },
  ],
  'slopes-premium': [
    { name: 'Annual Pass', period: 'year', amount: 3499 },
    { name: 'Family Plan', period: 'year', amount: 5999 },
  ],
  'opensnow-premium': [
    { name: 'Base', period: 'year', amount: 4999 },
    { name: 'Premium', period: 'year', amount: 9999 },
  ],
  'fatmap-premium': [
    { name: 'Explore', period: 'year', amount: 4999 },
  ],
  'golfshot-pro': [
    { name: 'Pro', period: 'month', amount: 1799 },
    { name: 'Pro', period: 'year', amount: 7999 },
  ],
  'onx-hunt': [
    { name: 'Premium', period: 'year', amount: 3499 },
    { name: 'Elite', period: 'month', amount: 1499 },
    { name: 'Elite', period: 'year', amount: 9999 },
  ],
  'gaia-gps-premium': [
    { name: 'Premium', period: 'year', amount: 5990 },
  ],
  'predictwind': [
    { name: 'Basic', period: 'month', amount: 699 },
    { name: 'Basic', period: 'year', amount: 2900 },
    { name: 'Standard', period: 'month', amount: 4900 },
    { name: 'Standard', period: 'year', amount: 24900 },
  ],
  'fishbrain-premium': [
    { name: 'Premium', period: 'month', amount: 799 },
    { name: 'Premium', period: 'year', amount: 7499 },
  ],
  'swingvision-pro': [
    { name: 'Pro', period: 'month', amount: 2499 },
    { name: 'Pro', period: 'year', amount: 17999 },
  ],
  'playtomic-premium': [
    { name: 'Basic', period: 'month', amount: 949 },
    { name: 'Basic', period: 'year', amount: 5999 },
  ],
};

async function auditPrices() {
  // Get all enabled markets
  const { data: markets } = await supabase
    .from('pe_markets')
    .select('country_code')
    .eq('enabled', true);
  const allCountries = (markets ?? []).map((m: { country_code: string }) => m.country_code);

  let totalUpdated = 0;

  for (const [slug, plans] of Object.entries(AUDITED)) {
    // Get service
    const { data: svc } = await supabase
      .from('pe_services')
      .select('id, slug, official_url')
      .eq('slug', slug)
      .single();
    if (!svc) { console.log(`  [SKIP] ${slug} — not found`); continue; }

    // Delete existing default plan + prices
    const { data: existingPlans } = await supabase
      .from('pe_plans')
      .select('id, slug, name')
      .eq('service_id', svc.id);
    
    if (existingPlans && existingPlans.length > 0) {
      // Delete all existing prices for this service
      for (const p of existingPlans) {
        await supabase.from('pe_regional_prices').delete().eq('plan_id', p.id);
      }
      // Delete the default plan
      await supabase.from('pe_plans').delete().eq('service_id', svc.id);
    }

    // Create new plans with audited prices
    for (const plan of plans) {
      const planSlug = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${plan.period === 'month' ? 'mo' : 'yr'}`;
      
      const { data: planRow, error: planErr } = await supabase
        .from('pe_plans')
        .insert({
          service_id: svc.id,
          slug: planSlug,
          name: plan.name,
          period: plan.period,
          active: true,
        })
        .select('id')
        .single();

      if (planErr || !planRow) {
        console.log(`  [ERR] ${slug}/${planSlug}: ${planErr?.message}`);
        continue;
      }

      // Insert prices for all countries
      const rows = allCountries.map((country) => ({
        service_id: svc.id,
        plan_id: planRow.id,
        country_code: country,
        currency: 'USD',
        amount: plan.amount,
        period: plan.period,
        tax_mode: 'tax_excluded',
        source_url: svc.official_url,
        source_type: 'manual_verified',
        last_verified_at: now(),
        status: 'verified',
        confidence_score: 70,
        valid_from: now(),
      }));

      const { error: priceErr } = await supabase.from('pe_regional_prices').insert(rows);
      if (priceErr) {
        console.log(`  [ERR] ${slug}/${planSlug} prices: ${priceErr.message}`);
      } else {
        totalUpdated += rows.length;
      }
    }

    console.log(`  [OK] ${slug}: ${plans.length} plans audited`);
  }

  // Bump catalog versions
  const n = now();
  for (const country of allCountries) {
    await supabase
      .from('pe_catalog_versions')
      .upsert({ country_code: country, updated_at: n }, { onConflict: 'country_code' });
  }

  console.log(`\n[Done] Total price rows updated: ${totalUpdated} across ${allCountries.length} markets`);
}

auditPrices().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
