import { supabase } from '../db/client.js';

const FIXES: Array<{ id: number; amount: number; currency: string; note: string }> = [
  // Dropbox — USD globally
  { id: 39, amount: 1199, currency: 'USD', note: 'Dropbox Plus $11.99' },
  { id: 40, amount: 1999, currency: 'USD', note: 'Dropbox Family $19.99' },
  // Adobe CC — USD globally
  { id: 55, amount: 999, currency: 'USD', note: 'Adobe CC Single App $9.99' },
  { id: 56, amount: 5999, currency: 'USD', note: 'Adobe CC All Apps $59.99' },
  // ChatGPT — USD globally
  { id: 68, amount: 2000, currency: 'USD', note: 'ChatGPT Plus $20.00' },
  { id: 69, amount: 2500, currency: 'USD', note: 'ChatGPT Team $25.00' },
  // Claude — USD globally
  { id: 70, amount: 2000, currency: 'USD', note: 'Claude Pro $20.00' },
  // Google Gemini — USD globally
  { id: 71, amount: 1999, currency: 'USD', note: 'Gemini Advanced $19.99' },
  // GitHub Copilot — USD globally
  { id: 72, amount: 1000, currency: 'USD', note: 'Copilot Individual $10.00' },
  { id: 73, amount: 1900, currency: 'USD', note: 'Copilot Business $19.00' },
  // Notion — USD globally
  { id: 52, amount: 1200, currency: 'USD', note: 'Notion Plus $12.00' },
  { id: 53, amount: 1500, currency: 'USD', note: 'Notion Business $15.00' },
  // Figma — USD globally
  { id: 54, amount: 1500, currency: 'USD', note: 'Figma Professional $15.00' },
  // 1Password — USD globally
  { id: 79, amount: 299, currency: 'USD', note: '1Password Individual $2.99' },
  { id: 80, amount: 499, currency: 'USD', note: '1Password Families $4.99' },
  // ExpressVPN — USD globally
  { id: 83, amount: 1295, currency: 'USD', note: 'ExpressVPN Monthly $12.95' },
  { id: 84, amount: 9995, currency: 'USD', note: 'ExpressVPN Annual $99.95' },
  // NordVPN — USD globally
  { id: 81, amount: 1299, currency: 'USD', note: 'NordVPN Monthly $12.99' },
  { id: 82, amount: 5988, currency: 'USD', note: 'NordVPN Annual $59.88' },
];

async function fixUsdPrices() {
  let fixed = 0;
  for (const f of FIXES) {
    const { error } = await supabase
      .from('pe_regional_prices')
      .update({
        currency: f.currency,
        amount: f.amount,
        source_type: 'manual_verified',
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', f.id)
      .eq('country_code', 'AR');

    if (error) {
      console.error(`[ERROR] id=${f.id}: ${error.message}`);
    } else {
      console.log(`[OK] id=${f.id} — ${f.note}`);
      fixed++;
    }
  }
  console.log(`\nFixed: ${fixed}/${FIXES.length}`);

  const now = new Date().toISOString();
  await supabase
    .from('pe_catalog_versions')
    .upsert({ country_code: 'AR', updated_at: now }, { onConflict: 'country_code' });

  console.log('[Done] Catalog version bumped for AR.');
}

fixUsdPrices().catch(console.error);
