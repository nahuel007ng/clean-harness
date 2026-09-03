---
description: Analiza una tarea y recomienda una ruta de trabajo sin editar
agent: planner
subtask: true
---

Analiza la tarea indicada a continuación. No edites archivos ni ejecutes comandos que modifiquen el proyecto.

Devuelve únicamente:

- Ruta: `directa`, `delegada` o `planificada/crítica` (directa = 1-3 archivos o cambio mecánico entendido; delegada = 4+ archivos para entender o 2+ no triviales para escribir; planificada = ambigüedad durable que artefactos reducirían).
- Alcance probable.
- Riesgos o incertidumbres.
- Verificación necesaria.
- Si conviene crear un plan persistente o basta con ejecutar directamente.

Si la tarea es `planificada` o `crítica`, recomienda crear un plan en `.harness/plans/`; este comando no crea archivos.

Tarea: $ARGUMENTS
