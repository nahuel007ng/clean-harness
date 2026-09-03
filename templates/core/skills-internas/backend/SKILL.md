---
name: backend
description: Guía cambios de servicios, APIs, jobs o persistencia sin imponer framework ni proveedor.
license: MIT
---

# Backend

- Traza la petición desde el límite de entrada hasta persistencia y efectos externos.
- Valida entradas en el límite de confianza y conserva autorización, privacidad y errores seguros.
- Considera idempotencia, concurrencia, transacciones, timeouts y reintentos cuando apliquen.
- No cambies contratos públicos sin actualizar consumidores y pruebas.
- Ejecuta tests unitarios/integración y una comprobación de migración o contrato cuando corresponda.
- Si necesitas capacidad extendida (ej. guía Postgres específica), propón la skill externa con fuente exacta y espera aprobación.
