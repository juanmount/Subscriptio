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

async function seedMusic(): Promise<void> {
  console.log('[Seed] Music category...');

  const services: ServiceSeed[] = [
    {
      slug: 'apple-music',
      provider: 'Apple',
      name: 'Apple Music',
      category: 'music',
      official_url: 'https://music.apple.com',
      priority: 2,
      plans: [
        { slug: 'individual', name: 'Individual', amount: 5900, period: 'month' },
        { slug: 'family', name: 'Familiar', amount: 9900, period: 'month' },
        { slug: 'student', name: 'Student', amount: 2900, period: 'month' },
        { slug: 'annual', name: 'Anual', amount: 59000, period: 'year' },
      ],
    },
    {
      slug: 'youtube-music',
      provider: 'Google',
      name: 'YouTube Music',
      category: 'music',
      official_url: 'https://music.youtube.com',
      priority: 2,
      plans: [
        { slug: 'individual', name: 'Individual', amount: 4999, period: 'month' },
        { slug: 'family', name: 'Familiar', amount: 8999, period: 'month' },
      ],
    },
    {
      slug: 'deezer',
      provider: 'Deezer',
      name: 'Deezer',
      category: 'music',
      official_url: 'https://www.deezer.com/ar',
      priority: 3,
      plans: [
        { slug: 'premium', name: 'Premium', amount: 4999, period: 'month' },
        { slug: 'family', name: 'Familiar', amount: 7999, period: 'month' },
      ],
    },
    {
      slug: 'tidal',
      provider: 'Tidal',
      name: 'Tidal',
      category: 'music',
      official_url: 'https://tidal.com',
      priority: 3,
      plans: [
        { slug: 'standard', name: 'Standard', amount: 4999, period: 'month' },
        { slug: 'family', name: 'Familiar', amount: 7499, period: 'month' },
      ],
    },
  ];

  for (const svc of services) {
    await seedService(svc);
  }

  console.log('[Seed] Music done.');
}

seedMusic().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
