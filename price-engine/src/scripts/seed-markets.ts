import { supabase } from '../db/client.js';

async function seedMarkets() {
  const markets = [
    { country_code: 'AR', name: 'Argentina', default_currency: 'ARS', locale: 'es-AR', priority: 'P0', default_audit_frequency_days: 7 },
    { country_code: 'BR', name: 'Brazil', default_currency: 'BRL', locale: 'pt-BR', priority: 'P1', default_audit_frequency_days: 14 },
    { country_code: 'MX', name: 'Mexico', default_currency: 'MXN', locale: 'es-MX', priority: 'P1', default_audit_frequency_days: 14 },
    { country_code: 'CL', name: 'Chile', default_currency: 'CLP', locale: 'es-CL', priority: 'P1', default_audit_frequency_days: 14 },
    { country_code: 'CO', name: 'Colombia', default_currency: 'COP', locale: 'es-CO', priority: 'P1', default_audit_frequency_days: 14 },
    { country_code: 'PE', name: 'Peru', default_currency: 'PEN', locale: 'es-PE', priority: 'P1', default_audit_frequency_days: 14 },
    { country_code: 'UY', name: 'Uruguay', default_currency: 'UYU', locale: 'es-UY', priority: 'P1', default_audit_frequency_days: 14 },
    { country_code: 'US', name: 'United States', default_currency: 'USD', locale: 'en-US', priority: 'P1', default_audit_frequency_days: 14 },
    { country_code: 'ES', name: 'Spain', default_currency: 'EUR', locale: 'es-ES', priority: 'P2', default_audit_frequency_days: 30 },
    { country_code: 'PT', name: 'Portugal', default_currency: 'EUR', locale: 'pt-PT', priority: 'P2', default_audit_frequency_days: 30 },
    { country_code: 'GB', name: 'United Kingdom', default_currency: 'GBP', locale: 'en-GB', priority: 'P2', default_audit_frequency_days: 30 },
    { country_code: 'FR', name: 'France', default_currency: 'EUR', locale: 'fr-FR', priority: 'P2', default_audit_frequency_days: 30 },
    { country_code: 'DE', name: 'Germany', default_currency: 'EUR', locale: 'de-DE', priority: 'P2', default_audit_frequency_days: 30 },
    { country_code: 'IT', name: 'Italy', default_currency: 'EUR', locale: 'it-IT', priority: 'P2', default_audit_frequency_days: 30 },
    { country_code: 'NL', name: 'Netherlands', default_currency: 'EUR', locale: 'nl-NL', priority: 'P2', default_audit_frequency_days: 30 },
  ];

  for (const m of markets) {
    const { error } = await supabase
      .from('pe_markets')
      .upsert(m, { onConflict: 'country_code' });
    if (error) {
      console.error(`[ERROR] ${m.country_code}: ${error.message}`);
    } else {
      console.log(`[OK] ${m.country_code} — ${m.name}`);
    }
  }

  console.log('[Seed] Markets done.');
}

seedMarkets().catch(console.error);
