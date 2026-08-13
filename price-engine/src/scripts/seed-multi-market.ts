import { supabase } from '../db/client.js';

interface PlanDef {
  slug: string;
  name: string;
  period: 'month' | 'year';
}

interface MarketPrice {
  country: string;
  currency: string;
  amount: number;
  tax_mode: string;
  source_url: string;
  status?: string;
}

interface ServiceDef {
  slug: string;
  provider: string;
  name: string;
  category: string;
  official_url: string;
  priority: number;
  plans: Array<PlanDef & { markets: MarketPrice[] }>;
}

const now = () => new Date().toISOString();

const SERVICES: ServiceDef[] = [
  {
    slug: 'netflix',
    provider: 'Netflix',
    name: 'Netflix',
    category: 'streaming',
    official_url: 'https://www.netflix.com',
    priority: 1,
    plans: [
      {
        slug: 'basic', name: 'Básico', period: 'month',
        markets: [
          { country: 'AR', currency: 'ARS', amount: 8999, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/ar/' },
          { country: 'BR', currency: 'BRL', amount: 2590, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/br/' },
          { country: 'MX', currency: 'MXN', amount: 13900, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/mx/' },
          { country: 'ES', currency: 'EUR', amount: 799, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/es/' },
        ],
      },
      {
        slug: 'standard', name: 'Estándar', period: 'month',
        markets: [
          { country: 'AR', currency: 'ARS', amount: 14999, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/ar/' },
          { country: 'BR', currency: 'BRL', amount: 3990, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/br/' },
          { country: 'MX', currency: 'MXN', amount: 21900, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/mx/' },
          { country: 'US', currency: 'USD', amount: 1554, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/' },
          { country: 'ES', currency: 'EUR', amount: 1299, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/es/' },
        ],
      },
      {
        slug: 'premium', name: 'Premium', period: 'month',
        markets: [
          { country: 'AR', currency: 'ARS', amount: 19999, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/ar/' },
          { country: 'BR', currency: 'BRL', amount: 5590, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/br/' },
          { country: 'MX', currency: 'MXN', amount: 29900, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/mx/' },
          { country: 'US', currency: 'USD', amount: 2299, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/' },
          { country: 'ES', currency: 'EUR', amount: 1799, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/es/' },
        ],
      },
      {
        slug: 'standard-ads', name: 'Standard with Ads', period: 'month',
        markets: [
          { country: 'US', currency: 'USD', amount: 699, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/' },
          { country: 'ES', currency: 'EUR', amount: 599, tax_mode: 'tax_excluded', source_url: 'https://www.netflix.com/es/' },
        ],
      },
    ],
  },
  {
    slug: 'spotify',
    provider: 'Spotify',
    name: 'Spotify Premium',
    category: 'music',
    official_url: 'https://spotify.com',
    priority: 1,
    plans: [
      {
        slug: 'student', name: 'Student', period: 'month',
        markets: [
          { country: 'AR', currency: 'ARS', amount: 2299, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/ar/premium/' },
          { country: 'BR', currency: 'BRL', amount: 1199, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/br/premium/' },
          { country: 'MX', currency: 'MXN', amount: 4900, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/mx/premium/' },
          { country: 'US', currency: 'USD', amount: 599, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/us/premium/' },
          { country: 'ES', currency: 'EUR', amount: 399, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/es/premium/' },
        ],
      },
      {
        slug: 'individual', name: 'Individual', period: 'month',
        markets: [
          { country: 'AR', currency: 'ARS', amount: 4499, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/ar/premium/' },
          { country: 'BR', currency: 'BRL', amount: 2199, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/br/premium/' },
          { country: 'MX', currency: 'MXN', amount: 11500, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/mx/premium/' },
          { country: 'US', currency: 'USD', amount: 1199, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/us/premium/' },
          { country: 'ES', currency: 'EUR', amount: 1099, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/es/premium/' },
        ],
      },
      {
        slug: 'duo', name: 'Duo', period: 'month',
        markets: [
          { country: 'AR', currency: 'ARS', amount: 5999, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/ar/premium/' },
          { country: 'BR', currency: 'BRL', amount: 2799, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/br/premium/' },
          { country: 'MX', currency: 'MXN', amount: 14900, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/mx/premium/' },
          { country: 'US', currency: 'USD', amount: 1699, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/us/premium/' },
          { country: 'ES', currency: 'EUR', amount: 1499, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/es/premium/' },
        ],
      },
      {
        slug: 'family', name: 'Family', period: 'month',
        markets: [
          { country: 'AR', currency: 'ARS', amount: 7599, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/ar/premium/' },
          { country: 'BR', currency: 'BRL', amount: 3499, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/br/premium/' },
          { country: 'MX', currency: 'MXN', amount: 17900, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/mx/premium/' },
          { country: 'US', currency: 'USD', amount: 1999, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/us/premium/' },
          { country: 'ES', currency: 'EUR', amount: 1799, tax_mode: 'tax_excluded', source_url: 'https://www.spotify.com/es/premium/' },
        ],
      },
    ],
  },
];

async function seedMultiMarket(): Promise<void> {
  for (const svc of SERVICES) {
    const { data: serviceRow, error: svcErr } = await supabase
      .from('pe_services')
      .upsert({
        slug: svc.slug,
        provider: svc.provider,
        name: svc.name,
        category: svc.category,
        official_url: svc.official_url,
        priority: svc.priority,
        active: true,
      }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (svcErr || !serviceRow) {
      console.error(`  [ERROR] ${svc.slug}: ${svcErr?.message}`);
      continue;
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

      for (const m of plan.markets) {
        const { error: priceErr } = await supabase
          .from('pe_regional_prices')
          .upsert({
            service_id: serviceId,
            plan_id: planRow.id,
            country_code: m.country,
            currency: m.currency,
            amount: m.amount,
            period: plan.period,
            tax_mode: m.tax_mode,
            source_url: m.source_url,
            source_type: 'manual_verified',
            last_verified_at: now(),
            status: m.status ?? 'verified',
            confidence_score: 70,
            valid_from: now(),
          }, { onConflict: 'service_id,plan_id,country_code,period' });

        if (priceErr) {
          console.error(`  [ERROR] ${svc.slug}/${plan.slug}/${m.country}: ${priceErr.message}`);
        }
      }
    }

    console.log(`  [OK] ${svc.slug} — ${svc.plans.length} plans across ${svc.plans[0].markets.length} markets`);
  }

  for (const country of ['AR', 'BR', 'MX', 'US', 'ES']) {
    await supabase
      .from('pe_catalog_versions')
      .upsert({
        country_code: country,
        updated_at: now(),
      }, { onConflict: 'country_code' });
  }

  console.log('[Seed] Multi-market seed complete.');
}

seedMultiMarket().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
