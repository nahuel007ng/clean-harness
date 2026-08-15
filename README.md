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

## Estado

La primera versión contiene las plantillas y scripts base. Todavía no migra ningún proyecto real ni modifica el vault antiguo.

## Uso

Desde este repositorio:

```text
node scripts/doctor.mjs
node scripts/install.mjs --target C:\ruta\al\proyecto
node scripts/install.mjs --target C:\ruta\al\proyecto --apply
node scripts/doctor.mjs --project C:\ruta\al\proyecto
node scripts/migrate.mjs --target C:\ruta\al\proyecto --manifest C:\ruta\manifest.json
node scripts/migrate.mjs --target C:\ruta\al\proyecto --manifest C:\ruta\manifest.json --apply
```

El instalador no sobrescribe archivos existentes. La migración tampoco mueve nada sin `--apply`.

## Comandos disponibles en OpenCode

- `/pre-plan`: análisis breve y clasificación de la tarea.
- `/plan`: plan explícito para cambios no directos.
- `/verify`: ejecuta o propone verificaciones sin editar.
- `/review`: revisión independiente del diff actual.

## Skills externas

Las skills externas no se instalan automáticamente. Consulta [docs/skills.md](docs/skills.md) y usa `node scripts/skills.mjs` para revisar e instalar un perfil según el stack del proyecto.

## Fuentes de diseño

- [OpenCode agents](https://opencode.ai/docs/agents/)
- [OpenCode permissions](https://opencode.ai/docs/permissions/)
- [OpenCode skills](https://opencode.ai/docs/skills/)
- [OpenCode commands](https://opencode.ai/docs/commands/)
- [Ponytail](https://github.com/DietrichGebert/ponytail)
- [Git commit skill](https://github.com/github/awesome-copilot/blob/main/skills/git-commit/SKILL.md)
