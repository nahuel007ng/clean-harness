# Flujo SDD-lite (Antigravity)

Nativo de la plataforma + archivos del repo como fuente de verdad. Cubre pre-plan, plan, execute-plan, verify y review inline (este TUI no registra prompts separados).

1. Análisis previo breve sin editar: ruta `directa/delegada/planificada` con umbrales 1-3 / 4+ / ambigüedad durable. Lee `.harness/memory/` antes de proponer; no crea archivos.
2. Si es planificada: crea `.harness/plans/YYYY-MM-DD-<slug>.md` con frontmatter exacto `estado: pendiente` (válidos: `pendiente`, `en progreso`, `concluido`), objetivo, alcance, cambios, verificaciones, riesgos y handoff. Agrega `## Propuesta/## Spec/## Tareas` solo si reducen ambigüedad real. No fijes proveedor ni modelo.
3. Ejecuta el handoff en orden, mueve a `en progreso` y al concluir verificado a `concluido` + `## Historial de commits`. No marques `concluido` sin verificación.
4. Verificación sin editar (comandos exactos + resultado + limitaciones) y revisión por riesgo (estructural / un foco / cuatro focos), informativa con veredicto `aprobado / aprobado con observaciones / requiere cambios`.
