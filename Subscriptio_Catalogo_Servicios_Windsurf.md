# STACK — Catálogo global precargado de servicios

**Especificación funcional y técnica para Windsurf**  \n**Versión:** 1.0  \n**Auditoría inicial:** 2026-08-06  \n**Servicios incluidos:** 64

> Objetivo: permitir que una persona busque un servicio, seleccione su plan y confirme el importe en pocos segundos. La complejidad de precios, regiones, créditos y consumo queda resuelta en el catálogo y en el proceso de auditoría, no en la interfaz principal.

## 1. Principio de producto

La función no intenta “adivinar” el cobro real. Ofrece una referencia oficial actualizada y obliga a confirmar el importe final cuando el precio depende de país, impuestos, promociones, cantidad de usuarios o consumo.

Flujo esperado: **buscar servicio → elegir plan → revisar datos precargados → confirmar o editar → guardar**.

## 2. Experiencia de carga

1. El usuario escribe al menos dos caracteres.
2. Se muestran coincidencias por nombre, proveedor y alias.
3. Al elegir un servicio se muestran los planes auditados y su fecha de actualización.
4. Si el plan tiene precio fijo, se precarga importe, moneda y frecuencia.
5. Si es variable, localizado o por dominio, se explica brevemente y se pide el gasto actual/estimado.
6. Antes de guardar, el usuario confirma el monto final y la próxima renovación.

Texto recomendado: `Precio de referencia oficial · actualizado el 06/08/2026. Confirmá el importe que realmente te cobran.`

## 3. Tipos de facturación

| Tipo | Comportamiento en UI | Ejemplos |
|---|---|---|
| `fixed_subscription` | Precargar precio y período; permitir editar. | ChatGPT Plus, Midjourney |
| `seat_subscription` | Pedir cantidad de usuarios; calcular total. | Slack, Notion, Figma |
| `credits_subscription / quota_subscription` | Mostrar plan, créditos/cuota y posibles excedentes. | Runway, Make, Windsurf |
| `usage_based` | No inventar mensualidad; pedir gasto actual, promedio o presupuesto. | AWS, OpenAI API, Twilio |
| `localized_subscription` | Mostrar precio de referencia y exigir confirmación. | Canva, Adobe, Microsoft 365 |
| `domain_dependent` | Pedir TLD y distinguir alta, renovación y promoción. | Namecheap, GoDaddy |
| `annual_membership / one_time` | No confundir con gasto mensual recurrente. | Apple Developer, Google Play Console |

## 4. Modelo de datos recomendado

```ts
export type BillingModel =
  | "fixed_subscription"
  | "seat_subscription"
  | "credits_subscription"
  | "quota_subscription"
  | "usage_based"
  | "localized_subscription"
  | "domain_dependent"
  | "annual_membership"
  | "one_time"
  | string;

export interface CatalogService {
  id: string;
  provider: string;
  service_name: string;
  category: string;
  subcategory: string;
  billing_model: BillingModel;
  aliases: string[];
  plans: CatalogPlan[];
  usage_rates: UsageRate[];
  source_url: string;
  source_type: "official";
  last_verified_at: string;
  audit_status: string;
  user_confirmation_required: boolean;
  regions: string;
  notes?: string;
}

export interface CatalogPlan {
  name: string;
  amount: number | null;
  currency: string;
  period: "month" | "year" | "one_time" | string;
  per_user: boolean;
  billed: "monthly" | "annual" | "one_time" | string;
  included?: string | null;
  note?: string | null;
}
```

## 5. Tablas sugeridas

- `catalog_services`: identidad, categoría, aliases, modelo de facturación y estado.
- `catalog_plans`: planes comerciales sin sobrescribir historial.
- `catalog_price_versions`: importe, moneda, región, vigencia y fuente.
- `catalog_usage_rates`: tarifas por token, evento, hora, GB, mensaje, etc.
- `catalog_audit_runs`: fecha, resultado, hash/snapshot y revisión humana.
- `user_subscriptions`: copia del dato confirmado por el usuario; nunca depender en vivo del catálogo.

## 6. Reglas de búsqueda

- Normalizar tildes, mayúsculas y puntuación.
- Buscar por `service_name`, `provider` y `aliases`.
- Priorizar `P1`, coincidencia exacta, popularidad y región del usuario.
- Mostrar máximo 8 resultados inicialmente.
- Incluir siempre `No encuentro mi servicio` para carga manual y generación de candidato para el catálogo.

## 7. Auditoría y actualización

1. Consultar únicamente páginas oficiales.
2. Guardar fecha, URL y snapshot/hash del contenido relevante.
3. Detectar cambios automáticamente, pero **no publicar cambios de precio sin revisión**.
4. Conservar historial de precios y vigencias.
5. Marcar precios promocionales con fecha de fin; no confundirlos con renovación.
6. Para precios localizados, mantener una tabla por país/moneda y usar `manual_confirmation` si no hay referencia segura.
7. Revisión sugerida: P1 cada 14 días; P2 mensual; dominios/APIs semanal si existe endpoint oficial.

## 8. Endpoints mínimos

```text
GET  /catalog/search?q=git&country=AR&currency=USD
GET  /catalog/services/:id
GET  /catalog/services/:id/plans?country=AR
POST /subscriptions/from-catalog
POST /catalog/missing-service-report
POST /admin/catalog/audit/:serviceId
```

## 9. Criterios de aceptación

- La búsqueda responde en menos de 300 ms con catálogo local/cacheado.
- Un servicio fijo puede cargarse en 3 pasos o menos.
- Ningún servicio variable recibe una mensualidad inventada.
- Todo precio muestra moneda, período, fecha de verificación y fuente.
- El usuario puede modificar cualquier dato antes de guardar.
- Un cambio futuro del catálogo no altera suscripciones ya confirmadas.
- Se soportan importes mensuales, anuales, por usuario, por uso y pagos únicos.

## 10. Orden de implementación

1. Importar el JSON seed y crear índices de búsqueda.
2. Construir búsqueda/autocomplete y selector de plan.
3. Implementar formulario dinámico según `billing_model`.
4. Guardar snapshot confirmado en `user_subscriptions`.
5. Crear panel administrativo y cola de auditoría.
6. Incorporar reportes de servicios faltantes y priorización por frecuencia.

## 11. Prompt operativo para Windsurf

```text
Implementar en STACK la función “Catálogo global precargado de servicios”.
Usar subscriptio_service_catalog_seed.json como semilla, sin convertir el catálogo en
fuente absoluta del cobro real. Crear búsqueda por nombre/proveedor/aliases, selector
de plan, precarga editable y formulario dinámico según billing_model.

Requisitos críticos:
- Mostrar fuente oficial y last_verified_at.
- Exigir confirmación del importe antes de guardar.
- Para usage_based/localized/domain_dependent no inventar mensualidad.
- Copiar el precio confirmado dentro de user_subscriptions; no guardar solo plan_id.
- Soportar mensual, anual, pago único, por usuario, créditos y uso.
- Agregar opción de carga manual y reporte de servicio faltante.
- Crear panel admin mínimo para editar servicios/planes, versionar precios y revisar cambios.
- Añadir tests unitarios para cálculo por usuarios, equivalencia anual y servicios variables.
```

## 12. Catálogo inicial auditado

Incluye 64 servicios. Los precios son referencias oficiales verificadas el 2026-08-06; pueden excluir impuestos, promociones o variaciones regionales.

### APIs y consumo

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [OpenAI API](https://developers.openai.com/api/docs/pricing) | `usage_based` | GPT-5.6 Sol input: USD 5/1M tokens; GPT-5.6 Sol output: USD 30/1M tokens; GPT-5.6 Terra input: USD 2/1M tokens | `verified_exact` |
| [Anthropic API](https://www.anthropic.com/pricing) | `usage_based` | Claude Opus 5 input: USD 5/1M tokens; Claude Opus 5 output: USD 25/1M tokens; Claude Sonnet 5 input: USD 3/1M tokens | `verified_exact` |
| [Gemini Developer API](https://ai.google.dev/gemini-api/docs/pricing) | `usage_based` | Gemini 3 input (<200k): USD 4/1M tokens; Gemini 3 output (<200k): USD 18/1M tokens; Batch input referencia: USD 0.125/1M tokens | `verified_exact` |
| [xAI API](https://x.ai/api) | `usage_based` | Grok 4.5 input: USD 2/1M tokens; Grok 4.5 output: USD 6/1M tokens; Imagen desde: USD 0.02/image | `verified_exact` |
| [Replicate](https://replicate.com/pricing) | `usage_based` | Precio variable/localizado; confirmar | `variable_official` |
| [RunPod](https://www.runpod.io/pricing) | `usage_based` | Precio variable/localizado; confirmar | `variable_official` |
| [Twilio](https://www.twilio.com/en-us/pricing) | `usage_based` | SMS/RCS EE.UU. desde: USD 0.0083/message; WhatsApp desde: USD 0.005/message; Voice receive desde: USD 0.0085/minute | `verified_exact` |

### Almacenamiento

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [Dropbox](https://www.dropbox.com/plans) | `subscription` | Basic: USD 0/mes; Plus: USD 9.99/mes; Standard: USD 15/mes/usuario; Advanced: USD 24/mes/usuario | `verified_exact` |

### Analítica y monitoreo

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [Sentry](https://sentry.io/pricing/) | `event_based` | Developer: USD 0/mes; Team: cotización/variable; Business: cotización/variable | `variable_official` |
| [Datadog](https://www.datadoghq.com/pricing/list/) | `usage_based_per_host` | Infrastructure Pro anual: USD 15/mes; Infrastructure Pro mensual: USD 18/mes; Infrastructure Enterprise anual: USD 23/mes; Infrastructure Enterprise mensual: USD 27/mes | `verified_exact` |
| [Mixpanel](https://mixpanel.com/pricing/) | `usage_based` | Free: USD 0/mes; Growth: USD 0/mes | `verified_exact` |
| [PostHog](https://posthog.com/pricing) | `usage_based` | Free: USD 0/mes; Pay-as-you-go: USD 0/mes | `verified_exact` |

### Automatización

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [Zapier](https://zapier.com/pricing) | `tasks_subscription` | Free: USD 0/mes; Professional desde: USD 19.99/mes; Team desde: USD 69/mes; Enterprise: cotización/variable | `verified_exact` |
| [Make](https://www.make.com/en/pricing) | `credits_subscription` | Free: USD 0/mes; Core: USD 12/mes; Pro: USD 21/mes; Teams: USD 38/mes | `verified_exact` |
| [n8n](https://n8n.io/pricing/) | `executions_subscription` | Community self-hosted: USD 0/mes; Starter anual: EUR 20/mes; Pro anual: EUR 50/mes; Business anual: EUR 667/mes | `verified_exact` |

### Creatividad

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [Midjourney](https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans) | `credits_subscription` | Basic: USD 10/mes; Basic anual: USD 96/año; Standard: USD 30/mes; Standard anual: USD 288/año | `verified_exact` |
| [Runway](https://runwayml.com/pricing) | `credits_subscription` | Free: USD 0/mes; Standard: USD 15/mes; Standard anual: USD 12/mes; Pro: USD 35/mes | `verified_exact` |
| [ElevenLabs](https://elevenlabs.io/pricing) | `credits_subscription` | Free: USD 0/mes; Starter: USD 6/mes; Creator: USD 22/mes; Pro: USD 99/mes | `verified_exact` |
| [Freepik / Magnific](https://www.freepik.com/pricing) | `localized_credits_subscription` | Precio variable/localizado; confirmar | `localized_manual_confirmation` |
| [Envato Elements](https://elements.envato.com/pricing) | `fixed_subscription` | Core mensual: USD 39/mes; Core anual: USD 16.5/mes; Plus mensual: USD 59/mes; Plus anual: USD 39/mes | `verified_exact` |

### Diseño

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [Canva](https://www.canva.com/pricing/) | `localized_seat_subscription` | Business: USD 20/mes/usuario | `verified_reference` |
| [Adobe Creative Cloud](https://www.adobe.com/creativecloud/plans.html) | `localized_subscription` | Precio variable/localizado; confirmar | `localized_manual_confirmation` |
| [Figma](https://www.figma.com/pricing/) | `seat_subscription_credits` | Starter: USD 0/mes; Organization Full seat: USD 55/mes/usuario; Enterprise Full seat: USD 90/mes/usuario; Enterprise Dev seat: USD 35/mes/usuario | `verified_reference` |
| [Framer](https://www.framer.com/pricing) | `hybrid_subscription_credits` | Free: USD 0/mes; Basic: USD 10/mes; Pro: USD 30/mes; Enterprise: cotización/variable | `verified_exact` |
| [Webflow](https://webflow.com/pricing) | `site_subscription` | Starter: USD 0/mes; Basic anual: USD 15/mes; Premium anual: USD 25/mes; Team: USD 2500/mes | `verified_exact` |

### Dominios y distribución

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) | `domain_dependent` | Dominios desde: USD 7.85/year | `verified_reference` |
| [Namecheap Domains](https://www.namecheap.com/domains/) | `domain_dependent` | Precio variable/localizado; confirmar | `domain_dynamic` |
| [GoDaddy Domains](https://www.godaddy.com/domains) | `domain_dependent` | Precio variable/localizado; confirmar | `domain_dynamic` |
| [Apple Developer Program](https://developer.apple.com/programs/enroll/) | `annual_membership` | Apple Developer Program: USD 99/año; Apple Developer Enterprise Program: USD 299/año | `verified_exact` |
| [Google Play Console](https://support.google.com/googleplay/android-developer/answer/6112435) | `one_time` | Registro de desarrollador: USD 25/único | `verified_exact` |

### IA y desarrollo

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [ChatGPT](https://openai.com/chatgpt/pricing/) | `fixed_subscription` | Free: USD 0/mes; Go: USD 8/mes; Plus: USD 20/mes; Pro: USD 200/mes | `verified_exact` |
| [Claude](https://claude.com/pricing) | `fixed_subscription` | Free: USD 0/mes; Pro: USD 20/mes; Pro anual: USD 200/año; Max 5x: USD 100/mes | `verified_exact` |
| [Google AI Pro / Gemini](https://one.google.com/about/google-ai-plans/) | `localized_subscription` | Google AI Pro: USD 19.99/mes | `verified_reference` |
| [Perplexity](https://www.perplexity.ai/pro) | `fixed_subscription` | Pro anual (equivalente mensual): USD 17/mes; Enterprise Pro: USD 40/mes/usuario; Enterprise Pro anual: USD 400/año/usuario; Max anual (equivalente mensual): USD 167/mes | `verified_reference` |
| [Grok / SuperGrok](https://help.x.com/en/using-x/x-premium) | `hybrid_subscription` | SuperGrok: USD 30/mes; X Premium Basic: USD 3/mes; X Premium: USD 8/mes; X Premium+: USD 40/mes | `verified_exact` |
| [GitHub Copilot](https://github.com/features/copilot/plans) | `hybrid_subscription_credits` | Free: USD 0/mes; Pro: USD 10/mes; Pro+: USD 39/mes; Max: USD 100/mes | `verified_exact` |
| [Cursor](https://cursor.com/pricing) | `fixed_subscription` | Hobby: USD 0/mes; Pro: USD 20/mes; Teams: USD 40/mes/usuario | `verified_reference` |
| [Windsurf](https://windsurf.com/pricing) | `quota_subscription` | Free: USD 0/mes; Pro: USD 20/mes; Max: USD 200/mes; Team: USD 80/mes/usuario | `verified_exact` |
| [Replit](https://replit.com/pricing) | `hybrid_subscription_credits` | Starter: USD 0/mes; Core: USD 25/mes; Core anual: USD 20/mes; Pro: USD 100/mes | `verified_exact` |
| [Bolt.new](https://bolt.new/pricing) | `credits_subscription` | Free: USD 0/mes; Pro: USD 25/mes; Teams: USD 30/mes/usuario | `verified_exact` |
| [Lovable](https://lovable.dev/pricing) | `credits_subscription` | Free: USD 0/mes; Pro: USD 25/mes; Business: USD 50/mes; Enterprise: cotización/variable | `verified_exact` |
| [GitHub](https://github.com/pricing) | `seat_subscription` | Free: USD 0/mes; Team: USD 4/mes/usuario | `verified_reference` |
| [GitLab](https://about.gitlab.com/pricing/) | `seat_subscription` | Free: USD 0/mes; Premium: USD 29/mes/usuario; Ultimate: cotización/variable | `verified_exact` |
| [Bitbucket Cloud](https://bitbucket.org/product/pricing) | `seat_subscription` | Free: USD 0/mes | `verified_plan_names_manual_price` |
| [Expo EAS](https://expo.dev/pricing) | `hybrid_subscription_usage` | Free: USD 0/mes; Starter: USD 19/mes; Production: USD 199/mes; Enterprise: cotización/variable | `verified_exact` |

### Infraestructura

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [Vercel](https://vercel.com/pricing) | `hybrid_subscription_usage` | Hobby: USD 0/mes; Pro: USD 20/mes; Enterprise: cotización/variable | `verified_exact` |
| [Netlify](https://www.netlify.com/pricing/) | `credits_subscription` | Free: USD 0/mes; Personal: USD 9/mes; Pro: USD 20/mes; Enterprise: cotización/variable | `verified_exact` |
| [Cloudflare Application Services](https://www.cloudflare.com/plans/) | `domain_subscription` | Free: USD 0/mes; Pro anual: USD 20/mes; Pro mensual: USD 25/mes; Business anual: USD 200/mes | `verified_exact` |
| [Railway](https://railway.com/pricing) | `minimum_plus_usage` | Hobby: USD 5/mes; Pro: USD 20/mes | `verified_exact` |
| [Render](https://render.com/pricing) | `workspace_subscription_usage` | Hobby: USD 0/mes; Pro: USD 25/mes; Scale: USD 499/mes; Enterprise: cotización/variable | `verified_exact` |
| [DigitalOcean](https://www.digitalocean.com/pricing) | `usage_based` | Droplets desde: USD 4/month; App Platform web desde: USD 5/month; Managed PostgreSQL desde: USD 15.15/month | `verified_exact` |
| [Google Cloud](https://cloud.google.com/pricing) | `usage_based` | Precio variable/localizado; confirmar | `variable_official` |
| [AWS](https://aws.amazon.com/pricing/) | `usage_based` | Precio variable/localizado; confirmar | `variable_official` |
| [Microsoft Azure](https://azure.microsoft.com/en-us/pricing/) | `usage_based` | Precio variable/localizado; confirmar | `variable_official` |
| [Firebase](https://firebase.google.com/pricing) | `freemium_usage` | Spark: USD 0/mes; Blaze: cotización/variable | `variable_official` |
| [Supabase](https://supabase.com/pricing) | `hybrid_subscription_usage` | Free: USD 0/mes; Pro: USD 25/mes; Team: USD 599/mes; Enterprise: cotización/variable | `verified_exact` |
| [MongoDB Atlas](https://www.mongodb.com/pricing) | `usage_based` | Free: USD 0/mes; Flex: cotización/variable | `verified_exact` |

### Trabajo

| Servicio | Modelo | Referencia precargada | Estado |
|---|---|---|---|
| [Google Workspace](https://workspace.google.com/pricing) | `localized_seat_subscription` | Business Starter: USD 7/mes/usuario | `verified_reference` |
| [Microsoft 365](https://www.microsoft.com/microsoft-365/business) | `localized_seat_subscription` | Precio variable/localizado; confirmar | `localized_manual_confirmation` |
| [Notion](https://www.notion.com/pricing) | `seat_subscription_credits` | Free: USD 0/mes; Plus: USD 10/mes/usuario; Business: USD 20/mes/usuario; Enterprise: cotización/variable | `verified_exact` |
| [Slack](https://slack.com/pricing) | `seat_subscription` | Free: USD 0/mes; Pro mensual: USD 8.75/mes/usuario; Pro anual: USD 7.25/mes/usuario; Business+ mensual: USD 18/mes/usuario | `verified_exact` |
| [Zoom Workplace](https://zoom.us/pricing) | `localized_seat_subscription` | Basic: USD 0/mes | `localized_manual_confirmation` |
| [Miro](https://miro.com/pricing/) | `seat_subscription` | Free: USD 0/mes; Starter anual: USD 8/mes/usuario | `verified_reference` |
| [Airtable](https://airtable.com/pricing) | `seat_subscription` | Free: USD 0/mes; Team anual: USD 20/mes/usuario; Business anual: USD 45/mes/usuario; Enterprise Scale: cotización/variable | `verified_exact` |

## 13. Archivos entregados

- `subscriptio_service_catalog_seed.json`: estructura completa para importación.
- `subscriptio_service_catalog_seed.csv`: versión plana para revisión o carga administrativa.
- Este documento: especificación funcional, técnica y reglas de auditoría.