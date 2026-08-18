import { I18n } from 'i18n-js';
import { esAR } from './locales/es-AR';
import { enUS } from './locales/en-US';
import { ptBR } from './locales/pt-BR';

export type AppLocale = 'es-AR' | 'en-US' | 'pt-BR';

const SUPPORTED: AppLocale[] = ['es-AR', 'en-US', 'pt-BR'];

function normalizeLocale(locale: string): AppLocale {
  const lower = locale.toLowerCase();
  if (SUPPORTED.includes(lower as AppLocale)) return lower as AppLocale;
  const base = lower.split('-')[0];
  if (base === 'es') return 'es-AR';
  if (base === 'en') return 'en-US';
  if (base === 'pt') return 'pt-BR';
  return 'es-AR';
}

function detectDeviceLocale(): AppLocale {
  try {
    const Localization = require('expo-localization');
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      return normalizeLocale(locales[0].languageTag);
    }
  } catch {
    // expo-localization native module not available
  }
  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    return normalizeLocale(intlLocale);
  } catch {
    return 'es-AR';
  }
}

function nestTranslations(flat: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let obj = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]] || typeof obj[parts[i]] !== 'object') {
        obj[parts[i]] = {};
      }
      obj = obj[parts[i]] as Record<string, unknown>;
    }
    obj[parts[parts.length - 1]] = value;
  }
  return result;
}

const deviceLocale = detectDeviceLocale();

export const i18n = new I18n(
  {
    'es-AR': nestTranslations(esAR),
    'en-US': nestTranslations(enUS),
    'pt-BR': nestTranslations(ptBR),
  },
  {
    defaultLocale: 'es-AR',
    enableFallback: true,
  },
);

i18n.locale = deviceLocale;

export function setLocale(locale: AppLocale) {
  i18n.locale = locale;
}

export function getLocale(): AppLocale {
  return i18n.locale as AppLocale;
}

export function getSupportedLocales(): AppLocale[] {
  return SUPPORTED;
}

const LOCALE_KEY = 'preferred_locale';

export async function savePreferredLocale(locale: AppLocale): Promise<void> {
  try {
    const { getSupabaseAuthUid, supabase } = require('../services/supabaseClient');
    const uid = getSupabaseAuthUid();
    if (!uid) return;
    await supabase
      .from('settings')
      .upsert({ user_id: uid, key: LOCALE_KEY, value: locale });
  } catch {
    // ignore — non-critical
  }
}

export async function loadPreferredLocale(): Promise<AppLocale | null> {
  try {
    const { getSupabaseAuthUid, supabase } = require('../services/supabaseClient');
    const uid = getSupabaseAuthUid();
    if (!uid) return null;
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('user_id', uid)
      .eq('key', LOCALE_KEY)
      .maybeSingle();
    if (data?.value && SUPPORTED.includes(data.value as AppLocale)) {
      return data.value as AppLocale;
    }
  } catch {
    // ignore — non-critical
  }
  return null;
}

export function t(key: string, options?: Record<string, any>): string {
  return i18n.t(key, options) as string;
}

export function tArray(key: string): string[] {
  const translations = i18n.translations as Record<string, Record<string, unknown>>;
  function lookup(locale: string): unknown {
    const parts = key.split('.');
    let obj: unknown = translations[locale];
    for (const part of parts) {
      if (obj && typeof obj === 'object') {
        obj = (obj as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return obj;
  }
  const val = lookup(i18n.locale);
  if (Array.isArray(val)) return val as string[];
  const fallback = lookup(i18n.defaultLocale);
  if (Array.isArray(fallback)) return fallback as string[];
  return [];
}
