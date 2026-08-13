import { runCollection } from '../services/collection.js';

async function main(): Promise<void> {
  const country = process.argv[2] ?? 'AR';
  const services = process.argv.slice(3).length > 0 ? process.argv.slice(3) : undefined;

  console.log(`[Collect] Running collectors for ${country}...`);
  const results = await runCollection(country, services);

  for (const r of results) {
    console.log(`\n${r.serviceSlug} (${r.collectorId}):`);
    console.log(`  Prices collected: ${r.pricesCollected}`);
    for (const ch of r.changes) {
      console.log(`  ${ch.planSlug}: ${ch.status} (old=${ch.oldPrice}, new=${ch.newPrice}, ${ch.percentChange ?? 0}%)`);
    }
    if (r.errors.length > 0) {
      console.log(`  Errors: ${r.errors.join(', ')}`);
    }
  }
}

main().catch((err) => {
  console.error('[Collect] Failed:', err);
  process.exit(1);
});
