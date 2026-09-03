# Flujo SDD-lite (Antigravity)

Nativo de la plataforma + archivos del repo como fuente de verdad.

1. Análisis previo breve: ruta `directa/delegada/planificada` con umbrales 1-3 / 4+ / ambigüedad durable.
2. Si es planificada: crea `.harness/plans/YYYY-MM-DD-<slug>.md` con `estado: pendiente`, objetivo, alcance, cambios, verificaciones, riesgos y handoff. Agrega `## Propuesta/## Spec/## Tareas` solo si reducen ambigüedad real.
3. Ejecuta el handoff en orden, mueve a `en progreso` y al concluir verificado a `concluido` + `## Historial de commits`.
4. Revisión por riesgo (estructural / un foco / cuatro focos), informativa.
