-- ============================================================
-- STACK PRICE ENGINE — Multi-Market Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── Markets ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_markets (
  country_code              text PRIMARY KEY,
  name                      text NOT NULL,
  default_currency          text NOT NULL,
  locale                    text NOT NULL,
  enabled                   boolean NOT NULL DEFAULT true,
  priority                  text NOT NULL DEFAULT 'P3'
    CHECK (priority IN ('P0','P1','P2','P3')),
  price_watch_enabled       boolean NOT NULL DEFAULT true,
  default_audit_frequency_days integer NOT NULL DEFAULT 30,
  fallback_currency         text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pe_markets DISABLE ROW LEVEL SECURITY;

-- ─── Seed initial markets ───────────────────────────────────
INSERT INTO public.pe_markets (country_code, name, default_currency, locale, priority, default_audit_frequency_days, fallback_currency) VALUES
  -- P0
  ('AR', 'Argentina',       'ARS', 'es-AR', 'P0', 7,  NULL),
  -- P1 — América
  ('BR', 'Brazil',          'BRL', 'pt-BR', 'P1', 14, NULL),
  ('MX', 'Mexico',          'MXN', 'es-MX', 'P1', 14, NULL),
  ('CL', 'Chile',           'CLP', 'es-CL', 'P1', 14, NULL),
  ('CO', 'Colombia',        'COP', 'es-CO', 'P1', 14, NULL),
  ('PE', 'Peru',            'PEN', 'es-PE', 'P1', 14, NULL),
  ('UY', 'Uruguay',         'UYU', 'es-UY', 'P1', 14, NULL),
  ('US', 'United States',   'USD', 'en-US', 'P1', 14, NULL),
  -- P2 — Europe
  ('ES', 'Spain',           'EUR', 'es-ES', 'P2', 30, NULL),
  ('PT', 'Portugal',        'EUR', 'pt-PT', 'P2', 30, NULL),
  ('GB', 'United Kingdom',  'GBP', 'en-GB', 'P2', 30, NULL),
  ('FR', 'France',          'EUR', 'fr-FR', 'P2', 30, NULL),
  ('DE', 'Germany',         'EUR', 'de-DE', 'P2', 30, NULL),
  ('IT', 'Italy',           'EUR', 'it-IT', 'P2', 30, NULL),
  ('NL', 'Netherlands',     'EUR', 'nl-NL', 'P2', 30, NULL)
ON CONFLICT (country_code) DO NOTHING;

-- ─── Audit Queue ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_audit_queue (
  id              serial PRIMARY KEY,
  service_id      integer NOT NULL REFERENCES public.pe_services(id) ON DELETE CASCADE,
  plan_id         integer REFERENCES public.pe_plans(id) ON DELETE CASCADE,
  country_code    text NOT NULL REFERENCES public.pe_markets(country_code) ON DELETE CASCADE,
  priority_score  numeric(10,2) NOT NULL DEFAULT 0,
  last_verified_at timestamptz,
  next_check_at   timestamptz NOT NULL DEFAULT now(),
  audit_status    text NOT NULL DEFAULT 'pending'
    CHECK (audit_status IN ('pending','in_progress','completed','failed','skipped')),
  attempt_count   integer NOT NULL DEFAULT 0,
  collector_type  text NOT NULL DEFAULT 'manual'
    CHECK (collector_type IN ('official_api','structured_html','public_json','headless_browser','manual')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, plan_id, country_code)
);

ALTER TABLE public.pe_audit_queue DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pe_audit_queue_next_check
  ON public.pe_audit_queue(next_check_at, audit_status);
CREATE INDEX IF NOT EXISTS idx_pe_audit_queue_priority
  ON public.pe_audit_queue(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_pe_audit_queue_country
  ON public.pe_audit_queue(country_code, audit_status);

-- ─── Plan Localizations ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_plan_localizations (
  id          serial PRIMARY KEY,
  plan_id     integer NOT NULL REFERENCES public.pe_plans(id) ON DELETE CASCADE,
  country_code text NOT NULL REFERENCES public.pe_markets(country_code) ON DELETE CASCADE,
  localized_name text NOT NULL,
  regional_offer_id text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, country_code)
);

ALTER TABLE public.pe_plan_localizations DISABLE ROW LEVEL SECURITY;

-- ─── Update pe_regional_prices unique constraint ────────────
-- The existing unique constraint is (service_id, plan_id, country_code)
-- We need to include period to allow same plan with different periods
ALTER TABLE public.pe_regional_prices
  DROP CONSTRAINT IF EXISTS pe_regional_prices_service_id_plan_id_country_code_key;

ALTER TABLE public.pe_regional_prices
  ADD CONSTRAINT pe_regional_prices_service_plan_country_period_key
  UNIQUE (service_id, plan_id, country_code, period);

-- ─── Add foreign key from pe_regional_prices to pe_markets ──
-- (Only if all existing country_codes exist in pe_markets)
ALTER TABLE public.pe_regional_prices
  ADD CONSTRAINT pe_regional_prices_country_code_fkey
  FOREIGN KEY (country_code) REFERENCES public.pe_markets(country_code) ON DELETE CASCADE;

-- ─── Add foreign key from pe_collector_sources to pe_markets ──
ALTER TABLE public.pe_collector_sources
  ADD CONSTRAINT pe_collector_sources_country_code_fkey
  FOREIGN KEY (country_code) REFERENCES public.pe_markets(country_code) ON DELETE CASCADE;

-- ─── Index for coverage queries ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pe_rp_country_status
  ON public.pe_regional_prices(country_code, status);

-- ─── Update pe_catalog_versions to link to markets ──────────
ALTER TABLE public.pe_catalog_versions
  ADD CONSTRAINT pe_catalog_versions_country_code_fkey
  FOREIGN KEY (country_code) REFERENCES public.pe_markets(country_code) ON DELETE CASCADE;
