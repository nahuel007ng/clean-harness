# Skills externas

El harness incluye solo las skills internas que definen su comportamiento: `minimal-change`, `git-commit` y las capacidades base de frontend, backend y mobile.

Las skills externas de skills.sh no se descargan automáticamente al instalar el harness. Se registran en [skills/registry.json](../skills/registry.json) y se agregan al proyecto mediante un perfil explícito.

## Por qué no se instalan todas

Una skill puede incluir instrucciones, scripts y referencias que afectan el comportamiento del agente. skills.sh ofrece auditorías y un CLI útil, pero también advierte que no garantiza la calidad o seguridad de todo lo publicado. Por eso cada skill se revisa, se instala a nivel de proyecto y se conserva como copia versionada.

OpenCode descubre skills desde `.opencode/skills`, `.agents/skills` y otras rutas compatibles del proyecto. El CLI de skills.sh puede apuntar a OpenCode con `--agent opencode`; el harness usa `--copy` para que el proyecto no dependa de una instalación global.

## Perfiles iniciales

- `web`: `frontend-design`, `vercel-react-best-practices`, `webapp-testing`.
- `design-heavy`: `frontend-design` y, solo con autorización adicional, `ui-ux-pro-max`.
- `backend`: `backend-development` como guía genérica opcional.
- `postgres`: `supabase-postgres-best-practices`.
- `testing`: `webapp-testing` y `playwright-best-practices`.
- `react-native`: `vercel-react-native-skills`.
- `expo`: React Native más `building-native-ui` y `native-data-fetching`.

La selección real depende del stack detectado. No se instala una skill de Next.js, Expo, PostgreSQL o Playwright si el proyecto no utiliza esa tecnología.

## Comandos

Desde el repositorio del harness:

```text
node scripts/skills.mjs list
node scripts/skills.mjs show web
node scripts/skills.mjs install --profile web --target C:\ruta\al\proyecto
node scripts/skills.mjs install --profile web --target C:\ruta\al\proyecto --apply
```

El primer comando de instalación es una vista previa. La ejecución real requiere `--apply`. El perfil `design-heavy` requiere además `--allow-review-required` porque `ui-ux-pro-max` aparece con un fallo en Gen Agent Trust Hub a fecha 2026-08-15.

Para desactivar la telemetría anónima del CLI, se usa `DISABLE_TELEMETRY=1` o `DO_NOT_TRACK=1`; el script del harness lo establece por defecto.
