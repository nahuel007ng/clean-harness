# Skills recomendadas (núcleo V6)

El port instala **cero skills externas**. Esta tabla es recomendación, no instalación.
Flujo: `skills suggest` (solo lectura) → el agente propone 1-2 candidatas → humano aprueba → instalación manual → `skills record --apply` escribe `.harness/skills-lock.json`.

| Perfil (`registry.json`) | Dominio | Candidata | Fuente | Cuándo | Nota de riesgo |
|---|---|---|---|---|---|
| `web` | Diseño frontend | `frontend-design` | `https://github.com/anthropics/skills` | Tarea visual con sistema de diseño | Revisar instrucciones generadas antes de usar |
| `web` | React/Next rendimiento | `vercel-react-best-practices` | `https://github.com/vercel-labs/agent-skills` | Proyecto React/Next | Prioriza reglas del proyecto |
| `web`, `testing` | Testing web | `webapp-testing` | `https://github.com/anthropics/skills` | App web con Playwright | Requiere servidor local del proyecto |
| `testing` | Testing profundo | `playwright-best-practices` | `https://github.com/currents-dev/playwright-best-practices-skill` | Fixtures/selectores/CI Playwright | Opcional, solo si hay suite Playwright |
| `design-heavy` | Diseño extenso | `ui-ux-pro-max` | `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` | Solo con revisión explícita | `review-required`: fallo de confianza 2026-08-15; requiere `--allow-review-required` |
| `backend` | Backend genérico | `backend-development` | `https://github.com/skillcreatorai/ai-agent-skills` | Sin skill oficial del stack | Comunitaria y genérica; última prioridad |
| `postgres` | Postgres | `supabase-postgres-best-practices` | `https://github.com/supabase/agent-skills` | Postgres con o sin Supabase | Revisar RLS/pooling contra proyecto |
| `react-native`, `expo` | React Native/Expo | `vercel-react-native-skills` | `https://github.com/vercel-labs/agent-skills` | App RN/Expo | — |
| `expo` | Expo UI/datos | `building-native-ui`, `native-data-fetching` | `https://github.com/expo/skills` | Proyecto Expo | Opcionales por necesidad |
| `android` | Android base | `android-kotlin`, `testing-setup` | `https://github.com/teachingai/full-stack-skills`, `https://github.com/android/skills` | Proyecto Android | `testing-setup` es oficial; no controla dispositivos sola |
| `android-compose` | Compose/diseño | `mobile-android-design`, `edge-to-edge` | `https://github.com/wshobson/agents`, `https://github.com/android/skills` | Compose / edge-to-edge | Opcionales por stack |
| `android-device` | QA dispositivo | `qa-testing-android` | `https://github.com/vasilyu1983/ai-agents-public` | Pruebas instrumentadas detectadas | Requiere SDK/ADB/emulador |
| `android-device-advanced` | Avanzado/Appium | `appium` | `https://github.com/teachingai/full-stack-skills` | Automatización explícita | Siempre explícito |
| `android-camera` | Cámara | `camerax` | `https://github.com/android/skills` | Uso de CameraX | Optativa; auditoría pendiente de ampliar en `registry.json` |

Instrucción para agentes: nombrar la candidata con fuente exacta, explicar por qué con evidencia de `suggest`, y esperar aprobación. Nunca `skills add` durante la tarea sin registro posterior.

Nota: `find-skills` (`https://github.com/vercel-labs/skills`) es descubrimiento dinámico opcional con gate `review-required` (Snyk en advertencia); no está en `skills/registry.json` ni se preinstala. Ver `docs/skills.md`.
