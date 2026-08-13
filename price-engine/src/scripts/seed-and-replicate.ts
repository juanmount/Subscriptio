import { supabase } from '../db/client.js';

const now = () => new Date().toISOString();

// ─── Types ─────────────────────────────────────────────────
interface PlanSeed {
  slug: string;
  name: string;
  amount: number;
  period: 'month' | 'year';
  currency: 'ARS' | 'USD';
  tax_mode?: string;
  status?: string;
}
interface ServiceSeed {
  slug: string;
  provider: string;
  name: string;
  category: string;
  subcategory?: string;
  official_url: string;
  priority: number;
  plans: PlanSeed[];
}

// ─── Helper ────────────────────────────────────────────────
async function seedService(svc: ServiceSeed): Promise<void> {
  const { data: serviceRow, error: svcErr } = await supabase
    .from('pe_services')
    .upsert({
      slug: svc.slug,
      provider: svc.provider,
      name: svc.name,
      category: svc.category,
      subcategory: svc.subcategory ?? null,
      official_url: svc.official_url,
      priority: svc.priority,
      active: true,
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (svcErr || !serviceRow) {
    console.error(`  [ERROR] ${svc.slug}: ${svcErr?.message}`);
    return;
  }

  const serviceId = serviceRow.id;

  for (const plan of svc.plans) {
    const { data: planRow, error: planErr } = await supabase
      .from('pe_plans')
      .upsert({
        service_id: serviceId,
        slug: plan.slug,
        name: plan.name,
        period: plan.period,
        active: true,
      }, { onConflict: 'service_id,slug' })
      .select('id')
      .single();

    if (planErr || !planRow) {
      console.error(`  [ERROR] ${svc.slug}/${plan.slug}: ${planErr?.message}`);
      continue;
    }

    const country = plan.currency === 'ARS' ? 'AR' : 'US';

    await supabase
      .from('pe_regional_prices')
      .upsert({
        service_id: serviceId,
        plan_id: planRow.id,
        country_code: country,
        currency: plan.currency,
        amount: plan.amount,
        period: plan.period,
        tax_mode: plan.tax_mode ?? 'tax_excluded',
        source_url: svc.official_url,
        source_type: 'manual_verified',
        last_verified_at: plan.status === 'manual_required' ? null : now(),
        status: plan.status ?? (plan.amount === 0 ? 'manual_required' : 'verified'),
        confidence_score: plan.status === 'manual_required' ? 0 : 70,
      }, { onConflict: 'service_id,plan_id,country_code' });
  }

  console.log(`  [OK] ${svc.slug} — ${svc.plans.length} plans`);
}

// ─── New services only (outdoors, weather, surf, padel, etc.) ──
const NEW_SERVICES: ServiceSeed[] = [
  // Fitness & Health
  { slug: 'garmin-connect-plus', provider: 'Garmin', name: 'Garmin Connect+', category: 'fitness', official_url: 'https://garmin.com/connect', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'peloton-app', provider: 'Peloton', name: 'Peloton App', category: 'fitness', official_url: 'https://onepeloton.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'freeletics', provider: 'Freeletics', name: 'Freeletics', category: 'fitness', official_url: 'https://freeletics.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'centr', provider: 'Centr', name: 'Centr', category: 'fitness', official_url: 'https://centr.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'fitbod', provider: 'Fitbod', name: 'Fitbod', category: 'fitness', official_url: 'https://fitbod.me', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'better-sleep', provider: 'BetterSleep', name: 'BetterSleep', category: 'fitness', official_url: 'https://bettersleep.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'down-dog', provider: 'Down Dog', name: 'Down Dog', category: 'fitness', official_url: 'https://downdogapp.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'sweat', provider: 'Sweat', name: 'Sweat', category: 'fitness', official_url: 'https://sweat.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'alo-moves', provider: 'Alo Moves', name: 'Alo Moves', category: 'fitness', official_url: 'https://alomoves.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'les-mills-plus', provider: 'Les Mills', name: 'Les Mills+', category: 'fitness', official_url: 'https://lesmills.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'alltrails-plus', provider: 'AllTrails', name: 'AllTrails+', category: 'fitness', official_url: 'https://alltrails.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'flo-premium', provider: 'Flo Health', name: 'Flo Premium', category: 'fitness', official_url: 'https://flo.health', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'sleep-cycle-premium', provider: 'Sleep Cycle', name: 'Sleep Cycle Premium', category: 'fitness', official_url: 'https://sleepcycle.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'fitbit-premium', provider: 'Fitbit', name: 'Fitbit Premium', category: 'fitness', official_url: 'https://fitbit.com/premium', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'komoot-premium', provider: 'Komoot', name: 'Komoot Premium', category: 'fitness', official_url: 'https://komoot.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'onx-hunt', provider: 'onX', name: 'onX Hunt', category: 'fitness', official_url: 'https://onxmaps.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'onx-backcountry', provider: 'onX', name: 'onX Backcountry', category: 'fitness', official_url: 'https://onxmaps.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'gaia-gps-premium', provider: 'Gaia GPS', name: 'Gaia GPS Premium', category: 'fitness', official_url: 'https://gaiagps.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'caltopo-pro', provider: 'Caltopo', name: 'Caltopo Pro', category: 'fitness', official_url: 'https://caltopo.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'relive-plus', provider: 'Relive', name: 'Relive Plus', category: 'fitness', official_url: 'https://relive.cc', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'cyclemeter', provider: 'Cyclemeter', name: 'Cyclemeter', category: 'fitness', official_url: 'https://cyclemeterapp.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'mapmyrun-premium', provider: 'MapMyRun', name: 'MapMyRun Premium', category: 'fitness', official_url: 'https://mapmyrun.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'trainerroad', provider: 'TrainerRoad', name: 'TrainerRoad', category: 'fitness', official_url: 'https://trainerroad.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'rouvy', provider: 'Rouvy', name: 'Rouvy', category: 'fitness', official_url: 'https://rouvy.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'insight-timer-premium', provider: 'Insight Timer', name: 'Insight Timer Premium', category: 'fitness', official_url: 'https://insighttimer.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'meditopia-premium', provider: 'Meditopia', name: 'Meditopia Premium', category: 'fitness', official_url: 'https://meditopia.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'nike-training-club-premium', provider: 'Nike', name: 'Nike Training Club Premium', category: 'fitness', official_url: 'https://nike.com/ntc', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'adidas-training', provider: 'Adidas', name: 'Adidas Training', category: 'fitness', official_url: 'https://adidas.com/training', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'jefit-elite', provider: 'JEFIT', name: 'JEFIT Elite', category: 'fitness', official_url: 'https://jeft.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'strong-workout-tracker', provider: 'Strong', name: 'Strong Workout Tracker', category: 'fitness', official_url: 'https://strongapp.site', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'polar-flow-premium', provider: 'Polar', name: 'Polar Flow Premium', category: 'fitness', official_url: 'https://flow.polar.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'coros-premium', provider: 'Coros', name: 'Coros Premium', category: 'fitness', official_url: 'https://coros.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'wahoo-sync-premium', provider: 'Wahoo', name: 'Wahoo SYNC Premium', category: 'fitness', official_url: 'https://wahoofitness.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // Surf, kitesurf, snow
  { slug: 'surfline-premium', provider: 'Surfline', name: 'Surfline Premium', category: 'fitness', subcategory: 'surf', official_url: 'https://surfline.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'magicseaweed-plus', provider: 'Magicseaweed', name: 'Magicseaweed Plus', category: 'fitness', subcategory: 'surf', official_url: 'https://magicseaweed.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'soli-forecast', provider: 'Soli', name: 'Soli Forecast', category: 'fitness', subcategory: 'surf', official_url: 'https://soli.app', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'windy-app-pro', provider: 'Windy.app', name: 'Windy.app Pro', category: 'fitness', subcategory: 'weather', official_url: 'https://windy.app', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'ikitesurf-premium', provider: 'iKitesurf', name: 'iKitesurf Premium', category: 'fitness', subcategory: 'kitesurf', official_url: 'https://ikitesurf.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'windguru-premium', provider: 'Windguru', name: 'Windguru Premium', category: 'fitness', subcategory: 'kitesurf', official_url: 'https://windguru.cz', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'snow-forecast-premium', provider: 'Snow-Forecast', name: 'Snow-Forecast Premium', category: 'fitness', subcategory: 'snow', official_url: 'https://snow-forecast.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'onthesnow', provider: 'OnTheSnow', name: 'OnTheSnow', category: 'fitness', subcategory: 'snow', official_url: 'https://onthesnow.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'slopes-premium', provider: 'Slopes', name: 'Slopes Premium', category: 'fitness', subcategory: 'snow', official_url: 'https://getslopes.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'fatmap-premium', provider: 'Fatmap', name: 'Fatmap Premium', category: 'fitness', subcategory: 'outdoors', official_url: 'https://fatmap.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'opensnow-premium', provider: 'OpenSnow', name: 'OpenSnow Premium', category: 'fitness', subcategory: 'snow', official_url: 'https://opensnow.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // Weather
  { slug: 'carrot-weather', provider: 'Carrot Weather', name: 'Carrot Weather', category: 'fitness', subcategory: 'weather', official_url: 'https://carrotweather.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'windy-premium', provider: 'Windy', name: 'Windy Premium', category: 'fitness', subcategory: 'weather', official_url: 'https://windy.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'weather-underground', provider: 'Weather Underground', name: 'Weather Underground', category: 'fitness', subcategory: 'weather', official_url: 'https://wunderground.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'myradar-pro', provider: 'MyRadar', name: 'MyRadar Pro', category: 'fitness', subcategory: 'weather', official_url: 'https://myradar.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'predictwind', provider: 'PredictWind', name: 'PredictWind', category: 'fitness', subcategory: 'weather', official_url: 'https://predictwind.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'buoyweather-premium', provider: 'Buoyweather', name: 'Buoyweather Premium', category: 'fitness', subcategory: 'weather', official_url: 'https://buoyweather.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // Padel y tenis
  { slug: 'playtomic-premium', provider: 'Playtomic', name: 'Playtomic Premium', category: 'fitness', subcategory: 'padel', official_url: 'https://playtomic.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'swingvision-pro', provider: 'SwingVision', name: 'SwingVision Pro', category: 'fitness', subcategory: 'tennis', official_url: 'https://swing.tennis', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'tenniskeeper-premium', provider: 'TennisKeeper', name: 'TennisKeeper Premium', category: 'fitness', subcategory: 'tennis', official_url: 'https://tenniskeeper.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // Golf
  { slug: 'golfshot-pro', provider: 'Golfshot', name: 'Golfshot Pro', category: 'fitness', subcategory: 'golf', official_url: 'https://golfshot.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: '18birdies-premium', provider: '18Birdies', name: '18Birdies Premium', category: 'fitness', subcategory: 'golf', official_url: 'https://18birdies.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'hole19-premium', provider: 'Hole19', name: 'Hole19 Premium', category: 'fitness', subcategory: 'golf', official_url: 'https://hole19golf.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'arccos-caddie', provider: 'Arccos', name: 'Arccos Caddie', category: 'fitness', subcategory: 'golf', official_url: 'https://arccosgolf.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // Buceo
  { slug: 'padi-club', provider: 'PADI', name: 'PADI Club', category: 'fitness', subcategory: 'dive', official_url: 'https://padi.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // Escalada
  { slug: 'vertical-life-premium', provider: 'Vertical Life', name: 'Vertical Life Premium', category: 'fitness', subcategory: 'climb', official_url: 'https://verticallife.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // Pesca y caza
  { slug: 'fishbrain-premium', provider: 'Fishbrain', name: 'Fishbrain Premium', category: 'fitness', subcategory: 'fishing', official_url: 'https://fishbrain.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'huntstand-pro', provider: 'HuntStand', name: 'HuntStand Pro', category: 'fitness', subcategory: 'hunting', official_url: 'https://huntstand.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
];

async function seedAndReplicate(): Promise<void> {
  // Step 1: Seed new services (US baseline)
  console.log(`[Seed] Seeding ${NEW_SERVICES.length} new services to US baseline...`);
  for (const svc of NEW_SERVICES) {
    await seedService(svc);
  }

  // Step 2: Replicate US prices to all other markets
  console.log('\n[Replicate] Replicating US prices to all markets...');
  const { data: markets, error: mErr } = await supabase
    .from('pe_markets')
    .select('country_code')
    .eq('enabled', true);
  if (mErr || !markets) { console.error('[ERROR] markets:', mErr?.message); return; }

  const allCountries = (markets as { country_code: string }[]).map((m) => m.country_code);
  console.log(`[Replicate] Markets: ${allCountries.join(', ')}`);

  const { data: usPrices, error } = await supabase
    .from('pe_regional_prices')
    .select('service_id, plan_id, currency, amount, period, tax_mode, source_url, source_type, status, confidence_score')
    .eq('country_code', 'US');

  if (error || !usPrices) { console.error('[ERROR] US prices:', error?.message); return; }
  console.log(`[Replicate] US baseline: ${usPrices.length} prices`);

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

  // Bump catalog versions
  const n = now();
  await supabase.from('pe_catalog_versions').upsert({ country_code: 'AR', version: 11, updated_at: n }, { onConflict: 'country_code' });
  await supabase.from('pe_catalog_versions').upsert({ country_code: 'US', version: 11, updated_at: n }, { onConflict: 'country_code' });

  console.log(`\n[Done] Total replicated: ${totalInserted} prices across ${allCountries.length - 1} markets`);
}

seedAndReplicate().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
