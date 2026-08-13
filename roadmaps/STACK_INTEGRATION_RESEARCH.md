# STACK — Integration Research

**Versión:** 1.0
**Fecha:** 2026-08-07
**Objetivo:** Decidir con evidencia qué integraciones vale la pena construir para Connected Usage y Price Watch.

---

## 1. Executive Summary

STACK centraliza suscripciones y gastos recurrentes. Esta investigación evalúa **60+ proveedores** para determinar cuáles permiten integración oficial para:

- **Connected Usage**: consultar consumo real (créditos, tokens, saldo, ciclo de facturación)
- **Price Watch**: monitorear precios oficiales de planes

### Hallazgos clave

**Connected Usage es viable solo para una minoría de proveedores.** La gran mayoría de servicios de entretenimiento (Netflix, Disney+, Spotify) y herramientas creativas (Canva, Figma, Adobe) no exponen APIs para que un tercero consulte estado de suscripción o consumo.

**Las mejores integraciones son plataformas de API/Cloud** que por diseño exponen billing/usage endpoints: OpenRouter, OpenAI, Anthropic, Vercel, Cloudflare, GitHub, Replicate. Estas son las que más valor diferencial aportan a STACK.

**Price Watch es universalmente aplicable.** Todo proveedor con página de pricing pública puede ser monitoreado, incluso sin API.

### Recomendación

Construir **5 integraciones piloto** en V1:
1. **OpenRouter** — credits balance + usage diario/mensual
2. **OpenAI** — usage/cost API (Admin Key)
3. **Anthropic** — usage/cost API (Admin Key)
4. **Vercel** — billing/charges API (FOCUS format)
5. **Cloudflare** — billable usage API

Todas usan API keys scoped, read-only, seguras, y devuelven datos de consumo real que un usuario individual puede obtener.

---

## 2. Tabla General de Proveedores

| # | Provider | Categoría | API Oficial | Connected Usage | Price Watch | Recomendación |
|---|----------|-----------|-------------|-----------------|-------------|---------------|
| 1 | OpenAI | AI API | Sí | Sí (Admin Key) | Sí | INTEGRATE_V1 |
| 2 | Anthropic | AI API | Sí | Sí (Admin Key) | Sí | INTEGRATE_V1 |
| 3 | OpenRouter | AI API | Sí | Sí (API Key) | Sí | INTEGRATE_V1 |
| 4 | Vercel | Cloud/Platform | Sí | Sí (Bearer Token) | Sí | INTEGRATE_V1 |
| 5 | Cloudflare | Cloud/Platform | Sí | Sí (API Token) | Sí | INTEGRATE_V1 |
| 6 | Replicate | AI API | Sí | Sí (API Token) | Sí | INTEGRATE_LATER |
| 7 | Together AI | AI API | Sí | Sí (API Key) | Sí | INTEGRATE_LATER |
| 8 | HuggingFace | AI Platform | Sí | Parcial (dashboard) | Sí | INTEGRATE_LATER |
| 9 | GitHub Copilot | Coding AI | Sí | Sí (billing API) | Sí | INTEGRATE_LATER |
| 10 | Cursor | Coding AI | Sí (Enterprise) | Sí (Enterprise) | Sí | TEAM_ONLY |
| 11 | Windsurf | Coding AI | Sí (Enterprise) | Sí (Enterprise) | Sí | TEAM_ONLY |
| 12 | v0 (Vercel) | AI Builder | Sí | Sí (SDK) | Sí | INTEGRATE_LATER |
| 13 | Replit | Coding Platform | Parcial | No (dashboard only) | Sí | RESEARCH_MORE |
| 14 | ElevenLabs | AI Voice | Sí | Sí (API Key) | Sí | INTEGRATE_LATER |
| 15 | Runway | AI Video | Sí (API) | Sí (API credits) | Sí | INTEGRATE_LATER |
| 16 | Descript | Creator Tool | Sí | Parcial (credits) | Sí | RESEARCH_MORE |
| 17 | OpusClip | Creator Tool | Sí | Parcial (credits) | Sí | RESEARCH_MORE |
| 18 | Midjourney | AI Image | No | No | Sí | DO_NOT_INTEGRATE |
| 19 | Netflix | Streaming | No | No | No | DO_NOT_INTEGRATE |
| 20 | Spotify | Streaming | Sí | Parcial (premium/free) | No | DO_NOT_INTEGRATE |
| 21 | Figma | Design | Sí (plugins) | No (externo) | Sí | DO_NOT_INTEGRATE |
| 22 | Canva | Design | Sí (in-app) | No (externo) | Sí | DO_NOT_INTEGRATE |
| 23 | Adobe CC | Creative | Sí (partners) | No (individual) | Sí | DO_NOT_INTEGRATE |
| 24 | Notion | Productivity | Sí | No (no plan info) | Sí | DO_NOT_INTEGRATE |
| 25 | Dropbox | Storage | Sí | No (no plan info) | Sí | DO_NOT_INTEGRATE |
| 26 | Groq | AI API | Parcial | No (dashboard only) | Sí | RESEARCH_MORE |
| 27 | Fireworks AI | AI API | Sí | Sí (API Key) | Sí | INTEGRATE_LATER |
| 28 | Higgsfield | AI Video | No | No | Sí | DO_NOT_INTEGRATE |
| 29 | Krea | AI Image | No | No | Sí | DO_NOT_INTEGRATE |
| 30 | Leonardo AI | AI Image | Sí | Parcial | Sí | RESEARCH_MORE |
| 31 | Ideogram | AI Image | Sí | Parcial | Sí | RESEARCH_MORE |
| 32 | Kling AI | AI Video | No | No | Sí | DO_NOT_INTEGRATE |
| 33 | Luma Dream Machine | AI Video | Sí | Parcial | Sí | RESEARCH_MORE |
| 34 | Pika | AI Video | No | No | Sí | DO_NOT_INTEGRATE |
| 35 | Hailuo AI | AI Video | No | No | Sí | DO_NOT_INTEGRATE |
| 36 | HeyGen | AI Video | Sí | Parcial | Sí | RESEARCH_MORE |
| 37 | Synthesia | AI Video | Sí | Parcial | Sí | RESEARCH_MORE |
| 38 | Suno | AI Music | No | No | Sí | DO_NOT_INTEGRATE |
| 39 | Udio | AI Music | No | No | Sí | DO_NOT_INTEGRATE |
| 40 | Freepik/Magnific | AI Image | Sí | Parcial | Sí | RESEARCH_MORE |
| 41 | Lovable | App Builder | No | No | Sí | DO_NOT_INTEGRATE |
| 42 | Bolt.new | App Builder | No | No | Sí | DO_NOT_INTEGRATE |
| 43 | Devin | AI Agent | No | No | Sí | DO_NOT_INTEGRATE |
| 44 | JetBrains AI | Coding AI | No | No | Sí | DO_NOT_INTEGRATE |
| 45 | Amazon Q Developer | Coding AI | Sí (AWS) | Sí (AWS billing) | Sí | ENTERPRISE_ONLY |
| 46 | Tabnine | Coding AI | No | No | Sí | DO_NOT_INTEGRATE |
| 47 | Google AI (Gemini) | AI API | Sí | Sí (Cloud billing) | Sí | ENTERPRISE_ONLY |
| 48 | AWS | Cloud | Sí | Sí (Cost Explorer) | Sí | ENTERPRISE_ONLY |
| 49 | GCP | Cloud | Sí | Sí (Cloud Billing) | Sí | ENTERPRISE_ONLY |
| 50 | Azure | Cloud | Sí | Sí (Cost Mgmt) | Sí | ENTERPRISE_ONLY |
| 51 | Envato Elements | Creative | No | No | Sí | DO_NOT_INTEGRATE |
| 52 | Motion Array | Creative | No | No | Sí | DO_NOT_INTEGRATE |
| 53 | Epidemic Sound | Audio | Sí (Partner API) | No (individual) | Sí | DO_NOT_INTEGRATE |
| 54 | Soundstripe | Audio | No | No | Sí | DO_NOT_INTEGRATE |
| 55 | Storyblocks | Video | No | No | Sí | DO_NOT_INTEGRATE |
| 56 | Frame.io | Video | Sí (Adobe) | No (individual) | Sí | DO_NOT_INTEGRATE |
| 57 | Vimeo | Video | Sí | Parcial | Sí | RESEARCH_MORE |
| 58 | Riverside | Audio/Video | No | No | Sí | DO_NOT_INTEGRATE |
| 59 | CapCut Pro | Video | No | No | Sí | DO_NOT_INTEGRATE |
| 60 | Topaz Labs | Image | No | No | Sí | DO_NOT_INTEGRATE |
| 61 | Shutterstock | Stock | Sí | No (individual) | Sí | DO_NOT_INTEGRATE |
| 62 | Adobe Stock | Stock | Sí | No (individual) | Sí | DO_NOT_INTEGRATE |
| 63 | Artlist | Audio | No | No | Sí | DO_NOT_INTEGRATE |
| 64 | Microsoft 365 | Productivity | Sí (Graph) | Sí (admin) | Sí | ENTERPRISE_ONLY |
| 65 | Apple Music | Streaming | Sí (MusicKit) | Parcial (iOS) | No | DO_NOT_INTEGRATE |
| 66 | GitHub (Marketplace) | Platform | Sí | Sí | Sí | INTEGRATE_LATER |
| 67 | NordVPN | VPN | No | No | Sí | DO_NOT_INTEGRATE |
| 68 | iCloud+ | Storage | No | No | No | DO_NOT_INTEGRATE |
| 69 | xAI (Grok API) | AI API | Sí | Sí (mgmt key) | Sí | INTEGRATE_LATER |

---

## 3. Detalle Técnico por Proveedor

### 3.1 — OpenAI

| Campo | Valor |
|-------|-------|
| Producto/Plan | Platform API (pay-as-you-go), ChatGPT Plus/Pro (consumer) |
| Tipo de cuenta | Individual, Organization |
| API Oficial | Sí |
| Endpoint | `GET /v1/organization/usage/completions`, `GET /v1/organization/costs` |
| Datos disponibles | Tokens consumidos, costo USD, modelo, agrupación por día/hora/minuto |
| Autenticación | Admin Key (`sk-admin-...`) — separada de la API key de inferencia |
| Scopes | Read-only de usage/cost |
| Usuarios individuales | Sí — cualquier usuario con cuenta de plataforma |
| Sentido en STACK | Sí — alto valor: muestra gasto real en API |
| Complejidad técnica | Baja |
| Riesgo de seguridad | Bajo — Admin Key read-only, no permite inferencia |
| Rate limits | Estándar OpenAI |
| Limitaciones | No muestra info de ChatGPT Plus (consumer). Solo plataforma. |
| URL docs | https://developers.openai.com/cookbook/examples/completions_usage_api |
| Recomendación | **INTEGRATE_V1** |

**Capabilities:**
```json
{
  "provider": "openai",
  "capabilities": {
    "price_watch": "supported",
    "plan_detection": "supported",
    "usage_tracking": "supported",
    "credit_balance": "unavailable",
    "token_usage": "supported",
    "cost_tracking": "supported",
    "billing_cycle": "supported",
    "overage_tracking": "supported",
    "renewal_tracking": "unavailable"
  }
}
```

---

### 3.2 — Anthropic (Claude)

| Campo | Valor |
|-------|-------|
| Producto/Plan | Claude API (Console), Claude Pro/Max (consumer) |
| Tipo de cuenta | Individual, Organization |
| API Oficial | Sí |
| Endpoint | `GET /v1/organizations/usage_report/messages`, `GET /v1/organizations/cost_report` |
| Datos disponibles | Tokens consumidos, costo USD, modelo, agrupación temporal |
| Autenticación | Admin Key (`sk-ant-admin...`) |
| Scopes | Read-only de usage/cost |
| Usuarios individuales | Sí — cualquier usuario con Console access |
| Sentido en STACK | Sí — mismo valor que OpenAI |
| Complejidad técnica | Baja |
| Riesgo de seguridad | Bajo |
| Rate limits | Estándar Anthropic |
| Limitaciones | Claude Pro (consumer) y API son productos separados. No muestra info de Claude Pro. |
| URL docs | https://platform.claude.com/cookbook/observability-usage-cost-api |
| Recomendación | **INTEGRATE_V1** |

**Capabilities:**
```json
{
  "provider": "anthropic",
  "capabilities": {
    "price_watch": "supported",
    "plan_detection": "supported",
    "usage_tracking": "supported",
    "credit_balance": "unavailable",
    "token_usage": "supported",
    "cost_tracking": "supported",
    "billing_cycle": "supported",
    "overage_tracking": "unavailable",
    "renewal_tracking": "unavailable"
  }
}
```

---

### 3.3 — OpenRouter

| Campo | Valor |
|-------|-------|
| Producto/Plan | Pay-as-you-go credits |
| Tipo de cuenta | Individual |
| API Oficial | Sí |
| Endpoint | `GET /api/v1/key`, `GET /api/v1/credits` |
| Datos disponibles | Credits usados (total, diario, semanal, mensual), límite, límite restante, is_free_tier |
| Autenticación | Bearer token (API key o Management key) |
| Scopes | Read-only para credits; Management key para /credits |
| Usuarios individuales | Sí |
| Sentido en STACK | Sí — altísimo valor: muestra saldo y consumo en una llamada |
| Complejidad técnica | Baja |
| Riesgo de seguridad | Bajo — API key read-only |
| Rate limits | Estándar |
| Limitaciones | No hay ciclo de facturación formal (prepaid) |
| URL docs | https://openrouter.ai/docs/api/api-reference/credits/get-credits |
| Recomendación | **INTEGRATE_V1** |

**Ejemplo de respuesta normalizada:**
```json
{
  "provider": "openrouter",
  "connectionStatus": "connected",
  "usage": {
    "used": 25.5,
    "limit": 100,
    "remaining": 74.5,
    "unit": "credits"
  },
  "cost": {
    "amount": 25.5,
    "currency": "USD"
  },
  "billingCycle": null
}
```

**Capabilities:**
```json
{
  "provider": "openrouter",
  "capabilities": {
    "price_watch": "supported",
    "plan_detection": "supported",
    "usage_tracking": "supported",
    "credit_balance": "supported",
    "token_usage": "supported",
    "cost_tracking": "supported",
    "billing_cycle": "unavailable",
    "overage_tracking": "unavailable",
    "renewal_tracking": "unavailable"
  }
}
```

---

### 3.4 — Vercel

| Campo | Valor |
|-------|-------|
| Producto/Plan | Hobby (free), Pro ($20/mo), Enterprise |
| Tipo de cuenta | Individual, Team |
| API Oficial | Sí |
| Endpoint | `GET /v1/billing/charges` (FOCUS v1.3 format, JSONL stream) |
| Datos disponibles | Costo por servicio, uso por servicio, período de facturación, breakdown diario |
| Autenticación | Bearer token (Vercel API token) |
| Scopes | Read-only billing |
| Usuarios individuales | Sí — Pro plan users |
| Sentido en STACK | Sí — útil para devs que pagan Vercel Pro |
| Complejidad técnica | Media — JSONL streaming, FOCUS format |
| Riesgo de seguridad | Bajo |
| Rate limits | Estándar Vercel |
| Limitaciones | Solo Team/Pro, no Hobby. Datos diarios, no real-time. |
| URL docs | https://docs.vercel.com/docs/rest-api/reference/endpoints/billing/list-focus-billing-charges |
| Recomendación | **INTEGRATE_V1** |

**Capabilities:**
```json
{
  "provider": "vercel",
  "capabilities": {
    "price_watch": "supported",
    "plan_detection": "supported",
    "usage_tracking": "supported",
    "credit_balance": "supported",
    "token_usage": "unavailable",
    "cost_tracking": "supported",
    "billing_cycle": "supported",
    "overage_tracking": "supported",
    "renewal_tracking": "supported"
  }
}
```

---

### 3.5 — Cloudflare

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Pro, Business, Enterprise |
| Tipo de cuenta | Individual, Team |
| API Oficial | Sí |
| Endpoint | `GET /accounts/{account_id}/billable/usage` (v2, FOCUS) o `GET /accounts/{account_id}/paygo-usage` (v1) |
| Datos disponibles | Costo por producto (Workers, R2, D1, AI, Images, Stream), uso consumido, costo acumulado, período |
| Autenticación | Bearer token (API Token con Billing Read) |
| Scopes | Billing Read (read-only) |
| Usuarios individuales | Sí — self-serve accounts |
| Sentido en STACK | Sí — útil para devs con Workers/R2 |
| Complejidad técnica | Media |
| Riesgo de seguridad | Bajo — token scoped read-only |
| Rate limits | Estándar Cloudflare |
| Limitaciones | v2 es Alpha/Restricted. v1 disponible. Datos diarios. |
| URL docs | https://developers.cloudflare.com/api/resources/billing/subresources/usage/ |
| Recomendación | **INTEGRATE_V1** |

**Capabilities:**
```json
{
  "provider": "cloudflare",
  "capabilities": {
    "price_watch": "supported",
    "plan_detection": "supported",
    "usage_tracking": "supported",
    "credit_balance": "unavailable",
    "token_usage": "unavailable",
    "cost_tracking": "supported",
    "billing_cycle": "supported",
    "overage_tracking": "supported",
    "renewal_tracking": "supported"
  }
}
```

---

### 3.6 — Replicate

| Campo | Valor |
|-------|-------|
| Producto/Plan | Pay-as-you-go (prepaid credits o monthly billing) |
| Tipo de cuenta | Individual |
| API Oficial | Sí (pero sin endpoint de billing/usage directo) |
| Endpoint | No hay endpoint público de balance/usage. Billing visible en dashboard. |
| Datos disponibles | Costo por predicción (en respuesta de API), pero no hay endpoint agregado |
| Autenticación | Bearer token (API token) |
| Usuarios individuales | Sí |
| Sentido en STACK | Sí — pero limitado sin endpoint de balance |
| Complejidad técnica | Media — requiere agregación manual de costos por predicción |
| Riesgo de seguridad | Bajo |
| Limitaciones | Sin endpoint de billing/usage. Costo viene en cada respuesta de predicción. |
| URL docs | https://replicate.com/docs/topics/billing |
| Recomendación | **INTEGRATE_LATER** |

**Capabilities:**
```json
{
  "provider": "replicate",
  "capabilities": {
    "price_watch": "supported",
    "plan_detection": "unavailable",
    "usage_tracking": "research",
    "credit_balance": "research",
    "token_usage": "unavailable",
    "cost_tracking": "research",
    "billing_cycle": "unavailable",
    "overage_tracking": "unavailable",
    "renewal_tracking": "unavailable"
  }
}
```

---

### 3.7 — Together AI

| Campo | Valor |
|-------|-------|
| Producto/Plan | Prepaid credits (mínimo $5) |
| Tipo de cuenta | Individual, Organization |
| API Oficial | Sí (dashboard billing), pero no hay endpoint público de balance |
| Endpoint | Cost analytics en dashboard. No hay API pública de balance. |
| Datos disponibles | Costo por modelo, agrupación por producto/proyecto/API key |
| Autenticación | API Key |
| Usuarios individuales | Sí |
| Sentido en STACK | Sí — pero sin endpoint de balance programático |
| Complejidad técnica | Media |
| Riesgo de seguridad | Bajo |
| Limitaciones | Sin endpoint público de credit balance. Analytics solo en dashboard web. |
| URL docs | https://docs.together.ai/docs/billing-usage-limits |
| Recomendación | **INTEGRATE_LATER** (esperar endpoint de balance) |

---

### 3.8 — ElevenLabs

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Starter, Creator, Pro, Scale, Business |
| Tipo de cuenta | Individual, Workspace |
| API Oficial | Sí |
| Endpoint | `GET /user/subscription` (subscription info), `GET /user` (usage) |
| Datos disponibles | Tier, character_count, character_limit, voice_slots, status, billing_period, current_overage |
| Autenticación | API Key (Bearer) |
| Scopes | Read-only |
| Usuarios individuales | Sí |
| Sentido en STACK | Sí — altísimo valor: créditos usados, límite, overage, ciclo |
| Complejidad técnica | Baja |
| Riesgo de seguridad | Bajo |
| Limitaciones | API key da acceso a inferencia también (no solo lectura) |
| URL docs | https://elevenlabs.io/docs/api-reference/user/subscription/get |
| Recomendación | **INTEGRATE_LATER** (V2 — alto valor pero requiere scoped key) |

**Ejemplo de respuesta normalizada:**
```json
{
  "provider": "elevenlabs",
  "connectionStatus": "connected",
  "billingCycle": {
    "period": "monthly_period"
  },
  "usage": {
    "used": 72000,
    "limit": 100000,
    "remaining": 28000,
    "unit": "characters"
  },
  "cost": {
    "amount": 18.40,
    "currency": "USD"
  }
}
```

**Capabilities:**
```json
{
  "provider": "elevenlabs",
  "capabilities": {
    "price_watch": "supported",
    "plan_detection": "supported",
    "usage_tracking": "supported",
    "credit_balance": "supported",
    "token_usage": "unavailable",
    "cost_tracking": "supported",
    "billing_cycle": "supported",
    "overage_tracking": "supported",
    "renewal_tracking": "supported"
  }
}
```

---

### 3.9 — Runway

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Standard ($12/mo), Pro ($28/mo), Max ($76/mo), Enterprise |
| Tipo de cuenta | Individual, Organization (API separada de web app) |
| API Oficial | Sí (API de generación, no de billing) |
| Endpoint | API de generación cuesta credits. No hay endpoint de balance público. |
| Datos disponibles | Credits por generación (en respuesta), tiers de uso |
| Autenticación | API Key (Bearer) |
| Usuarios individuales | Sí — pero API credits son separados de web app credits |
| Sentido en STACK | Sí — pero limitado |
| Complejidad técnica | Media |
| Riesgo de seguridad | Bajo |
| Limitaciones | Web app credits y API credits son completamente separados. No hay endpoint de balance. |
| URL docs | https://docs.dev.runwayml.com/guides/pricing/ |
| Recomendación | **INTEGRATE_LATER** |

---

### 3.10 — Cursor

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Pro ($20/mo), Teams ($40/seat/mo), Enterprise |
| Tipo de cuenta | Individual, Team |
| API Oficial | Sí — Admin API y Analytics API (Enterprise only) |
| Endpoint | `/teams/daily-usage-data`, `/teams/spend`, `/teams/filtered-usage-events` |
| Datos disponibles | Líneas agregadas, completions, chat requests, model usage, spend per user, tokens |
| Autenticación | API Key (HTTP Basic) — Enterprise teams only |
| Usuarios individuales | No — solo Enterprise teams |
| Sentido en STACK | Parcial — solo para teams/enterprise |
| Complejidad técnica | Media |
| Riesgo de seguridad | Bajo — API key scoped |
| Limitaciones | **Enterprise only**. No funciona para usuarios Pro individuales. Endpoints no oficiales del dashboard requieren cookies de sesión. |
| URL docs | https://cursor.com/docs/api |
| Recomendación | **TEAM_ONLY** |

---

### 3.11 — Windsurf (Codeium)

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Pro ($20/mo), Teams ($40/seat/mo), Max ($200/mo), Enterprise |
| Tipo de cuenta | Individual, Team |
| API Oficial | Sí — Enterprise API (service key) |
| Endpoint | `/GetTeamCreditBalance`, `/GetUsageConfig`, `/Analytics`, `/CascadeAnalytics` |
| Datos disponibles | Credit balance, usage config, analytics por usuario |
| Autenticación | Service Key (in request body) |
| Usuarios individuales | No — Enterprise only |
| Sentido en STACK | Parcial — solo Enterprise |
| Complejidad técnica | Media |
| Riesgo de seguridad | Bajo — service key scoped |
| Limitaciones | **Enterprise only**. No funciona para Pro individual. |
| URL docs | https://docs.windsurf.com/windsurf/accounts/api-reference/api-introduction |
| Recomendación | **TEAM_ONLY** |

---

### 3.12 — GitHub Copilot / GitHub

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Pro ($10/mo), Pro+ ($39/mo), Business ($19/seat/mo), Enterprise ($39/seat/mo) |
| Tipo de cuenta | Individual, Organization |
| API Oficial | Sí — Billing API + Copilot SDK |
| Endpoint | `GET /user/marketplace_purchases`, `GET /organizations/{org}/settings/billing/premium_request/usage`, Copilot SDK `account.getQuota` |
| Datos disponibles | Plan activo, premium requests usados/restantes, tokens, costo |
| Autenticación | OAuth token o Personal Access Token |
| Scopes | `user`, `admin:org` (para orgs) |
| Usuarios individuales | Sí — para compras personales (marketplace_purchases) |
| Sentido en STACK | Sí — premium requests tracking es muy útil |
| Complejidad técnica | Media |
| Riesgo de seguridad | Medio — token con scope `user` da acceso amplio |
| Limitaciones | Para orgs requiere admin. Para individuales funciona con PAT. |
| URL docs | https://docs.github.com/en/rest/billing/usage |
| Recomendación | **INTEGRATE_LATER** |

---

### 3.13 — v0 (Vercel)

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Premium ($20/mo), Team ($30/seat/mo) |
| Tipo de cuenta | Individual, Team |
| API Oficial | Sí — v0 SDK |
| Endpoint | `v0.user.getBilling()`, `v0.user.getPlan()`, Usage Report API |
| Datos disponibles | Plan, credits, usage por chat/message, costo |
| Autenticación | API Key (Bearer) |
| Usuarios individuales | Sí |
| Sentido en STACK | Sí — útil para usuarios de v0 |
| Complejidad técnica | Baja |
| Riesgo de seguridad | Bajo |
| Limitaciones | Credits expiran tras 1 año si comprados |
| URL docs | https://v0.app/docs/api/platform/packages/v0-sdk |
| Recomendación | **INTEGRATE_LATER** |

---

### 3.14 — Groq

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Developer (custom), Enterprise |
| Tipo de cuenta | Individual |
| API Oficial | Parcial — no hay endpoint público de billing/usage |
| Endpoint | Rate limit headers en responses. Dashboard tiene Usage pero no API. |
| Datos disponibles | Rate limits en headers (requests/tokens restantes), no billing |
| Autenticación | API Key |
| Usuarios individuales | Sí |
| Sentido en STACK | Parcial — solo rate limits, no costos |
| Complejidad técnica | Alta — requiere parsing de headers, no hay endpoint de billing |
| Riesgo de seguridad | Bajo |
| Limitaciones | Sin endpoint de billing/usage/balance. Solo dashboard. |
| URL docs | https://console.groq.com/docs/api-reference |
| Recomendación | **RESEARCH_MORE** |

---

### 3.15 — HuggingFace

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, PRO ($9/mo), Team ($20/seat/mo), Enterprise ($50/seat/mo) |
| Tipo de cuenta | Individual, Organization |
| API Oficial | Sí — pero billing es dashboard-only |
| Endpoint | Inference Providers usage breakdown en settings. No hay API pública de balance. |
| Datos disponibles | Usage por modelo/proveedor (dashboard), credits mensuales |
| Autenticación | User Access Token |
| Usuarios individuales | Sí |
| Sentido en STACK | Parcial — sin endpoint de balance programático |
| Complejidad técnica | Alta |
| Riesgo de seguridad | Bajo |
| Limitaciones | Sin API de billing. Todo es dashboard. |
| URL docs | https://huggingface.co/docs/inference-providers/main/pricing |
| Recomendación | **INTEGRATE_LATER** (esperar API de billing) |

---

### 3.16 — xAI (Grok API)

| Campo | Valor |
|-------|-------|
| Producto/Plan | Pay-as-you-go (prepaid credits) |
| Tipo de cuenta | Individual, Team |
| API Oficial | Parcial — endpoint de management no documentado |
| Endpoint | `GET https://management-api.x.ai/v1/billing/teams/{teamId}/prepaid/balance` |
| Datos disponibles | Prepaid balance, ledger de PURCHASE/SPEND, timestamps |
| Autenticación | Management Key (separada de inference key, no puede gastar) |
| Usuarios individuales | Sí — cualquier usuario con prepaid top-up tiene teamId |
| Sentido en STACK | Sí — balance y gastos |
| Complejidad técnica | Media |
| Riesgo de seguridad | Bajo — management key es read-only |
| Limitaciones | Endpoint no documentado oficialmente. Puede cambiar sin aviso. |
| Recomendación | **INTEGRATE_LATER** (riesgo de estabilidad) |

---

### 3.17 — Fireworks AI

| Campo | Valor |
|-------|-------|
| Producto/Plan | Pay-as-you-go |
| Tipo de cuenta | Individual |
| API Oficial | Sí — similar a OpenAI/Together |
| Endpoint | Dashboard billing. API de inference con costos en respuesta. |
| Datos disponibles | Costo por request (en respuesta), no hay endpoint de balance público |
| Autenticación | API Key |
| Usuarios individuales | Sí |
| Sentido en STACK | Parcial |
| Complejidad técnica | Media |
| Riesgo de seguridad | Bajo |
| Limitaciones | Sin endpoint público de balance |
| Recomendación | **INTEGRATE_LATER** |

---

### 3.18 — Descript

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Hobby, Pro, Business |
| API Oficial | Sí — Descript API |
| Endpoint | API de edición/procesamiento. Jobs consumen AI credits y media minutes. |
| Datos disponibles | `ai_credits_used` por job. No hay endpoint de balance. |
| Autenticación | Personal API Token (Bearer) |
| Usuarios individuales | Sí — paying users |
| Sentido en STACK | Parcial — credits por job, no balance global |
| Complejidad técnica | Alta |
| Riesgo de seguridad | Medio — token hereda permisos del usuario |
| Limitaciones | Sin endpoint de balance. Token consume credits si se usa. |
| URL docs | https://dev-docs.descriptapi.com/ |
| Recomendación | **RESEARCH_MORE** |

---

### 3.19 — OpusClip

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Pro (Beta), Max, Business |
| API Oficial | Sí |
| Endpoint | API de creación de clips. Credits visibles en dashboard. |
| Datos disponibles | Credits restantes (dashboard), consumo por video (1 credit = 1 min) |
| Autenticación | API Key |
| Usuarios individuales | Sí — Pro/Max/Business |
| Sentido en STACK | Parcial — sin endpoint de balance |
| Complejidad técnica | Media |
| Riesgo de seguridad | Bajo |
| Limitaciones | Sin endpoint de balance. 900 credits/mes cap en API. |
| URL docs | https://help.opus.pro/api-reference/overview |
| Recomendación | **RESEARCH_MORE** |

---

### 3.20 — Spotify

| Campo | Valor |
|-------|-------|
| Producto/Plan | Free, Premium Individual/Duo/Family/Student |
| API Oficial | Sí — Web API |
| Endpoint | `GET /me` con scope `user-read-private` |
| Datos disponibles | `product: "premium" | "free"` — solo eso |
| Autenticación | OAuth2 |
| Usuarios individuales | Sí |
| Sentido en STACK | Muy limitado — solo sabe si es premium, no plan/precio/renovación |
| Complejidad técnica | Baja |
| Riesgo de seguridad | Bajo |
| Limitaciones | No devuelve plan, precio, fecha de renovación. No se puede gestionar suscripción. |
| URL docs | https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile |
| Recomendación | **DO_NOT_INTEGRATE** (ROI muy bajo) |

---

### 3.21–3.69 — Proveedores sin API viable

Los siguientes proveedores **no tienen API pública** para consultar estado de suscripción, consumo o billing desde un tercero:

| Provider | Razón |
|----------|-------|
| Netflix | Sin API pública. Solo herramientas no oficiales (cookies). |
| Disney+ | Sin API pública. |
| YouTube Premium | Payments Reseller API es solo para partners revendedores. |
| Google One | Solo partners revendedores. |
| iCloud+ | Sin API pública. |
| Amazon Music | Sin API pública de suscripción. |
| NordVPN | API web no expone suscripción. |
| Midjourney | Sin API pública. Gestión solo en web. |
| Higgsfield | Sin API pública. |
| Krea | Sin API pública. |
| Kling AI | Sin API pública. |
| Pika | Sin API pública. |
| Hailuo AI | Sin API pública. |
| Suno | Sin API pública. |
| Udio | Sin API pública. |
| Lovable | Sin API pública. |
| Bolt.new | Sin API pública. |
| Devin | Sin API pública. |
| JetBrains AI | Sin API pública de billing. |
| Tabnine | Sin API pública. |
| Figma | Payments API solo dentro de plugins. |
| Canva | Monetization API solo dentro de Canva. |
| Adobe CC | VIP API solo para partners revendedores. |
| Dropbox | No expone info de plan. |
| Notion | No expone plan del workspace. |
| Envato Elements | Sin API pública. |
| Motion Array | Sin API pública. |
| Soundstripe | Sin API pública. |
| Storyblocks | Sin API pública. |
| Artlist | Sin API pública. |
| Frame.io | API de Adobe, no para individuales. |
| Riverside | Sin API pública. |
| CapCut Pro | Sin API pública. |
| Topaz Labs | Sin API pública. |
| Shutterstock | API de stock, no de suscripción. |
| Adobe Stock | API de stock, no de suscripción individual. |
| Vimeo | API limitada, no expone billing. |
| Replit | Billing en dashboard, sin API de balance. |
| Lovable | Sin API. |
| Amazon Q Developer | Requiere AWS billing (enterprise). |
| Google AI (Gemini) | Requiere GCP billing (enterprise). |
| AWS / GCP / Azure | APIs de billing requieren permisos de organización. |
| Microsoft 365 | Graph API requiere admin organizacional. |
| Apple Music | MusicKit solo iOS nativo, no backend. |
| Epidemic Sound | Partner API solo para revendedores, no individuales. |

**Todos estos proveedores son candidatos para Price Watch** (monitoreo de precios públicos) pero no para Connected Usage.

---

## 4. Price Watch Matrix

| Provider | URL Pricing | Planes identificables | Moneda | Localizado | Mensual/Anual | Promoción vs Renovación | Cambios frecuentes | Price Watch |
|----------|-------------|----------------------|--------|------------|---------------|------------------------|-------------------|-------------|
| OpenAI | openai.com/chatgpt/pricing | Sí | USD | No | Sí | No | Bajo | supported |
| Anthropic | claude.com/pricing | Sí | USD | No | Sí | No | Bajo | supported |
| OpenRouter | openrouter.ai/pricing | Sí | USD (credits) | No | N/A | N/A | Bajo | supported |
| Vercel | vercel.com/pricing | Sí | USD | No | Mensual | No | Bajo | supported |
| Cloudflare | cloudflare.com/pricing | Sí | USD | No | Mensual | No | Bajo | supported |
| ElevenLabs | elevenlabs.io/pricing | Sí | USD | No | Sí | No | Medio | supported |
| Runway | runway.com/pricing | Sí | USD | No | Sí | No | Medio | supported |
| Midjourney | midjourney.com/pricing | Sí | USD | No | Sí | No | Bajo | supported |
| GitHub Copilot | github.com/features/copilot | Sí | USD | No | Sí | No | Medio | supported |
| Cursor | cursor.com/pricing | Sí | USD | No | Mensual | No | Medio | supported |
| Windsurf | windsurf.com/pricing | Sí | USD | No | Mensual | No | Medio | supported |
| v0 | v0.dev/pricing | Sí | USD (credits) | No | Sí | No | Medio | supported |
| Replit | replit.com/pricing | Sí | USD | No | Sí | No | Medio | supported |
| Replicate | replicate.com/pricing | Sí | USD | No | N/A | N/A | Bajo | supported |
| Together AI | together.ai/pricing | Sí | USD | No | N/A | N/A | Bajo | supported |
| HuggingFace | huggingface.co/pricing | Sí | USD | No | Sí | No | Bajo | supported |
| Groq | console.groq.com/docs/billing | Sí | USD | No | N/A | N/A | Bajo | supported |
| Netflix | netflix.com/pricing | Sí | Local | Sí | Sí | Sí | Alto | supported |
| Spotify | spotify.com/premium | Sí | Local | Sí | Sí | Sí | Medio | supported |
| Adobe CC | adobe.com/creativecloud/plans | Sí | Local | Sí | Sí | Sí | Medio | supported |
| Canva | canva.com/pricing | Sí | Local | Sí | Sí | Sí | Bajo | supported |
| Figma | figma.com/pricing | Sí | USD | No | Sí | No | Bajo | supported |
| Notion | notion.com/pricing | Sí | USD | No | Sí | No | Bajo | supported |
| Dropbox | dropbox.com/plans | Sí | Local | Sí | Sí | No | Bajo | supported |
| Artlist | artlist.io/pricing | Sí | USD | No | Sí | No | Bajo | supported |
| Epidemic Sound | epidemicsound.com/pricing | Sí | Local | Sí | Sí | No | Bajo | supported |

**Conclusión Price Watch:** Todos los proveedores con página de pricing pública son candidatos. Los servicios de streaming (Netflix, Spotify) tienen precios localizados y cambian con frecuencia, lo que los hace más complejos pero también más valiosos para el usuario.

---

## 5. Connected Usage Matrix

| Provider | plan_detection | usage_tracking | credit_balance | token_usage | cost_tracking | billing_cycle | overage_tracking | renewal_tracking | Individual |
|----------|---------------|----------------|-----------------|-------------|---------------|---------------|------------------|------------------|------------|
| **OpenRouter** | supported | supported | supported | supported | supported | unavailable | unavailable | unavailable | Sí |
| **OpenAI** | supported | supported | unavailable | supported | supported | supported | supported | unavailable | Sí |
| **Anthropic** | supported | supported | unavailable | supported | supported | supported | unavailable | unavailable | Sí |
| **Vercel** | supported | supported | supported | unavailable | supported | supported | supported | supported | Sí |
| **Cloudflare** | supported | supported | unavailable | unavailable | supported | supported | supported | supported | Sí |
| **ElevenLabs** | supported | supported | supported | unavailable | supported | supported | supported | supported | Sí |
| **GitHub Copilot** | supported | supported | unavailable | supported | supported | supported | supported | unavailable | Sí |
| **v0** | supported | supported | supported | unavailable | supported | supported | unavailable | unavailable | Sí |
| **Cursor** | supported | supported | unavailable | supported | supported | supported | supported | unavailable | Enterprise |
| **Windsurf** | supported | supported | supported | unavailable | unavailable | supported | unavailable | unavailable | Enterprise |
| **xAI (Grok)** | unavailable | supported | supported | unavailable | supported | unavailable | unavailable | unavailable | Sí |
| **Replicate** | unavailable | research | research | unavailable | research | unavailable | unavailable | unavailable | Sí |
| **Together AI** | unavailable | research | research | unavailable | research | unavailable | unavailable | unavailable | Sí |
| **Runway** | unavailable | research | research | unavailable | unavailable | unavailable | unavailable | unavailable | Sí |
| **Groq** | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | Sí |
| **HuggingFace** | supported | research | research | unavailable | research | supported | unavailable | supported | Sí |
| **Spotify** | supported | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | Sí |
| **Netflix** | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | Sí |

---

## 6. Ranking Top 15

| Rank | Provider | Popularidad | Usuarios STACK potenciales | Utilidad del dato | Individual | Facilidad auth | Seguridad | Estabilidad API | Documentación | Complejidad | Valor diferencial | Score |
|------|----------|-------------|---------------------------|-------------------|------------|----------------|-----------|-----------------|---------------|-------------|-------------------|-------|
| 1 | **OpenRouter** | Alta | Alto | Excelente | Sí | Baja | Bajo | Alta | Excelente | Baja | Muy alto | 95 |
| 2 | **OpenAI** | Muy alta | Alto | Excelente | Sí | Baja | Bajo | Alta | Excelente | Baja | Muy alto | 93 |
| 3 | **Anthropic** | Muy alta | Alto | Excelente | Sí | Baja | Bajo | Alta | Excelente | Baja | Muy alto | 92 |
| 4 | **Vercel** | Alta | Medio | Muy bueno | Sí | Media | Bajo | Alta | Buena | Media | Alto | 85 |
| 5 | **Cloudflare** | Alta | Medio | Muy bueno | Sí | Media | Bajo | Alta | Buena | Media | Alto | 84 |
| 6 | **ElevenLabs** | Media | Medio | Excelente | Sí | Baja | Bajo | Alta | Excelente | Baja | Muy alto | 82 |
| 7 | **GitHub Copilot** | Alta | Medio | Muy bueno | Sí | Media | Medio | Alta | Excelente | Media | Alto | 78 |
| 8 | **v0** | Media | Bajo-Medio | Bueno | Sí | Baja | Bajo | Alta | Buena | Baja | Alto | 75 |
| 9 | **xAI (Grok)** | Media | Medio | Bueno | Sí | Media | Bajo | Media | Pobre | Media | Medio | 68 |
| 10 | **Replicate** | Media | Medio | Bueno | Sí | Baja | Bajo | Alta | Buena | Media | Medio | 65 |
| 11 | **Together AI** | Media | Bajo-Medio | Bueno | Sí | Baja | Bajo | Alta | Buena | Media | Medio | 63 |
| 12 | **HuggingFace** | Media | Bajo | Medio | Sí | Media | Bajo | Alta | Buena | Alta | Medio | 58 |
| 13 | **Cursor** | Alta | Medio | Excelente | No (Enterprise) | Media | Bajo | Media | Buena | Media | Alto (teams) | 55 |
| 14 | **Windsurf** | Media | Medio | Bueno | No (Enterprise) | Media | Bajo | Media | Buena | Media | Medio (teams) | 52 |
| 15 | **Runway** | Media | Bajo | Medio | Sí | Baja | Bajo | Media | Buena | Media | Medio | 48 |

---

## 7. Security Assessment

### Principios

1. **Nunca pedir contraseñas del usuario.** Todas las integraciones usan API keys, OAuth tokens o service keys.
2. **Priorizar scopes read-only.** Cada integración debe usar el scope mínimo necesario.
3. **Los tokens se guardan en backend**, nunca en el cliente. El app móvil habla con el backend de STACK, que guarda los tokens encrypted at rest.
4. **Token rotation.** Los tokens deben poder rotarse y revocarse desde STACK.
5. **OAuth refresh tokens.** Para proveedores con OAuth, guardar refresh token y manejar expiración automáticamente.
6. **Disconnect.** El usuario puede desconectar un proveedor en cualquier momento, lo que revoca el token.

### Evaluación por proveedor

| Provider | Credenciales | Scope | Read-only posible | Riesgo | Notas |
|----------|-------------|-------|-------------------|--------|-------|
| OpenRouter | API Key (Bearer) | Por key | Sí | Bajo | Management key no puede gastar, solo leer |
| OpenAI | Admin Key | Admin read | Sí | Bajo | Admin Key separada de inference key |
| Anthropic | Admin Key | Admin read | Sí | Bajo | `sk-ant-admin...` no permite inferencia |
| Vercel | API Token | Billing Read | Sí | Bajo | Token scoped a billing |
| Cloudflare | API Token | Billing Read | Sí | Bajo | Token scoped a billing read |
| ElevenLabs | API Key | Default | No | Medio | API key da acceso a inferencia también. No hay scoped read-only. |
| GitHub | PAT/OAuth | `user` o `admin:org` | Parcial | Medio | Scope `user` es amplio. Para individuales es lo único disponible. |
| v0 | API Key | Default | Sí | Bajo | |
| Cursor | API Key (Basic Auth) | Enterprise | Sí | Bajo | Enterprise only |
| Windsurf | Service Key | Enterprise | Sí | Bajo | Enterprise only |
| xAI | Management Key | Read billing | Sí | Bajo | Separada de inference key |

### Integraciones con riesgo elevado

- **ElevenLabs**: API key da acceso a inferencia (puede consumir credits). No hay scoped read-only key. **Mitigación**: guardar key en backend, nunca exponer al cliente, y advertir al usuario.
- **GitHub Copilot**: PAT con scope `user` da acceso amplio a la cuenta. **Mitigación**: usar OAuth con scopes mínimos cuando sea posible, o PAT fine-grained.
- **Cursor/Windsurf**: Enterprise only, no aplicable a usuarios individuales. No integrar en V1.

### Información que nunca debe guardarse en el cliente

- API keys de cualquier proveedor
- OAuth tokens (access o refresh)
- Session cookies
- Credenciales de servicio

**Arquitectura:** El cliente STACK habla con el backend STACK. El backend guarda tokens encrypted at rest y hace las llamadas a las APIs de proveedores. El cliente nunca toca las credenciales.

---

## 8. Arquitectura Propuesta

### Visión

Un sistema de adapters donde cada proveedor implementa una interfaz común. El core de STACK no necesita saber qué proveedor es — solo llama a los métodos del adapter.

### Estructura

```
src/services/providers/
  types.ts              # Interfaces y tipos compartidos
  registry.ts           # Registro de providers disponibles
  elevenlabs/
    adapter.ts
    types.ts
  github/
    adapter.ts
    types.ts
  openrouter/
    adapter.ts
    types.ts
  openai/
    adapter.ts
    types.ts
  anthropic/
    adapter.ts
    types.ts
  vercel/
    adapter.ts
    types.ts
  cloudflare/
    adapter.ts
    types.ts
```

### Interfaz base

```typescript
interface ProviderCapabilities {
  price_watch: CapabilityStatus;
  plan_detection: CapabilityStatus;
  usage_tracking: CapabilityStatus;
  credit_balance: CapabilityStatus;
  token_usage: CapabilityStatus;
  cost_tracking: CapabilityStatus;
  billing_cycle: CapabilityStatus;
  overage_tracking: CapabilityStatus;
  renewal_tracking: CapabilityStatus;
}

type CapabilityStatus =
  | "supported"
  | "individual_only"
  | "team_only"
  | "enterprise_only"
  | "api_account_only"
  | "research"
  | "unavailable";

interface StackProviderAdapter {
  providerId: string;
  capabilities: ProviderCapabilities;

  connect(credentials: ProviderCredentials): Promise<ConnectionResult>;
  disconnect(): Promise<void>;

  getPlan?(): Promise<PlanInfo | null>;
  getUsage?(): Promise<UsageInfo | null>;
  getCost?(): Promise<CostInfo | null>;
  getBillingCycle?(): Promise<BillingCycle | null>;
  getCreditBalance?(): Promise<CreditBalance | null>;
}

interface PlanInfo {
  planName: string;
  status: "active" | "trialing" | "canceled" | "expired" | "free";
}

interface UsageInfo {
  used: number;
  limit: number | null;
  remaining: number | null;
  unit: string;
}

interface CostInfo {
  amount: number;
  currency: string;
  period: "daily" | "weekly" | "monthly" | "total";
}

interface BillingCycle {
  start: string;
  end: string;
}

interface CreditBalance {
  total: number;
  used: number;
  remaining: number;
  currency: string;
}

interface ConnectionResult {
  status: "connected" | "error";
  message?: string;
}
```

### Respuesta normalizada

```json
{
  "provider": "openrouter",
  "connectionStatus": "connected",
  "billingCycle": null,
  "usage": {
    "used": 25.5,
    "limit": 100,
    "remaining": 74.5,
    "unit": "credits"
  },
  "cost": {
    "amount": 25.5,
    "currency": "USD"
  }
}
```

Si un proveedor no entrega una métrica, devolver `null`. Nunca estimarla ni inventarla.

### Flujo de conexión

1. Usuario selecciona proveedor en STACK
2. STACK muestra qué credenciales necesita (API key, OAuth, etc.)
3. Usuario ingresa credenciales (o hace OAuth)
4. Backend de STACK valida y guarda encrypted
5. Backend llama al adapter correspondiente
6. Adapter normaliza la respuesta
7. STACK muestra datos al usuario

### Price Watch (separado de Connected Usage)

Price Watch no requiere credenciales del usuario. Es un servicio backend que:

1. Scraping ético de páginas de pricing públicas (con rate limiting respetuoso)
2. O usa APIs de pricing si existen
3. Compara con precio anterior
4. Notifica al usuario si detecta cambio

---

## 9. Recomendaciones V1 / V2

### A — Integrar primero (V1)

**APIs estables + buen dato + usuario individual + seguridad razonable.**

| Provider | Razón |
|----------|-------|
| OpenRouter | Endpoint simple, credits balance + usage en una llamada, individual, read-only |
| OpenAI | Admin Key read-only, usage/cost detallado, altísima adopción |
| Anthropic | Igual que OpenAI, Admin Key read-only |
| Vercel | Billing API en FOCUS format, individual (Pro), read-only |
| Cloudflare | Billable Usage API, individual (self-serve), read-only |

### B — Segunda etapa (V2)

**Buenas integraciones pero mayor complejidad o limitaciones.**

| Provider | Razón |
|----------|-------|
| ElevenLabs | Excelente dato pero API key no es read-only |
| GitHub Copilot | Premium requests tracking útil pero scope amplio |
| v0 | SDK con billing info, adopción creciente |
| Replicate | Sin endpoint de balance, requiere agregación manual |
| Together AI | Sin endpoint público de balance |
| HuggingFace | Sin API de billing, dashboard only |
| xAI (Grok) | Endpoint no documentado, inestable |
| Fireworks AI | Similar a Together, sin balance endpoint |

### C — Enterprise / Teams

**Funcionan, pero no sirven inicialmente para el usuario consumer típico de STACK.**

| Provider | Razón |
|----------|-------|
| Cursor | Admin API es Enterprise only |
| Windsurf | Enterprise API es Enterprise only |
| AWS / GCP / Azure | Requieren permisos de organización |
| Microsoft 365 | Requiere admin organizacional |
| Amazon Q Developer | Requiere AWS billing |

### D — Solo Price Watch

**No ofrecen conexión útil, pero STACK puede seguir sus precios y renovaciones.**

Todos los proveedores marcados como DO_NOT_INTEGRATE para Connected Usage son candidatos para Price Watch. Esto incluye: Netflix, Spotify, Disney+, Midjourney, Adobe CC, Canva, Figma, Notion, Dropbox, y todos los servicios de streaming/creative sin API.

---

## 10. Links a Documentación Oficial

| Provider | URL Docs |
|----------|----------|
| OpenAI Usage API | https://developers.openai.com/cookbook/examples/completions_usage_api |
| Anthropic Admin API | https://platform.claude.com/cookbook/observability-usage-cost-api |
| OpenRouter Credits | https://openrouter.ai/docs/api/api-reference/credits/get-credits |
| OpenRouter Key Info | https://openrouter.ai/docs/api/api-reference/api-keys/get-current-api-key |
| Vercel Billing | https://docs.vercel.com/docs/rest-api/reference/endpoints/billing/list-focus-billing-charges |
| Cloudflare Usage | https://developers.cloudflare.com/api/resources/billing/subresources/usage/ |
| Cloudflare Billable Usage | https://developers.cloudflare.com/billing/manage/billable-usage/ |
| ElevenLabs Subscription | https://elevenlabs.io/docs/api-reference/user/subscription/get |
| ElevenLabs User Info | https://elevenlabs.io/docs/api-reference/user/get |
| GitHub Billing | https://docs.github.com/en/rest/billing/usage |
| GitHub Copilot SDK | https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/usage-and-billing |
| Cursor API | https://cursor.com/docs/api |
| Windsurf API | https://docs.windsurf.com/windsurf/accounts/api-reference/api-introduction |
| v0 SDK | https://v0.app/docs/api/platform/packages/v0-sdk |
| Replicate Billing | https://replicate.com/docs/topics/billing |
| Together AI Billing | https://docs.together.ai/docs/billing-usage-limits |
| HuggingFace Pricing | https://huggingface.co/docs/inference-providers/main/pricing |
| Groq API Reference | https://console.groq.com/docs/api-reference |
| Runway API Pricing | https://docs.dev.runwayml.com/guides/pricing/ |
| Runway Credits | https://help.runwayml.com/hc/en-us/articles/15124877443219 |
| Descript API | https://dev-docs.descriptapi.com/ |
| OpusClip API | https://help.opus.pro/api-reference/overview |
| Spotify Web API | https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile |
| Midjourney Plans | https://docs.midjourney.com/hc/en-us/articles/27870484040333 |
| Replit Billing | https://replit.mintlify.app/category/billing |
| GitHub Marketplace | https://docs.github.com/en/rest/apps/marketplace |

---

## Próximos pasos sugeridos

1. **Seleccionar 3-5 integraciones piloto** antes de construir adapters en escala
2. **Construir el sistema de adapters** con OpenRouter como primera implementación (más simple)
3. **Implementar Price Watch** como servicio backend separado
4. **Diseñar UX de conexión** — cómo el usuario conecta un proveedor y ve sus datos
5. **Evaluar Firebase** como backend para guardar tokens encrypted at rest
