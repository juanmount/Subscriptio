# STACK Price Engine — Market Rollout Proposal

## Overview

This document outlines the progressive rollout plan for STACK Price Engine across multiple markets. The architecture is now multi-country ready with `pe_markets`, `pe_audit_queue`, `pe_plan_localizations`, and per-country `pe_regional_prices`.

**Principle:** STACK launches in a country even without 100% catalog coverage. Services without verified prices show "Servicio reconocido. Ingresá cuánto pagás."

---

## Markets

| Phase | Country | Code | Currency | Locale | Status |
|-------|---------|------|----------|--------|--------|
| P0 | Argentina | AR | ARS | es-AR | Active — full catalog |
| P1 | Brazil | BR | BRL | pt-BR | Structure ready |
| P1 | Mexico | MX | MXN | es-MX | Structure ready |
| P1 | Chile | CL | CLP | es-CL | Structure ready |
| P1 | Colombia | CO | COP | es-CO | Structure ready |
| P1 | Peru | PE | PEN | es-PE | Structure ready |
| P1 | Uruguay | UY | UYU | es-UY | Structure ready |
| P1 | United States | US | USD | en-US | Structure ready |
| P2 | Spain | ES | EUR | es-ES | Structure ready |
| P2 | Portugal | PT | EUR | pt-PT | Structure ready |
| P2 | United Kingdom | GB | GBP | en-GB | Structure ready |
| P2 | France | FR | EUR | fr-FR | Structure ready |
| P2 | Germany | DE | EUR | de-DE | Structure ready |
| P2 | Italy | IT | EUR | it-IT | Structure ready |
| P2 | Netherlands | NL | EUR | nl-NL | Structure ready |

---

## Current Coverage (Test Data)

| Country | Services | Plans | Verified | Manual Required | Coverage |
|---------|----------|-------|----------|-----------------|----------|
| AR | 2 (Netflix, Spotify) | 7 | 7 | 0 | 100% |
| BR | 2 | 7 | 7 | 0 | 100% |
| MX | 2 | 7 | 7 | 0 | 100% |
| US | 2 | 6 | 6 | 0 | 100% |
| ES | 2 | 7 | 7 | 0 | 100% |

*Note: These are test-only. Real coverage will be measured after audit queue processing.*

---

## P1 Services (Priority for expansion)

### Streaming / Entertainment
- Netflix (collector: manual, multi-country ready)
- Disney+ (collector: needed)
- Max (collector: needed)
- Spotify (collector: manual, multi-country ready)
- YouTube Premium (collector: needed)
- Amazon Prime / Prime Video (collector: needed)
- Apple TV+ (collector: needed)
- Paramount+ (collector: needed)
- Crunchyroll (collector: needed)
- Xbox Game Pass (collector: needed)
- PlayStation Plus (collector: needed)
- Nintendo Switch Online (collector: needed)

### AI
- ChatGPT (collector: needed)
- Claude (collector: needed)
- Gemini (collector: needed)
- Midjourney (collector: needed)
- Runway (collector: needed)
- Higgsfield (collector: needed)
- ElevenLabs (collector: needed)
- Perplexity (collector: needed)
- OpenRouter (collector: needed)

### Coding / Development
- GitHub (collector: needed)
- GitHub Copilot (collector: needed)
- Cursor (collector: needed)
- Windsurf (collector: needed)
- v0 (collector: needed)
- Replit (collector: needed)
- Lovable (collector: needed)
- Bolt (collector: needed)
- Vercel (collector: needed)
- Supabase (collector: needed)
- Firebase (collector: needed)
- Google Cloud (collector: needed)
- AWS (collector: needed)

### Creator / Audiovisual
- Adobe Creative Cloud (collector: needed)
- Canva (collector: needed)
- Artlist (collector: needed)
- Envato Elements (collector: needed)
- Motion Array (collector: needed)
- Epidemic Sound (collector: needed)
- Freepik / Magnific (collector: needed)
- Frame.io (collector: needed)

---

## Collectors Available

| Service | Collector Type | Countries | Status |
|---------|---------------|-----------|--------|
| Netflix | manual | AR, BR, MX, US, ES | Ready |
| Spotify | manual | AR, BR, MX, US, ES | Ready |
| All others | — | — | Not built |

**Collector types available in architecture:**
- `official_api` — structured API with known endpoint
- `structured_html` — scraping with known selectors
- `public_json` — public JSON endpoint
- `headless_browser` — JS-rendered pages
- `manual` — human-verified static data

---

## Services with `manual_required` Status

All services not yet seeded for a given country will appear as `manual_required` in coverage metrics. The app handles this gracefully:

```
Servicio reconocido.
Ingresá cuánto pagás.
```

---

## Difficulty Assessment per Provider

| Provider | Difficulty | Notes |
|----------|-----------|-------|
| Netflix | Low | Clear pricing pages per country, consistent structure |
| Spotify | Low | Clear pricing pages per country |
| Disney+ | Medium | Some countries redirect, geo-detection |
| Max | Medium | Regional variations, some markets not available |
| ChatGPT | Medium | Pricing varies by region, some use USD globally |
| Claude | Medium | USD globally, some regional pricing |
| Adobe CC | High | Complex regional pricing, taxes vary significantly |
| Apple services | High | Apple sets regional prices but tax handling is complex |
| Google services | Medium | Regional pricing exists but varies by product |
| Gaming (Xbox/PS/Nintendo) | Medium | Regional stores, prices in local currency |

---

## Recommended Implementation Order

### Phase 1: Argentina (current)
1. Complete AR catalog for all P1 services
2. Verify all existing AR prices
3. Mark unverified as `review_required`
4. Build collectors for top 5 AR services

### Phase 2: Test markets (current)
1. Netflix + Spotify across AR, BR, MX, US, ES (done)
2. Verify API endpoints work for all 5 countries
3. Test app integration with multi-country catalog

### Phase 3: P1 América expansion
1. Expand to all P1 services in AR
2. Add BR, MX with top 10 services each
3. Add US with global services (USD pricing)
4. Add CL, CO, PE, UY progressively

### Phase 4: P2 Europe
1. Add ES, PT with top 10 services
2. Add GB, FR, DE, IT, NL progressively
3. Handle EUR markets independently (never copy prices between EUR countries)

### Phase 5: Long tail
1. Expand based on user demand data
2. Add services requested by users
3. Prioritize by `priority_score` from audit queue

---

## Combination Estimates

| Phase | Services | Countries | Combinations | Notes |
|-------|----------|-----------|-------------|-------|
| Phase 1 | ~60 | 1 (AR) | ~180 | 60 services × ~3 plans avg |
| Phase 2 | 2 | 5 | ~35 | Test only |
| Phase 3 | ~60 | 8 (P1) | ~1,440 | Full P1 expansion |
| Phase 4 | ~60 | 15 (P1+P2) | ~2,700 | Full coverage |
| Phase 5 | ~250 | 15+ | ~11,250 | Long tail |

---

## Technical Risks

1. **Supabase RLS**: `pe_` tables have RLS disabled (service role access only). App must use the API, not direct Supabase queries from the client.

2. **Price formatting**: Different currencies have different `minor_unit` values (ARS=0, USD=2, CLP=0). The admin dashboard now handles this correctly. The app must also respect this.

3. **Collector scalability**: Manual collectors don't scale. Need to build `structured_html` collectors for top providers before Phase 3.

4. **Currency confusion**: Some services sell in USD even in AR (e.g., Apple TV+). The architecture supports this — `country_code=AR, currency=USD` is valid.

5. **Plan name localization**: Plan names may differ by country (e.g., "Básico" vs "Basic"). The `pe_plan_localizations` table supports this.

6. **Audit queue growth**: With 250 services × 15 countries × 3 plans = 11,250 queue items. The priority score formula ensures high-value audits run first.

---

## Recommendations

1. **Don't seed all countries at once.** Start with AR (full), then BR+MX (top 10), then US (global services).

2. **Build collectors for Netflix and Spotify first** as `structured_html` to replace manual data. These are the highest-traffic services.

3. **Use the audit queue** to prioritize which prices to verify next. The `priority_score` formula considers market priority, service priority, and staleness.

4. **Mark all inherited AR prices as `review_required`** during migration, not `verified`. Only mark `verified` after manual confirmation.

5. **The app should call `GET /v1/catalog?country=AR` once and cache locally.** Use `catalog_version` to determine if a refresh is needed.

6. **Price Watch alerts must match `service_id + plan_id + country_code`.** An AR price change never triggers an alert for MX users.
