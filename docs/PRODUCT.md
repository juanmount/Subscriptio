# STACK — Producto

## Visión

STACK es una aplicación móvil simple que permite a una persona cargar todas sus suscripciones de forma manual asistida y descubrir cuánto está gastando hoy.

## Problema

Las personas tienen múltiples suscripciones activas (streaming, productividad, gimnasio, software, etc.) y pierden visibilidad sobre el gasto total mensual y anual. No existe una forma simple de consolidar, categorizar y proyectar estos gastos.

## Solución

Una app mobile-first, local-first, sin login obligatorio, donde el usuario carga manualmente sus suscripciones con asistencia de un catálogo de proveedores y planes sugeridos. La app calcula automáticamente:

- Gasto mensual actual
- Proyección anual
- Cantidad de suscripciones
- Gasto por categoría
- Gasto por tarjeta alias
- Próximas renovaciones
- Créditos o compras adicionales
- Equivalente mensual de planes anuales

## Principios

- **Mobile-first**: diseñada para iOS y Android.
- **Local-first**: la base de datos local es la fuente de verdad.
- **Sin login obligatorio**: el usuario empieza a cargar inmediatamente.
- **Carga ilimitada gratuita**: sin límites en la versión gratuita.
- **Valor antes del paywall**: el usuario ve su resumen completo antes de cualquier paywall.
- **Carga manual asistida**: catálogo, planes sugeridos, precios de referencia, links oficiales y capturas opcionales.
- **Confirmación de precio**: todo precio sugerido debe ser confirmado por el usuario.
- **Sin datos sensibles**: no se guardan números completos de tarjetas, CVV, vencimientos ni datos bancarios.
- **Moneda original preservada**: siempre se conserva el valor y la moneda originales.
- **Origen de datos diferenciado**: suggested, manual, screenshot, connected.

## Navegación principal

1. **Inicio** — resumen con gasto mensual, proyección anual y próximas renovaciones.
2. **Suscripciones** — lista y detalle de suscripciones activas e inactivas.
3. **Calendario** — renovaciones ordenadas por fecha.
4. **Tarjetas** — gestión de tarjetas mediante alias.
5. **Más** — ajustes, sobre la app, funciones desbloqueadas.

## Supabase (post-MVP)

No se implementa en el MVP. Reservado para:

- Catálogo remoto
- Actualización de planes y precios
- Backup
- Sincronización entre dispositivos
- Procesamiento de capturas
- Integraciones oficiales
