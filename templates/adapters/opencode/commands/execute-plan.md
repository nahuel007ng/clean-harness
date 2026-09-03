---
description: Ejecuta un plan persistente en una sesión nueva
agent: executor
subtask: true
---

Lee primero el plan persistente indicado y ejecuta su handoff en orden:

`$ARGUMENTS`

La referencia debe ser una ruta como `.harness/plans/2026-08-11-hardening-sync-continuidad-series.md`. Si no se proporciona una ruta exacta, inspecciona `.harness/plans/` priorizando planes con estado `pendiente` o `en progreso` y solicita aclaración si existe más de un plan plausible.

Del archivo del plan, edita solo lo que dicta el ciclo de vida: el frontmatter `estado` (`pendiente` → `en progreso` al comenzar, `concluido` al terminar verificado) y la sección final `## Historial de commits` que se añade al concluir. No edites el resto del plan.
