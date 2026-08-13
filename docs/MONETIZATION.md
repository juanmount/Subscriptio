# STACK — Monetización

## Modelo

RevenueCat preparado con productos configurables:

- `lifetime_unlock`: pago único
- `annual_tracking`: suscripción anual
- `monthly_tracking`: suscripción mensual

No se fija todavía el modelo comercial definitivo. La arquitectura debe soportar cualquiera de los tres.

## Versión gratuita

Incluye:

- Suscripciones ilimitadas
- Resumen actual (gasto mensual, proyección anual)
- Edición manual
- Totales (por categoría, por tarjeta)
- Categorías
- Tarjetas alias
- Compras extra
- Calendario actual
- Resumen compartible

## Versión desbloqueada

Incluye todo lo gratuito más:

- Snapshots mensuales
- Historial
- Comparación entre meses
- Alertas
- Check-in mensual
- Historial de créditos extra
- Cambios de precio
- Respaldo futuro

## Reglas del paywall

El paywall **no debe**:

- Bloquear la carga de suscripciones
- Limitar la cantidad de suscripciones
- Ocultar el resumen actual
- Aparecer antes de que el usuario reciba valor

El paywall **solo puede** aparecer:

- Después de que el usuario haya completado la carga
- Después de que el usuario haya visto su resumen
- Cuando el usuario intente acceder a funciones premium

## Implementación

- RevenueCat SDK integrado
- Productos configurables desde el dashboard de RevenueCat
- Estado de desbloqueo guardado localmente
- Verificación de receipt al abrir la app
- No hardcodear precios en la app
