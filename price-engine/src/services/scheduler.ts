import cron from 'node-cron';
import { supabase } from '../db/client.js';
import { runCollection } from './collection.js';
import type { ServiceRow, MarketRow } from '../types.js';

const P1_CRON = '0 */24 * * *'; // every 24 hours
const P2_CRON = '0 0 * * 0'; // weekly (Sunday)
const P3_CRON = '0 0 1 * *'; // monthly (1st of month)

export function startScheduler(): void {
  cron.schedule(P1_CRON, () => runPriorityTier(1));
  cron.schedule(P2_CRON, () => runPriorityTier(2));
  cron.schedule(P3_CRON, () => runPriorityTier(3));

  console.log('[Scheduler] Started — P1:24h, P2:weekly, P3:monthly (all enabled markets)');
}

async function getEnabledMarkets(): Promise<MarketRow[]> {
  const { data, error } = await supabase
    .from('pe_markets')
    .select('*')
    .eq('enabled', true);
  if (error || !data) return [];
  return data as MarketRow[];
}

async function runPriorityTier(priority: number): Promise<void> {
  const markets = await getEnabledMarkets();
  if (markets.length === 0) {
    console.log(`[Scheduler] No enabled markets found`);
    return;
  }

  const { data: services } = await supabase
    .from('pe_services')
    .select('slug')
    .eq('active', true)
    .eq('priority', priority);

  if (!services || services.length === 0) {
    console.log(`[Scheduler] No P${priority} services found`);
    return;
  }

  const slugs = (services as ServiceRow[]).map((s) => s.slug);

  for (const market of markets) {
    console.log(`[Scheduler] Running P${priority} collection for ${market.country_code}`);
    const results = await runCollection(market.country_code, slugs);

    for (const r of results) {
      console.log(
        `[Scheduler] ${market.country_code} ${r.serviceSlug}: ${r.pricesCollected} prices, ${r.changes.length} changes, ${r.errors.length} errors`,
      );
    }
  }
}
