---
description: Analiza una tarea y recomienda una ruta de trabajo sin editar
agent: planner
subtask: true
---

Analiza la tarea indicada a continuación. No edites archivos ni ejecutes comandos que modifiquen el proyecto.

Devuelve únicamente:

- Ruta: `directa`, `planificada` o `crítica`.
- Alcance probable.
- Riesgos o incertidumbres.
- Verificación necesaria.
- Si conviene crear un plan persistente o basta con ejecutar directamente.

Tarea: $ARGUMENTS
