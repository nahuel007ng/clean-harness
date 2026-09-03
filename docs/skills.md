# Skills externas (V6: suggest + record, cero descargas)

El núcleo incluye solo las skills internas: `minimal-change`, `git-commit` y las capacidades base `frontend`, `backend`, `mobile` (routers sin framework).

## Principio

El port instala **cero skills externas** (ni siquiera `find-skills`). La tabla de candidatas vive en `templates/core/skills-recomendadas.md`. El flujo siempre es:

```text
node scripts/skills.mjs suggest --target <proyecto>   # solo lectura, sin red
# el agente propone 1-2 candidatas con fuente exacta y evidencia
# humano aprueba
# instalación manual con telemetría desactivada
# node scripts/skills.mjs record --skill <nombre> --source <url> --target <proyecto> --apply
```

## Comandos

```text
node scripts/skills.mjs list
node scripts/skills.mjs show --profile web
node scripts/skills.mjs suggest --target <proyecto>
node scripts/skills.mjs suggest --target <proyecto> --json
node scripts/skills.mjs install --profile web --target <proyecto>
node scripts/skills.mjs install --profile web --target <proyecto> --apply
node scripts/skills.mjs record --skill <nombre> --source <url> --target <proyecto> --apply
```

`install` en V6 **no descarga**: imprime los comandos manuales (`DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx skills add <fuente> --skill <nombre> --copy --yes`) y con `--apply` solo registra el lock tras tu instalación manual. `record` registra una skill individual con el mismo gate.

El perfil `design-heavy` requiere además `--allow-review-required` porque `ui-ux-pro-max` tiene un fallo de confianza a fecha 2026-08-15. `find-skills` es opcional bajo el mismo gate (auditoría Snyk en advertencia) y nunca se preinstala.

## Lockfile y verificación

Con `--apply` se escribe `.harness/skills-lock.json` (fuente, perfil, revisión, fecha). `doctor --project` verifica que cada entrada tenga copia local en `.agents/skills/` o en el espejo del adapter (`.opencode/skills`, `.codex/skills`, `.gemini/skills`). La detección solo lee archivos (máx 5000, sin ejecutar Gradle/ADB/scripts) y excluye directorios de harness y documentación.
