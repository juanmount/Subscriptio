# STACK — Design System

## Referencia visual

Mockups de referencia compartidos por el producto (5 pantallas: Inicio, Suscripciones, Agregar, Calendario, Detalle).

## Principios visuales

- Simple, rápida, clara y visualmente liviana.
- Mobile-first: optimizada para iOS y Android.
- Información financiera clara y jerárquica.
- Color para categorizar, no para decorar.
- Todo el texto en español rioplatense.

## Paleta de colores

| Rol | Color | Hex |
|-----|-------|-----|
| Primario | Azul | `#0A7AFF` |
| Fondo | Blanco | `#FFFFFF` |
| Fondo secundario | Gris muy claro | `#F2F2F7` |
| Card background | Blanco con borde | `#FFFFFF` |
| Texto principal | Casi negro | `#1A1A1A` |
| Texto secundario | Gris | `#6C6C70` |
| Texto terciario | Gris claro | `#AEAEB2` |
| Éxito / verde | Verde | `#34C759` |
| Advertencia | Naranja | `#FF9500` |
| Error | Rojo | `#FF3B30` |
| Badge IA | Púrpura claro | `#EDE9FF` / texto `#6B52E0` |
| Badge Entretenimiento | Verde claro | `#E3F9E5` / texto `#2D9E40` |
| Badge Trabajo | Azul claro | `#E5F0FF` / texto `#2B6ED4` |
| Badge Otras | Gris claro | `#F0F0F0` / texto `#666666` |

## Tipografía

- Fuente: sistema nativo (SF Pro en iOS, Roboto en Android).
- Sin fuentes externas en el MVP.

| Uso | Tamaño | Peso |
|-----|--------|------|
| Título de pantalla | 28–32px | 700 (bold) |
| Título de sección | 17px | 600 (semibold) |
| Nombre de suscripción | 16px | 500 (medium) |
| Subtítulo / descripción | 13–14px | 400 (regular) |
| Caption / badge | 12px | 500 |
| Monto principal | 32–36px | 700 |
| Monto secundario | 15px | 400 |

## Espaciado

- Base unit: 4px
- Padding de pantalla: 20px horizontal
- Gap entre list items: 0 (separados por línea sutil o card)
- Gap entre secciones: 24px
- Border radius de cards: 14px
- Border radius de badges/pills: 20px (full)
- Border radius de buscador: 12px
- Border radius de botón primario: 14px

## Header

- Logo: cuadrado redondeado azul con letra "S" blanca (32×32px)
- Título "STACK" en semibold
- Ícono de campana con badge de notificación (azul) a la derecha
- Fondo: blanco, sin sombra visible

## Tab bar

5 tabs con ícono + label:
- **Inicio** — ícono casa (home)
- **Suscripciones** — ícono lista/documento
- **Calendario** — ícono calendario
- **Tarjetas** — ícono tarjeta de crédito
- **Más** — ícono tres puntos (ellipsis)

Color activo: `#0A7AFF`. Color inactivo: `#AEAEB2`.

## Componentes principales

### SubscriptionRow
- Ícono circular del proveedor (40px, fondo coloreado + letra si no hay logo)
- Nombre en medium, subtítulo en gris (precio · fecha renovación o info extra)
- Badge de categoría a la derecha
- Chevron `>`
- Altura: ~72px

### CategoryBadge
- Pill de fondo coloreado según categoría
- Texto en 12px medium
- Padding: 4px 10px

### SummaryCard
- Fondo blanco, border radius 14px, sombra suave o borde gris claro
- "Hoy gastás" caption arriba
- Monto principal grande (34px bold)
- Conversión estimada en gris debajo
- Badge de variación vs. mes anterior (verde si baja, rojo si sube)
- Row de conteo de suscripciones activas con chevron

### CategoryGrid
- Grid 2×2 (o más columnas si hay pocas categorías)
- Cada celda: ícono, nombre, porcentaje grande, barra de progreso, monto
- Fondo: card blanco

### RenewalRow
- Ícono circular del proveedor
- Nombre + fecha en subtítulo
- Monto a la derecha + chevron

### PremiumBanner
- Fondo azul muy claro (`#EFF6FF`)
- Ícono + título + descripción + botón "Activar" azul
- Solo visible si el usuario no tiene premium

### InfoGrid (en detalle)
- Grid 2×2 de celdas con ícono coloreado + label + valor
- Fondo blanco, border radius 14px

### DisclaimerBanner
- Fondo gris muy claro
- Ícono de escudo + texto de privacidad
- Sin borde, padding generoso

### PrimaryButton
- Fondo azul `#0A7AFF`, texto blanco bold
- Border radius 14px, altura 52px, ancho completo
- Texto: 16px / 600

### SearchBar
- Fondo `#F2F2F7`
- Ícono de lupa gris a la izquierda
- Placeholder en gris
- Border radius 12px

## Filtros de categoría (CategoryFilter)
- Scroll horizontal de pills
- Pill activo: borde azul + texto azul
- Pill inactivo: sin borde, texto gris
- Pill "Todas" siempre primero

## Estados de pantalla

| Estado | Tratamiento |
|--------|-------------|
| **Vacío** | Ilustración simple + texto guía + CTA primario |
| **Carga** | Skeleton de color `#F2F2F7` en las cards |
| **Éxito** | Contenido normal |
| **Error** | Mensaje descriptivo + botón "Reintentar" |
| **Offline** | Banner sutil arriba sin bloquear navegación |

## Ícono de proveedor (ProviderAvatar)

Si hay logo: imagen circular.
Si no hay logo: círculo con color generado desde el nombre + inicial en blanco.
Tamaño estándar: 40px. Tamaño en detalle: 56px.

## Formato de moneda

- Siempre mostrar código de moneda antes del monto: `USD 186,90`
- Separador decimal: coma (`,`)
- Sin símbolo `$` a menos que sea la moneda local configurada
- Conversión estimada: mostrar siempre en gris debajo del monto principal

## Formato de fechas

- Día + mes en texto corto: `12 ago`, `14 ago`
- Nunca mostrar el año salvo que sea diferente al actual
