import { supabase } from '../db/client.js';

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

const now = () => new Date().toISOString();

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

// ─── Master catalog ────────────────────────────────────────
// Migrated from supabase-seed.ts + stub-catalog.ts
// Services with prices use their real currency (ARS for AR, USD for US/intl)
// Stubs without prices get amount=0, status=manual_required

const CATALOG: ServiceSeed[] = [
  // ═══ AI ═════════════════════════════════════════════════
  { slug: 'chatgpt', provider: 'OpenAI', name: 'ChatGPT', category: 'ai', official_url: 'https://chat.openai.com', priority: 1, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'plus', name: 'Plus', amount: 2000, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 20000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'claude', provider: 'Anthropic', name: 'Claude', category: 'ai', official_url: 'https://claude.ai', priority: 1, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2000, period: 'month', currency: 'USD' },
    { slug: 'pro-annual', name: 'Pro Anual', amount: 20000, period: 'year', currency: 'USD' },
    { slug: 'max-5x', name: 'Max 5x', amount: 10000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'elevenlabs', provider: 'ElevenLabs', name: 'ElevenLabs', category: 'ai', official_url: 'https://elevenlabs.io', priority: 3, plans: [
    { slug: 'starter', name: 'Starter', amount: 500, period: 'month', currency: 'USD' },
    { slug: 'creator', name: 'Creator', amount: 2200, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 9900, period: 'month', currency: 'USD' },
  ]},
  { slug: 'higgsfield', provider: 'Higgsfield', name: 'Higgsfield', category: 'ai', official_url: 'https://higgsfield.ai', priority: 3, plans: [
    { slug: 'creator', name: 'Creator', amount: 1500, period: 'month', currency: 'USD' },
    { slug: 'ultra', name: 'Ultra', amount: 3900, period: 'month', currency: 'USD' },
  ]},
  { slug: 'midjourney', provider: 'Midjourney', name: 'Midjourney', category: 'ai', official_url: 'https://midjourney.com', priority: 2, plans: [
    { slug: 'basic', name: 'Basic', amount: 1000, period: 'month', currency: 'USD' },
    { slug: 'standard', name: 'Standard', amount: 3000, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 6000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'perplexity', provider: 'Perplexity', name: 'Perplexity', category: 'ai', official_url: 'https://perplexity.ai', priority: 2, plans: [
    { slug: 'pro', name: 'Pro', amount: 2000, period: 'month', currency: 'USD' },
    { slug: 'pro-annual', name: 'Pro Anual', amount: 19200, period: 'year', currency: 'USD' },
  ]},
  { slug: 'cursor', provider: 'Cursor', name: 'Cursor', category: 'ai', official_url: 'https://cursor.com', priority: 2, plans: [
    { slug: 'hobby', name: 'Hobby', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2000, period: 'month', currency: 'USD' },
    { slug: 'teams', name: 'Teams', amount: 4000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'github-copilot', provider: 'GitHub', name: 'GitHub Copilot', category: 'ai', official_url: 'https://github.com/features/copilot', priority: 2, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 1000, period: 'month', currency: 'USD' },
    { slug: 'pro-plus', name: 'Pro+', amount: 3900, period: 'month', currency: 'USD' },
  ]},
  { slug: 'windsurf', provider: 'Windsurf', name: 'Windsurf', category: 'ai', official_url: 'https://windsurf.com', priority: 2, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2000, period: 'month', currency: 'USD' },
    { slug: 'max', name: 'Max', amount: 20000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'runway', provider: 'Runway', name: 'Runway', category: 'ai', official_url: 'https://runwayml.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'standard', name: 'Standard', amount: 1500, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 3500, period: 'month', currency: 'USD' },
  ]},
  { slug: 'gemini', provider: 'Google', name: 'Google Gemini', category: 'ai', official_url: 'https://gemini.google.com', priority: 2, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'ai-pro', name: 'AI Pro', amount: 1999, period: 'month', currency: 'USD' },
  ]},
  { slug: 'replit', provider: 'Replit', name: 'Replit', category: 'ai', official_url: 'https://replit.com', priority: 3, plans: [
    { slug: 'starter', name: 'Starter', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'core', name: 'Core', amount: 2500, period: 'month', currency: 'USD' },
    { slug: 'core-annual', name: 'Core Anual', amount: 24000, period: 'year', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 10000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'bolt', provider: 'Bolt', name: 'Bolt.new', category: 'ai', official_url: 'https://bolt.new', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2500, period: 'month', currency: 'USD' },
    { slug: 'teams', name: 'Teams', amount: 3000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'lovable', provider: 'Lovable', name: 'Lovable', category: 'ai', official_url: 'https://lovable.dev', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2500, period: 'month', currency: 'USD' },
    { slug: 'business', name: 'Business', amount: 5000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'grok', provider: 'xAI', name: 'Grok', category: 'ai', official_url: 'https://grok.x.ai', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'poe', provider: 'Quora', name: 'Poe', category: 'ai', official_url: 'https://poe.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'mistral', provider: 'Mistral', name: 'Mistral Le Chat', category: 'ai', official_url: 'https://chat.mistral.ai', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'deepl', provider: 'DeepL', name: 'DeepL Pro', category: 'ai', official_url: 'https://deepl.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'grammarly', provider: 'Grammarly', name: 'Grammarly Pro', category: 'ai', official_url: 'https://grammarly.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'jasper', provider: 'Jasper', name: 'Jasper', category: 'ai', official_url: 'https://jasper.ai', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'otter-ai', provider: 'Otter.ai', name: 'Otter.ai', category: 'ai', official_url: 'https://otter.ai', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'krea', provider: 'Krea', name: 'Krea', category: 'ai', official_url: 'https://krea.ai', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'leonardo-ai', provider: 'Leonardo', name: 'Leonardo AI', category: 'ai', official_url: 'https://leonardo.ai', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'ideogram', provider: 'Ideogram', name: 'Ideogram', category: 'ai', official_url: 'https://ideogram.ai', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'suno', provider: 'Suno', name: 'Suno', category: 'ai', official_url: 'https://suno.ai', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'heygen', provider: 'HeyGen', name: 'HeyGen', category: 'ai', official_url: 'https://heygen.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'synthesia', provider: 'Synthesia', name: 'Synthesia', category: 'ai', official_url: 'https://synthesia.io', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'descript', provider: 'Descript', name: 'Descript', category: 'ai', official_url: 'https://descript.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'opusclip', provider: 'OpusClip', name: 'OpusClip', category: 'ai', official_url: 'https://opus.pro', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'capcut', provider: 'ByteDance', name: 'CapCut Pro', category: 'ai', official_url: 'https://capcut.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Streaming Video ═════════════════════════════════════
  { slug: 'netflix', provider: 'Netflix', name: 'Netflix', category: 'streaming', subcategory: 'video', official_url: 'https://netflix.com', priority: 1, plans: [
    { slug: 'basic', name: 'Básico', amount: 8999, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
    { slug: 'standard', name: 'Estándar', amount: 14999, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
    { slug: 'premium', name: 'Premium', amount: 19999, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
  ]},
  { slug: 'disney-plus', provider: 'Disney', name: 'Disney+', category: 'streaming', subcategory: 'video', official_url: 'https://disneyplus.com', priority: 1, plans: [
    { slug: 'standard-ads', name: 'Standard Ads', amount: 9999, period: 'month', currency: 'ARS', tax_mode: 'final_price' },
    { slug: 'standard', name: 'Standard', amount: 12999, period: 'month', currency: 'ARS', tax_mode: 'final_price' },
    { slug: 'premium', name: 'Premium', amount: 19999, period: 'month', currency: 'ARS', tax_mode: 'final_price' },
  ]},
  { slug: 'max', provider: 'Warner Bros. Discovery', name: 'HBO Max', category: 'streaming', subcategory: 'video', official_url: 'https://max.com', priority: 1, plans: [
    { slug: 'basic-ads', name: 'Basic Ads', amount: 7390, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
    { slug: 'standard', name: 'Standard', amount: 9590, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
    { slug: 'platinum', name: 'Platinum', amount: 11490, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
  ]},
  { slug: 'prime-video', provider: 'Amazon', name: 'Prime Video', category: 'streaming', subcategory: 'video', official_url: 'https://amazon.com/prime', priority: 2, plans: [
    { slug: 'prime', name: 'Prime', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},
  { slug: 'apple-tv-plus', provider: 'Apple', name: 'Apple TV+', category: 'streaming', subcategory: 'video', official_url: 'https://tv.apple.com', priority: 2, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 1299, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 9999, period: 'year', currency: 'USD' },
  ]},
  { slug: 'paramount-plus', provider: 'Paramount', name: 'Paramount+', category: 'streaming', subcategory: 'video', official_url: 'https://paramountplus.com', priority: 2, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 6750, period: 'month', currency: 'ARS', tax_mode: 'vat_included_other_taxes_possible' },
  ]},
  { slug: 'peacock', provider: 'NBCUniversal', name: 'Peacock', category: 'streaming', subcategory: 'video', official_url: 'https://peacocktv.com', priority: 3, plans: [
    { slug: 'premium', name: 'Premium', amount: 1099, period: 'month', currency: 'USD' },
    { slug: 'premium-plus', name: 'Premium Plus', amount: 1699, period: 'month', currency: 'USD' },
  ]},
  { slug: 'hulu', provider: 'Disney', name: 'Hulu', category: 'streaming', subcategory: 'video', official_url: 'https://hulu.com', priority: 3, plans: [
    { slug: 'with-ads', name: 'With Ads', amount: 1199, period: 'month', currency: 'USD' },
    { slug: 'no-ads', name: 'No Ads', amount: 1899, period: 'month', currency: 'USD' },
  ]},
  { slug: 'crunchyroll', provider: 'Crunchyroll', name: 'Crunchyroll', category: 'streaming', subcategory: 'video', official_url: 'https://crunchyroll.com', priority: 3, plans: [
    { slug: 'fan', name: 'Fan', amount: 999, period: 'month', currency: 'USD' },
    { slug: 'mega-fan', name: 'Mega Fan', amount: 1199, period: 'month', currency: 'USD' },
    { slug: 'ultimate-fan', name: 'Ultimate Fan', amount: 1799, period: 'month', currency: 'USD' },
  ]},
  { slug: 'espn-plus', provider: 'ESPN', name: 'ESPN+', category: 'streaming', subcategory: 'video', official_url: 'https://espn.com/plus', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 1199, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 11999, period: 'year', currency: 'USD' },
  ]},
  { slug: 'twitch-turbo', provider: 'Twitch', name: 'Twitch Turbo', category: 'streaming', subcategory: 'video', official_url: 'https://twitch.tv/turbo', priority: 3, plans: [
    { slug: 'turbo', name: 'Turbo', amount: 1199, period: 'month', currency: 'USD' },
  ]},
  { slug: 'youtube-premium', provider: 'Google', name: 'YouTube Premium', category: 'streaming', subcategory: 'video', official_url: 'https://youtube.com/premium', priority: 2, plans: [
    { slug: 'individual', name: 'Individual', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
    { slug: 'familiar', name: 'Familiar', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},
  { slug: 'apple-one', provider: 'Apple', name: 'Apple One', category: 'streaming', subcategory: 'video', official_url: 'https://apple.com/apple-one', priority: 2, plans: [
    { slug: 'individual', name: 'Individual', amount: 6999, period: 'month', currency: 'ARS' },
    { slug: 'familiar', name: 'Familiar', amount: 9999, period: 'month', currency: 'ARS' },
  ]},
  { slug: 'discord-nitro', provider: 'Discord', name: 'Discord Nitro', category: 'streaming', subcategory: 'video', official_url: 'https://discord.com', priority: 3, plans: [
    { slug: 'nitro-basic', name: 'Nitro Basic', amount: 299, period: 'month', currency: 'USD' },
    { slug: 'nitro', name: 'Nitro', amount: 999, period: 'month', currency: 'USD' },
  ]},
  { slug: 'telegram-premium', provider: 'Telegram', name: 'Telegram Premium', category: 'streaming', subcategory: 'video', official_url: 'https://telegram.org', priority: 3, plans: [
    { slug: 'premium', name: 'Premium', amount: 499, period: 'month', currency: 'USD' },
  ]},
  { slug: 'dazn', provider: 'DAZN', name: 'DAZN', category: 'streaming', subcategory: 'video', official_url: 'https://dazn.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'mubi', provider: 'MUBI', name: 'MUBI', category: 'streaming', subcategory: 'video', official_url: 'https://mubi.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'f1-tv', provider: 'F1', name: 'F1 TV', category: 'streaming', subcategory: 'video', official_url: 'https://f1.com/en/subscribe-to-f1-tv', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'nba-league-pass', provider: 'NBA', name: 'NBA League Pass', category: 'streaming', subcategory: 'video', official_url: 'https://nba.com/leaguepass', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Music ══════════════════════════════════════════════
  { slug: 'spotify', provider: 'Spotify', name: 'Spotify Premium', category: 'music', official_url: 'https://spotify.com', priority: 1, plans: [
    { slug: 'student', name: 'Student', amount: 2299, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
    { slug: 'individual', name: 'Individual', amount: 4499, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
    { slug: 'duo', name: 'Duo', amount: 5999, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
    { slug: 'family', name: 'Family', amount: 7599, period: 'month', currency: 'ARS', tax_mode: 'tax_excluded' },
  ]},
  { slug: 'apple-music', provider: 'Apple', name: 'Apple Music', category: 'music', official_url: 'https://music.apple.com', priority: 2, plans: [
    { slug: 'individual', name: 'Individual', amount: 3199, period: 'month', currency: 'ARS' },
    { slug: 'familiar', name: 'Familiar', amount: 4999, period: 'month', currency: 'ARS' },
    { slug: 'student', name: 'Student', amount: 1599, period: 'month', currency: 'ARS' },
    { slug: 'individual-annual', name: 'Individual Anual', amount: 31900, period: 'year', currency: 'ARS' },
  ]},
  { slug: 'youtube-music', provider: 'Google', name: 'YouTube Music', category: 'music', official_url: 'https://music.youtube.com', priority: 2, plans: [
    { slug: 'individual', name: 'Individual', amount: 1199, period: 'month', currency: 'ARS' },
    { slug: 'familiar', name: 'Familiar', amount: 1899, period: 'month', currency: 'ARS' },
  ]},
  { slug: 'tidal', provider: 'Tidal', name: 'Tidal', category: 'music', official_url: 'https://tidal.com', priority: 3, plans: [
    { slug: 'hifi', name: 'HiFi', amount: 1099, period: 'month', currency: 'USD' },
    { slug: 'familiar', name: 'Familiar', amount: 1699, period: 'month', currency: 'USD' },
    { slug: 'student', name: 'Student', amount: 499, period: 'month', currency: 'USD' },
  ]},
  { slug: 'amazon-music', provider: 'Amazon', name: 'Amazon Music Unlimited', category: 'music', official_url: 'https://amazon.com/music/unlimited', priority: 3, plans: [
    { slug: 'prime', name: 'Prime', amount: 999, period: 'month', currency: 'USD' },
    { slug: 'non-prime', name: 'Non-Prime', amount: 1099, period: 'month', currency: 'USD' },
    { slug: 'familiar', name: 'Familiar', amount: 1699, period: 'month', currency: 'USD' },
  ]},
  { slug: 'deezer', provider: 'Deezer', name: 'Deezer', category: 'music', official_url: 'https://deezer.com', priority: 3, plans: [
    { slug: 'premium', name: 'Premium', amount: 1099, period: 'month', currency: 'USD' },
    { slug: 'familiar', name: 'Familiar', amount: 1799, period: 'month', currency: 'USD' },
    { slug: 'premium-annual', name: 'Premium Anual', amount: 10788, period: 'year', currency: 'USD' },
  ]},
  { slug: 'soundcloud', provider: 'SoundCloud', name: 'SoundCloud Go+', category: 'music', official_url: 'https://soundcloud.com/go', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'qobuz', provider: 'Qobuz', name: 'Qobuz', category: 'music', official_url: 'https://qobuz.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Cloud Storage ══════════════════════════════════════
  { slug: 'icloud', provider: 'Apple', name: 'iCloud+', category: 'cloud', subcategory: 'storage', official_url: 'https://icloud.com', priority: 1, plans: [
    { slug: '50gb', name: '50 GB', amount: 299, period: 'month', currency: 'ARS' },
    { slug: '200gb', name: '200 GB', amount: 899, period: 'month', currency: 'ARS' },
    { slug: '2tb', name: '2 TB', amount: 2999, period: 'month', currency: 'ARS' },
    { slug: '6tb', name: '6 TB', amount: 8999, period: 'month', currency: 'ARS' },
    { slug: '12tb', name: '12 TB', amount: 17999, period: 'month', currency: 'ARS' },
  ]},
  { slug: 'google-one', provider: 'Google', name: 'Google One', category: 'cloud', subcategory: 'storage', official_url: 'https://one.google.com', priority: 2, plans: [
    { slug: '100gb', name: '100 GB', amount: 999, period: 'month', currency: 'ARS' },
    { slug: '200gb', name: '200 GB', amount: 1499, period: 'month', currency: 'ARS' },
    { slug: '2tb', name: '2 TB', amount: 4999, period: 'month', currency: 'ARS' },
    { slug: '5tb', name: '5 TB', amount: 9999, period: 'month', currency: 'ARS' },
  ]},
  { slug: 'dropbox', provider: 'Dropbox', name: 'Dropbox', category: 'cloud', subcategory: 'storage', official_url: 'https://dropbox.com', priority: 3, plans: [
    { slug: 'plus', name: 'Plus', amount: 1199, period: 'month', currency: 'USD' },
    { slug: 'plus-annual', name: 'Plus Anual', amount: 9996, period: 'year', currency: 'USD' },
    { slug: 'professional', name: 'Professional', amount: 19996, period: 'year', currency: 'USD' },
  ]},
  { slug: 'onedrive', provider: 'Microsoft', name: 'OneDrive', category: 'cloud', subcategory: 'storage', official_url: 'https://onedrive.live.com', priority: 2, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'mega', provider: 'MEGA', name: 'MEGA', category: 'cloud', subcategory: 'storage', official_url: 'https://mega.io', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'pcloud', provider: 'pCloud', name: 'pCloud', category: 'cloud', subcategory: 'storage', official_url: 'https://pcloud.com', priority: 3, plans: [
    { slug: '500gb', name: '500 GB', amount: 4999, period: 'year', currency: 'USD' },
    { slug: '2tb', name: '2 TB', amount: 9999, period: 'year', currency: 'USD' },
  ]},
  { slug: 'box', provider: 'Box', name: 'Box', category: 'cloud', subcategory: 'storage', official_url: 'https://box.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'backblaze', provider: 'Backblaze', name: 'Backblaze', category: 'cloud', subcategory: 'storage', official_url: 'https://backblaze.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Productivity ════════════════════════════════════════
  { slug: 'microsoft-365', provider: 'Microsoft', name: 'Microsoft 365', category: 'productivity', official_url: 'https://microsoft.com/microsoft-365', priority: 1, plans: [
    { slug: 'personal', name: 'Personal', amount: 699, period: 'month', currency: 'USD' },
    { slug: 'personal-annual', name: 'Personal Anual', amount: 6999, period: 'year', currency: 'USD' },
    { slug: 'familiar-annual', name: 'Familiar Anual', amount: 9999, period: 'year', currency: 'USD' },
  ]},
  { slug: 'google-workspace', provider: 'Google', name: 'Google Workspace', category: 'productivity', official_url: 'https://workspace.google.com', priority: 2, plans: [
    { slug: 'business-starter', name: 'Business Starter', amount: 3500, period: 'month', currency: 'ARS' },
    { slug: 'business-standard', name: 'Business Standard', amount: 7000, period: 'month', currency: 'ARS' },
    { slug: 'business-plus', name: 'Business Plus', amount: 10500, period: 'month', currency: 'ARS' },
  ]},
  { slug: 'notion', provider: 'Notion', name: 'Notion', category: 'productivity', official_url: 'https://notion.so', priority: 3, plans: [
    { slug: 'plus', name: 'Plus', amount: 1200, period: 'month', currency: 'USD' },
    { slug: 'plus-annual', name: 'Plus Anual', amount: 9600, period: 'year', currency: 'USD' },
    { slug: 'business', name: 'Business', amount: 18000, period: 'year', currency: 'USD' },
  ]},
  { slug: 'figma', provider: 'Figma', name: 'Figma', category: 'productivity', official_url: 'https://figma.com', priority: 3, plans: [
    { slug: 'professional', name: 'Professional', amount: 1500, period: 'month', currency: 'USD' },
    { slug: 'professional-annual', name: 'Professional Anual', amount: 14400, period: 'year', currency: 'USD' },
    { slug: 'organization', name: 'Organization', amount: 45600, period: 'year', currency: 'USD' },
  ]},
  { slug: 'adobe-cc', provider: 'Adobe', name: 'Adobe Creative Cloud', category: 'productivity', official_url: 'https://adobe.com', priority: 1, plans: [
    { slug: 'photography', name: 'Fotografía', amount: 999, period: 'month', currency: 'USD' },
    { slug: 'individual', name: 'Individual', amount: 5999, period: 'month', currency: 'USD' },
    { slug: 'individual-annual', name: 'Individual Anual', amount: 59988, period: 'year', currency: 'USD' },
  ]},
  { slug: 'canva', provider: 'Canva', name: 'Canva', category: 'productivity', official_url: 'https://canva.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 1499, period: 'month', currency: 'USD' },
    { slug: 'business', name: 'Business', amount: 2000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'evernote', provider: 'Evernote', name: 'Evernote', category: 'productivity', official_url: 'https://evernote.com', priority: 3, plans: [
    { slug: 'personal', name: 'Personal', amount: 1499, period: 'month', currency: 'USD' },
    { slug: 'professional', name: 'Professional', amount: 1799, period: 'month', currency: 'USD' },
  ]},
  { slug: 'todoist', provider: 'Todoist', name: 'Todoist', category: 'productivity', official_url: 'https://todoist.com', priority: 3, plans: [
    { slug: 'pro', name: 'Pro', amount: 400, period: 'month', currency: 'USD' },
    { slug: 'pro-annual', name: 'Pro Anual', amount: 3600, period: 'year', currency: 'USD' },
  ]},
  { slug: 'proton-unlimited', provider: 'Proton', name: 'Proton Unlimited', category: 'productivity', official_url: 'https://proton.me', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 999, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 9588, period: 'year', currency: 'USD' },
  ]},
  { slug: 'fastmail', provider: 'Fastmail', name: 'Fastmail', category: 'productivity', official_url: 'https://fastmail.com', priority: 3, plans: [
    { slug: 'basic', name: 'Basic', amount: 300, period: 'month', currency: 'USD' },
    { slug: 'standard', name: 'Standard', amount: 500, period: 'month', currency: 'USD' },
    { slug: 'professional', name: 'Professional', amount: 900, period: 'month', currency: 'USD' },
  ]},
  { slug: 'ifttt', provider: 'IFTTT', name: 'IFTTT Pro', category: 'productivity', official_url: 'https://ifttt.com', priority: 3, plans: [
    { slug: 'pro', name: 'Pro', amount: 399, period: 'month', currency: 'USD' },
    { slug: 'pro-plus', name: 'Pro+', amount: 1299, period: 'month', currency: 'USD' },
  ]},
  { slug: 'slack', provider: 'Slack', name: 'Slack', category: 'productivity', official_url: 'https://slack.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 875, period: 'month', currency: 'USD' },
    { slug: 'business-plus', name: 'Business+', amount: 1800, period: 'month', currency: 'USD' },
  ]},
  { slug: 'zoom', provider: 'Zoom', name: 'Zoom', category: 'productivity', official_url: 'https://zoom.us', priority: 3, plans: [
    { slug: 'basic', name: 'Basic', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 1499, period: 'month', currency: 'USD' },
  ]},
  { slug: 'linear', provider: 'Linear', name: 'Linear', category: 'productivity', official_url: 'https://linear.app', priority: 3, plans: [
    { slug: 'plus', name: 'Plus', amount: 8000, period: 'year', currency: 'USD' },
    { slug: 'business', name: 'Business', amount: 16000, period: 'year', currency: 'USD' },
  ]},
  { slug: 'linkedin-premium', provider: 'LinkedIn', name: 'LinkedIn Premium', category: 'productivity', official_url: 'https://linkedin.com', priority: 3, plans: [
    { slug: 'career', name: 'Career', amount: 3999, period: 'month', currency: 'USD' },
    { slug: 'business', name: 'Business', amount: 5999, period: 'month', currency: 'USD' },
  ]},
  { slug: 'make', provider: 'Make', name: 'Make', category: 'productivity', official_url: 'https://make.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'core', name: 'Core', amount: 1200, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2100, period: 'month', currency: 'USD' },
    { slug: 'teams', name: 'Teams', amount: 3800, period: 'month', currency: 'USD' },
  ]},
  { slug: 'zapier', provider: 'Zapier', name: 'Zapier', category: 'productivity', official_url: 'https://zapier.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'professional', name: 'Professional', amount: 1999, period: 'month', currency: 'USD' },
    { slug: 'team', name: 'Team', amount: 6900, period: 'month', currency: 'USD' },
  ]},

  // ═══ Dev Tools ══════════════════════════════════════════
  { slug: 'github', provider: 'GitHub', name: 'GitHub', category: 'devtools', official_url: 'https://github.com', priority: 2, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 400, period: 'month', currency: 'USD' },
    { slug: 'team', name: 'Team', amount: 400, period: 'month', currency: 'USD' },
  ]},
  { slug: 'vercel', provider: 'Vercel', name: 'Vercel', category: 'devtools', official_url: 'https://vercel.com', priority: 3, plans: [
    { slug: 'hobby', name: 'Hobby', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'supabase', provider: 'Supabase', name: 'Supabase', category: 'devtools', official_url: 'https://supabase.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2500, period: 'month', currency: 'USD' },
  ]},
  { slug: 'firebase', provider: 'Google', name: 'Firebase', category: 'devtools', official_url: 'https://firebase.google.com', priority: 3, plans: [
    { slug: 'spark', name: 'Spark (Free)', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'blaze', name: 'Blaze (Pay as you go)', amount: 0, period: 'month', currency: 'USD' },
  ]},
  { slug: 'railway', provider: 'Railway', name: 'Railway', category: 'devtools', official_url: 'https://railway.com', priority: 3, plans: [
    { slug: 'hobby', name: 'Hobby', amount: 500, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'render', provider: 'Render', name: 'Render', category: 'devtools', official_url: 'https://render.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2500, period: 'month', currency: 'USD' },
  ]},
  { slug: 'expo-eas', provider: 'Expo', name: 'Expo EAS', category: 'devtools', official_url: 'https://expo.dev', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'starter', name: 'Starter', amount: 1900, period: 'month', currency: 'USD' },
    { slug: 'production', name: 'Production', amount: 19900, period: 'month', currency: 'USD' },
  ]},
  { slug: 'netlify', provider: 'Netlify', name: 'Netlify', category: 'devtools', official_url: 'https://netlify.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'personal', name: 'Personal', amount: 900, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 2000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'aws', provider: 'Amazon', name: 'AWS', category: 'devtools', official_url: 'https://aws.amazon.com', priority: 3, plans: [
    { slug: 'payg', name: 'Pay as you go', amount: 0, period: 'month', currency: 'USD' },
  ]},
  { slug: 'google-cloud', provider: 'Google', name: 'Google Cloud', category: 'devtools', official_url: 'https://cloud.google.com', priority: 3, plans: [
    { slug: 'payg', name: 'Pay as you go', amount: 0, period: 'month', currency: 'USD' },
  ]},
  { slug: 'n8n', provider: 'n8n', name: 'n8n', category: 'devtools', official_url: 'https://n8n.io', priority: 3, plans: [
    { slug: 'community', name: 'Community (self-hosted)', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'starter', name: 'Starter', amount: 2400, period: 'month', currency: 'USD' },
    { slug: 'pro', name: 'Pro', amount: 6000, period: 'month', currency: 'USD' },
  ]},
  { slug: 'apple-developer', provider: 'Apple', name: 'Apple Developer', category: 'devtools', official_url: 'https://developer.apple.com', priority: 3, plans: [
    { slug: 'standard', name: 'Standard', amount: 9900, period: 'year', currency: 'USD' },
    { slug: 'enterprise', name: 'Enterprise', amount: 29900, period: 'year', currency: 'USD' },
  ]},
  { slug: 'google-play-console', provider: 'Google', name: 'Google Play Console', category: 'devtools', official_url: 'https://play.google.com/console', priority: 3, plans: [
    { slug: 'registration', name: 'Registration (one-time)', amount: 2500, period: 'month', currency: 'USD' },
  ]},
  { slug: 'gitlab', provider: 'GitLab', name: 'GitLab', category: 'devtools', official_url: 'https://gitlab.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'jetbrains', provider: 'JetBrains', name: 'JetBrains', category: 'devtools', official_url: 'https://jetbrains.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'cloudflare', provider: 'Cloudflare', name: 'Cloudflare', category: 'devtools', official_url: 'https://cloudflare.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'digitalocean', provider: 'DigitalOcean', name: 'DigitalOcean', category: 'devtools', official_url: 'https://digitalocean.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'azure', provider: 'Microsoft', name: 'Microsoft Azure', category: 'devtools', official_url: 'https://azure.microsoft.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'heroku', provider: 'Salesforce', name: 'Heroku', category: 'devtools', official_url: 'https://heroku.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'fly-io', provider: 'Fly.io', name: 'Fly.io', category: 'devtools', official_url: 'https://fly.io', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'hetzner', provider: 'Hetzner', name: 'Hetzner Cloud', category: 'devtools', official_url: 'https://hetzner.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'neon', provider: 'Neon', name: 'Neon', category: 'devtools', official_url: 'https://neon.tech', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'planetscale', provider: 'PlanetScale', name: 'PlanetScale', category: 'devtools', official_url: 'https://planetscale.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'upstash', provider: 'Upstash', name: 'Upstash', category: 'devtools', official_url: 'https://upstash.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'stripe', provider: 'Stripe', name: 'Stripe', category: 'devtools', official_url: 'https://stripe.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'resend', provider: 'Resend', name: 'Resend', category: 'devtools', official_url: 'https://resend.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'docker', provider: 'Docker', name: 'Docker', category: 'devtools', official_url: 'https://docker.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'postman', provider: 'Postman', name: 'Postman', category: 'devtools', official_url: 'https://postman.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'sentry', provider: 'Sentry', name: 'Sentry', category: 'devtools', official_url: 'https://sentry.io', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'datadog', provider: 'Datadog', name: 'Datadog', category: 'devtools', official_url: 'https://datadoghq.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'posthog', provider: 'PostHog', name: 'PostHog', category: 'devtools', official_url: 'https://posthog.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Gaming ═════════════════════════════════════════════
  { slug: 'xbox-game-pass', provider: 'Microsoft', name: 'Xbox Game Pass', category: 'gaming', official_url: 'https://xbox.com/game-pass', priority: 2, plans: [
    { slug: 'essential', name: 'Essential', amount: 8999, period: 'month', currency: 'ARS' },
    { slug: 'premium', name: 'Premium', amount: 11999, period: 'month', currency: 'ARS' },
    { slug: 'ultimate', name: 'Ultimate', amount: 18999, period: 'month', currency: 'ARS' },
  ]},
  { slug: 'playstation-plus', provider: 'Sony', name: 'PlayStation Plus', category: 'gaming', official_url: 'https://playstation.com/ps-plus', priority: 2, plans: [
    { slug: 'essential', name: 'Essential', amount: 999, period: 'month', currency: 'USD' },
    { slug: 'extra', name: 'Extra', amount: 1499, period: 'month', currency: 'USD' },
    { slug: 'premium', name: 'Premium', amount: 1799, period: 'month', currency: 'USD' },
  ]},
  { slug: 'nintendo-switch-online', provider: 'Nintendo', name: 'Nintendo Switch Online', category: 'gaming', official_url: 'https://nintendo.com/switch-online', priority: 3, plans: [
    { slug: 'individual', name: 'Individual', amount: 28299, period: 'year', currency: 'ARS' },
    { slug: 'familiar', name: 'Familiar', amount: 70899, period: 'year', currency: 'ARS' },
  ]},
  { slug: 'ea-play', provider: 'EA', name: 'EA Play', category: 'gaming', official_url: 'https://ea.com/ea-play', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'apple-arcade', provider: 'Apple', name: 'Apple Arcade', category: 'gaming', official_url: 'https://apple.com/apple-arcade', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 699, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 4999, period: 'year', currency: 'USD' },
  ]},
  { slug: 'geforce-now', provider: 'NVIDIA', name: 'GeForce Now', category: 'gaming', official_url: 'https://geforcenow.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'performance', name: 'Performance', amount: 999, period: 'month', currency: 'USD' },
    { slug: 'ultimate', name: 'Ultimate', amount: 1999, period: 'month', currency: 'USD' },
  ]},
  { slug: 'roblox-premium', provider: 'Roblox', name: 'Roblox Premium', category: 'gaming', official_url: 'https://roblox.com/premium', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'fortnite-crew', provider: 'Epic Games', name: 'Fortnite Crew', category: 'gaming', official_url: 'https://fortnite.com/crew', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'minecraft-realms', provider: 'Mojang', name: 'Minecraft Realms', category: 'gaming', official_url: 'https://minecraft.net/realms', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'wow', provider: 'Blizzard', name: 'World of Warcraft', category: 'gaming', official_url: 'https://worldofwarcraft.blizzard.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'ffxiv', provider: 'Square Enix', name: 'Final Fantasy XIV', category: 'gaming', official_url: 'https://finalfantasyxiv.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Security ═══════════════════════════════════════════
  { slug: '1password', provider: '1Password', name: '1Password', category: 'security', official_url: 'https://1password.com', priority: 3, plans: [
    { slug: 'individual', name: 'Individual', amount: 299, period: 'month', currency: 'USD' },
    { slug: 'familiar', name: 'Familiar', amount: 499, period: 'month', currency: 'USD' },
  ]},
  { slug: 'nordvpn', provider: 'Nord Security', name: 'NordVPN', category: 'security', official_url: 'https://nordvpn.com', priority: 3, plans: [
    { slug: 'monthly', name: 'Mensual', amount: 1299, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Anual', amount: 5988, period: 'year', currency: 'USD' },
  ]},
  { slug: 'expressvpn', provider: 'ExpressVPN', name: 'ExpressVPN', category: 'security', official_url: 'https://expressvpn.com', priority: 3, plans: [
    { slug: 'monthly', name: 'Mensual', amount: 1295, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Anual', amount: 9995, period: 'year', currency: 'USD' },
  ]},
  { slug: 'surfshark', provider: 'Surfshark', name: 'Surfshark', category: 'security', official_url: 'https://surfshark.com', priority: 3, plans: [
    { slug: 'monthly', name: 'Mensual', amount: 1545, period: 'month', currency: 'USD' },
  ]},
  { slug: 'proton-vpn', provider: 'Proton', name: 'Proton VPN', category: 'security', official_url: 'https://protonvpn.com', priority: 3, plans: [
    { slug: 'free', name: 'Free', amount: 0, period: 'month', currency: 'USD' },
    { slug: 'plus', name: 'Plus', amount: 999, period: 'month', currency: 'USD' },
    { slug: 'plus-annual', name: 'Plus Anual', amount: 7188, period: 'year', currency: 'USD' },
  ]},
  { slug: 'bitwarden', provider: 'Bitwarden', name: 'Bitwarden Premium', category: 'security', official_url: 'https://bitwarden.com', priority: 3, plans: [
    { slug: 'premium', name: 'Premium', amount: 1000, period: 'year', currency: 'USD' },
  ]},

  // ═══ Education ══════════════════════════════════════════
  { slug: 'duolingo', provider: 'Duolingo', name: 'Duolingo', category: 'education', official_url: 'https://duolingo.com', priority: 3, plans: [
    { slug: 'super', name: 'Super', amount: 699, period: 'month', currency: 'USD' },
    { slug: 'super-annual', name: 'Super Anual', amount: 8388, period: 'year', currency: 'USD' },
    { slug: 'max', name: 'Max', amount: 2999, period: 'month', currency: 'USD' },
  ]},
  { slug: 'coursera-plus', provider: 'Coursera', name: 'Coursera Plus', category: 'education', official_url: 'https://coursera.org', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 5900, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 39900, period: 'year', currency: 'USD' },
  ]},
  { slug: 'skillshare', provider: 'Skillshare', name: 'Skillshare', category: 'education', official_url: 'https://skillshare.com', priority: 3, plans: [
    { slug: 'annual', name: 'Annual', amount: 16788, period: 'year', currency: 'USD' },
    { slug: 'monthly', name: 'Monthly', amount: 1899, period: 'month', currency: 'USD' },
  ]},
  { slug: 'masterclass', provider: 'MasterClass', name: 'MasterClass', category: 'education', official_url: 'https://masterclass.com', priority: 3, plans: [
    { slug: 'individual', name: 'Individual', amount: 12000, period: 'year', currency: 'USD' },
    { slug: 'duo', name: 'Duo', amount: 18000, period: 'year', currency: 'USD' },
    { slug: 'familiar', name: 'Familiar', amount: 24000, period: 'year', currency: 'USD' },
  ]},
  { slug: 'brilliant', provider: 'Brilliant', name: 'Brilliant', category: 'education', official_url: 'https://brilliant.org', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 1500, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 12000, period: 'year', currency: 'USD' },
  ]},
  { slug: 'udemy', provider: 'Udemy', name: 'Udemy', category: 'education', official_url: 'https://udemy.com', priority: 3, plans: [
    { slug: 'personal-monthly', name: 'Personal Plan', amount: 3200, period: 'month', currency: 'USD' },
    { slug: 'personal-annual', name: 'Personal Plan Anual', amount: 15600, period: 'year', currency: 'USD' },
  ]},
  { slug: 'linkedin-learning', provider: 'LinkedIn', name: 'LinkedIn Learning', category: 'education', official_url: 'https://linkedin.com/learning', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'datacamp', provider: 'DataCamp', name: 'DataCamp', category: 'education', official_url: 'https://datacamp.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'codecademy', provider: 'Codecademy', name: 'Codecademy', category: 'education', official_url: 'https://codecademy.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'platzi', provider: 'Platzi', name: 'Platzi', category: 'education', official_url: 'https://platzi.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'domestika', provider: 'Domestika', name: 'Domestika Plus', category: 'education', official_url: 'https://domestika.org', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Fitness & Health ═══════════════════════════════════
  { slug: 'strava', provider: 'Strava', name: 'Strava', category: 'fitness', official_url: 'https://strava.com', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 1199, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 7999, period: 'year', currency: 'USD' },
  ]},
  { slug: 'myfitnesspal', provider: 'MyFitnessPal', name: 'MyFitnessPal', category: 'fitness', official_url: 'https://myfitnesspal.com', priority: 3, plans: [
    { slug: 'premium-annual', name: 'Premium Anual', amount: 7999, period: 'year', currency: 'USD' },
    { slug: 'premium-monthly', name: 'Premium', amount: 1999, period: 'month', currency: 'USD' },
  ]},
  { slug: 'apple-fitness', provider: 'Apple', name: 'Apple Fitness+', category: 'fitness', official_url: 'https://apple.com/apple-fitness-plus', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 999, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 7999, period: 'year', currency: 'USD' },
  ]},
  { slug: 'calm', provider: 'Calm', name: 'Calm', category: 'fitness', official_url: 'https://calm.com', priority: 3, plans: [
    { slug: 'annual', name: 'Annual', amount: 6999, period: 'year', currency: 'USD' },
    { slug: 'monthly', name: 'Monthly', amount: 1699, period: 'month', currency: 'USD' },
  ]},
  { slug: 'headspace', provider: 'Headspace', name: 'Headspace', category: 'fitness', official_url: 'https://headspace.com', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 1299, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 6999, period: 'year', currency: 'USD' },
  ]},
  { slug: 'whoop', provider: 'WHOOP', name: 'WHOOP', category: 'fitness', official_url: 'https://whoop.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'oura', provider: 'Oura', name: 'Oura Ring', category: 'fitness', official_url: 'https://ouraring.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'noom', provider: 'Noom', name: 'Noom', category: 'fitness', official_url: 'https://noom.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'zwift', provider: 'Zwift', name: 'Zwift', category: 'fitness', official_url: 'https://zwift.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ News & Reading ═════════════════════════════════════
  { slug: 'medium', provider: 'Medium', name: 'Medium', category: 'news', official_url: 'https://medium.com', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 500, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 5000, period: 'year', currency: 'USD' },
  ]},
  { slug: 'nyt', provider: 'New York Times', name: 'New York Times', category: 'news', official_url: 'https://nytimes.com', priority: 3, plans: [
    { slug: 'all-access', name: 'All Access', amount: 2500, period: 'month', currency: 'USD' },
    { slug: 'games', name: 'Games', amount: 500, period: 'month', currency: 'USD' },
    { slug: 'cooking', name: 'Cooking', amount: 500, period: 'month', currency: 'USD' },
  ]},
  { slug: 'wsj', provider: 'Wall Street Journal', name: 'Wall Street Journal', category: 'news', official_url: 'https://wsj.com', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 1299, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 15588, period: 'year', currency: 'USD' },
  ]},
  { slug: 'washington-post', provider: 'Washington Post', name: 'Washington Post', category: 'news', official_url: 'https://washingtonpost.com', priority: 3, plans: [
    { slug: 'core', name: 'Core', amount: 14000, period: 'year', currency: 'USD' },
    { slug: 'premium', name: 'Premium', amount: 19000, period: 'year', currency: 'USD' },
  ]},
  { slug: 'kindle-unlimited', provider: 'Amazon', name: 'Kindle Unlimited', category: 'news', official_url: 'https://amazon.com/kindle-unlimited', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 1199, period: 'month', currency: 'USD' },
  ]},
  { slug: 'audible', provider: 'Amazon', name: 'Audible', category: 'news', official_url: 'https://audible.com', priority: 3, plans: [
    { slug: 'standard', name: 'Standard', amount: 899, period: 'month', currency: 'USD' },
    { slug: 'premium-plus', name: 'Premium Plus', amount: 1495, period: 'month', currency: 'USD' },
  ]},
  { slug: 'scribd', provider: 'Scribd', name: 'Scribd', category: 'news', official_url: 'https://scribd.com', priority: 3, plans: [
    { slug: 'standard', name: 'Standard', amount: 1199, period: 'month', currency: 'USD' },
    { slug: 'plus', name: 'Plus', amount: 1699, period: 'month', currency: 'USD' },
  ]},
  { slug: 'ft', provider: 'Financial Times', name: 'Financial Times', category: 'news', official_url: 'https://ft.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'the-economist', provider: 'The Economist', name: 'The Economist', category: 'news', official_url: 'https://economist.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'bloomberg', provider: 'Bloomberg', name: 'Bloomberg', category: 'news', official_url: 'https://bloomberg.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'apple-news-plus', provider: 'Apple', name: 'Apple News+', category: 'news', official_url: 'https://apple.com/apple-news', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Social & Dating ════════════════════════════════════
  { slug: 'tinder', provider: 'Tinder', name: 'Tinder', category: 'social', official_url: 'https://tinder.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'bumble', provider: 'Bumble', name: 'Bumble', category: 'social', official_url: 'https://bumble.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'x-premium', provider: 'xAI', name: 'X Premium', category: 'social', official_url: 'https://x.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'reddit-premium', provider: 'Reddit', name: 'Reddit Premium', category: 'social', official_url: 'https://reddit.com/premium', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'meta-verified', provider: 'Meta', name: 'Meta Verified', category: 'social', official_url: 'https://meta.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'snapchat-plus', provider: 'Snap', name: 'Snapchat+', category: 'social', official_url: 'https://snapchat.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Telco / Local AR ═══════════════════════════════════
  { slug: 'flow', provider: 'Telecentro', name: 'Flow', category: 'telco', subcategory: 'streaming', official_url: 'https://flow.com.ar', priority: 2, plans: [
    { slug: 'flow-plus', name: 'Flow+', amount: 11499, period: 'month', currency: 'ARS', tax_mode: 'final_price' },
    { slug: 'flow-full', name: 'Flow Full', amount: 23999, period: 'month', currency: 'ARS', tax_mode: 'final_price' },
  ]},
  { slug: 'personal-play', provider: 'Personal', name: 'Personal Play', category: 'telco', subcategory: 'streaming', official_url: 'https://play.personal.com.ar', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},
  { slug: 'movistar-play', provider: 'Movistar', name: 'Movistar Play', category: 'telco', subcategory: 'streaming', official_url: 'https://play.movistar.com.ar', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},
  { slug: 'claro-video', provider: 'Claro', name: 'Claro Video', category: 'telco', subcategory: 'streaming', official_url: 'https://clarovideo.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},
  { slug: 'dgo', provider: 'DirecTV', name: 'DGO', category: 'telco', subcategory: 'streaming', official_url: 'https://dgo.com.ar', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},

  // ═══ Finance ════════════════════════════════════════════
  { slug: 'ynab', provider: 'YNAB', name: 'YNAB', category: 'finance', official_url: 'https://ynab.com', priority: 3, plans: [
    { slug: 'monthly', name: 'Monthly', amount: 1499, period: 'month', currency: 'USD' },
    { slug: 'annual', name: 'Annual', amount: 10900, period: 'year', currency: 'USD' },
  ]},
  { slug: 'quickbooks', provider: 'Intuit', name: 'QuickBooks Online', category: 'finance', official_url: 'https://quickbooks.intuit.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'xero', provider: 'Xero', name: 'Xero', category: 'finance', official_url: 'https://xero.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'tradingview', provider: 'TradingView', name: 'TradingView', category: 'finance', official_url: 'https://tradingview.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'rocket-money', provider: 'Rocket Money', name: 'Rocket Money', category: 'finance', official_url: 'https://rocketmoney.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Design & Creative ══════════════════════════════════
  { slug: 'envato', provider: 'Envato', name: 'Envato Elements', category: 'design', official_url: 'https://elements.envato.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'framer', provider: 'Framer', name: 'Framer', category: 'design', official_url: 'https://framer.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'webflow', provider: 'Webflow', name: 'Webflow', category: 'design', official_url: 'https://webflow.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'shutterstock', provider: 'Shutterstock', name: 'Shutterstock', category: 'design', official_url: 'https://shutterstock.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'artlist', provider: 'Artlist', name: 'Artlist', category: 'design', official_url: 'https://artlist.io', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'epidemic-sound', provider: 'Epidemic Sound', name: 'Epidemic Sound', category: 'design', official_url: 'https://epidemicsound.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ E-commerce & Creators ══════════════════════════════
  { slug: 'shopify', provider: 'Shopify', name: 'Shopify', category: 'ecommerce', official_url: 'https://shopify.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'wix', provider: 'Wix', name: 'Wix', category: 'ecommerce', official_url: 'https://wix.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'squarespace', provider: 'Squarespace', name: 'Squarespace', category: 'ecommerce', official_url: 'https://squarespace.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'wordpress-com', provider: 'Automattic', name: 'WordPress.com', category: 'ecommerce', official_url: 'https://wordpress.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'patreon', provider: 'Patreon', name: 'Patreon', category: 'ecommerce', official_url: 'https://patreon.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'substack', provider: 'Substack', name: 'Substack', category: 'ecommerce', official_url: 'https://substack.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'skool', provider: 'Skool', name: 'Skool', category: 'ecommerce', official_url: 'https://skool.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'linktree', provider: 'Linktree', name: 'Linktree Pro', category: 'ecommerce', official_url: 'https://linktr.ee', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Delivery & Shopping ════════════════════════════════
  { slug: 'amazon-prime', provider: 'Amazon', name: 'Amazon Prime', category: 'shopping', official_url: 'https://amazon.com/prime', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'uber-one', provider: 'Uber', name: 'Uber One', category: 'shopping', official_url: 'https://uber.com/one', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'rappi-pro', provider: 'Rappi', name: 'Rappi Pro', category: 'shopping', official_url: 'https://rappi.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},
  { slug: 'pedidosya-plus', provider: 'PedidosYa', name: 'PedidosYa Plus', category: 'shopping', official_url: 'https://pedidosya.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},
  { slug: 'meli-plus', provider: 'Mercado Libre', name: 'Meli+', category: 'shopping', official_url: 'https://mercadolibre.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'ARS', status: 'manual_required' },
  ]},

  // ═══ Marketing & CRM ════════════════════════════════════
  { slug: 'hubspot', provider: 'HubSpot', name: 'HubSpot', category: 'marketing', official_url: 'https://hubspot.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'salesforce', provider: 'Salesforce', name: 'Salesforce', category: 'marketing', official_url: 'https://salesforce.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'mailchimp', provider: 'Mailchimp', name: 'Mailchimp', category: 'marketing', official_url: 'https://mailchimp.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'semrush', provider: 'Semrush', name: 'Semrush', category: 'marketing', official_url: 'https://semrush.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'ahrefs', provider: 'Ahrefs', name: 'Ahrefs', category: 'marketing', official_url: 'https://ahrefs.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'intercom', provider: 'Intercom', name: 'Intercom', category: 'marketing', official_url: 'https://intercom.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'zendesk', provider: 'Zendesk', name: 'Zendesk', category: 'marketing', official_url: 'https://zendesk.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ═══ Fitness, Health & Outdoors — additional ═════════════
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

  // ─── Surf, kitesurf, snow y outdoors ─────────────────────
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

  // ─── Weather ─────────────────────────────────────────────
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

  // ─── Padel y tenis ───────────────────────────────────────
  { slug: 'playtomic-premium', provider: 'Playtomic', name: 'Playtomic Premium', category: 'fitness', subcategory: 'padel', official_url: 'https://playtomic.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'swingvision-pro', provider: 'SwingVision', name: 'SwingVision Pro', category: 'fitness', subcategory: 'tennis', official_url: 'https://swing.tennis', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'tenniskeeper-premium', provider: 'TennisKeeper', name: 'TennisKeeper Premium', category: 'fitness', subcategory: 'tennis', official_url: 'https://tenniskeeper.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ─── Golf ────────────────────────────────────────────────
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

  // ─── Buceo ───────────────────────────────────────────────
  { slug: 'padi-club', provider: 'PADI', name: 'PADI Club', category: 'fitness', subcategory: 'dive', official_url: 'https://padi.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ─── Escalada ────────────────────────────────────────────
  { slug: 'vertical-life-premium', provider: 'Vertical Life', name: 'Vertical Life Premium', category: 'fitness', subcategory: 'climb', official_url: 'https://verticallife.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},

  // ─── Pesca y caza ────────────────────────────────────────
  { slug: 'fishbrain-premium', provider: 'Fishbrain', name: 'Fishbrain Premium', category: 'fitness', subcategory: 'fishing', official_url: 'https://fishbrain.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
  { slug: 'huntstand-pro', provider: 'HuntStand', name: 'HuntStand Pro', category: 'fitness', subcategory: 'hunting', official_url: 'https://huntstand.com', priority: 3, plans: [
    { slug: 'default', name: 'Plan personalizado', amount: 0, period: 'month', currency: 'USD', status: 'manual_required' },
  ]},
];

async function seedFullCatalog(): Promise<void> {
  console.log(`[Seed] Full catalog: ${CATALOG.length} services...`);

  for (const svc of CATALOG) {
    await seedService(svc);
  }

  // Bump catalog versions for both countries
  const n = now();
  await supabase.from('pe_catalog_versions').upsert({ country_code: 'AR', version: 11, updated_at: n }, { onConflict: 'country_code' });
  await supabase.from('pe_catalog_versions').upsert({ country_code: 'US', version: 11, updated_at: n }, { onConflict: 'country_code' });

  console.log('[Seed] Full catalog done.');
}

seedFullCatalog().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
