# STACK — Modelo de Datos

## Reglas generales

- **No usar números flotantes para dinero**. Todos los importes se guardan en la unidad menor de cada moneda (ej: centavos).
- **Conservar siempre el valor y la moneda originales**.
- Si se muestra una conversión, guardar también: tipo de cambio, fecha del tipo de cambio, fuente, importe convertido.
- No reemplazar el valor original por el convertido.
- Las tarjetas son únicamente alias. No se guardan datos sensibles.

## Tablas

### `currencies`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `code` | text PK | Código ISO 4217 (ej: USD, ARS) |
| `symbol` | text | Símbolo ($, US$, $) |
| `name` | text | Nombre legible |
| `minor_unit` | integer | Decimales de la unidad menor (default: 2) |

### `categories`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer PK | Autoincremental |
| `name` | text | Nombre (Streaming, Productividad, etc.) |
| `icon` | text? | Emoji o nombre de icono |
| `color` | text? | Color identificador (hex) |

### `providers`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer PK | Autoincremental |
| `name` | text | Nombre del proveedor |
| `logo_url` | text? | URL del logo |
| `website_url` | text? | Link oficial |
| `category_id` | integer FK → categories | Categoría sugerida |
| `is_custom` | boolean | true si fue creado por el usuario |
| `created_at` | integer | Timestamp Unix |

### `plans`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer PK | Autoincremental |
| `provider_id` | integer FK → providers | Proveedor al que pertenece |
| `name` | text | Nombre del plan (Básico, Premium, etc.) |
| `frequency` | text | monthly, yearly, weekly, quarterly, semiannual |
| `suggested_price_minor` | integer | Precio sugerido en unidad menor |
| `currency_code` | text FK → currencies | Moneda del precio sugerido |
| `credits_included` | integer? | Créditos incluidos en el plan |
| `is_suggested` | boolean | true si es un plan sugerido del catálogo |
| `created_at` | integer | Timestamp Unix |

### `cards`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer PK | Autoincremental |
| `alias` | text | Nombre de fantasía (ej: "Visa Galicia") |
| `bank` | text? | Banco opcional |
| `brand` | text? | Marca opcional (Visa, Mastercard, etc.) |
| `last_four` | text? | Últimos cuatro dígitos opcionales |
| `closing_day` | integer? | Día de cierre opcional |
| `color` | text? | Color identificador (hex) |
| `created_at` | integer | Timestamp Unix |

**Nunca guardar**: número completo, CVV, fecha de vencimiento real, tokens bancarios, información de pago.

### `subscriptions`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer PK | Autoincremental |
| `provider_id` | integer FK? → providers | Proveedor (si es del catálogo) |
| `custom_name` | text? | Nombre personalizado (si no es del catálogo) |
| `plan_id` | integer FK? → plans | Plan (si es del catálogo) |
| `custom_plan_name` | text? | Nombre de plan personalizado |
| `confirmed_price_minor` | integer | Precio confirmado en unidad menor |
| `currency_code` | text FK → currencies | Moneda del precio |
| `converted_price_minor` | integer? | Precio convertido (opcional) |
| `converted_currency_code` | text FK? → currencies | Moneda convertida |
| `exchange_rate` | integer? | Tipo de cambio usado |
| `exchange_rate_date` | integer? | Fecha del tipo de cambio |
| `exchange_rate_source` | text? | Fuente del tipo de cambio |
| `frequency` | text | monthly, yearly, weekly, quarterly, semiannual |
| `next_renewal_date` | integer? | Próxima renovación (timestamp) |
| `start_date` | integer? | Fecha de inicio |
| `category_id` | integer FK? → categories | Categoría |
| `card_id` | integer FK? → cards | Tarjeta alias |
| `credits_included` | integer? | Créditos incluidos |
| `data_origin` | text | suggested, manual, screenshot, connected |
| `is_active` | boolean | true si está activa |
| `notes` | text? | Notas del usuario |
| `created_at` | integer | Timestamp Unix |
| `updated_at` | integer | Timestamp Unix |

### `extra_purchases`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer PK | Autoincremental |
| `subscription_id` | integer FK → subscriptions | Suscripción asociada |
| `description` | text | Descripción de la compra |
| `amount_minor` | integer | Importe en unidad menor |
| `currency_code` | text FK → currencies | Moneda |
| `purchased_at` | integer | Fecha de compra (timestamp) |
| `created_at` | integer | Timestamp Unix |

### `monthly_snapshots` (premium)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer PK | Autoincremental |
| `month_year` | text | Ej: "2026-08" |
| `total_monthly_minor` | integer | Total mensual en unidad menor |
| `currency_code` | text FK → currencies | Moneda |
| `subscription_count` | integer | Cantidad de suscripciones |
| `snapshot_data` | text? | JSON con detalle del snapshot |
| `created_at` | integer | Timestamp Unix |

### `settings`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `key` | text PK | Clave |
| `value` | text | Valor (serializado) |

## Origen de datos (`data_origin`)

Cada suscripción registra el origen de sus datos:

- `suggested`: cargada desde el catálogo con precio sugerido
- `manual`: cargada manualmente por el usuario
- `screenshot`: cargada con asistencia de captura
- `connected`: cargada desde una integración (post-MVP)
