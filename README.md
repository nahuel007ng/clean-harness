# clean-harness

Harness V5 portable para OpenCode. Está diseñado para conservar reglas, permisos y verificaciones mientras los modelos pueden cambiar.

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
node scripts/install.mjs --target C:\ruta\al\proyecto --apply
node scripts/doctor.mjs --project C:\ruta\al\proyecto
node scripts/skills.mjs suggest --target C:\ruta\al\proyecto
node scripts/skills.mjs install --profile android --profile android-compose --target C:\ruta\al\proyecto --apply
node scripts/migrate.mjs --target C:\ruta\al\proyecto --manifest C:\ruta\manifest.json
node scripts/migrate.mjs --target C:\ruta\al\proyecto --manifest C:\ruta\manifest.json --apply
```

El instalador no sobrescribe archivos existentes. La migración tampoco mueve nada sin `--apply`.

## Comandos disponibles en OpenCode

- `/pre-plan`: análisis breve y clasificación de la tarea.
- `/plan`: crea y guarda un plan persistente en `.opencode/plans/YYYY-MM-DD-<slug>.md` con estado `pendiente`.
- `/execute-plan <ruta>`: entrega un plan persistente a una sesión nueva del Executor; el estado avanza a `en progreso` y al cerrar pasa a `concluido` con el historial de commits del plan.
- `/verify`: ejecuta o propone verificaciones sin editar.
- `/review`: revisión independiente del diff actual.

## Skills externas

Las skills externas no se instalan automáticamente. Al inicializar el harness se inspeccionan los archivos del proyecto y se muestran perfiles sugeridos. Consulta [docs/skills.md](docs/skills.md), revisa la propuesta y usa `node scripts/skills.mjs install` con `--apply` para instalarla. Las instalaciones exitosas quedan registradas en `.harness/skills-lock.json`.

## Portabilidad a otros TUI

La codificación de este harness es para OpenCode, pero el núcleo (roles, planes, verificación y commits) no está atado a él. Para usar el harness en otro TUI —Codex, Claude Code, Cursor u otro— sigue [docs/tui-portabilidad.md](docs/tui-portabilidad.md): incluye el mapa de conceptos, la intención de permisos, el procedimiento de adaptación y un ejemplo con Codex.

## Fuentes de diseño

- [OpenCode agents](https://opencode.ai/docs/agents/)
- [OpenCode permissions](https://opencode.ai/docs/permissions/)
- [OpenCode skills](https://opencode.ai/docs/skills/)
- [OpenCode commands](https://opencode.ai/docs/commands/)
- [Ponytail](https://github.com/DietrichGebert/ponytail)
- [Git commit skill](https://github.com/github/awesome-copilot/blob/main/skills/git-commit/SKILL.md)
