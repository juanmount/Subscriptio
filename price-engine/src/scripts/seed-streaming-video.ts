import { supabase } from '../db/client.js';

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

interface PlanSeed {
  slug: string;
  name: string;
  amount: number;
  period: 'month' | 'year';
  tax_mode?: string;
}

const now = () => new Date().toISOString();

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

    await supabase
      .from('pe_regional_prices')
      .upsert({
        service_id: serviceId,
        plan_id: planRow.id,
        country_code: 'AR',
        currency: 'ARS',
        amount: plan.amount,
        period: plan.period,
        tax_mode: plan.tax_mode ?? 'tax_excluded',
        source_url: svc.official_url,
        source_type: 'manual_verified',
        last_verified_at: now(),
        status: 'verified',
        confidence_score: 70,
      }, { onConflict: 'service_id,plan_id,country_code' });
  }

  console.log(`  [OK] ${svc.slug} — ${svc.plans.length} plans`);
}

async function seedStreamingVideo(): Promise<void> {
  console.log('[Seed] Streaming Video category...');

  const services: ServiceSeed[] = [
    {
      slug: 'disney-plus',
      provider: 'Disney',
      name: 'Disney+',
      category: 'streaming',
      subcategory: 'video',
      official_url: 'https://www.disneyplus.com/ar',
      priority: 1,
      plans: [
        { slug: 'standard', name: 'Estándar', amount: 7999, period: 'month' },
        { slug: 'premium', name: 'Premium', amount: 11999, period: 'month' },
      ],
    },
    {
      slug: 'max',
      provider: 'Warner Bros. Discovery',
      name: 'Max',
      category: 'streaming',
      subcategory: 'video',
      official_url: 'https://www.max.com/ar',
      priority: 1,
      plans: [
        { slug: 'standard', name: 'Estándar', amount: 8999, period: 'month' },
        { slug: 'premium', name: 'Premium', amount: 14999, period: 'month' },
      ],
    },
    {
      slug: 'prime-video',
      provider: 'Amazon',
      name: 'Prime Video',
      category: 'streaming',
      subcategory: 'video',
      official_url: 'https://www.primevideo.com',
      priority: 2,
      plans: [
        { slug: 'standard', name: 'Estándar', amount: 3999, period: 'month' },
      ],
    },
    {
      slug: 'apple-tv-plus',
      provider: 'Apple',
      name: 'Apple TV+',
      category: 'streaming',
      subcategory: 'video',
      official_url: 'https://tv.apple.com',
      priority: 2,
      plans: [
        { slug: 'standard', name: 'Estándar', amount: 7900, period: 'month' },
        { slug: 'annual', name: 'Anual', amount: 79000, period: 'year' },
      ],
    },
    {
      slug: 'paramount-plus',
      provider: 'Paramount',
      name: 'Paramount+',
      category: 'streaming',
      subcategory: 'video',
      official_url: 'https://www.paramountplus.com/ar',
      priority: 2,
      plans: [
        { slug: 'standard', name: 'Estándar', amount: 4999, period: 'month' },
        { slug: 'premium', name: 'Premium', amount: 6999, period: 'month' },
      ],
    },
    {
      slug: 'crunchyroll',
      provider: 'Crunchyroll',
      name: 'Crunchyroll',
      category: 'streaming',
      subcategory: 'video',
      official_url: 'https://www.crunchyroll.com',
      priority: 3,
      plans: [
        { slug: 'fan', name: 'Fan', amount: 5999, period: 'month' },
        { slug: 'mega-fan', name: 'Mega Fan', amount: 7999, period: 'month' },
      ],
    },
    {
      slug: 'youtube-premium',
      provider: 'Google',
      name: 'YouTube Premium',
      category: 'streaming',
      subcategory: 'video',
      official_url: 'https://www.youtube.com/premium',
      priority: 2,
      plans: [
        { slug: 'individual', name: 'Individual', amount: 6999, period: 'month' },
        { slug: 'family', name: 'Familiar', amount: 12999, period: 'month' },
      ],
    },
  ];

  for (const svc of services) {
    await seedService(svc);
  }

  console.log('[Seed] Streaming Video done.');
}

seedStreamingVideo().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
