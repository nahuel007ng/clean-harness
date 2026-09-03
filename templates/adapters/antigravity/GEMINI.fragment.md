# Fragmento Antigravity — Harness Engineering V6 (project-local)

Este TUI es solo-agente con Mission Control (subagentes built-in de Browser/Terminal). No hay subagentes custom: todas las fases corren inline en la misma conversación y la memoria file-based compensa el contexto.

El instalador genera el `GEMINI.md` inicial desde este fragmento; en proyectos ya inicializados pega este fragmento en el `GEMINI.md` del proyecto (puede convivir con el de Gemini CLI; si ambos TUIs están activos, anota cuál manda en este repo). Re-exporta las reglas de `AGENTS.md` del núcleo y agrega:

- Planner: solo escribe `.harness/plans/*.md`, lee `.harness/memory/`, nunca edita código. Red para documentación denegada. Si la plataforma ofrece planes propios para artefactos grandes, úsalos solo como espejo opcional del plan `.harness/plans/` (la fuente sigue siendo el archivo del repo).
- Executor: lee plan + memoria antes de editar, cambio mínimo verificado, commits locales atómicos, cierre verificable de procesos hijos (PID, logs, evidencia de salida; limpiar solo lo iniciado por la tarea). Red y acceso externo solo a petición; skills externas solo propuestas + registro en `.harness/skills-lock.json`.
- Reviewer: solo lectura, esfuerzo por riesgo, veredicto informativo.
- Skills: espejo project-local en `.gemini/skills/`; si la instalación solo resuelve `~/.gemini/antigravity/skills/` global, no escribir global desde el harness: documentar instalación manual y registrar en `.harness/skills-lock.json`.
- Nunca fijar proveedor, modelo ni credenciales en el puerto.
