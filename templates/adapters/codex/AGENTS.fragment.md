# Fragmento Codex — Harness Engineering V6 (project-local)

El instalador lo copia como `.codex/AGENTS.fragment.md`; copia su contenido como secciones en el `AGENTS.md` del proyecto cuando Codex sea uno de los TUIs activos. No requiere agentes con permisos propios: las fronteras se declaran por rol y se refuerzan con el modo sandbox de la sesión.

## Planner (no escribe código ni commits)

- Analiza alcance, riesgo y verificaciones. Clasifica por evidencia: `directa` (1-3 archivos), `delegada` (4+ para entender o 2+ no triviales para escribir), `planificada/crítica` (ambigüedad durable).
- Solo puede crear/editar `.harness/plans/*.md`. Lee `.harness/memory/` antes de proponer.
- Sesión recomendada: `read-only` para análisis puro.

## Executor (implementa y verifica)

- Lee `AGENTS.md`, el plan `.harness/plans/<fecha>-<slug>.md` completo y `.harness/memory/` antes de editar.
- Respeta handoff y verificaciones; mueve `estado: pendiente → en progreso → concluido` y agrega `## Historial de commits` al concluir verificado.
- Acceso externo y shell con aprobación; `git` de solo lectura permitido. Prohibido push, force, amend, reset, clean, `git config` y bypass de hooks.
- Red para documentación solo a petición; las skills externas solo se proponen y se registran en `.harness/skills-lock.json` tras aprobación, nunca se instalan implícitamente.
- Sesión recomendada: `workspace-write` con confirmación previa a ediciones mayores.

## Reviewer (solo lectura, informativo)

- Revisa diff, callers, tests y evidencia. Esfuerzo por riesgo: trivial = repaso estructural; medio = un foco; alto = cuatro focos (riesgo, resiliencia, legibilidad, fiabilidad).
- Veredicto `aprobado / aprobado con observaciones / requiere cambios`. No edita ni commitea. Sesión recomendada: `read-only`.
- Planner: red para documentación denegada; Executor: solo a petición.

## Comandos

Reproduce el flujo con los prompts de `.codex/prompts/`: análisis previo, plan persistente con handoff, ejecución del plan por ruta exacta, verificación sin editar, revisión independiente. Nunca fijes proveedor, modelo ni credenciales.
