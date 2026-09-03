# Ejecutar plan (Codex)

Lee el plan `.harness/plans/<ruta exacta>` completo y `.harness/memory/` antes de editar, y ejecuta su handoff en orden. Si falta la ruta, lista `.harness/plans/` priorizando `pendiente`/`en progreso` y pide aclaración si hay más de uno plausible (un plan sin frontmatter se considera `concluido`). Edita del plan solo `estado` (`pendiente` → `en progreso` al comenzar, `concluido` al terminar verificado) y la sección final `## Historial de commits` al concluir. No marques `concluido` sin verificación.

Plan:
