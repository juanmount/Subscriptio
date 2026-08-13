import { db } from '@/data/db/client';
import { categories, currencies, providers, plans, settings, subscriptions, cards } from '@/data/schema';
import { eq, isNull, and, notInArray } from 'drizzle-orm';
import { STUB_CATALOG } from './stub-catalog';
import { PRICE_WATCH_CATALOG } from './price-watch-catalog';

const SEED_VERSION = '14';

let _seedPromise: Promise<void> | null = null;

export function runSeedIfNeeded(): Promise<void> {
  if (_seedPromise) return _seedPromise;
  _seedPromise = _runSeed().catch((err) => {
    _seedPromise = null;
    throw err;
  });
  return _seedPromise;
}

async function _runSeed(): Promise<void> {
  const existing = await db.select().from(settings).where(eq(settings.key, 'seed_version'));
  if (existing.length > 0 && existing[0].value === SEED_VERSION) return;

  await seedCurrencies();
  await seedCategories();
  await seedProviders();
  await cleanOrphanedSubscriptions();
  await seedDemoData();

  await db
    .insert(settings)
    .values({ key: 'seed_version', value: SEED_VERSION })
    .onConflictDoUpdate({ target: settings.key, set: { value: SEED_VERSION } });
}

async function seedCurrencies(): Promise<void> {
  const data = [
    { code: 'USD', symbol: 'US$', name: 'Dólar estadounidense', minorUnit: 2 },
    { code: 'ARS', symbol: '$', name: 'Peso argentino', minorUnit: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', minorUnit: 2 },
    { code: 'BRL', symbol: 'R$', name: 'Real brasileño', minorUnit: 2 },
    { code: 'MXN', symbol: 'MX$', name: 'Peso mexicano', minorUnit: 2 },
    { code: 'CLP', symbol: 'CL$', name: 'Peso chileno', minorUnit: 0 },
    { code: 'COP', symbol: 'CO$', name: 'Peso colombiano', minorUnit: 2 },
    { code: 'GBP', symbol: '£', name: 'Libra esterlina', minorUnit: 2 },
  ];
  for (const c of data) {
    await db.insert(currencies).values(c).onConflictDoNothing();
  }
}

async function seedCategories(): Promise<void> {
  const data = [
    { id: 1,  name: 'IA',                  icon: '🤖', color: '#6B52E0' },
    { id: 2,  name: 'Entretenimiento',      icon: '🎬', color: '#2D9E40' },
    { id: 3,  name: 'Productividad',        icon: '⚡', color: '#2B6ED4' },
    { id: 4,  name: 'Desarrollo',           icon: '💻', color: '#F97316' },
    { id: 5,  name: 'Almacenamiento',       icon: '☁️', color: '#B07800' },
    { id: 6,  name: 'Salud y Fitness',      icon: '💪', color: '#00875A' },
    { id: 7,  name: 'Educación',            icon: '�', color: '#0066CC' },
    { id: 8,  name: 'Seguridad',            icon: '🔒', color: '#CC6600' },
    { id: 9,  name: 'Diseño y Creatividad', icon: '🎨', color: '#CC0066' },
    { id: 10, name: 'Otras',                icon: '···', color: '#666666' },
    { id: 11, name: 'Finanzas',             icon: '💰', color: '#2E7D32' },
    { id: 12, name: 'Marketing',            icon: '📣', color: '#E91E63' },
  ];
  for (const c of data) {
    await db
      .insert(categories)
      .values(c)
      .onConflictDoUpdate({ target: categories.id, set: { name: c.name, icon: c.icon, color: c.color } });
  }
}

async function seedProviders(): Promise<void> {
  const now = Date.now();
  const existingProviders = await db
    .select({ id: providers.id, name: providers.name })
    .from(providers)
    .where(eq(providers.isCustom, false));
  const existingByName = new Map(existingProviders.map((p) => [p.name, p.id]));

  const providerData: Array<{
    name: string;
    websiteUrl: string;
    categoryId: number;
    plans: Array<{ name: string; frequency: string; priceMinor: number; currency: string }>;
  }> = [
    {
      name: 'ChatGPT',
      websiteUrl: 'https://chat.openai.com',
      categoryId: 1,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Plus', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 20000, currency: 'USD' },
      ],
    },
    {
      name: 'Claude',
      websiteUrl: 'https://claude.ai',
      categoryId: 1,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
        { name: 'Pro', frequency: 'yearly', priceMinor: 20000, currency: 'USD' },
        { name: 'Max 5x', frequency: 'monthly', priceMinor: 10000, currency: 'USD' },
      ],
    },
    {
      name: 'ElevenLabs',
      websiteUrl: 'https://elevenlabs.io',
      categoryId: 1,
      plans: [
        { name: 'Starter', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
        { name: 'Creator', frequency: 'monthly', priceMinor: 2200, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 9900, currency: 'USD' },
      ],
    },
    {
      name: 'Higgsfield',
      websiteUrl: 'https://higgsfield.ai',
      categoryId: 1,
      plans: [
        { name: 'Creator', frequency: 'monthly', priceMinor: 1500, currency: 'USD' },
        { name: 'Ultra', frequency: 'monthly', priceMinor: 3900, currency: 'USD' },
      ],
    },
    {
      name: 'Midjourney',
      websiteUrl: 'https://midjourney.com',
      categoryId: 1,
      plans: [
        { name: 'Basic', frequency: 'monthly', priceMinor: 1000, currency: 'USD' },
        { name: 'Standard', frequency: 'monthly', priceMinor: 3000, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 6000, currency: 'USD' },
      ],
    },
    {
      name: 'Netflix',
      websiteUrl: 'https://netflix.com',
      categoryId: 2,
      plans: [
        { name: 'Standard with Ads', frequency: 'monthly', priceMinor: 899, currency: 'USD' },
        { name: 'Standard', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
        { name: 'Premium', frequency: 'monthly', priceMinor: 2699, currency: 'USD' },
      ],
    },
    {
      name: 'Disney+',
      websiteUrl: 'https://disneyplus.com',
      categoryId: 2,
      plans: [
        { name: 'Basic with Ads', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
        { name: 'Premium', frequency: 'monthly', priceMinor: 1899, currency: 'USD' },
        { name: 'Premium', frequency: 'yearly', priceMinor: 18999, currency: 'USD' },
      ],
    },
    {
      name: 'YouTube Premium',
      websiteUrl: 'https://youtube.com/premium',
      categoryId: 2,
      plans: [
        { name: 'Individual', frequency: 'monthly', priceMinor: 1599, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 2699, currency: 'USD' },
        { name: 'Lite', frequency: 'monthly', priceMinor: 899, currency: 'USD' },
      ],
    },
    {
      name: 'Spotify Premium',
      websiteUrl: 'https://spotify.com',
      categoryId: 2,
      plans: [
        { name: 'Individual', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
        { name: 'Duo', frequency: 'monthly', priceMinor: 1899, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 2199, currency: 'USD' },
        { name: 'Student', frequency: 'monthly', priceMinor: 599, currency: 'USD' },
      ],
    },
    {
      name: 'Apple Music',
      websiteUrl: 'https://music.apple.com',
      categoryId: 2,
      plans: [
        { name: 'Individual', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
        { name: 'Student', frequency: 'monthly', priceMinor: 599, currency: 'USD' },
        { name: 'Individual', frequency: 'yearly', priceMinor: 10900, currency: 'USD' },
      ],
    },
    {
      name: 'Adobe Creative Cloud',
      websiteUrl: 'https://adobe.com',
      categoryId: 9,
      plans: [
        { name: 'Fotografía', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'Individual', frequency: 'monthly', priceMinor: 5999, currency: 'USD' },
        { name: 'Individual', frequency: 'yearly', priceMinor: 59988, currency: 'USD' },
      ],
    },
    {
      name: 'Figma',
      websiteUrl: 'https://figma.com',
      categoryId: 9,
      plans: [
        { name: 'Professional', frequency: 'monthly', priceMinor: 1500, currency: 'USD' },
        { name: 'Professional', frequency: 'yearly', priceMinor: 14400, currency: 'USD' },
        { name: 'Organization', frequency: 'yearly', priceMinor: 45600, currency: 'USD' },
      ],
    },
    {
      name: 'Google One',
      websiteUrl: 'https://one.google.com',
      categoryId: 5,
      plans: [
        { name: '100 GB', frequency: 'monthly', priceMinor: 199, currency: 'USD' },
        { name: '200 GB', frequency: 'monthly', priceMinor: 299, currency: 'USD' },
        { name: '2 TB', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: '5 TB', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
      ],
    },
    {
      name: 'iCloud+',
      websiteUrl: 'https://icloud.com',
      categoryId: 5,
      plans: [
        { name: '50 GB', frequency: 'monthly', priceMinor: 99, currency: 'USD' },
        { name: '200 GB', frequency: 'monthly', priceMinor: 299, currency: 'USD' },
        { name: '2 TB', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: '6 TB', frequency: 'monthly', priceMinor: 2999, currency: 'USD' },
        { name: '12 TB', frequency: 'monthly', priceMinor: 5999, currency: 'USD' },
      ],
    },
    {
      name: 'Notion',
      websiteUrl: 'https://notion.so',
      categoryId: 3,
      plans: [
        { name: 'Plus', frequency: 'monthly', priceMinor: 1200, currency: 'USD' },
        { name: 'Plus', frequency: 'yearly', priceMinor: 9600, currency: 'USD' },
        { name: 'Business', frequency: 'yearly', priceMinor: 18000, currency: 'USD' },
      ],
    },
    {
      name: 'Microsoft 365',
      websiteUrl: 'https://microsoft.com/microsoft-365',
      categoryId: 3,
      plans: [
        { name: 'Personal', frequency: 'monthly', priceMinor: 699, currency: 'USD' },
        { name: 'Personal', frequency: 'yearly', priceMinor: 6999, currency: 'USD' },
        { name: 'Familiar', frequency: 'yearly', priceMinor: 9999, currency: 'USD' },
      ],
    },
    {
      name: 'Dropbox',
      websiteUrl: 'https://dropbox.com',
      categoryId: 5,
      plans: [
        { name: 'Plus', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
        { name: 'Plus', frequency: 'yearly', priceMinor: 9996, currency: 'USD' },
        { name: 'Professional', frequency: 'yearly', priceMinor: 19996, currency: 'USD' },
      ],
    },
    {
      name: 'GitHub',
      websiteUrl: 'https://github.com',
      categoryId: 4,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 400, currency: 'USD' },
        { name: 'Team', frequency: 'monthly', priceMinor: 400, currency: 'USD' },
      ],
    },
    {
      name: 'Linear',
      websiteUrl: 'https://linear.app',
      categoryId: 4,
      plans: [
        { name: 'Plus', frequency: 'yearly', priceMinor: 8000, currency: 'USD' },
        { name: 'Business', frequency: 'yearly', priceMinor: 16000, currency: 'USD' },
      ],
    },
    {
      name: 'Perplexity',
      websiteUrl: 'https://perplexity.ai',
      categoryId: 1,
      plans: [
        { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
        { name: 'Pro', frequency: 'yearly', priceMinor: 19200, currency: 'USD' },
      ],
    },
    {
      name: 'Cursor',
      websiteUrl: 'https://cursor.com',
      categoryId: 1,
      plans: [
        { name: 'Hobby', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
        { name: 'Teams', frequency: 'monthly', priceMinor: 4000, currency: 'USD' },
      ],
    },
    {
      name: 'GitHub Copilot',
      websiteUrl: 'https://github.com/features/copilot',
      categoryId: 1,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 1000, currency: 'USD' },
        { name: 'Pro+', frequency: 'monthly', priceMinor: 3900, currency: 'USD' },
      ],
    },
    {
      name: 'Windsurf',
      websiteUrl: 'https://windsurf.com',
      categoryId: 1,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
        { name: 'Max', frequency: 'monthly', priceMinor: 20000, currency: 'USD' },
      ],
    },
    {
      name: 'Runway',
      websiteUrl: 'https://runwayml.com',
      categoryId: 1,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Standard', frequency: 'monthly', priceMinor: 1500, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 3500, currency: 'USD' },
      ],
    },
    {
      name: 'HBO Max',
      websiteUrl: 'https://max.com',
      categoryId: 2,
      plans: [
        { name: 'Basic with Ads', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
        { name: 'Standard', frequency: 'monthly', priceMinor: 1849, currency: 'USD' },
        { name: 'Premium', frequency: 'monthly', priceMinor: 2299, currency: 'USD' },
      ],
    },
    {
      name: 'Prime Video',
      websiteUrl: 'https://amazon.com/prime',
      categoryId: 2,
      plans: [
        { name: 'Standalone with Ads', frequency: 'monthly', priceMinor: 899, currency: 'USD' },
        { name: 'Prime', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
        { name: 'Prime', frequency: 'yearly', priceMinor: 13900, currency: 'USD' },
      ],
    },
    {
      name: 'Apple TV+',
      websiteUrl: 'https://tv.apple.com',
      categoryId: 2,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 9999, currency: 'USD' },
      ],
    },
    {
      name: 'Paramount+',
      websiteUrl: 'https://paramountplus.com',
      categoryId: 2,
      plans: [
        { name: 'Essential', frequency: 'monthly', priceMinor: 899, currency: 'USD' },
        { name: 'Premium with Showtime', frequency: 'monthly', priceMinor: 1399, currency: 'USD' },
      ],
    },
    {
      name: 'Peacock',
      websiteUrl: 'https://peacocktv.com',
      categoryId: 2,
      plans: [
        { name: 'Premium', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
        { name: 'Premium Plus', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
      ],
    },
    {
      name: 'Hulu',
      websiteUrl: 'https://hulu.com',
      categoryId: 2,
      plans: [
        { name: 'With Ads', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
        { name: 'No Ads', frequency: 'monthly', priceMinor: 1899, currency: 'USD' },
      ],
    },
    {
      name: 'Crunchyroll',
      websiteUrl: 'https://crunchyroll.com',
      categoryId: 2,
      plans: [
        { name: 'Fan', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'Mega Fan', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
        { name: 'Ultimate Fan', frequency: 'monthly', priceMinor: 1799, currency: 'USD' },
      ],
    },
    {
      name: 'ESPN+',
      websiteUrl: 'https://espn.com/plus',
      categoryId: 2,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 11999, currency: 'USD' },
      ],
    },
    {
      name: 'Twitch Turbo',
      websiteUrl: 'https://twitch.tv/turbo',
      categoryId: 2,
      plans: [
        { name: 'Turbo', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
      ],
    },
    {
      name: 'YouTube Music',
      websiteUrl: 'https://music.youtube.com',
      categoryId: 2,
      plans: [
        { name: 'Individual', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 1899, currency: 'USD' },
      ],
    },
    {
      name: 'Tidal',
      websiteUrl: 'https://tidal.com',
      categoryId: 2,
      plans: [
        { name: 'HiFi', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
        { name: 'Student', frequency: 'monthly', priceMinor: 499, currency: 'USD' },
      ],
    },
    {
      name: 'Amazon Music Unlimited',
      websiteUrl: 'https://amazon.com/music/unlimited',
      categoryId: 2,
      plans: [
        { name: 'Prime', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'Non-Prime', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
      ],
    },
    {
      name: 'Deezer',
      websiteUrl: 'https://deezer.com',
      categoryId: 2,
      plans: [
        { name: 'Premium', frequency: 'monthly', priceMinor: 1099, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 1799, currency: 'USD' },
        { name: 'Premium', frequency: 'yearly', priceMinor: 10788, currency: 'USD' },
      ],
    },
    {
      name: 'Xbox Game Pass',
      websiteUrl: 'https://xbox.com/game-pass',
      categoryId: 2,
      plans: [
        { name: 'Essential', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'PC', frequency: 'monthly', priceMinor: 1399, currency: 'USD' },
        { name: 'Ultimate', frequency: 'monthly', priceMinor: 2299, currency: 'USD' },
      ],
    },
    {
      name: 'PlayStation Plus',
      websiteUrl: 'https://playstation.com/ps-plus',
      categoryId: 2,
      plans: [
        { name: 'Essential', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'Extra', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
        { name: 'Premium', frequency: 'monthly', priceMinor: 1799, currency: 'USD' },
      ],
    },
    {
      name: 'Nintendo Switch Online',
      websiteUrl: 'https://nintendo.com/switch-online',
      categoryId: 2,
      plans: [
        { name: 'Individual', frequency: 'monthly', priceMinor: 399, currency: 'USD' },
        { name: 'Individual', frequency: 'yearly', priceMinor: 1999, currency: 'USD' },
        { name: 'Familiar', frequency: 'yearly', priceMinor: 3499, currency: 'USD' },
      ],
    },
    {
      name: 'Apple Arcade',
      websiteUrl: 'https://apple.com/apple-arcade',
      categoryId: 2,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 699, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 4999, currency: 'USD' },
      ],
    },
    {
      name: 'GeForce Now',
      websiteUrl: 'https://geforcenow.com',
      categoryId: 2,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Performance', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'Ultimate', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
      ],
    },
    {
      name: 'NordVPN',
      websiteUrl: 'https://nordvpn.com',
      categoryId: 8,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 5988, currency: 'USD' },
      ],
    },
    {
      name: 'ExpressVPN',
      websiteUrl: 'https://expressvpn.com',
      categoryId: 8,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1295, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 9995, currency: 'USD' },
      ],
    },
    {
      name: 'Surfshark',
      websiteUrl: 'https://surfshark.com',
      categoryId: 8,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1545, currency: 'USD' },
      ],
    },
    {
      name: 'Proton VPN',
      websiteUrl: 'https://protonvpn.com',
      categoryId: 8,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Plus', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'Plus', frequency: 'yearly', priceMinor: 7188, currency: 'USD' },
      ],
    },
    {
      name: '1Password',
      websiteUrl: 'https://1password.com',
      categoryId: 8,
      plans: [
        { name: 'Individual', frequency: 'monthly', priceMinor: 299, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 499, currency: 'USD' },
      ],
    },
    {
      name: 'Bitwarden Premium',
      websiteUrl: 'https://bitwarden.com',
      categoryId: 8,
      plans: [
        { name: 'Premium', frequency: 'yearly', priceMinor: 1000, currency: 'USD' },
      ],
    },
    {
      name: 'pCloud',
      websiteUrl: 'https://pcloud.com',
      categoryId: 5,
      plans: [
        { name: '500 GB', frequency: 'yearly', priceMinor: 4999, currency: 'USD' },
        { name: '2 TB', frequency: 'yearly', priceMinor: 9999, currency: 'USD' },
      ],
    },
    {
      name: 'Duolingo',
      websiteUrl: 'https://duolingo.com',
      categoryId: 7,
      plans: [
        { name: 'Super', frequency: 'monthly', priceMinor: 699, currency: 'USD' },
        { name: 'Super', frequency: 'yearly', priceMinor: 8388, currency: 'USD' },
        { name: 'Max', frequency: 'monthly', priceMinor: 2999, currency: 'USD' },
      ],
    },
    {
      name: 'Coursera Plus',
      websiteUrl: 'https://coursera.org',
      categoryId: 7,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 5900, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 39900, currency: 'USD' },
      ],
    },
    {
      name: 'Skillshare',
      websiteUrl: 'https://skillshare.com',
      categoryId: 7,
      plans: [
        { name: 'Annual', frequency: 'yearly', priceMinor: 16788, currency: 'USD' },
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1899, currency: 'USD' },
      ],
    },
    {
      name: 'MasterClass',
      websiteUrl: 'https://masterclass.com',
      categoryId: 7,
      plans: [
        { name: 'Individual', frequency: 'yearly', priceMinor: 12000, currency: 'USD' },
        { name: 'Duo', frequency: 'yearly', priceMinor: 18000, currency: 'USD' },
        { name: 'Familiar', frequency: 'yearly', priceMinor: 24000, currency: 'USD' },
      ],
    },
    {
      name: 'Brilliant',
      websiteUrl: 'https://brilliant.org',
      categoryId: 7,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1500, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 12000, currency: 'USD' },
      ],
    },
    {
      name: 'Udemy',
      websiteUrl: 'https://udemy.com',
      categoryId: 7,
      plans: [
        { name: 'Personal Plan', frequency: 'monthly', priceMinor: 3200, currency: 'USD' },
        { name: 'Personal Plan', frequency: 'yearly', priceMinor: 15600, currency: 'USD' },
      ],
    },
    {
      name: 'Strava',
      websiteUrl: 'https://strava.com',
      categoryId: 6,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 7999, currency: 'USD' },
      ],
    },
    {
      name: 'MyFitnessPal',
      websiteUrl: 'https://myfitnesspal.com',
      categoryId: 6,
      plans: [
        { name: 'Premium', frequency: 'yearly', priceMinor: 7999, currency: 'USD' },
        { name: 'Premium', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
      ],
    },
    {
      name: 'Apple Fitness+',
      websiteUrl: 'https://apple.com/apple-fitness-plus',
      categoryId: 6,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 7999, currency: 'USD' },
      ],
    },
    {
      name: 'Calm',
      websiteUrl: 'https://calm.com',
      categoryId: 6,
      plans: [
        { name: 'Annual', frequency: 'yearly', priceMinor: 6999, currency: 'USD' },
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
      ],
    },
    {
      name: 'Headspace',
      websiteUrl: 'https://headspace.com',
      categoryId: 6,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 6999, currency: 'USD' },
      ],
    },
    {
      name: 'Medium',
      websiteUrl: 'https://medium.com',
      categoryId: 7,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 5000, currency: 'USD' },
      ],
    },
    {
      name: 'New York Times',
      websiteUrl: 'https://nytimes.com',
      categoryId: 7,
      plans: [
        { name: 'All Access', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
        { name: 'Games', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
        { name: 'Cooking', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
      ],
    },
    {
      name: 'Wall Street Journal',
      websiteUrl: 'https://wsj.com',
      categoryId: 7,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 15588, currency: 'USD' },
      ],
    },
    {
      name: 'Washington Post',
      websiteUrl: 'https://washingtonpost.com',
      categoryId: 7,
      plans: [
        { name: 'Core', frequency: 'yearly', priceMinor: 14000, currency: 'USD' },
        { name: 'Premium', frequency: 'yearly', priceMinor: 19000, currency: 'USD' },
      ],
    },
    {
      name: 'Kindle Unlimited',
      websiteUrl: 'https://amazon.com/kindle-unlimited',
      categoryId: 7,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
      ],
    },
    {
      name: 'Audible',
      websiteUrl: 'https://audible.com',
      categoryId: 7,
      plans: [
        { name: 'Standard', frequency: 'monthly', priceMinor: 899, currency: 'USD' },
        { name: 'Premium Plus', frequency: 'monthly', priceMinor: 1495, currency: 'USD' },
      ],
    },
    {
      name: 'Scribd',
      websiteUrl: 'https://scribd.com',
      categoryId: 7,
      plans: [
        { name: 'Standard', frequency: 'monthly', priceMinor: 1199, currency: 'USD' },
        { name: 'Plus', frequency: 'monthly', priceMinor: 1699, currency: 'USD' },
      ],
    },
    {
      name: 'Discord Nitro',
      websiteUrl: 'https://discord.com',
      categoryId: 2,
      plans: [
        { name: 'Nitro Basic', frequency: 'monthly', priceMinor: 299, currency: 'USD' },
        { name: 'Nitro', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
      ],
    },
    {
      name: 'Telegram Premium',
      websiteUrl: 'https://telegram.org',
      categoryId: 2,
      plans: [
        { name: 'Premium', frequency: 'monthly', priceMinor: 499, currency: 'USD' },
      ],
    },
    {
      name: 'LinkedIn Premium',
      websiteUrl: 'https://linkedin.com',
      categoryId: 3,
      plans: [
        { name: 'Career', frequency: 'monthly', priceMinor: 3999, currency: 'USD' },
        { name: 'Business', frequency: 'monthly', priceMinor: 5999, currency: 'USD' },
      ],
    },
    {
      name: 'YNAB',
      websiteUrl: 'https://ynab.com',
      categoryId: 11,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 10900, currency: 'USD' },
      ],
    },
    {
      name: 'Evernote',
      websiteUrl: 'https://evernote.com',
      categoryId: 3,
      plans: [
        { name: 'Personal', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
        { name: 'Professional', frequency: 'monthly', priceMinor: 1799, currency: 'USD' },
      ],
    },
    {
      name: 'Todoist',
      websiteUrl: 'https://todoist.com',
      categoryId: 3,
      plans: [
        { name: 'Pro', frequency: 'monthly', priceMinor: 400, currency: 'USD' },
        { name: 'Pro', frequency: 'yearly', priceMinor: 3600, currency: 'USD' },
      ],
    },
    {
      name: 'Proton Unlimited',
      websiteUrl: 'https://proton.me',
      categoryId: 3,
      plans: [
        { name: 'Monthly', frequency: 'monthly', priceMinor: 999, currency: 'USD' },
        { name: 'Annual', frequency: 'yearly', priceMinor: 9588, currency: 'USD' },
      ],
    },
    {
      name: 'Fastmail',
      websiteUrl: 'https://fastmail.com',
      categoryId: 3,
      plans: [
        { name: 'Basic', frequency: 'monthly', priceMinor: 300, currency: 'USD' },
        { name: 'Standard', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
        { name: 'Professional', frequency: 'monthly', priceMinor: 900, currency: 'USD' },
      ],
    },
    {
      name: 'IFTTT Pro',
      websiteUrl: 'https://ifttt.com',
      categoryId: 3,
      plans: [
        { name: 'Pro', frequency: 'monthly', priceMinor: 399, currency: 'USD' },
        { name: 'Pro+', frequency: 'monthly', priceMinor: 1299, currency: 'USD' },
      ],
    },
    {
      name: 'Apple One',
      websiteUrl: 'https://apple.com/apple-one',
      categoryId: 2,
      plans: [
        { name: 'Individual', frequency: 'monthly', priceMinor: 2195, currency: 'USD' },
        { name: 'Familiar', frequency: 'monthly', priceMinor: 2895, currency: 'USD' },
        { name: 'Premier', frequency: 'monthly', priceMinor: 3795, currency: 'USD' },
      ],
    },
    {
      name: 'Canva',
      websiteUrl: 'https://canva.com',
      categoryId: 9,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
        { name: 'Business', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
      ],
    },
    {
      name: 'Slack',
      websiteUrl: 'https://slack.com',
      categoryId: 3,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 875, currency: 'USD' },
        { name: 'Business+', frequency: 'monthly', priceMinor: 1800, currency: 'USD' },
      ],
    },
    {
      name: 'Zoom',
      websiteUrl: 'https://zoom.us',
      categoryId: 3,
      plans: [
        { name: 'Basic', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 1499, currency: 'USD' },
      ],
    },
    {
      name: 'Vercel',
      websiteUrl: 'https://vercel.com',
      categoryId: 4,
      plans: [
        { name: 'Hobby', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
      ],
    },
    {
      name: 'Supabase',
      websiteUrl: 'https://supabase.com',
      categoryId: 4,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
      ],
    },
    {
      name: 'Railway',
      websiteUrl: 'https://railway.com',
      categoryId: 4,
      plans: [
        { name: 'Hobby', frequency: 'monthly', priceMinor: 500, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
      ],
    },
    {
      name: 'Render',
      websiteUrl: 'https://render.com',
      categoryId: 4,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
      ],
    },
    {
      name: 'Expo EAS',
      websiteUrl: 'https://expo.dev',
      categoryId: 4,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Starter', frequency: 'monthly', priceMinor: 1900, currency: 'USD' },
        { name: 'Production', frequency: 'monthly', priceMinor: 19900, currency: 'USD' },
      ],
    },
    {
      name: 'Netlify',
      websiteUrl: 'https://netlify.com',
      categoryId: 4,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Personal', frequency: 'monthly', priceMinor: 900, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2000, currency: 'USD' },
      ],
    },
    {
      name: 'Google Gemini',
      websiteUrl: 'https://gemini.google.com',
      categoryId: 1,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'AI Pro', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
      ],
    },
    {
      name: 'Replit',
      websiteUrl: 'https://replit.com',
      categoryId: 1,
      plans: [
        { name: 'Starter', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Core', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
        { name: 'Core', frequency: 'yearly', priceMinor: 24000, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 10000, currency: 'USD' },
      ],
    },
    {
      name: 'Bolt.new',
      websiteUrl: 'https://bolt.new',
      categoryId: 1,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
        { name: 'Teams', frequency: 'monthly', priceMinor: 3000, currency: 'USD' },
      ],
    },
    {
      name: 'Lovable',
      websiteUrl: 'https://lovable.dev',
      categoryId: 1,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
        { name: 'Business', frequency: 'monthly', priceMinor: 5000, currency: 'USD' },
      ],
    },
    {
      name: 'Firebase',
      websiteUrl: 'https://firebase.google.com',
      categoryId: 4,
      plans: [
        { name: 'Spark (Free)', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Blaze (Pay as you go)', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      ],
    },
    {
      name: 'AWS',
      websiteUrl: 'https://aws.amazon.com',
      categoryId: 4,
      plans: [
        { name: 'Pay as you go', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      ],
    },
    {
      name: 'Google Cloud',
      websiteUrl: 'https://cloud.google.com',
      categoryId: 4,
      plans: [
        { name: 'Pay as you go', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
      ],
    },
    {
      name: 'Make',
      websiteUrl: 'https://make.com',
      categoryId: 3,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Core', frequency: 'monthly', priceMinor: 1200, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 2100, currency: 'USD' },
        { name: 'Teams', frequency: 'monthly', priceMinor: 3800, currency: 'USD' },
      ],
    },
    {
      name: 'Zapier',
      websiteUrl: 'https://zapier.com',
      categoryId: 3,
      plans: [
        { name: 'Free', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Professional', frequency: 'monthly', priceMinor: 1999, currency: 'USD' },
        { name: 'Team', frequency: 'monthly', priceMinor: 6900, currency: 'USD' },
      ],
    },
    {
      name: 'n8n',
      websiteUrl: 'https://n8n.io',
      categoryId: 4,
      plans: [
        { name: 'Community (self-hosted)', frequency: 'monthly', priceMinor: 0, currency: 'USD' },
        { name: 'Starter', frequency: 'monthly', priceMinor: 2400, currency: 'USD' },
        { name: 'Pro', frequency: 'monthly', priceMinor: 6000, currency: 'USD' },
      ],
    },
    {
      name: 'Apple Developer',
      websiteUrl: 'https://developer.apple.com',
      categoryId: 4,
      plans: [
        { name: 'Standard', frequency: 'yearly', priceMinor: 9900, currency: 'USD' },
        { name: 'Enterprise', frequency: 'yearly', priceMinor: 29900, currency: 'USD' },
      ],
    },
    {
      name: 'Google Play Console',
      websiteUrl: 'https://play.google.com/console',
      categoryId: 4,
      plans: [
        { name: 'Registration (one-time)', frequency: 'monthly', priceMinor: 2500, currency: 'USD' },
      ],
    },
  ];

  const providerDataNames = new Set(providerData.map((p) => p.name));
  const pricingUrlMap = new Map(PRICE_WATCH_CATALOG.map((e) => [e.providerName, e.pricingUrl]));

  for (const p of providerData) {
    let providerId = existingByName.get(p.name);
    const pricingUrl = pricingUrlMap.get(p.name) ?? null;

    if (providerId) {
      await db.delete(plans).where(eq(plans.providerId, providerId));
      await db
        .update(providers)
        .set({ categoryId: p.categoryId, pricingUrl })
        .where(eq(providers.id, providerId));
    } else {
      const inserted = await db
        .insert(providers)
        .values({
          name: p.name,
          websiteUrl: p.websiteUrl,
          pricingUrl,
          categoryId: p.categoryId,
          isCustom: false,
          createdAt: now,
        })
        .returning({ id: providers.id });
      providerId = inserted[0]?.id;
    }

    if (!providerId) continue;

    for (const plan of p.plans) {
      await db.insert(plans).values({
        providerId,
        name: plan.name,
        frequency: plan.frequency,
        suggestedPriceMinor: plan.priceMinor,
        currencyCode: plan.currency,
        isSuggested: true,
        createdAt: now,
      });
    }
  }

  // ── Stub providers: searchable, price to be confirmed by user ──────────
  const STUB_CAT_REMAP: Record<number, number> = {
    3: 4,   // dev/cloud/APIs → Desarrollo
    4: 2,   // Música → Entretenimiento
    11: 2,  // Gaming → Entretenimiento
    12: 7,  // Educación (old) → Educación
    13: 7,  // Lectura → Educación
    14: 2,  // Social → Entretenimiento
    15: 11, // Finanzas (old) → Finanzas
    16: 3,  // Productividad (old) → Productividad
    17: 2,  // Bundles → Entretenimiento
    18: 12, // Marketing (old) → Marketing
    19: 12, // E-commerce → Marketing
    20: 10, // Viajes → Otras
    21: 10, // Delivery → Otras
  };
  for (const [name, websiteUrl, rawCatId] of STUB_CATALOG) {
    const categoryId = STUB_CAT_REMAP[rawCatId] ?? rawCatId;
    if (existingByName.has(name) || providerDataNames.has(name)) continue;
    const inserted = await db
      .insert(providers)
      .values({ name, websiteUrl, categoryId, isCustom: false, createdAt: now })
      .returning({ id: providers.id });
    const stubId = inserted[0]?.id;
    if (stubId) {
      await db.insert(plans).values({
        providerId: stubId,
        name: 'Plan personalizado',
        frequency: 'monthly',
        suggestedPriceMinor: 0,
        currencyCode: 'USD',
        isSuggested: true,
        createdAt: now,
      });
    }
  }
}

async function seedDemoData(): Promise<void> {
  const DEMO_VERSION = '12a';
  const demoVerRow = await db.select().from(settings).where(eq(settings.key, 'demo_seed_version'));
  if (demoVerRow.length > 0 && demoVerRow[0].value === DEMO_VERSION) return;

  await db.delete(subscriptions);
  await db.delete(cards);

  const now = Date.now();

  const [c1] = await db.insert(cards).values({ alias: 'Visa Personal',    lastFour: '4521', createdAt: now }).returning({ id: cards.id });
  const [c2] = await db.insert(cards).values({ alias: 'Mastercard Black', lastFour: '8834', createdAt: now }).returning({ id: cards.id });
  const [c3] = await db.insert(cards).values({ alias: 'AMEX Gold',        lastFour: '2290', createdAt: now }).returning({ id: cards.id });

  const providerRows = await db.select({ id: providers.id, name: providers.name }).from(providers);
  const byName = new Map(providerRows.map((p) => [p.name, p.id]));

  const d = (month: number, day: number) => new Date(2026, month, day).getTime();

  const demo: Array<{
    name: string; price: number; freq: string; cat: number; card: number; date: number;
  }> = [
    // 1 · IA
    { name: 'Claude',           price: 2000,  freq: 'monthly', cat:  1, card: c1.id, date: d(8,  3) },
    { name: 'ChatGPT',          price: 2000,  freq: 'monthly', cat:  1, card: c1.id, date: d(8,  5) },
    { name: 'Cursor',           price: 2000,  freq: 'monthly', cat:  1, card: c2.id, date: d(8,  8) },
    { name: 'Perplexity',       price: 2000,  freq: 'monthly', cat:  1, card: c1.id, date: d(8, 12) },
    { name: 'ElevenLabs',       price: 2200,  freq: 'monthly', cat:  1, card: c2.id, date: d(8, 15) },
    { name: 'Midjourney',       price: 3000,  freq: 'monthly', cat:  1, card: c1.id, date: d(8, 18) },
    { name: 'Higgsfield',       price: 2900,  freq: 'monthly', cat:  1, card: c2.id, date: d(9,  3) },
    // 2 · Entretenimiento
    { name: 'Netflix',          price: 1549,  freq: 'monthly', cat:  2, card: c3.id, date: d(8,  1) },
    { name: 'Spotify Premium',  price:  999,  freq: 'monthly', cat:  2, card: c3.id, date: d(8, 10) },
    { name: 'YouTube Premium',  price: 1399,  freq: 'monthly', cat:  2, card: c3.id, date: d(8, 25) },
    { name: 'Disney+',          price: 1399,  freq: 'monthly', cat:  2, card: c3.id, date: d(8, 19) },
    // 3 · Productividad
    { name: 'Notion',           price: 1600,  freq: 'monthly', cat:  3, card: c1.id, date: d(8, 22) },
    { name: 'Slack',            price:  875,  freq: 'monthly', cat:  3, card: c2.id, date: d(8, 27) },
    // 4 · Desarrollo
    { name: 'GitHub',           price: 1000,  freq: 'monthly', cat:  4, card: c2.id, date: d(8, 20) },
    { name: 'Vercel',           price: 2000,  freq: 'monthly', cat:  4, card: c2.id, date: d(8,  4) },
    // 5 · Almacenamiento
    { name: 'iCloud+',          price:  299,  freq: 'monthly', cat:  5, card: c1.id, date: d(8, 28) },
    { name: 'Google One',       price: 1999,  freq: 'monthly', cat:  5, card: c1.id, date: d(8,  7) },
    // 6 · Salud y Fitness
    { name: 'Strava',           price: 1199,  freq: 'monthly', cat:  6, card: c1.id, date: d(8, 11) },
    { name: 'Headspace',        price: 1299,  freq: 'monthly', cat:  6, card: c1.id, date: d(8, 24) },
    // 7 · Educación
    { name: 'Duolingo',         price:  699,  freq: 'monthly', cat:  7, card: c1.id, date: d(8, 16) },
    { name: 'Coursera Plus',    price: 5900,  freq: 'monthly', cat:  7, card: c2.id, date: d(8, 29) },
    // 8 · Seguridad
    { name: 'NordVPN',          price: 1299,  freq: 'monthly', cat:  8, card: c2.id, date: d(8,  9) },
    { name: '1Password',        price:  299,  freq: 'monthly', cat:  8, card: c1.id, date: d(8, 17) },
    // 9 · Diseño y Creatividad
    { name: 'Figma',            price: 1200,  freq: 'monthly', cat:  9, card: c2.id, date: d(8, 14) },
    { name: 'Adobe Creative Cloud', price: 5999, freq: 'monthly', cat: 9, card: c2.id, date: d(8,  6) },
    // 10 · Otras
    { name: 'Amazon Prime',     price: 1499,  freq: 'monthly', cat: 10, card: c3.id, date: d(8, 23) },
    // 11 · Finanzas
    { name: 'YNAB',             price: 1499,  freq: 'monthly', cat: 11, card: c1.id, date: d(8, 21) },
    // 12 · Marketing
    { name: 'Mailchimp',        price: 1300,  freq: 'monthly', cat: 12, card: c2.id, date: d(8, 17) },
    { name: 'Semrush',          price: 10000, freq: 'monthly', cat: 12, card: c2.id, date: d(8,  2) },
  ];

  await db
    .insert(settings)
    .values({ key: 'demo_seed_version', value: DEMO_VERSION })
    .onConflictDoUpdate({ target: settings.key, set: { value: DEMO_VERSION } });

  for (const s of demo) {
    await db.insert(subscriptions).values({
      providerId:              byName.get(s.name) ?? null,
      customName:              s.name,
      planId:                  null,
      customPlanName:          null,
      confirmedPriceMinor:     s.price,
      currencyCode:            'USD',
      convertedPriceMinor:     null,
      convertedCurrencyCode:   null,
      exchangeRate:            null,
      exchangeRateDate:        null,
      exchangeRateSource:      null,
      frequency:               s.freq,
      nextRenewalDate:         s.date,
      startDate:               now - 60 * 24 * 60 * 60 * 1000,
      categoryId:              s.cat,
      cardId:                  s.card,
      creditsIncluded:         null,
      dataOrigin:              'manual',
      isActive:                true,
      notes:                   null,
      createdAt:               now,
      updatedAt:               now,
    });
  }
}

async function cleanOrphanedSubscriptions(): Promise<void> {
  const validProviders = await db.select({ id: providers.id }).from(providers);
  const validIds = validProviders.map((p) => p.id);

  if (validIds.length === 0) return;

  await db.delete(subscriptions).where(
    and(
      isNull(subscriptions.customName),
      notInArray(subscriptions.providerId as Parameters<typeof notInArray>[0], validIds),
    ),
  );
}
