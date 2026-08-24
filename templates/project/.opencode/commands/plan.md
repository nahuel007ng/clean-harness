---
description: Produce y guarda un plan de implementación para una tarea no directa
agent: planner
subtask: true
---

Prepara un plan breve y ejecutable para la tarea siguiente y guárdalo como un archivo Markdown persistente.

Ruta obligatoria: `.opencode/plans/YYYY-MM-DD-<slug>.md`.

Reglas del nombre:

- Usa la fecha actual en formato `YYYY-MM-DD`.
- Usa después un slug corto, descriptivo, en minúsculas y separado por guiones.
- No sobrescribas otro plan: si el nombre ya existe, agrega un sufijo breve que lo diferencie.

El archivo debe empezar con un frontmatter que declare el estado inicial:

```yaml
---
estado: pendiente
---
```

Los únicos estados válidos son `pendiente`, `en progreso` y `concluido`.

Incluye:

1. Objetivo y criterio de aceptación.
2. Archivos o zonas que deben inspeccionarse.
3. Cambios propuestos en orden.
4. Verificaciones focalizadas y completas.
5. Riesgos, supuestos y punto de revisión.
6. Handoff para una sesión nueva del Executor, incluyendo la ruta exacta del plan y el orden de ejecución.

No añadas la sección de historial: la agrega el Executor al concluir el plan.

Edita únicamente el archivo del plan dentro de `.opencode/plans/`. No edites el código ni crees commits. No fijes proveedor ni modelo.

Tarea: $ARGUMENTS
