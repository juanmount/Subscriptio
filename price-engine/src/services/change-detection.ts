import { supabase } from '../db/client.js';
import type {
  CollectedPrice,
  RegionalPriceRow,
  ChangeCandidateRow,
} from '../types.js';

const REVIEW_THRESHOLD_PERCENT = 50;
const AUTO_APPROVE_CONFIDENCE = 80;

export interface ChangeDetectionResult {
  regionalPriceId: number;
  oldPrice: number | null;
  newPrice: number;
  currencyChanged: boolean;
  percentChange: number | null;
  status: 'no_change' | 'auto_approved' | 'review_required' | 'new_price';
  candidateId: number | null;
}

export async function detectChanges(
  collected: CollectedPrice[],
): Promise<ChangeDetectionResult[]> {
  const results: ChangeDetectionResult[] = [];

  for (const cp of collected) {
    const result = await detectSingle(cp);
    results.push(result);
  }

  return results;
}

async function detectSingle(cp: CollectedPrice): Promise<ChangeDetectionResult> {
  const { data: service } = await supabase
    .from('pe_services')
    .select('id')
    .eq('slug', cp.serviceSlug)
    .single();

  if (!service) {
    return {
      regionalPriceId: 0,
      oldPrice: null,
      newPrice: cp.price,
      currencyChanged: false,
      percentChange: null,
      status: 'new_price',
      candidateId: null,
    };
  }

  const { data: plan } = await supabase
    .from('pe_plans')
    .select('id')
    .eq('service_id', service.id)
    .eq('slug', cp.planSlug)
    .single();

  if (!plan) {
    return {
      regionalPriceId: 0,
      oldPrice: null,
      newPrice: cp.price,
      currencyChanged: false,
      percentChange: null,
      status: 'new_price',
      candidateId: null,
    };
  }

  const { data: existing } = await supabase
    .from('pe_regional_prices')
    .select('*')
    .eq('service_id', service.id)
    .eq('plan_id', plan.id)
    .eq('country_code', cp.countryCode)
    .single();

  if (!existing) {
    return {
      regionalPriceId: 0,
      oldPrice: null,
      newPrice: cp.price,
      currencyChanged: false,
      percentChange: null,
      status: 'new_price',
      candidateId: null,
    };
  }

  const existingRow = existing as RegionalPriceRow;
  const oldAmount = existingRow.amount;
  const newAmount = cp.price;
  const currencyChanged = existingRow.currency !== cp.currency;

  if (oldAmount === newAmount && !currencyChanged) {
    await supabase
      .from('pe_regional_prices')
      .update({
        last_verified_at: cp.detectedAt,
        source_url: cp.sourceUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingRow.id);

    return {
      regionalPriceId: existingRow.id,
      oldPrice: oldAmount,
      newPrice: newAmount,
      currencyChanged: false,
      percentChange: 0,
      status: 'no_change',
      candidateId: null,
    };
  }

  const percentChange =
    oldAmount > 0
      ? Math.round(((newAmount - oldAmount) / oldAmount) * 10000) / 100
      : null;

  const absPercent = percentChange !== null ? Math.abs(percentChange) : 100;

  let candidateStatus: ChangeCandidateRow['status'] = 'detected';
  let confidence = 60;

  if (currencyChanged) {
    candidateStatus = 'pending_verification';
    confidence = 30;
  } else if (absPercent > REVIEW_THRESHOLD_PERCENT) {
    candidateStatus = 'pending_verification';
    confidence = 40;
  } else if (absPercent < 10) {
    confidence = 85;
  } else if (absPercent < 25) {
    confidence = 70;
  }

  const shouldAutoApprove = confidence >= AUTO_APPROVE_CONFIDENCE && !currencyChanged;

  const { data: candidate } = await supabase
    .from('pe_change_candidates')
    .insert({
      regional_price_id: existingRow.id,
      old_amount: oldAmount,
      new_amount: newAmount,
      old_currency: existingRow.currency,
      new_currency: cp.currency,
      detected_at: cp.detectedAt,
      source_url: cp.sourceUrl,
      collector_id: `${cp.serviceSlug}-${cp.countryCode}`,
      confidence_score: confidence,
      status: shouldAutoApprove ? 'auto_approved' : candidateStatus,
    })
    .select('id')
    .single();

  if (shouldAutoApprove && candidate) {
    await applyPriceUpdate(existingRow.id, cp, oldAmount);
  }

  return {
    regionalPriceId: existingRow.id,
    oldPrice: oldAmount,
    newPrice: newAmount,
    currencyChanged,
    percentChange,
    status: shouldAutoApprove ? 'auto_approved' : 'review_required',
    candidateId: candidate?.id ?? null,
  };
}

export async function applyPriceUpdate(
  regionalPriceId: number,
  cp: CollectedPrice,
  previousAmount: number,
): Promise<void> {
  const now = new Date().toISOString();

  await supabase.from('pe_price_history').insert({
    regional_price_id: regionalPriceId,
    amount: cp.price,
    currency: cp.currency,
    detected_at: cp.detectedAt,
    verified_at: now,
    source_url: cp.sourceUrl,
    previous_amount: previousAmount,
    change_percentage:
      previousAmount > 0
        ? Math.round(((cp.price - previousAmount) / previousAmount) * 10000) / 100
        : null,
  });

  await supabase
    .from('pe_regional_prices')
    .update({
      amount: cp.price,
      currency: cp.currency,
      tax_mode: cp.taxMode,
      source_url: cp.sourceUrl,
      source_type: cp.sourceType,
      last_verified_at: cp.detectedAt,
      status: 'verified',
      updated_at: now,
    })
    .eq('id', regionalPriceId);

  try {
    await supabase
      .from('pe_catalog_versions')
      .update({ updated_at: now })
      .eq('country_code', cp.countryCode);
  } catch {
    // ignore version bump errors
  }
}

export async function approveCandidate(candidateId: number, reviewer: string): Promise<void> {
  const { data: candidate } = await supabase
    .from('pe_change_candidates')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

  const c = candidate as ChangeCandidateRow;

  const cp: CollectedPrice = {
    serviceSlug: '',
    planSlug: '',
    planName: '',
    countryCode: '',
    price: c.new_amount,
    currency: c.new_currency,
    period: 'month',
    taxMode: 'tax_excluded',
    sourceUrl: c.source_url ?? '',
    sourceType: 'manual_verified',
    detectedAt: c.detected_at,
  };

  await applyPriceUpdate(c.regional_price_id, cp, c.old_amount);

  await supabase
    .from('pe_change_candidates')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer,
    })
    .eq('id', candidateId);
}

export async function rejectCandidate(candidateId: number, reviewer: string, notes?: string): Promise<void> {
  await supabase
    .from('pe_change_candidates')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer,
      notes: notes ?? null,
    })
    .eq('id', candidateId);
}
