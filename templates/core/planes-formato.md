# Formato de planes persistentes (núcleo V6)

Ruta obligatoria: `.harness/plans/YYYY-MM-DD-<slug>.md`.

## Nombre

- Fecha actual `YYYY-MM-DD` + slug corto en minúsculas con guiones, sin acentos ni caracteres especiales.
- No sobrescribir: si existe, agregar sufijo breve.

## Frontmatter

```yaml
---
estado: pendiente
---
```

Estados válidos: `pendiente`, `en progreso`, `concluido`. Un plan sin frontmatter se considera `concluido`.

## Contenido mínimo

1. Objetivo y criterios de aceptación.
2. Archivos o zonas a inspeccionar.
3. Cambios propuestos en orden.
4. Verificaciones focalizadas y completas.
5. Riesgos, supuestos y punto de revisión.
6. Handoff para una sesión nueva del Executor, con la ruta exacta del plan y el orden de ejecución.

## Secciones SDD-lite (opcionales, solo si reducen ambigüedad real)

- `## Propuesta`: intento, alcance y enfoque.
- `## Spec`: requisitos y escenarios.
- `## Tareas`: checklist ordenado de unidades entregables.

No añadas `## Historial de commits` al crear el plan. El Executor la agrega al concluir, con hash corto y mensaje, una línea por commit. No marques `concluido` sin verificación completa.
