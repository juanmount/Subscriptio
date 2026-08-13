-- ═══════════════════════════════════════════════════════════════════════════
-- STACK — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Helper: get Firebase UID from request header ───────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.header.x-user-id', true), '')::text
$$;

-- ─── Currencies (shared, read-only for users) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.currencies (
  code        text PRIMARY KEY,
  symbol      text NOT NULL,
  name        text NOT NULL,
  minor_unit  integer NOT NULL DEFAULT 2
);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "currencies are readable by all" ON public.currencies
  FOR SELECT USING (true);

-- ─── Categories (shared, read-only for users) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id    serial PRIMARY KEY,
  name  text NOT NULL,
  icon  text,
  color text
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories are readable by all" ON public.categories
  FOR SELECT USING (true);

-- ─── Providers (shared catalog) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.providers (
  id           serial PRIMARY KEY,
  name         text NOT NULL,
  logo_url     text,
  website_url  text,
  pricing_url  text,
  category_id  integer REFERENCES public.categories(id),
  is_custom    boolean NOT NULL DEFAULT false,
  created_at   bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;

-- ─── Plans (shared, per provider) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id                    serial PRIMARY KEY,
  provider_id           integer NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  frequency             text NOT NULL,
  suggested_price_minor integer NOT NULL,
  currency_code         text NOT NULL REFERENCES public.currencies(code),
  credits_included      integer,
  is_suggested          boolean NOT NULL DEFAULT true,
  tax_mode              text NOT NULL DEFAULT 'tax_excluded',
  source_url            text,
  last_verified_at      bigint,
  audit_status          text NOT NULL DEFAULT 'verified',
  created_at            bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;

-- ─── Cards (user-scoped) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cards (
  id          serial PRIMARY KEY,
  user_id     text NOT NULL,
  alias       text NOT NULL,
  bank        text,
  brand       text,
  last_four   text,
  closing_day integer,
  color       text,
  created_at  bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;

-- ─── Subscriptions (user-scoped) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       serial PRIMARY KEY,
  user_id                  text NOT NULL,
  provider_id              integer REFERENCES public.providers(id),
  custom_name              text,
  plan_id                  integer REFERENCES public.plans(id),
  custom_plan_name         text,

  confirmed_price_minor    integer NOT NULL,
  currency_code            text NOT NULL REFERENCES public.currencies(code),

  converted_price_minor    integer,
  converted_currency_code  text REFERENCES public.currencies(code),
  exchange_rate            integer,
  exchange_rate_date       bigint,
  exchange_rate_source     text,

  frequency                text NOT NULL,
  next_renewal_date        bigint,
  start_date               bigint,

  category_id              integer REFERENCES public.categories(id),
  card_id                  integer REFERENCES public.cards(id),

  credits_included         integer,
  data_origin              text NOT NULL DEFAULT 'manual',
  is_active                boolean NOT NULL DEFAULT true,
  notes                    text,

  created_at               bigint NOT NULL DEFAULT 0,
  updated_at               bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- ─── Extra purchases (user-scoped) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.extra_purchases (
  id               serial PRIMARY KEY,
  user_id          text NOT NULL,
  subscription_id  integer NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  description      text NOT NULL,
  amount_minor     integer NOT NULL,
  currency_code    text NOT NULL REFERENCES public.currencies(code),
  purchased_at     bigint NOT NULL,
  created_at       bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.extra_purchases DISABLE ROW LEVEL SECURITY;

-- ─── Price watch logs (user-scoped) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_watch_logs (
  id              serial PRIMARY KEY,
  user_id         text NOT NULL,
  provider_id     integer REFERENCES public.providers(id),
  provider_name   text NOT NULL,
  plan_name       text,
  old_price_minor integer,
  new_price_minor integer NOT NULL,
  currency_code   text NOT NULL,
  frequency       text,
  detected_at     bigint NOT NULL,
  is_read         boolean NOT NULL DEFAULT false,
  created_at      bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.price_watch_logs DISABLE ROW LEVEL SECURITY;

-- ─── Monthly snapshots (user-scoped) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id                  serial PRIMARY KEY,
  user_id             text NOT NULL,
  month_year          text NOT NULL,
  total_monthly_minor integer NOT NULL,
  currency_code       text NOT NULL REFERENCES public.currencies(code),
  subscription_count  integer NOT NULL,
  snapshot_data       text,
  created_at          bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.monthly_snapshots DISABLE ROW LEVEL SECURITY;

-- ─── Settings (user-scoped key-value) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  user_id  text NOT NULL,
  key      text NOT NULL,
  value    text NOT NULL,
  PRIMARY KEY (user_id, key)
);

ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- ─── Seed: Currencies ───────────────────────────────────────────────────────
INSERT INTO public.currencies (code, symbol, name, minor_unit) VALUES
  ('USD', 'US$', 'Dólar estadounidense', 2),
  ('ARS', '$',   'Peso argentino',        0),
  ('EUR', '€',   'Euro',                  2),
  ('BRL', 'R$',  'Real brasileño',        2),
  ('MXN', 'MX$', 'Peso mexicano',         2),
  ('CLP', 'CL$', 'Peso chileno',          0),
  ('COP', 'CO$', 'Peso colombiano',       2),
  ('GBP', '£',   'Libra esterlina',       2)
ON CONFLICT (code) DO NOTHING;

-- ─── Seed: Categories ───────────────────────────────────────────────────────
INSERT INTO public.categories (id, name, icon, color) VALUES
  (1,  'IA',                  '🤖',  '#6B52E0'),
  (2,  'Entretenimiento',     '🎬',  '#2D9E40'),
  (3,  'Productividad',       '⚡',  '#2B6ED4'),
  (4,  'Desarrollo',          '💻',  '#F97316'),
  (5,  'Almacenamiento',      '☁️',  '#B07800'),
  (6,  'Salud y Fitness',     '💪',  '#00875A'),
  (7,  'Educación',           '📚',  '#0066CC'),
  (8,  'Seguridad',           '🔒',  '#CC6600'),
  (9,  'Diseño y Creatividad','🎨',  '#CC0066'),
  (10, 'Otras',               '···', '#666666'),
  (11, 'Finanzas',            '💰',  '#2E7D32'),
  (12, 'Marketing',           '📣',  '#E91E63')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, color = EXCLUDED.color;

-- Reset sequence after explicit ID inserts
SELECT setval('public.categories_id_seq', (SELECT MAX(id) FROM public.categories));
