/**
 * STACK Price Watch — Firebase Cloud Functions
 *
 * Cron job that runs daily, fetches pricing pages for all providers,
 * parses prices, compares with stored prices in Firestore, and sends
 * push notifications to users when a price change is detected.
 *
 * Setup:
 * 1. npm install in firebase/functions/
 * 2. firebase init (select Firestore + Functions + Messaging)
 * 3. firebase deploy --only functions
 *
 * Firestore collections:
 *   - price_snapshots/{providerName}: latest known prices per provider
 *   - price_watch_logs: log of all detected changes
 *   - user_tokens/{uid}: FCM tokens for push notifications
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const cheerio = require('cheerio');

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

const PRICE_WATCH_CATALOG = require('./price-watch-catalog.json');

exports.checkPrices = onSchedule(
  {
    schedule: '0 9 * * *',
    timeZone: 'America/Argentina/Buenos_Aires',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (event) => {
    console.log('[PriceWatch] Starting daily price check...');

    const results = [];
    const providers = PRICE_WATCH_CATALOG;

    for (const provider of providers) {
      try {
        const result = await checkProviderPrices(provider);
        if (result.changes.length > 0) {
          results.push(result);
        }
      } catch (err) {
        console.error(`[PriceWatch] Error checking ${provider.providerName}:`, err.message);
      }
    }

    if (results.length > 0) {
      await sendNotifications(results);
    }

    console.log(`[PriceWatch] Done. ${results.length} providers with changes.`);
    return null;
  },
);

async function checkProviderPrices(provider) {
  const changes = [];

  const response = await fetch(provider.pricingUrl, {
    headers: {
      'User-Agent': 'STACK-PriceWatch/1.0 (https://stack.app)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${provider.pricingUrl}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const snapshotRef = db.collection('price_snapshots').doc(provider.providerName);
  const snapshotDoc = await snapshotRef.get();
  const previousPrices = snapshotDoc.exists ? snapshotDoc.data().plans || {} : {};

  const currentPrices = {};

  for (const plan of provider.plans) {
    const element = $(plan.selector).first();
    if (element.length === 0) continue;

    const text = element.text();
    const match = text.match(new RegExp(plan.priceRegex));
    if (!match) continue;

    const price = parseFloat(match[1]);
    if (isNaN(price)) continue;

    const priceMinor = Math.round(price * 100);
    const planKey = `${plan.name}|${plan.frequency}`;
    currentPrices[planKey] = priceMinor;

    const oldPriceMinor = previousPrices[planKey] ?? null;

    if (oldPriceMinor !== null && oldPriceMinor !== priceMinor) {
      changes.push({
        providerName: provider.providerName,
        planName: plan.name,
        frequency: plan.frequency,
        oldPriceMinor,
        newPriceMinor: priceMinor,
        currencyCode: provider.currency,
        detectedAt: Date.now(),
      });
    }
  }

  if (Object.keys(currentPrices).length > 0) {
    await snapshotRef.set({
      plans: currentPrices,
      updatedAt: Date.now(),
      pricingUrl: provider.pricingUrl,
    });
  }

  for (const change of changes) {
    await db.collection('price_watch_logs').add({
      ...change,
      isRead: false,
      createdAt: Date.now(),
    });
  }

  return { providerName: provider.providerName, changes };
}

async function sendNotifications(results) {
  const tokensSnapshot = await db.collection('user_tokens').get();
  const tokens = tokensSnapshot.docs.map((d) => d.data().token).filter(Boolean);

  if (tokens.length === 0) {
    console.log('[PriceWatch] No FCM tokens registered. Skipping notifications.');
    return;
  }

  for (const result of results) {
    const changeCount = result.changes.length;
    const title = `${result.providerName} cambió de precio`;
    const body = changeCount === 1
      ? `${result.changes[0].planName}: nuevo precio detectado`
      : `${changeCount} planes con cambios de precio`;

    const message = {
      notification: { title, body },
      data: {
        type: 'price_watch',
        providerName: result.providerName,
        clickAction: 'PRICE_WATCH',
      },
      tokens,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      console.log(`[PriceWatch] Notification sent for ${result.providerName}: ${response.successCount} success, ${response.failureCount} failure`);
    } catch (err) {
      console.error(`[PriceWatch] Notification error for ${result.providerName}:`, err.message);
    }
  }
}
