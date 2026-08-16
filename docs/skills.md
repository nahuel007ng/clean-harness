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
- `android`: `android-kotlin` y la skill oficial Android `testing-setup`.
- `android-compose`: `mobile-android-design` y `edge-to-edge`.
- `android-device`: `qa-testing-android`, solo cuando se detectan pruebas instrumentadas.
- `android-device-advanced`: `appium`, siempre explícito.
- `android-camera`: `camerax`, solo cuando se detecta CameraX.

La selección real depende del stack detectado. No se instala una skill de Next.js, Expo, PostgreSQL, Playwright o Android si el proyecto no utiliza esa tecnología. La detección solo lee archivos; no ejecuta Gradle, ADB, scripts del proyecto ni código externo.

## Comandos

Desde el repositorio del harness:

```text
node scripts/skills.mjs list
node scripts/skills.mjs show web
node scripts/skills.mjs suggest --target C:\ruta\al\proyecto
node scripts/skills.mjs install --profile web --target C:\ruta\al\proyecto
node scripts/skills.mjs install --profile web --target C:\ruta\al\proyecto --apply
node scripts/skills.mjs install --profile android --profile android-compose --target C:\ruta\al\proyecto --apply
```

`suggest` muestra evidencias y skills, pero no descarga nada. El primer comando de instalación es una vista previa. La ejecución real requiere `--apply`. Se pueden combinar perfiles y las skills repetidas se instalan una sola vez. El perfil `design-heavy` requiere además `--allow-review-required` porque `ui-ux-pro-max` aparece con un fallo en Gen Agent Trust Hub a fecha 2026-08-15.

Con `--apply`, el script agrega o actualiza `.harness/skills-lock.json` en el proyecto. El lockfile conserva la fuente, estado de revisión, perfil y fecha de cada skill instalada. `doctor --project` verifica que cada entrada tenga una copia local en `.agents/skills` o `.opencode/skills`.

Para desactivar la telemetría anónima del CLI, se usa `DISABLE_TELEMETRY=1` o `DO_NOT_TRACK=1`; el script del harness lo establece por defecto.
