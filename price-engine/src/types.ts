// ============================================================
// STACK PRICE ENGINE — Core Types
// ============================================================

export type TaxMode =
  | 'final_price'
  | 'tax_included'
  | 'tax_excluded'
  | 'vat_included_other_taxes_possible'
  | 'unknown';

export type SourceType =
  | 'official_api'
  | 'official_page'
  | 'official_document'
  | 'manual_verified';

export type PriceStatus =
  | 'verified'
  | 'pending'
  | 'stale'
  | 'manual_required'
  | 'review_required';

export type CollectorType =
  | 'official_api'
  | 'structured_html'
  | 'public_json'
  | 'headless_browser'
  | 'manual';

export type ChangeCandidateStatus =
  | 'detected'
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'auto_approved';

export type Period = 'month' | 'year' | 'quarter' | 'semester' | 'one_time';

export type Priority = 1 | 2 | 3;

export type MarketPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type AuditStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

// ─── Database row types ─────────────────────────────────────

export interface ServiceRow {
  id: number;
  slug: string;
  provider: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  aliases: string[];
  official_url: string | null;
  active: boolean;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface PlanRow {
  id: number;
  service_id: number;
  slug: string;
  name: string;
  billing_model: string;
  period: Period;
  per_user: boolean;
  parent_plan_id: number | null;
  active: boolean;
  created_at: string;
}

export interface RegionalPriceRow {
  id: number;
  service_id: number;
  plan_id: number;
  country_code: string;
  currency: string;
  amount: number;
  period: Period;
  tax_mode: TaxMode;
  source_url: string | null;
  source_type: SourceType;
  last_verified_at: string | null;
  status: PriceStatus;
  confidence_score: number;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceHistoryRow {
  id: number;
  regional_price_id: number;
  amount: number;
  currency: string;
  detected_at: string;
  verified_at: string | null;
  source_url: string | null;
  change_percentage: number | null;
  previous_amount: number | null;
}

export interface ChangeCandidateRow {
  id: number;
  regional_price_id: number;
  old_amount: number;
  new_amount: number;
  old_currency: string;
  new_currency: string;
  detected_at: string;
  source_url: string | null;
  collector_id: string | null;
  confidence_score: number;
  status: ChangeCandidateStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
}

export interface AuditJobRow {
  id: number;
  service_id: number | null;
  plan_id: number | null;
  country: string | null;
  scheduled_at: string;
  executed_at: string | null;
  result: string | null;
  error: string | null;
  raw_snapshot: Record<string, unknown> | null;
  collector_id: string | null;
}

export interface CollectorSourceRow {
  id: number;
  service_id: number;
  country_code: string;
  collector_type: CollectorType;
  source_url: string;
  config: Record<string, unknown>;
  active: boolean;
  last_run_at: string | null;
  last_result: string | null;
}

// ─── Collector output ───────────────────────────────────────

export interface CollectedPrice {
  serviceSlug: string;
  planSlug: string;
  planName: string;
  countryCode: string;
  price: number; // minor units
  currency: string;
  period: Period;
  taxMode: TaxMode;
  sourceUrl: string;
  sourceType: SourceType;
  detectedAt: string;
}

// ─── API response types ─────────────────────────────────────

export interface CatalogService {
  slug: string;
  name: string;
  provider: string;
  category: string | null;
  officialUrl: string | null;
  plans: CatalogPlan[];
}

export interface CatalogPlan {
  slug: string;
  name: string;
  period: Period;
  price: number;
  currency: string;
  taxMode: TaxMode;
  status: PriceStatus;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
}

export interface CatalogResponse {
  country: string;
  version: number;
  updatedAt: string;
  services: CatalogService[];
}

export interface PriceResponse {
  service: string;
  plan: string;
  country: string;
  price: number;
  currency: string;
  period: Period;
  tax_mode: TaxMode;
  source_type: SourceType;
  source_url: string | null;
  last_verified_at: string | null;
  status: PriceStatus;
}

export interface PriceHistoryResponse {
  service: string;
  plan: string;
  country: string;
  history: Array<{
    amount: number;
    currency: string;
    detectedAt: string;
    changePercentage: number | null;
    previousAmount: number | null;
  }>;
}

export interface PriceChangeResponse {
  id: number;
  service: string;
  plan: string;
  country: string;
  oldAmount: number;
  newAmount: number;
  oldCurrency: string;
  newCurrency: string;
  detectedAt: string;
  status: ChangeCandidateStatus;
  confidenceScore: number;
  sourceUrl: string | null;
}

// ─── Market types ───────────────────────────────────────────

export interface MarketRow {
  country_code: string;
  name: string;
  default_currency: string;
  locale: string;
  enabled: boolean;
  priority: MarketPriority;
  price_watch_enabled: boolean;
  default_audit_frequency_days: number;
  fallback_currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketResponse {
  countryCode: string;
  name: string;
  defaultCurrency: string;
  locale: string;
  enabled: boolean;
  priority: MarketPriority;
  priceWatchEnabled: boolean;
  defaultAuditFrequencyDays: number;
  fallbackCurrency: string | null;
}

export interface CoverageResponse {
  country: string;
  servicesTotal: number;
  plansTotal: number;
  pricesVerified: number;
  pricesPending: number;
  pricesStale: number;
  pricesManualRequired: number;
  pricesReviewRequired: number;
  coveragePercentage: number;
  lastCatalogUpdate: string | null;
}

// ─── Audit Queue types ──────────────────────────────────────

export interface AuditQueueRow {
  id: number;
  service_id: number;
  plan_id: number | null;
  country_code: string;
  priority_score: number;
  last_verified_at: string | null;
  next_check_at: string;
  audit_status: AuditStatus;
  attempt_count: number;
  collector_type: CollectorType;
  created_at: string;
  updated_at: string;
}

// ─── Plan Localization types ────────────────────────────────

export interface PlanLocalizationRow {
  id: number;
  plan_id: number;
  country_code: string;
  localized_name: string;
  regional_offer_id: string | null;
  created_at: string;
}
