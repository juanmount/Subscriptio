import { supabase, getSupabaseAuthUid } from '@/services/supabaseClient';

export type ExtraPurchase = {
  id: number;
  subscriptionId: number;
  description: string;
  amountMinor: number;
  currencyCode: string;
  purchasedAt: number;
  createdAt: number;
};

type RawExtra = {
  id: number;
  user_id: string;
  subscription_id: number;
  description: string;
  amount_minor: number;
  currency_code: string;
  purchased_at: number;
  created_at: number;
};

function toDomain(row: RawExtra): ExtraPurchase {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    description: row.description,
    amountMinor: row.amount_minor,
    currencyCode: row.currency_code,
    purchasedAt: row.purchased_at,
    createdAt: row.created_at,
  };
}

export async function getExtraPurchasesForSubscription(
  subscriptionId: number,
): Promise<ExtraPurchase[]> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('extra_purchases')
    .select('*')
    .eq('user_id', uid)
    .eq('subscription_id', subscriptionId)
    .order('purchased_at', { ascending: false });
  if (error) throw error;
  return (data as RawExtra[]).map(toDomain);
}

export async function addExtraPurchase(data: {
  subscriptionId: number;
  description: string;
  amountMinor: number;
  currencyCode: string;
  purchasedAt: number;
}): Promise<ExtraPurchase> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data: row, error } = await supabase
    .from('extra_purchases')
    .insert({
      user_id: uid,
      subscription_id: data.subscriptionId,
      description: data.description,
      amount_minor: data.amountMinor,
      currency_code: data.currencyCode,
      purchased_at: data.purchasedAt,
      created_at: Date.now(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return toDomain(row as RawExtra);
}

export async function deleteExtraPurchase(id: number): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase.from('extra_purchases').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

export async function getMonthExtras(startMs: number, endMs: number): Promise<ExtraPurchase[]> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('extra_purchases')
    .select('*')
    .eq('user_id', uid)
    .gte('purchased_at', startMs)
    .lte('purchased_at', endMs)
    .order('purchased_at', { ascending: false });
  if (error) throw error;
  return (data as RawExtra[]).map(toDomain);
}

export async function getExtrasMonthTotal(startMs: number, endMs: number): Promise<number> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('extra_purchases')
    .select('amount_minor')
    .eq('user_id', uid)
    .gte('purchased_at', startMs)
    .lte('purchased_at', endMs);
  if (error) throw error;
  return (data as { amount_minor: number }[]).reduce((sum, r) => sum + r.amount_minor, 0);
}
