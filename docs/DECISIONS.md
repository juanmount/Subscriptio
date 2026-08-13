# STACK — Decisiones

## D001 — Expo SDK 57 + Expo Router

**Fecha**: 2026-08-05
**Decisión**: Usar Expo SDK 57 con Expo Router para navegación file-based.
**Justificación**: Expo Router es la solución oficial de Expo para navegación. SDK 57 es la versión más reciente con React Native 0.86 y React 19.

## D002 — Expo SQLite + Drizzle ORM

**Fecha**: 2026-08-05
**Decisión**: Usar Expo SQLite como base de datos local con Drizzle ORM para migraciones versionadas.
**Justificación**: Local-first es un principio del producto. Drizzle ofrece type-safety y migraciones versionadas. Expo SQLite tiene integración oficial con Drizzle.

## D003 — Importes en unidad menor (enteros)

**Fecha**: 2026-08-05
**Decisión**: Todos los importes se guardan como enteros en la unidad menor de cada moneda.
**Justificación**: Evitar errores de precisión de punto flotante. Cada moneda define su `minor_unit` (ej: 2 para USD = centavos).

## D004 — Sin login obligatorio

**Fecha**: 2026-08-05
**Decisión**: La app no requiere login para funcionar.
**Justificación**: Reducir fricción. El usuario empieza a cargar inmediatamente. Supabase se reserva para post-MVP.

## D005 — Tarjetas como alias sin datos sensibles

**Fecha**: 2026-08-05
**Decisión**: Las tarjetas son únicamente alias. Solo se guarda: nombre de fantasía, banco opcional, marca opcional, últimos cuatro dígitos opcionales, día de cierre opcional, color identificador.
**Justificación**: Seguridad y simplicidad. No se procesan pagos ni se conectan medios de pago.

## D006 — Migraciones inlined en TypeScript con clave m{idx}

**Fecha**: 2026-08-05
**Decisión**: El archivo `drizzle/migrations/index.ts` contiene el SQL inlined como string. Las claves del objeto `migrations` usan el formato `m${idx.padStart(4, "0")}` (ej: `m0000`, `m0001`), NO el tag.
**Justificación**: `tsc` no puede resolver imports de `.sql`. El migrator de drizzle-orm usa `migrations[m${entry.idx.padStart(4, '0')}]` para buscar el SQL, no el nombre del tag. Clave incorrecta genera "Missing migration: {tag}".

## D007 — ESLint flat config

**Fecha**: 2026-08-05
**Decisión**: Usar ESLint 10 con flat config manual en lugar de `eslint-config-expo`.
**Justificación**: `eslint-config-expo` no es compatible con el formato flat config de ESLint 10. Se crea una configuración mínima con `@typescript-eslint`.

## D008 — Zustand solo para estado temporal

**Fecha**: 2026-08-05
**Decisión**: Zustand se usa únicamente para estado temporal de interfaz. La base de datos local es la fuente de verdad.
**Justificación**: Mantener la arquitectura simple y local-first. Zustand maneja estados de UI (modales, sheets, filtros) pero no datos persistentes.

## Pendientes de aprobación

- **¿Confirmás el modelo de datos inicial?** (ver `docs/DATA_MODEL.md`)
- **¿Confirmás el árbol de carpetas propuesto?** (ver entrega)
- **¿Confirmás las dependencias elegidas?** (ver entrega)
- **¿Confirmás el plan de ejecución H0 y H1?** (ver `docs/ROADMAP.md`)
