# clean-harness

Harness V6 portable multi-TUI (OpenCode, Codex, Antigravity). Núcleo agnóstico en `templates/core/` + adapters por TUI en `templates/adapters/<tui>/`. Diseñado para conservar reglas, permisos y verificaciones mientras los modelos pueden cambiar. Solo escribe dentro del proyecto, nunca en config global.

## Principios

- Tres responsabilidades: Planner, Executor y Reviewer.
- Frontend, backend y mobile son skills, no agentes permanentes.
- El modelo se selecciona desde OpenCode; el repositorio no contiene IDs de modelos.
- `pre-plan` es opcional.
- La documentación solo se actualiza cuando el cambio deja conocimiento durable.
- Los commits automáticos son locales, atómicos y posteriores a una verificación exitosa.
- Las migraciones requieren manifiesto explícito, *dry-run* y `--apply`.
- El Planner puede leer directorios externos para analizar dependencias; el Executor requiere aprobación de sesión para acceder a ellos.

## Estado

La primera versión contiene las plantillas y scripts base. Todavía no migra ningún proyecto real ni modifica el vault antiguo.

## Uso

Desde este repositorio:

```text
node scripts/doctor.mjs
node scripts/install.mjs --target C:\ruta\al\proyecto
node scripts/install.mjs --agent codex --target C:\ruta\al\proyecto
node scripts/install.mjs --target C:\ruta\al\proyecto --apply
node scripts/doctor.mjs --project C:\ruta\al\proyecto
node scripts/skills.mjs suggest --target C:\ruta\al\proyecto
node scripts/skills.mjs record --skill <nombre> --source <url> --target C:\ruta\al\proyecto --apply
node scripts/migrate.mjs --target C:\ruta\al\proyecto --manifest C:\ruta\manifest.json
node scripts/migrate.mjs --target C:\ruta\al\proyecto --manifest C:\ruta\manifest.json --apply
```

El instalador no sobrescribe archivos existentes. La migración tampoco mueve nada sin `--apply`.

## Comandos disponibles (según adapter)

OpenCode: `/pre-plan`, `/plan`, `/execute-plan <ruta>`, `/verify`, `/review`. Codex/Antigravity: mismos flujos vía prompts del adapter (`.codex/prompts/`, `GEMINI.md` + workflows). Los planes viven en `.harness/plans/YYYY-MM-DD-<slug>.md` con estado `pendiente/en progreso/concluido` e historial de commits.

## Skills externas

Las skills externas no se instalan automáticamente (cero descargas en el port). Al inicializar el harness se inspeccionan los archivos del proyecto y se muestran perfiles sugeridos. Consulta [docs/skills.md](docs/skills.md) y [templates/core/skills-recomendadas.md](templates/core/skills-recomendadas.md), instala manualmente tras aprobar y registra con `node scripts/skills.mjs record` o `install --apply` (solo escribe el lock). Las instalaciones quedan registradas en `.harness/skills-lock.json`.

## Portabilidad y bootstrap por TUI

El núcleo (`templates/core/`: roles, planes, verificación y commits) no está atado a ningún TUI. Cada TUI vive en `templates/adapters/<tui>/`. Para portar a otro TUI, seguir `docs/portar-v6.md` (guía TUI-first con investigación previa); `docs/tui-portabilidad.md` queda como referencia V5. Para instalar desde el propio TUI destino (ej. abrir Codex en el repo y pedir el port), usar los prompts copiables de `docs/bootstrap-v6.md`: inventarían legacy, archivan V4/V5 a `.harness-archive/` con manifiesto y hacen init fresco project-local con import curado.

## Fuentes de diseño

- [OpenCode agents](https://opencode.ai/docs/agents/)
- [OpenCode permissions](https://opencode.ai/docs/permissions/)
- [OpenCode skills](https://opencode.ai/docs/skills/)
- [OpenCode commands](https://opencode.ai/docs/commands/)
- [Ponytail](https://github.com/DietrichGebert/ponytail)
- [Git commit skill](https://github.com/github/awesome-copilot/blob/main/skills/git-commit/SKILL.md)
