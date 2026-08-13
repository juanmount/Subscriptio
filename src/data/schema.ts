import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ─── Currencies ───────────────────────────────────────────────
export const currencies = sqliteTable('currencies', {
  code: text('code').primaryKey(),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  minorUnit: integer('minor_unit').notNull().default(2),
});

// ─── Categories ───────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
});

// ─── Providers (catalog) ──────────────────────────────────────
export const providers = sqliteTable('providers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  pricingUrl: text('pricing_url'),
  categoryId: integer('category_id').references(() => categories.id),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().default(0),
});

// ─── Plans (suggested plans per provider) ─────────────────────
export const plans = sqliteTable('plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id').notNull().references(() => providers.id),
  name: text('name').notNull(),
  frequency: text('frequency').notNull(),
  suggestedPriceMinor: integer('suggested_price_minor').notNull(),
  currencyCode: text('currency_code').notNull().references(() => currencies.code),
  creditsIncluded: integer('credits_included'),
  isSuggested: integer('is_suggested', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull().default(0),
});

// ─── Cards (alias only, no sensitive data) ────────────────────
export const cards = sqliteTable('cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  alias: text('alias').notNull(),
  bank: text('bank'),
  brand: text('brand'),
  lastFour: text('last_four'),
  closingDay: integer('closing_day'),
  color: text('color'),
  createdAt: integer('created_at').notNull().default(0),
});

// ─── Subscriptions ────────────────────────────────────────────
export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id').references(() => providers.id),
  customName: text('custom_name'),
  planId: integer('plan_id').references(() => plans.id),
  customPlanName: text('custom_plan_name'),

  // Price stored in minor units (no floats)
  confirmedPriceMinor: integer('confirmed_price_minor').notNull(),
  currencyCode: text('currency_code').notNull().references(() => currencies.code),

  // Conversion (optional, original always preserved)
  convertedPriceMinor: integer('converted_price_minor'),
  convertedCurrencyCode: text('converted_currency_code').references(() => currencies.code),
  exchangeRate: integer('exchange_rate'),
  exchangeRateDate: integer('exchange_rate_date'),
  exchangeRateSource: text('exchange_rate_source'),

  // Billing
  frequency: text('frequency').notNull(),
  nextRenewalDate: integer('next_renewal_date'),
  startDate: integer('start_date'),

  // Classification
  categoryId: integer('category_id').references(() => categories.id),
  cardId: integer('card_id').references(() => cards.id),

  // Credits
  creditsIncluded: integer('credits_included'),

  // Data origin: suggested | manual | screenshot | connected
  dataOrigin: text('data_origin').notNull().default('manual'),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),

  createdAt: integer('created_at').notNull().default(0),
  updatedAt: integer('updated_at').notNull().default(0),
});

// ─── Extra purchases (one-off credits or top-ups) ─────────────
export const extraPurchases = sqliteTable('extra_purchases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id),
  description: text('description').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currencyCode: text('currency_code').notNull().references(() => currencies.code),
  purchasedAt: integer('purchased_at').notNull(),
  createdAt: integer('created_at').notNull().default(0),
});

// ─── Monthly snapshots (premium feature) ──────────────────────
export const monthlySnapshots = sqliteTable('monthly_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  monthYear: text('month_year').notNull(),
  totalMonthlyMinor: integer('total_monthly_minor').notNull(),
  currencyCode: text('currency_code').notNull().references(() => currencies.code),
  subscriptionCount: integer('subscription_count').notNull(),
  snapshotData: text('snapshot_data'),
  createdAt: integer('created_at').notNull().default(0),
});

// ─── Price watch logs (price change alerts) ───────────────────
export const priceWatchLogs = sqliteTable('price_watch_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  providerId: integer('provider_id').references(() => providers.id),
  providerName: text('provider_name').notNull(),
  planName: text('plan_name'),
  oldPriceMinor: integer('old_price_minor'),
  newPriceMinor: integer('new_price_minor').notNull(),
  currencyCode: text('currency_code').notNull(),
  frequency: text('frequency'),
  detectedAt: integer('detected_at').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().default(0),
});

// ─── Settings ─────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
