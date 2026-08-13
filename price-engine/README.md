# STACK Price Engine

Centralized price collection, change detection, and API for subscription catalogs.

## Architecture

```
Official Sources → Price Collectors → Normalization → Price Database
    → Change Detector → Verification → STACK Price API → STACK App
```

## Setup

### 1. Create the `price_engine` schema in Supabase

Run `db/schema.sql` in Supabase SQL Editor.

### 2. Install dependencies

```bash
cd price-engine
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase URL and service role key
```

### 4. Seed initial data (Netflix AR + Spotify AR)

```bash
npm run seed
```

### 5. Start the API server

```bash
npm run dev
```

Server runs on `http://localhost:3100`.

## API Endpoints

### Catalog
```
GET /v1/catalog?country=AR
```

### Service detail
```
GET /v1/services/netflix
GET /v1/services/netflix/plans?country=AR
```

### Single price
```
GET /v1/prices/netflix/premium?country=AR
```

### Price history
```
GET /v1/prices/netflix/premium/history?country=AR
```

### Price changes
```
GET /v1/price-changes?country=AR&since=2026-08-01
```

### Admin Dashboard
```
GET /admin
```

### Admin API
```
POST /admin/collect         — trigger collection { country, services? }
GET  /admin/candidates      — list change candidates
POST /admin/candidates/:id/approve  — approve { reviewer }
POST /admin/candidates/:id/reject   — reject { reviewer, notes? }
GET  /admin/services        — list all services with prices
```

## Collectors

Each provider has a collector that returns standardized price data.

Current collectors:
- **Netflix** (manual) — AR plans: Básico, Estándar, Premium
- **Spotify** (manual) — AR plans: Student, Individual, Duo, Family

To add a new collector:
1. Create `src/collectors/<name>.ts` extending `BaseCollector`
2. Register it in `src/collectors/registry.ts`

## Scheduler

Priority tiers:
- **P1** (24h): Netflix, Spotify, Disney+, Max, ChatGPT, Adobe, Google, Apple
- **P2** (weekly): Popular services
- **P3** (monthly): Long tail

## Change Detection

- Price changes > 50% → `review_required`
- Currency change → `review_required`
- High confidence + small change → `auto_approved`
- All changes recorded in `price_history`
- Candidates require approval before updating `regional_prices`

## Data Model

```
services → plans → regional_prices → price_history
                                    ↑
                              change_candidates
                              audit_jobs
                              collector_sources
```
