import { supabase, getSupabaseAuthUid } from '@/services/supabaseClient';
import type { PriceWatchLog, NewPriceWatchLog, PriceAlert } from '@/domain/price-watch';
import { getChangeDirection } from '@/domain/price-watch';

type PriceWatchLogRow = {
  id: number;
  user_id: string;
  provider_id: number | null;
  provider_name: string;
  plan_name: string | null;
  old_price_minor: number | null;
  new_price_minor: number;
  currency_code: string;
  frequency: string | null;
  detected_at: number;
  is_read: boolean;
  created_at: number;
};

function toDomain(row: PriceWatchLogRow): PriceWatchLog {
  return {
    id: row.id,
    providerId: row.provider_id,
    providerName: row.provider_name,
    planName: row.plan_name,
    oldPriceMinor: row.old_price_minor,
    newPriceMinor: row.new_price_minor,
    currencyCode: row.currency_code,
    frequency: row.frequency,
    detectedAt: row.detected_at,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function listPriceWatchLogs(): Promise<PriceWatchLog[]> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('price_watch_logs')
    .select('*')
    .eq('user_id', uid)
    .order('detected_at', { ascending: false });
  if (error) throw error;
  return (data as PriceWatchLogRow[]).map(toDomain);
}

export async function listUnreadPriceWatchLogs(): Promise<PriceWatchLog[]> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('price_watch_logs')
    .select('*')
    .eq('user_id', uid)
    .eq('is_read', false)
    .order('detected_at', { ascending: false });
  if (error) throw error;
  return (data as PriceWatchLogRow[]).map(toDomain);
}

export async function insertPriceWatchLog(data: NewPriceWatchLog): Promise<number> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data: row, error } = await supabase
    .from('price_watch_logs')
    .insert({
      user_id: uid,
      provider_id: data.providerId ?? null,
      provider_name: data.providerName,
      plan_name: data.planName ?? null,
      old_price_minor: data.oldPriceMinor ?? null,
      new_price_minor: data.newPriceMinor,
      currency_code: data.currencyCode,
      frequency: data.frequency ?? null,
      detected_at: data.detectedAt,
      created_at: Date.now(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return row.id;
}

export async function markPriceWatchLogAsRead(id: number): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('price_watch_logs')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', uid);
  if (error) throw error;
}

export async function markAllPriceWatchLogsAsRead(): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('price_watch_logs')
    .update({ is_read: true })
    .eq('user_id', uid)
    .eq('is_read', false);
  if (error) throw error;
}

export async function deletePriceWatchLog(id: number): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase.from('price_watch_logs').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}

export async function clearAllPriceWatchLogs(): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase.from('price_watch_logs').delete().neq('id', 0).eq('user_id', uid);
  if (error) throw error;
}

export async function getUnreadCount(): Promise<number> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { count, error } = await supabase
    .from('price_watch_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', uid)
    .eq('is_read', false);
  if (error) throw error;
  return count ?? 0;
}

export function toPriceAlert(log: PriceWatchLog): PriceAlert {
  return {
    id: log.id,
    providerName: log.providerName,
    planName: log.planName,
    oldPriceMinor: log.oldPriceMinor,
    newPriceMinor: log.newPriceMinor,
    currencyCode: log.currencyCode,
    frequency: log.frequency,
    direction: getChangeDirection(log.oldPriceMinor, log.newPriceMinor),
    detectedAt: log.detectedAt,
    isRead: log.isRead,
  };
}
