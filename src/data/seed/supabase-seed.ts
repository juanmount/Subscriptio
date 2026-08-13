import { supabase, getSupabaseAuthUid } from '@/services/supabaseClient';
import { PRICE_WATCH_CATALOG } from './price-watch-catalog';
import { STUB_CATALOG } from './stub-catalog';

const SEED_VERSION = '20';

let _seedPromise: Promise<void> | null = null;

export function runSeedIfNeeded(): Promise<void> {
  if (_seedPromise) return _seedPromise;
  _seedPromise = _runSeed().catch((err) => {
    console.error('[Supabase seed] Failed:', err);
    _seedPromise = null;
    throw err;
  });
  return _seedPromise;
}

async function _runSeed(): Promise<void> {
  const uid = getSupabaseAuthUid();
  console.log('[Supabase seed] Starting, uid:', uid);

  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('user_id', uid ?? '')
    .eq('key', 'catalog_seed_version')
    .maybeSingle();

  if (setting?.value === SEED_VERSION) {
    console.log('[Supabase seed] Already at version', SEED_VERSION, '- skipping');
    return;
  }

  await seedProviders();

  if (uid) {
    const { error: setErr } = await supabase
      .from('settings')
      .upsert({ user_id: uid, key: 'catalog_seed_version', value: SEED_VERSION });
    if (setErr) console.log('[Supabase seed] Settings upsert error:', setErr);
  }

  const { count: afterCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true });
  console.log('[Supabase seed] Done. Provider count after seed:', afterCount);

  const { count: planCount } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true });
  console.log('[Supabase seed] Plan count after seed:', planCount);
}

async function seedProviders(): Promise<void> {
  const now = Date.now();

  const providerData: Array<{
    name: string;
    websiteUrl: string;
    categoryId: number;
    plans: Array<{
      name: string;
      frequency: string;
      priceMinor: number;
      currency: string;
      taxMode?: string;
      sourceUrl?: string | null;
      lastVerifiedAt?: number | null;
      auditStatus?: string;
    }>;
  }> = [
    { name: 'ChatGPT', websiteUrl: 'https://chat.openai.com', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'ARS' },
      { name: 'Plus', frequency: 'monthly', priceMinor: 7999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://chat.openai.com', lastVerifiedAt: now },
      { name: 'Pro', frequency: 'monthly', priceMinor: 79999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://chat.openai.com', lastVerifiedAt: now },
    ]},
    { name: 'Claude', websiteUrl: 'https://claude.ai', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'ARS' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 8499, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://claude.ai', lastVerifiedAt: now },
      { name: 'Pro', frequency: 'yearly', priceMinor: 84990, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://claude.ai', lastVerifiedAt: now },
      { name: 'Max 5x', frequency: 'monthly', priceMinor: 42499, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://claude.ai', lastVerifiedAt: now },
    ]},
    { name: 'ElevenLabs', websiteUrl: 'https://elevenlabs.io', categoryId: 1, plans: [
      { name: 'Starter', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
      { name: 'Creator', frequency: 'monthly', priceMinor: 2200, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 9900, currency: 'USD' },
    ]},
    { name: 'Higgsfield', websiteUrl: 'https://higgsfield.ai', categoryId: 1, plans: [
      { name: 'Creator', frequency: 'monthly', priceMinor: 1500, currency: 'USD' },
      { name: 'Ultra', frequency: 'monthly', priceMinor: 3900, currency: 'USD' },
    ]},
    { name: 'Midjourney', websiteUrl: 'https://midjourney.com', categoryId: 1, plans: [
      { name: 'Basic', frequency: 'monthly', priceMinor: 1000, currency: 'USD' },
      { name: 'Standard', frequency: 'monthly', priceMinor: 3000, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 6000, currency: 'USD' },
    ]},
    { name: 'Netflix', websiteUrl: 'https://netflix.com', categoryId: 2, plans: [
      { name: 'Básico', frequency: 'monthly', priceMinor: 8999, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://netflix.com', lastVerifiedAt: now },
      { name: 'Estándar', frequency: 'monthly', priceMinor: 14999, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://netflix.com', lastVerifiedAt: now },
      { name: 'Premium', frequency: 'monthly', priceMinor: 19999, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://netflix.com', lastVerifiedAt: now },
    ]},
    { name: 'Disney+', websiteUrl: 'https://disneyplus.com', categoryId: 2, plans: [
      { name: 'Standard Ads', frequency: 'monthly', priceMinor: 9999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://disneyplus.com', lastVerifiedAt: now },
      { name: 'Standard', frequency: 'monthly', priceMinor: 12999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://disneyplus.com', lastVerifiedAt: now },
      { name: 'Premium', frequency: 'monthly', priceMinor: 19999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://disneyplus.com', lastVerifiedAt: now },
    ]},
    { name: 'YouTube Premium', websiteUrl: 'https://youtube.com/premium', categoryId: 2, plans: [
      { name: 'Individual', frequency: 'monthly', priceMinor: 0, currency: 'ARS', auditStatus: 'manual_required', sourceUrl: null, lastVerifiedAt: null },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 0, currency: 'ARS', auditStatus: 'manual_required', sourceUrl: null, lastVerifiedAt: null },
    ]},
    { name: 'Spotify Premium', websiteUrl: 'https://spotify.com', categoryId: 2, plans: [
      { name: 'Student', frequency: 'monthly', priceMinor: 2299, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://spotify.com', lastVerifiedAt: now },
      { name: 'Individual', frequency: 'monthly', priceMinor: 4499, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://spotify.com', lastVerifiedAt: now },
      { name: 'Duo', frequency: 'monthly', priceMinor: 5999, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://spotify.com', lastVerifiedAt: now },
      { name: 'Family', frequency: 'monthly', priceMinor: 7599, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://spotify.com', lastVerifiedAt: now },
    ]},
    { name: 'Apple Music', websiteUrl: 'https://music.apple.com', categoryId: 2, plans: [
      { name: 'Individual', frequency: 'monthly', priceMinor: 3199, currency: 'ARS' },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 4999, currency: 'ARS' },
      { name: 'Student', frequency: 'monthly', priceMinor: 1599, currency: 'ARS' },
      { name: 'Individual', frequency: 'yearly', priceMinor: 31900, currency: 'ARS' },
    ]},
    { name: 'Adobe Creative Cloud', websiteUrl: 'https://adobe.com', categoryId: 9, plans: [
      { name: 'Fotografía', frequency: 'monthly', priceMinor: 11999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://adobe.com', lastVerifiedAt: now },
      { name: 'Individual', frequency: 'monthly', priceMinor: 19999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://adobe.com', lastVerifiedAt: now },
      { name: 'Individual', frequency: 'yearly', priceMinor: 191999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://adobe.com', lastVerifiedAt: now },
    ]},
    { name: 'Adobe Firefly', websiteUrl: 'https://firefly.adobe.com', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'ARS' },
      { name: 'Premium', frequency: 'monthly', priceMinor: 4999, currency: 'ARS' },
    ]},
    { name: 'Figma', websiteUrl: 'https://figma.com', categoryId: 9, plans: [
      { name: 'Professional', frequency: 'monthly', priceMinor: 1500, currency: 'USD' },
      { name: 'Professional', frequency: 'yearly', priceMinor: 14400, currency: 'USD' },
      { name: 'Organization', frequency: 'yearly', priceMinor: 45600, currency: 'USD' },
    ]},
    { name: 'Google One', websiteUrl: 'https://one.google.com', categoryId: 5, plans: [
      { name: '100 GB', frequency: 'monthly', priceMinor: 999, currency: 'ARS' },
      { name: '200 GB', frequency: 'monthly', priceMinor: 1499, currency: 'ARS' },
      { name: '2 TB', frequency: 'monthly', priceMinor: 4999, currency: 'ARS' },
      { name: '5 TB', frequency: 'monthly', priceMinor: 9999, currency: 'ARS' },
    ]},
    { name: 'iCloud+', websiteUrl: 'https://icloud.com', categoryId: 5, plans: [
      { name: '50 GB', frequency: 'monthly', priceMinor: 299, currency: 'ARS' },
      { name: '200 GB', frequency: 'monthly', priceMinor: 899, currency: 'ARS' },
      { name: '2 TB', frequency: 'monthly', priceMinor: 2999, currency: 'ARS' },
      { name: '6 TB', frequency: 'monthly', priceMinor: 8999, currency: 'ARS' },
      { name: '12 TB', frequency: 'monthly', priceMinor: 17999, currency: 'ARS' },
    ]},
    { name: 'Notion', websiteUrl: 'https://notion.so', categoryId: 3, plans: [
      { name: 'Plus', frequency: 'monthly', priceMinor: 3499, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://notion.so', lastVerifiedAt: now },
      { name: 'Plus', frequency: 'yearly', priceMinor: 34990, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://notion.so', lastVerifiedAt: now },
      { name: 'Business', frequency: 'yearly', priceMinor: 52490, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://notion.so', lastVerifiedAt: now },
    ]},
    { name: 'Microsoft 365', websiteUrl: 'https://microsoft.com/microsoft-365', categoryId: 3, plans: [
      { name: 'Personal', frequency: 'monthly', priceMinor: 3699, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://microsoft.com/microsoft-365', lastVerifiedAt: now },
      { name: 'Personal', frequency: 'yearly', priceMinor: 37199, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://microsoft.com/microsoft-365', lastVerifiedAt: now },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 4599, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://microsoft.com/microsoft-365', lastVerifiedAt: now },
      { name: 'Familiar', frequency: 'yearly', priceMinor: 45999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://microsoft.com/microsoft-365', lastVerifiedAt: now },
    ]},
    { name: 'Dropbox', websiteUrl: 'https://dropbox.com', categoryId: 5, plans: [
      { name: 'Plus', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
      { name: 'Plus', frequency: 'yearly', priceMinor: 9996, currency: 'USD' },
      { name: 'Professional', frequency: 'yearly', priceMinor: 19996, currency: 'USD' },
    ]},
    { name: 'GitHub', websiteUrl: 'https://github.com', categoryId: 4, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 400, currency: 'USD' },
      { name: 'Team', frequency: 'monthly', priceMinor: 400, currency: 'USD' },
    ]},
    { name: 'Linear', websiteUrl: 'https://linear.app', categoryId: 4, plans: [
      { name: 'Plus', frequency: 'yearly', priceMinor: 8000, currency: 'USD' },
      { name: 'Business', frequency: 'yearly', priceMinor: 16000, currency: 'USD' },
    ]},
    { name: 'Perplexity', websiteUrl: 'https://perplexity.ai', categoryId: 1, plans: [
      { name: 'Pro', frequency: 'monthly', priceMinor: 8299, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://perplexity.ai', lastVerifiedAt: now },
      { name: 'Pro', frequency: 'yearly', priceMinor: 82990, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://perplexity.ai', lastVerifiedAt: now },
    ]},
    { name: 'Cursor', websiteUrl: 'https://cursor.com', categoryId: 1, plans: [
      { name: 'Hobby', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
      { name: 'Teams', frequency: 'monthly', priceMinor: 4000, currency: 'USD' },
    ]},
    { name: 'GitHub Copilot', websiteUrl: 'https://github.com/features/copilot', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 1000, currency: 'USD' },
      { name: 'Pro+', frequency: 'monthly', priceMinor: 3900, currency: 'USD' },
    ]},
    { name: 'Windsurf', websiteUrl: 'https://windsurf.com', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
      { name: 'Max', frequency: 'monthly', priceMinor: 20000, currency: 'USD' },
    ]},
    { name: 'Runway', websiteUrl: 'https://runwayml.com', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Standard', frequency: 'monthly', priceMinor: 1500, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 3500, currency: 'USD' },
    ]},
    { name: 'HBO Max', websiteUrl: 'https://max.com', categoryId: 2, plans: [
      { name: 'Basic Ads', frequency: 'monthly', priceMinor: 7390, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://max.com', lastVerifiedAt: now },
      { name: 'Standard', frequency: 'monthly', priceMinor: 9590, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://max.com', lastVerifiedAt: now },
      { name: 'Platinum', frequency: 'monthly', priceMinor: 11490, currency: 'ARS', taxMode: 'tax_excluded', sourceUrl: 'https://max.com', lastVerifiedAt: now },
    ]},
    { name: 'Prime Video', websiteUrl: 'https://amazon.com/prime', categoryId: 2, plans: [
      { name: 'Prime', frequency: 'monthly', priceMinor: 0, currency: 'ARS', auditStatus: 'manual_required', sourceUrl: null, lastVerifiedAt: null },
    ]},
    { name: 'Apple TV+', websiteUrl: 'https://tv.apple.com', categoryId: 2, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 9999, currency: 'USD' },
    ]},
    { name: 'Paramount+', websiteUrl: 'https://paramountplus.com', categoryId: 2, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 6750, currency: 'ARS', taxMode: 'vat_included_other_taxes_possible', sourceUrl: 'https://paramountplus.com', lastVerifiedAt: now },
    ]},
    { name: 'Peacock', websiteUrl: 'https://peacocktv.com', categoryId: 2, plans: [
      { name: 'Premium', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
      { name: 'Premium Plus', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
    ]},
    { name: 'Hulu', websiteUrl: 'https://hulu.com', categoryId: 2, plans: [
      { name: 'With Ads', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
      { name: 'No Ads', frequency: 'monthly', priceMinor: 1899, currency: 'USD' },
    ]},
    { name: 'Crunchyroll', websiteUrl: 'https://crunchyroll.com', categoryId: 2, plans: [
      { name: 'Fan', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
      { name: 'Mega Fan', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
      { name: 'Ultimate Fan', frequency: 'monthly', priceMinor: 1799, currency: 'USD' },
    ]},
    { name: 'ESPN+', websiteUrl: 'https://espn.com/plus', categoryId: 2, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 11999, currency: 'USD' },
    ]},
    { name: 'Twitch Turbo', websiteUrl: 'https://twitch.tv/turbo', categoryId: 2, plans: [
      { name: 'Turbo', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
    ]},
    { name: 'YouTube Music', websiteUrl: 'https://music.youtube.com', categoryId: 2, plans: [
      { name: 'Individual', frequency: 'monthly', priceMinor: 1199, currency: 'ARS' },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 1899, currency: 'ARS' },
    ]},
    { name: 'Tidal', websiteUrl: 'https://tidal.com', categoryId: 2, plans: [
      { name: 'HiFi', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
      { name: 'Student', frequency: 'monthly', priceMinor: 499, currency: 'USD' },
    ]},
    { name: 'Amazon Music Unlimited', websiteUrl: 'https://amazon.com/music/unlimited', categoryId: 2, plans: [
      { name: 'Prime', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
      { name: 'Non-Prime', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
    ]},
    { name: 'Deezer', websiteUrl: 'https://deezer.com', categoryId: 2, plans: [
      { name: 'Premium', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 1799, currency: 'USD' },
      { name: 'Premium', frequency: 'yearly', priceMinor: 10788, currency: 'USD' },
    ]},
    { name: 'Xbox Game Pass', websiteUrl: 'https://xbox.com/game-pass', categoryId: 2, plans: [
      { name: 'Essential', frequency: 'monthly', priceMinor: 8999, currency: 'ARS', sourceUrl: 'https://xbox.com/game-pass', lastVerifiedAt: now },
      { name: 'Premium', frequency: 'monthly', priceMinor: 11999, currency: 'ARS', sourceUrl: 'https://xbox.com/game-pass', lastVerifiedAt: now },
      { name: 'Ultimate', frequency: 'monthly', priceMinor: 18999, currency: 'ARS', sourceUrl: 'https://xbox.com/game-pass', lastVerifiedAt: now },
    ]},
    { name: 'PlayStation Plus', websiteUrl: 'https://playstation.com/ps-plus', categoryId: 2, plans: [
      { name: 'Essential', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
      { name: 'Extra', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
      { name: 'Premium', frequency: 'monthly', priceMinor: 1799, currency: 'USD' },
    ]},
    { name: 'Nintendo Switch Online', websiteUrl: 'https://nintendo.com/switch-online', categoryId: 2, plans: [
      { name: 'Individual', frequency: 'yearly', priceMinor: 28299, currency: 'ARS', sourceUrl: 'https://nintendo.com/switch-online', lastVerifiedAt: now },
      { name: 'Familiar', frequency: 'yearly', priceMinor: 70899, currency: 'ARS', sourceUrl: 'https://nintendo.com/switch-online', lastVerifiedAt: now },
    ]},
    { name: 'Apple Arcade', websiteUrl: 'https://apple.com/apple-arcade', categoryId: 2, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 699, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 4999, currency: 'USD' },
    ]},
    { name: 'GeForce Now', websiteUrl: 'https://geforcenow.com', categoryId: 2, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Performance', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
      { name: 'Ultimate', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
    ]},
    { name: 'NordVPN', websiteUrl: 'https://nordvpn.com', categoryId: 8, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 2799, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://nordvpn.com', lastVerifiedAt: now },
      { name: 'Annual', frequency: 'yearly', priceMinor: 27990, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://nordvpn.com', lastVerifiedAt: now },
    ]},
    { name: 'ExpressVPN', websiteUrl: 'https://expressvpn.com', categoryId: 8, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1295, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 9995, currency: 'USD' },
    ]},
    { name: 'Surfshark', websiteUrl: 'https://surfshark.com', categoryId: 8, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1545, currency: 'USD' },
    ]},
    { name: 'Proton VPN', websiteUrl: 'https://protonvpn.com', categoryId: 8, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Plus', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
      { name: 'Plus', frequency: 'yearly', priceMinor: 7188, currency: 'USD' },
    ]},
    { name: '1Password', websiteUrl: 'https://1password.com', categoryId: 8, plans: [
      { name: 'Individual', frequency: 'monthly', priceMinor: 1499, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://1password.com', lastVerifiedAt: now },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 2249, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://1password.com', lastVerifiedAt: now },
    ]},
    { name: 'Bitwarden Premium', websiteUrl: 'https://bitwarden.com', categoryId: 8, plans: [
      { name: 'Premium', frequency: 'yearly', priceMinor: 1000, currency: 'USD' },
    ]},
    { name: 'pCloud', websiteUrl: 'https://pcloud.com', categoryId: 5, plans: [
      { name: '500 GB', frequency: 'yearly', priceMinor: 4999, currency: 'USD' },
      { name: '2 TB', frequency: 'yearly', priceMinor: 9999, currency: 'USD' },
    ]},
    { name: 'Duolingo', websiteUrl: 'https://duolingo.com', categoryId: 7, plans: [
      { name: 'Super', frequency: 'monthly', priceMinor: 1299, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://duolingo.com', lastVerifiedAt: now },
      { name: 'Super', frequency: 'yearly', priceMinor: 12990, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://duolingo.com', lastVerifiedAt: now },
      { name: 'Max', frequency: 'monthly', priceMinor: 5599, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://duolingo.com', lastVerifiedAt: now },
    ]},
    { name: 'Coursera Plus', websiteUrl: 'https://coursera.org', categoryId: 7, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 5900, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 39900, currency: 'USD' },
    ]},
    { name: 'Skillshare', websiteUrl: 'https://skillshare.com', categoryId: 7, plans: [
      { name: 'Annual', frequency: 'yearly', priceMinor: 16788, currency: 'USD' },
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1899, currency: 'USD' },
    ]},
    { name: 'MasterClass', websiteUrl: 'https://masterclass.com', categoryId: 7, plans: [
      { name: 'Individual', frequency: 'yearly', priceMinor: 12000, currency: 'USD' },
      { name: 'Duo', frequency: 'yearly', priceMinor: 18000, currency: 'USD' },
      { name: 'Familiar', frequency: 'yearly', priceMinor: 24000, currency: 'USD' },
    ]},
    { name: 'Brilliant', websiteUrl: 'https://brilliant.org', categoryId: 7, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1500, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 12000, currency: 'USD' },
    ]},
    { name: 'Udemy', websiteUrl: 'https://udemy.com', categoryId: 7, plans: [
      { name: 'Personal Plan', frequency: 'monthly', priceMinor: 3200, currency: 'USD' },
      { name: 'Personal Plan', frequency: 'yearly', priceMinor: 15600, currency: 'USD' },
    ]},
    { name: 'Strava', websiteUrl: 'https://strava.com', categoryId: 6, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 7999, currency: 'USD' },
    ]},
    { name: 'MyFitnessPal', websiteUrl: 'https://myfitnesspal.com', categoryId: 6, plans: [
      { name: 'Premium', frequency: 'yearly', priceMinor: 7999, currency: 'USD' },
      { name: 'Premium', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
    ]},
    { name: 'Apple Fitness+', websiteUrl: 'https://apple.com/apple-fitness-plus', categoryId: 6, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 7999, currency: 'USD' },
    ]},
    { name: 'Calm', websiteUrl: 'https://calm.com', categoryId: 6, plans: [
      { name: 'Annual', frequency: 'yearly', priceMinor: 6999, currency: 'USD' },
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
    ]},
    { name: 'Headspace', websiteUrl: 'https://headspace.com', categoryId: 6, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 6999, currency: 'USD' },
    ]},
    { name: 'Medium', websiteUrl: 'https://medium.com', categoryId: 7, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 5000, currency: 'USD' },
    ]},
    { name: 'New York Times', websiteUrl: 'https://nytimes.com', categoryId: 7, plans: [
      { name: 'All Access', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
      { name: 'Games', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
      { name: 'Cooking', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
    ]},
    { name: 'Wall Street Journal', websiteUrl: 'https://wsj.com', categoryId: 7, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 15588, currency: 'USD' },
    ]},
    { name: 'Washington Post', websiteUrl: 'https://washingtonpost.com', categoryId: 7, plans: [
      { name: 'Core', frequency: 'yearly', priceMinor: 14000, currency: 'USD' },
      { name: 'Premium', frequency: 'yearly', priceMinor: 19000, currency: 'USD' },
    ]},
    { name: 'Kindle Unlimited', websiteUrl: 'https://amazon.com/kindle-unlimited', categoryId: 7, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
    ]},
    { name: 'Audible', websiteUrl: 'https://audible.com', categoryId: 7, plans: [
      { name: 'Standard', frequency: 'monthly', priceMinor: 899, currency: 'USD' },
      { name: 'Premium Plus', frequency: 'monthly', priceMinor: 1495, currency: 'USD' },
    ]},
    { name: 'Scribd', websiteUrl: 'https://scribd.com', categoryId: 7, plans: [
      { name: 'Standard', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
      { name: 'Plus', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
    ]},
    { name: 'Discord Nitro', websiteUrl: 'https://discord.com', categoryId: 2, plans: [
      { name: 'Nitro Basic', frequency: 'monthly', priceMinor: 299, currency: 'USD' },
      { name: 'Nitro', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
    ]},
    { name: 'Telegram Premium', websiteUrl: 'https://telegram.org', categoryId: 2, plans: [
      { name: 'Premium', frequency: 'monthly', priceMinor: 499, currency: 'USD' },
    ]},
    { name: 'LinkedIn Premium', websiteUrl: 'https://linkedin.com', categoryId: 3, plans: [
      { name: 'Career', frequency: 'monthly', priceMinor: 3999, currency: 'USD' },
      { name: 'Business', frequency: 'monthly', priceMinor: 5999, currency: 'USD' },
    ]},
    { name: 'YNAB', websiteUrl: 'https://ynab.com', categoryId: 11, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 10900, currency: 'USD' },
    ]},
    { name: 'Evernote', websiteUrl: 'https://evernote.com', categoryId: 3, plans: [
      { name: 'Personal', frequency: 'monthly', priceMinor: 5999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://evernote.com', lastVerifiedAt: now },
      { name: 'Professional', frequency: 'monthly', priceMinor: 8999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://evernote.com', lastVerifiedAt: now },
    ]},
    { name: 'Todoist', websiteUrl: 'https://todoist.com', categoryId: 3, plans: [
      { name: 'Pro', frequency: 'monthly', priceMinor: 2449, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://todoist.com', lastVerifiedAt: now },
      { name: 'Pro', frequency: 'yearly', priceMinor: 24490, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://todoist.com', lastVerifiedAt: now },
    ]},
    { name: 'Proton Unlimited', websiteUrl: 'https://proton.me', categoryId: 3, plans: [
      { name: 'Monthly', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
      { name: 'Annual', frequency: 'yearly', priceMinor: 9588, currency: 'USD' },
    ]},
    { name: 'Fastmail', websiteUrl: 'https://fastmail.com', categoryId: 3, plans: [
      { name: 'Basic', frequency: 'monthly', priceMinor: 300, currency: 'USD' },
      { name: 'Standard', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
      { name: 'Professional', frequency: 'monthly', priceMinor: 900, currency: 'USD' },
    ]},
    { name: 'IFTTT Pro', websiteUrl: 'https://ifttt.com', categoryId: 3, plans: [
      { name: 'Pro', frequency: 'monthly', priceMinor: 399, currency: 'USD' },
      { name: 'Pro+', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
    ]},
    { name: 'Apple One', websiteUrl: 'https://apple.com/apple-one', categoryId: 2, plans: [
      { name: 'Individual', frequency: 'monthly', priceMinor: 6999, currency: 'ARS' },
      { name: 'Familiar', frequency: 'monthly', priceMinor: 9999, currency: 'ARS' },
    ]},
    { name: 'Flow+', websiteUrl: 'https://flow.com.ar', categoryId: 2, plans: [
      { name: 'Flow+', frequency: 'monthly', priceMinor: 11499, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://flow.com.ar', lastVerifiedAt: now },
    ]},
    { name: 'Flow Full', websiteUrl: 'https://flow.com.ar', categoryId: 2, plans: [
      { name: 'Flow Full', frequency: 'monthly', priceMinor: 23999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://flow.com.ar', lastVerifiedAt: now },
    ]},
    { name: 'Canva', websiteUrl: 'https://canva.com', categoryId: 9, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'ARS' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://canva.com', lastVerifiedAt: now },
      { name: 'Business', frequency: 'monthly', priceMinor: 4999, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://canva.com', lastVerifiedAt: now },
    ]},
    { name: 'Slack', websiteUrl: 'https://slack.com', categoryId: 3, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 875, currency: 'USD' },
      { name: 'Business+', frequency: 'monthly', priceMinor: 1800, currency: 'USD' },
    ]},
    { name: 'Zoom', websiteUrl: 'https://zoom.us', categoryId: 3, plans: [
      { name: 'Basic', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
    ]},
    { name: 'Vercel', websiteUrl: 'https://vercel.com', categoryId: 4, plans: [
      { name: 'Hobby', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
    ]},
    { name: 'Supabase', websiteUrl: 'https://supabase.com', categoryId: 4, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
    ]},
    { name: 'Railway', websiteUrl: 'https://railway.com', categoryId: 4, plans: [
      { name: 'Hobby', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
    ]},
    { name: 'Render', websiteUrl: 'https://render.com', categoryId: 4, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
    ]},
    { name: 'Expo EAS', websiteUrl: 'https://expo.dev', categoryId: 4, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Starter', frequency: 'monthly', priceMinor: 1900, currency: 'USD' },
      { name: 'Production', frequency: 'monthly', priceMinor: 19900, currency: 'USD' },
    ]},
    { name: 'Netlify', websiteUrl: 'https://netlify.com', categoryId: 4, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Personal', frequency: 'monthly', priceMinor: 900, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
    ]},
    { name: 'Google Gemini', websiteUrl: 'https://gemini.google.com', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'ARS' },
      { name: 'AI Pro', frequency: 'monthly', priceMinor: 7499, currency: 'ARS', taxMode: 'final_price', sourceUrl: 'https://gemini.google.com', lastVerifiedAt: now },
    ]},
    { name: 'Replit', websiteUrl: 'https://replit.com', categoryId: 1, plans: [
      { name: 'Starter', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Core', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
      { name: 'Core', frequency: 'yearly', priceMinor: 24000, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 10000, currency: 'USD' },
    ]},
    { name: 'Bolt.new', websiteUrl: 'https://bolt.new', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
      { name: 'Teams', frequency: 'monthly', priceMinor: 3000, currency: 'USD' },
    ]},
    { name: 'Lovable', websiteUrl: 'https://lovable.dev', categoryId: 1, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
      { name: 'Business', frequency: 'monthly', priceMinor: 5000, currency: 'USD' },
    ]},
    { name: 'Firebase', websiteUrl: 'https://firebase.google.com', categoryId: 4, plans: [
      { name: 'Spark (Free)', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Blaze (Pay as you go)', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
    ]},
    { name: 'AWS', websiteUrl: 'https://aws.amazon.com', categoryId: 4, plans: [
      { name: 'Pay as you go', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
    ]},
    { name: 'Google Cloud', websiteUrl: 'https://cloud.google.com', categoryId: 4, plans: [
      { name: 'Pay as you go', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
    ]},
    { name: 'Make', websiteUrl: 'https://make.com', categoryId: 3, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Core', frequency: 'monthly', priceMinor: 1200, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 2100, currency: 'USD' },
      { name: 'Teams', frequency: 'monthly', priceMinor: 3800, currency: 'USD' },
    ]},
    { name: 'Zapier', websiteUrl: 'https://zapier.com', categoryId: 3, plans: [
      { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Professional', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
      { name: 'Team', frequency: 'monthly', priceMinor: 6900, currency: 'USD' },
    ]},
    { name: 'n8n', websiteUrl: 'https://n8n.io', categoryId: 4, plans: [
      { name: 'Community (self-hosted)', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      { name: 'Starter', frequency: 'monthly', priceMinor: 2400, currency: 'USD' },
      { name: 'Pro', frequency: 'monthly', priceMinor: 6000, currency: 'USD' },
    ]},
    { name: 'Apple Developer', websiteUrl: 'https://developer.apple.com', categoryId: 4, plans: [
      { name: 'Standard', frequency: 'yearly', priceMinor: 9900, currency: 'USD' },
      { name: 'Enterprise', frequency: 'yearly', priceMinor: 29900, currency: 'USD' },
    ]},
    { name: 'Google Play Console', websiteUrl: 'https://play.google.com/console', categoryId: 4, plans: [
      { name: 'Registration (one-time)', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
    ]},
  ];

  const pricingUrlMap = new Map(PRICE_WATCH_CATALOG.map((e) => [e.providerName, e.pricingUrl]));

  for (const p of providerData) {
    const pricingUrl = pricingUrlMap.get(p.name) ?? null;

    const { data: existing } = await supabase
      .from('providers')
      .select('id')
      .eq('name', p.name)
      .maybeSingle();

    let providerId: number | null = existing?.id ?? null;

    if (providerId) {
      await supabase
        .from('plans')
        .delete()
        .eq('provider_id', providerId);

      await supabase
        .from('providers')
        .update({ category_id: p.categoryId, pricing_url: pricingUrl })
        .eq('id', providerId);
    } else {
      const { data: inserted, error } = await supabase
        .from('providers')
        .insert({
          name: p.name,
          website_url: p.websiteUrl,
          pricing_url: pricingUrl,
          category_id: p.categoryId,
          is_custom: false,
          created_at: now,
        })
        .select('id')
        .single();
      if (error) {
        console.log(`[Supabase seed] Error inserting provider "${p.name}":`, error.message);
        continue;
      }
      providerId = inserted.id;
    }

    if (!providerId) continue;

    const planRows = p.plans.map((plan) => ({
      provider_id: providerId,
      name: plan.name,
      frequency: plan.frequency,
      suggested_price_minor: plan.priceMinor,
      currency_code: plan.currency,
      is_suggested: true,
      tax_mode: plan.taxMode ?? 'tax_excluded',
      source_url: plan.sourceUrl ?? null,
      last_verified_at: plan.lastVerifiedAt ?? null,
      audit_status: plan.auditStatus ?? 'verified',
      created_at: now,
    }));

    const { error: planErr } = await supabase.from('plans').insert(planRows);
    if (planErr) console.log(`[Supabase seed] Error inserting plans for "${p.name}":`, planErr.message);
  }

  const STUB_CAT_REMAP: Record<number, number> = {
    3: 4, 4: 2, 11: 2, 12: 7, 13: 7, 14: 2, 15: 11, 16: 3, 17: 2, 18: 12, 19: 12, 20: 10, 21: 10,
  };

  const providerDataNames = new Set(providerData.map((p) => p.name));

  for (const [name, websiteUrl, rawCatId] of STUB_CATALOG) {
    const categoryId = STUB_CAT_REMAP[rawCatId] ?? rawCatId;
    if (providerDataNames.has(name)) continue;

    const { data: existing } = await supabase
      .from('providers')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    if (existing) continue;

    const { data: inserted } = await supabase
      .from('providers')
      .insert({ name, website_url: websiteUrl, category_id: categoryId, is_custom: false, created_at: now })
      .select('id')
      .single();

    if (inserted) {
      await supabase.from('plans').insert({
        provider_id: inserted.id,
        name: 'Plan personalizado',
        frequency: 'monthly',
        suggested_price_minor: 0,
        currency_code: 'USD',
        is_suggested: true,
        tax_mode: 'tax_excluded',
        source_url: null,
        last_verified_at: null,
        audit_status: 'manual_required',
        created_at: now,
      });
    }
  }
}
