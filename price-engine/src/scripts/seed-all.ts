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

async function seedAll(): Promise<void> {
  // ─── Cloud Storage ──────────────────────────────────────
  console.log('[Seed] Cloud Storage...');
  const cloud: ServiceSeed[] = [
    {
      slug: 'icloud',
      provider: 'Apple',
      name: 'iCloud+',
      category: 'cloud',
      subcategory: 'storage',
      official_url: 'https://www.icloud.com',
      priority: 1,
      plans: [
        { slug: '50gb', name: '50 GB', amount: 1900, period: 'month' },
        { slug: '200gb', name: '200 GB', amount: 3900, period: 'month' },
        { slug: '2tb', name: '2 TB', amount: 9900, period: 'month' },
        { slug: '6tb', name: '6 TB', amount: 19900, period: 'month' },
      ],
    },
    {
      slug: 'google-one',
      provider: 'Google',
      name: 'Google One',
      category: 'cloud',
      subcategory: 'storage',
      official_url: 'https://one.google.com',
      priority: 2,
      plans: [
        { slug: '100gb', name: '100 GB', amount: 2499, period: 'month' },
        { slug: '200gb', name: '200 GB', amount: 3499, period: 'month' },
        { slug: '2tb', name: '2 TB', amount: 7999, period: 'month' },
        { slug: '5tb', name: '5 TB', amount: 12999, period: 'month' },
      ],
    },
    {
      slug: 'dropbox',
      provider: 'Dropbox',
      name: 'Dropbox',
      category: 'cloud',
      subcategory: 'storage',
      official_url: 'https://www.dropbox.com',
      priority: 3,
      plans: [
        { slug: 'plus', name: 'Plus (2 TB)', amount: 9999, period: 'month' },
        { slug: 'family', name: 'Family (2 TB)', amount: 13999, period: 'month' },
      ],
    },
    {
      slug: 'onedrive',
      provider: 'Microsoft',
      name: 'Microsoft OneDrive',
      category: 'cloud',
      subcategory: 'storage',
      official_url: 'https://www.microsoft.com/microsoft-365/onedrive/online-cloud-storage',
      priority: 2,
      plans: [
        { slug: 'standalone-100gb', name: '100 GB', amount: 2900, period: 'month' },
        { slug: 'standalone-1tb', name: '1 TB', amount: 4900, period: 'month' },
      ],
    },
    {
      slug: 'mega',
      provider: 'MEGA',
      name: 'MEGA',
      category: 'cloud',
      subcategory: 'storage',
      official_url: 'https://mega.io',
      priority: 3,
      plans: [
        { slug: 'pro-lite', name: 'Pro Lite (400 GB)', amount: 3499, period: 'month' },
        { slug: 'pro-i', name: 'Pro I (2 TB)', amount: 6999, period: 'month' },
        { slug: 'pro-ii', name: 'Pro II (8 TB)', amount: 13999, period: 'month' },
        { slug: 'pro-iii', name: 'Pro III (16 TB)', amount: 20999, period: 'month' },
      ],
    },
  ];
  for (const svc of cloud) await seedService(svc);

  // ─── Productivity ───────────────────────────────────────
  console.log('[Seed] Productivity...');
  const productivity: ServiceSeed[] = [
    {
      slug: 'google-workspace',
      provider: 'Google',
      name: 'Google Workspace',
      category: 'productivity',
      official_url: 'https://workspace.google.com',
      priority: 2,
      plans: [
        { slug: 'business-starter', name: 'Business Starter', amount: 3500, period: 'month' },
        { slug: 'business-standard', name: 'Business Standard', amount: 7000, period: 'month' },
        { slug: 'business-plus', name: 'Business Plus', amount: 10500, period: 'month' },
      ],
    },
    {
      slug: 'microsoft-365',
      provider: 'Microsoft',
      name: 'Microsoft 365',
      category: 'productivity',
      official_url: 'https://www.microsoft.com/microsoft-365',
      priority: 1,
      plans: [
        { slug: 'personal', name: 'Personal', amount: 4900, period: 'month' },
        { slug: 'family', name: 'Familiar', amount: 6900, period: 'month' },
      ],
    },
    {
      slug: 'notion',
      provider: 'Notion',
      name: 'Notion',
      category: 'productivity',
      official_url: 'https://www.notion.so',
      priority: 3,
      plans: [
        { slug: 'plus', name: 'Plus', amount: 4800, period: 'month' },
        { slug: 'business', name: 'Business', amount: 9000, period: 'month' },
      ],
    },
    {
      slug: 'figma',
      provider: 'Figma',
      name: 'Figma',
      category: 'productivity',
      official_url: 'https://www.figma.com',
      priority: 3,
      plans: [
        { slug: 'professional', name: 'Professional', amount: 4500, period: 'month' },
      ],
    },
    {
      slug: 'adobe-cc',
      provider: 'Adobe',
      name: 'Adobe Creative Cloud',
      category: 'productivity',
      official_url: 'https://www.adobe.com/creativecloud.html',
      priority: 1,
      plans: [
        { slug: 'single-app', name: 'Single App', amount: 14999, period: 'month' },
        { slug: 'all-apps', name: 'All Apps', amount: 29999, period: 'month' },
      ],
    },
    {
      slug: 'canva',
      provider: 'Canva',
      name: 'Canva',
      category: 'productivity',
      official_url: 'https://www.canva.com',
      priority: 3,
      plans: [
        { slug: 'pro', name: 'Pro', amount: 4999, period: 'month' },
        { slug: 'teams', name: 'Teams', amount: 8999, period: 'month' },
      ],
    },
  ];
  for (const svc of productivity) await seedService(svc);

  // ─── Gaming ─────────────────────────────────────────────
  console.log('[Seed] Gaming...');
  const gaming: ServiceSeed[] = [
    {
      slug: 'xbox-game-pass',
      provider: 'Microsoft',
      name: 'Xbox Game Pass',
      category: 'gaming',
      official_url: 'https://www.xbox.com/game-pass',
      priority: 2,
      plans: [
        { slug: 'core', name: 'Core', amount: 4999, period: 'month' },
        { slug: 'ultimate', name: 'Ultimate', amount: 9999, period: 'month' },
      ],
    },
    {
      slug: 'playstation-plus',
      provider: 'Sony',
      name: 'PlayStation Plus',
      category: 'gaming',
      official_url: 'https://www.playstation.com/ps-plus',
      priority: 2,
      plans: [
        { slug: 'essential', name: 'Essential', amount: 5999, period: 'month' },
        { slug: 'extra', name: 'Extra', amount: 8999, period: 'month' },
        { slug: 'premium', name: 'Premium', amount: 10999, period: 'month' },
      ],
    },
    {
      slug: 'nintendo-switch-online',
      provider: 'Nintendo',
      name: 'Nintendo Switch Online',
      category: 'gaming',
      official_url: 'https://www.nintendo.com/switch-online',
      priority: 3,
      plans: [
        { slug: 'individual', name: 'Individual', amount: 2999, period: 'month' },
        { slug: 'family', name: 'Familiar', amount: 4999, period: 'month' },
      ],
    },
    {
      slug: 'ea-play',
      provider: 'EA',
      name: 'EA Play',
      category: 'gaming',
      official_url: 'https://www.ea.com/ea-play',
      priority: 3,
      plans: [
        { slug: 'standard', name: 'Standard', amount: 3999, period: 'month' },
        { slug: 'pro', name: 'Pro', amount: 6999, period: 'month' },
      ],
    },
  ];
  for (const svc of gaming) await seedService(svc);

  // ─── AI ─────────────────────────────────────────────────
  console.log('[Seed] AI...');
  const ai: ServiceSeed[] = [
    {
      slug: 'chatgpt',
      provider: 'OpenAI',
      name: 'ChatGPT',
      category: 'ai',
      official_url: 'https://chat.openai.com',
      priority: 1,
      plans: [
        { slug: 'plus', name: 'Plus', amount: 20000, period: 'month' },
        { slug: 'team', name: 'Team', amount: 25000, period: 'month' },
      ],
    },
    {
      slug: 'claude',
      provider: 'Anthropic',
      name: 'Claude',
      category: 'ai',
      official_url: 'https://claude.ai',
      priority: 1,
      plans: [
        { slug: 'pro', name: 'Pro', amount: 20000, period: 'month' },
      ],
    },
    {
      slug: 'gemini',
      provider: 'Google',
      name: 'Gemini Advanced',
      category: 'ai',
      official_url: 'https://gemini.google.com',
      priority: 2,
      plans: [
        { slug: 'advanced', name: 'Advanced', amount: 20000, period: 'month' },
      ],
    },
    {
      slug: 'github-copilot',
      provider: 'GitHub',
      name: 'GitHub Copilot',
      category: 'ai',
      official_url: 'https://github.com/features/copilot',
      priority: 2,
      plans: [
        { slug: 'individual', name: 'Individual', amount: 10000, period: 'month' },
        { slug: 'business', name: 'Business', amount: 19000, period: 'month' },
      ],
    },
  ];
  for (const svc of ai) await seedService(svc);

  // ─── Telco / Local AR ───────────────────────────────────
  console.log('[Seed] Telco / Local AR...');
  const telco: ServiceSeed[] = [
    {
      slug: 'flow',
      provider: 'Telecentro',
      name: 'Flow',
      category: 'telco',
      subcategory: 'streaming',
      official_url: 'https://www.flow.com.ar',
      priority: 2,
      plans: [
        { slug: 'full', name: 'Flow Full', amount: 6999, period: 'month' },
        { slug: 'plus', name: 'Flow+', amount: 4999, period: 'month' },
      ],
    },
    {
      slug: 'personal-play',
      provider: 'Personal',
      name: 'Personal Play',
      category: 'telco',
      subcategory: 'streaming',
      official_url: 'https://play.personal.com.ar',
      priority: 3,
      plans: [
        { slug: 'standard', name: 'Estándar', amount: 3999, period: 'month' },
      ],
    },
    {
      slug: 'movistar-play',
      provider: 'Movistar',
      name: 'Movistar Play',
      category: 'telco',
      subcategory: 'streaming',
      official_url: 'https://play.movistar.com.ar',
      priority: 3,
      plans: [
        { slug: 'standard', name: 'Estándar', amount: 3499, period: 'month' },
      ],
    },
    {
      slug: 'claro-video',
      provider: 'Claro',
      name: 'Claro Video',
      category: 'telco',
      subcategory: 'streaming',
      official_url: 'https://www.clarovideo.com',
      priority: 3,
      plans: [
        { slug: 'standard', name: 'Estándar', amount: 2999, period: 'month' },
      ],
    },
  ];
  for (const svc of telco) await seedService(svc);

  // ─── Security ───────────────────────────────────────────
  console.log('[Seed] Security...');
  const security: ServiceSeed[] = [
    {
      slug: '1password',
      provider: '1Password',
      name: '1Password',
      category: 'security',
      official_url: 'https://1password.com',
      priority: 3,
      plans: [
        { slug: 'individual', name: 'Individual', amount: 2999, period: 'month' },
        { slug: 'family', name: 'Families', amount: 4999, period: 'month' },
      ],
    },
    {
      slug: 'nordvpn',
      provider: 'Nord Security',
      name: 'NordVPN',
      category: 'security',
      official_url: 'https://nordvpn.com',
      priority: 3,
      plans: [
        { slug: 'monthly', name: 'Mensual', amount: 5999, period: 'month' },
        { slug: 'annual', name: 'Anual', amount: 39999, period: 'year' },
      ],
    },
    {
      slug: 'expressvpn',
      provider: 'ExpressVPN',
      name: 'ExpressVPN',
      category: 'security',
      official_url: 'https://www.expressvpn.com',
      priority: 3,
      plans: [
        { slug: 'monthly', name: 'Mensual', amount: 8999, period: 'month' },
        { slug: 'annual', name: 'Anual', amount: 69999, period: 'year' },
      ],
    },
  ];
  for (const svc of security) await seedService(svc);

  // ─── Bump catalog version ───────────────────────────────
  await supabase
    .from('pe_catalog_versions')
    .upsert({
      country_code: 'AR',
      version: 3,
      updated_at: now(),
    }, { onConflict: 'country_code' });

  console.log('[Seed] All remaining categories done.');
}

seedAll().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
