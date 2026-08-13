import { supabase } from '@/services/supabaseClient';
import type { Currency } from '@/domain/types';

type RawCurrency = {
  code: string;
  symbol: string;
  name: string;
  minor_unit: number;
};

function toDomain(row: RawCurrency): Currency {
  return {
    code: row.code,
    symbol: row.symbol,
    name: row.name,
    minorUnit: row.minor_unit,
  };
}

let _cache: Map<string, Currency> | null = null;

export async function loadCurrencies(): Promise<Map<string, Currency>> {
  if (_cache) return _cache;
  const { data, error } = await supabase
    .from('currencies')
    .select('*');
  if (error) throw error;
  _cache = new Map((data as RawCurrency[]).map((r) => [r.code, toDomain(r)]));
  return _cache;
}

export function getCurrencyMinorUnit(code: string): number {
  return _cache?.get(code)?.minorUnit ?? 2;
}

export function getCachedCurrency(code: string): Currency | undefined {
  return _cache?.get(code);
}
