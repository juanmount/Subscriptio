import { supabase, getSupabaseAuthUid } from '@/services/supabaseClient';

export type CardRow = {
  id: number;
  alias: string;
  bank: string | null;
  brand: string | null;
  lastFour: string | null;
  closingDay: number | null;
  color: string | null;
  createdAt: number;
};

export type NewCard = {
  alias: string;
  bank?: string | null;
  brand?: string | null;
  lastFour?: string | null;
  closingDay?: number | null;
  color?: string | null;
};

type RawCard = {
  id: number;
  user_id: string;
  alias: string;
  bank: string | null;
  brand: string | null;
  last_four: string | null;
  closing_day: number | null;
  color: string | null;
  created_at: number;
};

function toDomain(row: RawCard): CardRow {
  return {
    id: row.id,
    alias: row.alias,
    bank: row.bank,
    brand: row.brand,
    lastFour: row.last_four,
    closingDay: row.closing_day,
    color: row.color,
    createdAt: row.created_at,
  };
}

export async function listCards(): Promise<CardRow[]> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', uid)
    .order('alias');
  if (error) throw error;
  return (data as RawCard[]).map(toDomain);
}

export async function insertCard(data: NewCard): Promise<number> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { data: row, error } = await supabase
    .from('cards')
    .insert({
      user_id: uid,
      alias: data.alias,
      bank: data.bank ?? null,
      brand: data.brand ?? null,
      last_four: data.lastFour ?? null,
      closing_day: data.closingDay ?? null,
      color: data.color ?? null,
      created_at: Date.now(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return row.id;
}

export async function deleteCard(id: number): Promise<void> {
  const uid = getSupabaseAuthUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase.from('cards').delete().eq('id', id).eq('user_id', uid);
  if (error) throw error;
}
