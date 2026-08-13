-- ============================================================
-- STACK PRICE ENGINE — Schema (public schema, pe_ prefix)
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── Services ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_services (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  provider    text NOT NULL,
  name        text NOT NULL,
  category    text,
  subcategory text,
  aliases     text[] NOT NULL DEFAULT '{}',
  official_url text,
  active      boolean NOT NULL DEFAULT true,
  priority    integer NOT NULL DEFAULT 2,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pe_services DISABLE ROW LEVEL SECURITY;

-- ─── Plans ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_plans (
  id            serial PRIMARY KEY,
  service_id    integer NOT NULL REFERENCES public.pe_services(id) ON DELETE CASCADE,
  slug          text NOT NULL,
  name          text NOT NULL,
  billing_model text NOT NULL DEFAULT 'flat',
  period        text NOT NULL DEFAULT 'month',
  per_user      boolean NOT NULL DEFAULT false,
  parent_plan_id integer REFERENCES public.pe_plans(id),
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, slug)
);

ALTER TABLE public.pe_plans DISABLE ROW LEVEL SECURITY;

-- ─── Regional Prices ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_regional_prices (
  id              serial PRIMARY KEY,
  service_id      integer NOT NULL REFERENCES public.pe_services(id) ON DELETE CASCADE,
  plan_id         integer NOT NULL REFERENCES public.pe_plans(id) ON DELETE CASCADE,
  country_code    text NOT NULL,
  currency        text NOT NULL,
  amount          integer NOT NULL,
  period          text NOT NULL DEFAULT 'month',
  tax_mode        text NOT NULL DEFAULT 'tax_excluded',
  source_url      text,
  source_type     text NOT NULL DEFAULT 'manual_verified',
  last_verified_at timestamptz,
  status          text NOT NULL DEFAULT 'verified',
  confidence_score integer NOT NULL DEFAULT 50,
  valid_from      timestamptz NOT NULL DEFAULT now(),
  valid_until     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, plan_id, country_code)
);

ALTER TABLE public.pe_regional_prices DISABLE ROW LEVEL SECURITY;

-- ─── Price History ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_price_history (
  id                serial PRIMARY KEY,
  regional_price_id integer NOT NULL REFERENCES public.pe_regional_prices(id) ON DELETE CASCADE,
  amount            integer NOT NULL,
  currency          text NOT NULL,
  detected_at       timestamptz NOT NULL DEFAULT now(),
  verified_at       timestamptz,
  source_url        text,
  change_percentage numeric(6,2),
  previous_amount   integer
);

ALTER TABLE public.pe_price_history DISABLE ROW LEVEL SECURITY;

-- ─── Change Candidates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_change_candidates (
  id                serial PRIMARY KEY,
  regional_price_id integer NOT NULL REFERENCES public.pe_regional_prices(id) ON DELETE CASCADE,
  old_amount        integer NOT NULL,
  new_amount        integer NOT NULL,
  old_currency      text NOT NULL,
  new_currency      text NOT NULL,
  detected_at       timestamptz NOT NULL DEFAULT now(),
  source_url        text,
  collector_id      text,
  confidence_score  integer NOT NULL DEFAULT 50,
  status            text NOT NULL DEFAULT 'detected',
  reviewed_at       timestamptz,
  reviewed_by       text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pe_change_candidates DISABLE ROW LEVEL SECURITY;

-- ─── Audit Jobs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_audit_jobs (
  id            serial PRIMARY KEY,
  service_slug  text,
  country       text,
  scheduled_at  timestamptz NOT NULL DEFAULT now(),
  executed_at   timestamptz,
  result        text,
  error         text,
  raw_snapshot  jsonb,
  collector_id  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pe_audit_jobs DISABLE ROW LEVEL SECURITY;

-- ─── Collector Sources ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_collector_sources (
  id              serial PRIMARY KEY,
  service_id      integer NOT NULL REFERENCES public.pe_services(id) ON DELETE CASCADE,
  country_code    text NOT NULL,
  collector_type  text NOT NULL,
  source_url      text NOT NULL,
  config          jsonb NOT NULL DEFAULT '{}',
  active          boolean NOT NULL DEFAULT true,
  last_run_at     timestamptz,
  last_result     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, country_code, collector_type)
);

ALTER TABLE public.pe_collector_sources DISABLE ROW LEVEL SECURITY;

-- ─── Catalog Version ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pe_catalog_versions (
  id          serial PRIMARY KEY,
  country_code text NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code)
);

ALTER TABLE public.pe_catalog_versions DISABLE ROW LEVEL SECURITY;

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pe_rp_service_plan_country
  ON public.pe_regional_prices(service_id, plan_id, country_code);
CREATE INDEX IF NOT EXISTS idx_pe_rp_country_status
  ON public.pe_regional_prices(country_code, status);
CREATE INDEX IF NOT EXISTS idx_pe_history_rp_id
  ON public.pe_price_history(regional_price_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_pe_candidates_status
  ON public.pe_change_candidates(status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_pe_services_slug ON public.pe_services(slug);
CREATE INDEX IF NOT EXISTS idx_pe_plans_service_slug ON public.pe_plans(service_id, slug);

-- ─── Initial catalog version ────────────────────────────────
INSERT INTO public.pe_catalog_versions (country_code, version)
VALUES ('AR', 1)
ON CONFLICT (country_code) DO NOTHING;
