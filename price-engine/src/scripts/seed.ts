import { supabase } from '../db/client.js';

async function seed(): Promise<void> {
  console.log('[Seed] Starting price engine seed...');

  // ─── Netflix ──────────────────────────────────────────────
  const { data: netflix, error: netflixErr } = await supabase
    .from('pe_services')
    .upsert({
      slug: 'netflix',
      provider: 'Netflix',
      name: 'Netflix',
      category: 'streaming',
      official_url: 'https://www.netflix.com/ar/',
      priority: 1,
      active: true,
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (!netflix) throw new Error(`Failed to upsert Netflix service: ${JSON.stringify(netflixErr)}`);
  const netflixId = netflix.id;

  const netflixPlans = [
    { slug: 'basic', name: 'Básico', period: 'month' as const },
    { slug: 'standard', name: 'Estándar', period: 'month' as const },
    { slug: 'premium', name: 'Premium', period: 'month' as const },
  ];

  for (const plan of netflixPlans) {
    const { data: planRow } = await supabase
      .from('pe_plans')
      .upsert({
        service_id: netflixId,
        slug: plan.slug,
        name: plan.name,
        period: plan.period,
        active: true,
      }, { onConflict: 'service_id,slug' })
      .select('id')
      .single();

    if (!planRow) continue;

    const prices: Record<string, { amount: number; taxMode: string }> = {
      basic: { amount: 8999, taxMode: 'tax_excluded' },
      standard: { amount: 14999, taxMode: 'tax_excluded' },
      premium: { amount: 19999, taxMode: 'tax_excluded' },
    };

    const p = prices[plan.slug];
    if (!p) continue;

    await supabase
      .from('pe_regional_prices')
      .upsert({
        service_id: netflixId,
        plan_id: planRow.id,
        country_code: 'AR',
        currency: 'ARS',
        amount: p.amount,
        period: 'month',
        tax_mode: p.taxMode,
        source_url: 'https://www.netflix.com/ar/',
        source_type: 'manual_verified',
        last_verified_at: new Date().toISOString(),
        status: 'verified',
        confidence_score: 70,
      }, { onConflict: 'service_id,plan_id,country_code' });
  }

  console.log('[Seed] Netflix AR seeded');

  // ─── Spotify ──────────────────────────────────────────────
  const { data: spotify } = await supabase
    .from('pe_services')
    .upsert({
      slug: 'spotify',
      provider: 'Spotify',
      name: 'Spotify Premium',
      category: 'music',
      official_url: 'https://www.spotify.com/ar/premium/',
      priority: 1,
      active: true,
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (!spotify) throw new Error('Failed to upsert Spotify service');
  const spotifyId = spotify.id;

  const spotifyPlans = [
    { slug: 'student', name: 'Student', amount: 2299 },
    { slug: 'individual', name: 'Individual', amount: 4499 },
    { slug: 'duo', name: 'Duo', amount: 5999 },
    { slug: 'family', name: 'Family', amount: 7599 },
  ];

  for (const plan of spotifyPlans) {
    const { data: planRow } = await supabase
      .from('pe_plans')
      .upsert({
        service_id: spotifyId,
        slug: plan.slug,
        name: plan.name,
        period: 'month',
        active: true,
      }, { onConflict: 'service_id,slug' })
      .select('id')
      .single();

    if (!planRow) continue;

    await supabase
      .from('pe_regional_prices')
      .upsert({
        service_id: spotifyId,
        plan_id: planRow.id,
        country_code: 'AR',
        currency: 'ARS',
        amount: plan.amount,
        period: 'month',
        tax_mode: 'tax_excluded',
        source_url: 'https://www.spotify.com/ar/premium/',
        source_type: 'manual_verified',
        last_verified_at: new Date().toISOString(),
        status: 'verified',
        confidence_score: 70,
      }, { onConflict: 'service_id,plan_id,country_code' });
  }

  console.log('[Seed] Spotify AR seeded');

  // ─── Bump catalog version ─────────────────────────────────
  await supabase
    .from('pe_catalog_versions')
    .upsert({
      country_code: 'AR',
      version: 2,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'country_code' });

  console.log('[Seed] Done. Netflix + Spotify AR seeded with verified prices.');
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
