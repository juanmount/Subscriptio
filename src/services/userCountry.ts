import { supabase, getSupabaseAuthUid } from '@/services/supabaseClient';
import { getLocale } from '@/i18n';

const CACHE_KEY = 'user_country';
let cachedCountry: string | null = null;
let cachedFromSettings: string | null = null;

const LOCALE_TO_COUNTRY: Record<string, string> = {
  'es-AR': 'AR',
  'en-US': 'US',
  'pt-BR': 'BR',
  'es-MX': 'MX',
  'es-CL': 'CL',
  'es-CO': 'CO',
  'es-PE': 'PE',
  'es-UY': 'UY',
  'es-ES': 'ES',
  'pt-PT': 'PT',
  'en-GB': 'GB',
  'fr-FR': 'FR',
  'de-DE': 'DE',
  'it-IT': 'IT',
  'nl-NL': 'NL',
};

export function localeToCountry(locale: string): string {
  return LOCALE_TO_COUNTRY[locale] ?? 'AR';
}

export function detectCountryFromLocale(): string {
  return localeToCountry(getLocale());
}

export async function getUserCountry(): Promise<string> {
  if (cachedCountry) return cachedCountry;

  try {
    const uid = getSupabaseAuthUid();
    if (uid) {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('user_id', uid)
        .eq('key', CACHE_KEY)
        .maybeSingle();
      if (data?.value) {
        cachedFromSettings = data.value;
        cachedCountry = data.value;
        return data.value;
      }
    }
  } catch {
    // ignore
  }

  const detected = detectCountryFromLocale();
  cachedCountry = detected;
  return detected;
}

export async function setUserCountry(country: string): Promise<void> {
  cachedCountry = country;
  const uid = getSupabaseAuthUid();
  if (uid) {
    await supabase
      .from('settings')
      .upsert({ user_id: uid, key: CACHE_KEY, value: country });
  }
}

export function getUserCountrySync(): string {
  return cachedCountry ?? cachedFromSettings ?? detectCountryFromLocale();
}

export function clearCountryCache(): void {
  cachedCountry = null;
  cachedFromSettings = null;
}
