export type PriceWatchEntry = {
  providerName: string;
  pricingUrl: string;
  currency: string;
  plans: Array<{
    name: string;
    frequency: 'monthly' | 'yearly';
    selector: string;
    priceRegex: string;
  }>;
};

export const PRICE_WATCH_CATALOG: PriceWatchEntry[] = [
  {
    providerName: 'ChatGPT',
    pricingUrl: 'https://openai.com/chatgpt/pricing',
    currency: 'USD',
    plans: [
      { name: 'Plus', frequency: 'monthly', selector: '[data-plan="plus"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Claude',
    pricingUrl: 'https://claude.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Max 5x', frequency: 'monthly', selector: '[data-plan="max5"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Netflix',
    pricingUrl: 'https://www.netflix.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Standard with Ads', frequency: 'monthly', selector: '.plan-basic', priceRegex: '\\$([\\d.]+)' },
      { name: 'Standard', frequency: 'monthly', selector: '.plan-standard', priceRegex: '\\$([\\d.]+)' },
      { name: 'Premium', frequency: 'monthly', selector: '.plan-premium', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Spotify Premium',
    pricingUrl: 'https://www.spotify.com/premium',
    currency: 'USD',
    plans: [
      { name: 'Individual', frequency: 'monthly', selector: '[data-testid="plan-individual"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Duo', frequency: 'monthly', selector: '[data-testid="plan-duo"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Familiar', frequency: 'monthly', selector: '[data-testid="plan-family"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Student', frequency: 'monthly', selector: '[data-testid="plan-student"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Disney+',
    pricingUrl: 'https://www.disneyplus.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Basic with Ads', frequency: 'monthly', selector: '.plan-basic', priceRegex: '\\$([\\d.]+)' },
      { name: 'Premium', frequency: 'monthly', selector: '.plan-premium', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'YouTube Premium',
    pricingUrl: 'https://www.youtube.com/premium',
    currency: 'USD',
    plans: [
      { name: 'Individual', frequency: 'monthly', selector: '.individual-plan', priceRegex: '\\$([\\d.]+)' },
      { name: 'Familiar', frequency: 'monthly', selector: '.family-plan', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Apple Music',
    pricingUrl: 'https://www.apple.com/apple-music/pricing',
    currency: 'USD',
    plans: [
      { name: 'Individual', frequency: 'monthly', selector: '.individual', priceRegex: '\\$([\\d.]+)' },
      { name: 'Familiar', frequency: 'monthly', selector: '.family', priceRegex: '\\$([\\d.]+)' },
      { name: 'Student', frequency: 'monthly', selector: '.student', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Adobe Creative Cloud',
    pricingUrl: 'https://www.adobe.com/creativecloud/plans.html',
    currency: 'USD',
    plans: [
      { name: 'Fotografía', frequency: 'monthly', selector: '.plan-photography', priceRegex: '\\$([\\d.]+)' },
      { name: 'Individual', frequency: 'monthly', selector: '.plan-all-apps', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Notion',
    pricingUrl: 'https://www.notion.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Plus', frequency: 'monthly', selector: '[data-plan="plus"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Business', frequency: 'monthly', selector: '[data-plan="business"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Figma',
    pricingUrl: 'https://www.figma.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Professional', frequency: 'monthly', selector: '[data-plan="professional"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Canva',
    pricingUrl: 'https://www.canva.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Business', frequency: 'monthly', selector: '[data-plan="business"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Cursor',
    pricingUrl: 'https://cursor.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Teams', frequency: 'monthly', selector: '[data-plan="teams"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Windsurf',
    pricingUrl: 'https://windsurf.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Max', frequency: 'monthly', selector: '[data-plan="max"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'GitHub Copilot',
    pricingUrl: 'https://github.com/features/copilot',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Pro+', frequency: 'monthly', selector: '[data-plan="pro-plus"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'ElevenLabs',
    pricingUrl: 'https://elevenlabs.io/pricing',
    currency: 'USD',
    plans: [
      { name: 'Starter', frequency: 'monthly', selector: '[data-plan="starter"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Creator', frequency: 'monthly', selector: '[data-plan="creator"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Midjourney',
    pricingUrl: 'https://docs.midjourney.com/hc/en-us/articles/27870484040333',
    currency: 'USD',
    plans: [
      { name: 'Basic', frequency: 'monthly', selector: '.basic-plan', priceRegex: '\\$([\\d.]+)' },
      { name: 'Standard', frequency: 'monthly', selector: '.standard-plan', priceRegex: '\\$([\\d.]+)' },
      { name: 'Pro', frequency: 'monthly', selector: '.pro-plan', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Runway',
    pricingUrl: 'https://runwayml.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Standard', frequency: 'monthly', selector: '[data-plan="standard"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Higgsfield',
    pricingUrl: 'https://higgsfield.ai/pricing',
    currency: 'USD',
    plans: [
      { name: 'Creator', frequency: 'monthly', selector: '[data-plan="creator"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Ultra', frequency: 'monthly', selector: '[data-plan="ultra"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Vercel',
    pricingUrl: 'https://vercel.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Supabase',
    pricingUrl: 'https://supabase.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'NordVPN',
    pricingUrl: 'https://nordvpn.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Monthly', frequency: 'monthly', selector: '.plan-monthly', priceRegex: '\\$([\\d.]+)' },
      { name: 'Annual', frequency: 'yearly', selector: '.plan-annual', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: '1Password',
    pricingUrl: 'https://1password.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Individual', frequency: 'monthly', selector: '[data-plan="individual"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Familiar', frequency: 'monthly', selector: '[data-plan="family"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Dropbox',
    pricingUrl: 'https://www.dropbox.com/plans',
    currency: 'USD',
    plans: [
      { name: 'Plus', frequency: 'monthly', selector: '[data-plan="plus"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Professional', frequency: 'monthly', selector: '[data-plan="professional"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'iCloud+',
    pricingUrl: 'https://www.apple.com/shop/icloud',
    currency: 'USD',
    plans: [
      { name: '50 GB', frequency: 'monthly', selector: '.plan-50gb', priceRegex: '\\$([\\d.]+)' },
      { name: '200 GB', frequency: 'monthly', selector: '.plan-200gb', priceRegex: '\\$([\\d.]+)' },
      { name: '2 TB', frequency: 'monthly', selector: '.plan-2tb', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Google One',
    pricingUrl: 'https://one.google.com/about/ai-premium',
    currency: 'USD',
    plans: [
      { name: '100 GB', frequency: 'monthly', selector: '.plan-100gb', priceRegex: '\\$([\\d.]+)' },
      { name: '2 TB', frequency: 'monthly', selector: '.plan-2tb', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Duolingo',
    pricingUrl: 'https://www.duolingo.com/efective/super',
    currency: 'USD',
    plans: [
      { name: 'Super', frequency: 'monthly', selector: '[data-plan="super"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Max', frequency: 'monthly', selector: '[data-plan="max"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Perplexity',
    pricingUrl: 'https://www.perplexity.ai/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Google Gemini',
    pricingUrl: 'https://one.google.com/about/ai-premium',
    currency: 'USD',
    plans: [
      { name: 'AI Pro', frequency: 'monthly', selector: '[data-plan="ai-pro"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Replit',
    pricingUrl: 'https://replit.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Core', frequency: 'monthly', selector: '[data-plan="core"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Bolt.new',
    pricingUrl: 'https://bolt.new/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Teams', frequency: 'monthly', selector: '[data-plan="teams"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Lovable',
    pricingUrl: 'https://lovable.dev/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Business', frequency: 'monthly', selector: '[data-plan="business"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'HBO Max',
    pricingUrl: 'https://www.max.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Basic with Ads', frequency: 'monthly', selector: '.plan-basic', priceRegex: '\\$([\\d.]+)' },
      { name: 'Standard', frequency: 'monthly', selector: '.plan-standard', priceRegex: '\\$([\\d.]+)' },
      { name: 'Premium', frequency: 'monthly', selector: '.plan-premium', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Prime Video',
    pricingUrl: 'https://www.amazon.com/prime',
    currency: 'USD',
    plans: [
      { name: 'Prime', frequency: 'monthly', selector: '.prime-monthly', priceRegex: '\\$([\\d.]+)' },
      { name: 'Prime', frequency: 'yearly', selector: '.prime-annual', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Apple TV+',
    pricingUrl: 'https://www.apple.com/apple-tv-plus',
    currency: 'USD',
    plans: [
      { name: 'Monthly', frequency: 'monthly', selector: '.monthly-plan', priceRegex: '\\$([\\d.]+)' },
      { name: 'Annual', frequency: 'yearly', selector: '.annual-plan', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Microsoft 365',
    pricingUrl: 'https://www.microsoft.com/microsoft-365/buy/compare-all-microsoft-365-products',
    currency: 'USD',
    plans: [
      { name: 'Personal', frequency: 'monthly', selector: '.plan-personal', priceRegex: '\\$([\\d.]+)' },
      { name: 'Familiar', frequency: 'yearly', selector: '.plan-family', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Slack',
    pricingUrl: 'https://slack.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Pro', frequency: 'monthly', selector: '[data-plan="pro"]', priceRegex: '\\$([\\d.]+)' },
      { name: 'Business+', frequency: 'monthly', selector: '[data-plan="business-plus"]', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Discord Nitro',
    pricingUrl: 'https://discord.com/nitro',
    currency: 'USD',
    plans: [
      { name: 'Nitro Basic', frequency: 'monthly', selector: '.nitro-basic', priceRegex: '\\$([\\d.]+)' },
      { name: 'Nitro', frequency: 'monthly', selector: '.nitro-full', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Crunchyroll',
    pricingUrl: 'https://www.crunchyroll.com/welcome',
    currency: 'USD',
    plans: [
      { name: 'Fan', frequency: 'monthly', selector: '.plan-fan', priceRegex: '\\$([\\d.]+)' },
      { name: 'Mega Fan', frequency: 'monthly', selector: '.plan-mega-fan', priceRegex: '\\$([\\d.]+)' },
      { name: 'Ultimate Fan', frequency: 'monthly', selector: '.plan-ultimate-fan', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Apple One',
    pricingUrl: 'https://www.apple.com/apple-one',
    currency: 'USD',
    plans: [
      { name: 'Individual', frequency: 'monthly', selector: '.plan-individual', priceRegex: '\\$([\\d.]+)' },
      { name: 'Familiar', frequency: 'monthly', selector: '.plan-family', priceRegex: '\\$([\\d.]+)' },
      { name: 'Premier', frequency: 'monthly', selector: '.plan-premier', priceRegex: '\\$([\\d.]+)' },
    ],
  },
  {
    providerName: 'Strava',
    pricingUrl: 'https://www.strava.com/pricing',
    currency: 'USD',
    plans: [
      { name: 'Monthly', frequency: 'monthly', selector: '.plan-monthly', priceRegex: '\\$([\\d.]+)' },
      { name: 'Annual', frequency: 'yearly', selector: '.plan-annual', priceRegex: '\\$([\\d.]+)' },
    ],
  },
];

export const PRICE_WATCH_PROVIDER_NAMES = new Set(
  PRICE_WATCH_CATALOG.map((e) => e.providerName),
);

export function getPriceWatchEntry(providerName: string): PriceWatchEntry | undefined {
  return PRICE_WATCH_CATALOG.find((e) => e.providerName === providerName);
}
