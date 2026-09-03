# Portar V6 a un TUI (guía TUI-first)

El núcleo (`templates/core/`) es agnóstico y no se modifica por un puerto. Cada puerto genera solo `templates/adapters/<tui>/` y se valida con `doctor --agent <tui>`.

La ejecuta quien porta: un modelo del propio TUI destino con revisión humana. No sustituye la documentación oficial del TUI; se usa para traducir intención, no para adivinar sintaxis.

## Fase 0 — Investigar antes de escribir (bloqueante)

1. Identifica el TUI destino y su versión. Lee su documentación oficial de configuración, agentes, permisos, comandos, skills y sandbox.
2. Cita versión y URLs consultadas en el informe del puerto. No copies un puerto de memoria sin confirmar el mecanismo real.
3. Rellena la matriz de capacidades antes de generar archivos:

| Pregunta | Respuesta + fuente |
|---|---|
| ¿Hay agentes/subagentes con permisos propios? | |
| ¿Hay comandos custom o prompts registrados? Sintaxis exacta | |
| ¿Desde qué directorios descubre skills? ¿Proyecto o solo global? | |
| ¿Configuración y permisos: archivo de proyecto o sandbox por sesión? | |
| ¿Soporta ejecución en segundo plano / delegación nativa? | |
| ¿Red/documentación permitida por rol? | |

## Fase 1 — Proyectar el núcleo

- Reglas (`core/AGENTS.md`) → archivo de reglas del TUI (Codex: `AGENTS.md`; Antigravity: `GEMINI.md`; OpenCode: `AGENTS.md` + agents).
- Intención de permisos (`core/permisos.md`) → mecanismo real del TUI. Si no hay cuadrícula por agente, degradar a secciones por rol + modo sandbox documentado.
- Planes (`core/planes-formato.md`) → misma ruta `.harness/plans/`, mismo frontmatter y ciclo de vida. El puerto nunca cambia el formato.
- Memoria (`core/memoria-formato.md`) → mismos archivos `.harness/memory/`.
- Skills internas → directorio que el TUI resuelva; canónico `.agents/skills/` + espejo del adapter.

## Fase 2 — Degradación permitida

- Si el TUI no tiene un mecanismo (ej. Codex sin agentes con permisos, Antigravity global-first), se degrada a convención documentada en `AGENTS.md`/`GEMINI.md`. Nunca se inventa sintaxis.
- Antigravity/Codex son solo-agente en V6: todo corre inline; la memoria file-based compensa el contexto.
- El instalador es solo proyecto. Si el TUI solo lee config global, el puerto se declara `detect-only` para esa parte y documenta instalación manual. Nunca escribe en `~`.

## Fase 3 — Validar

```text
node scripts/doctor.mjs
node scripts/install.mjs --agent <tui> --target <tmp-vacio>
node scripts/install.mjs --agent <tui> --target <tmp-vacio> --apply
node scripts/doctor.mjs --project <tmp-vacio> --agent <tui>
```

El doctor de fuente falla si `core/` contiene `.opencode`, `$ARGUMENTS` u `opencode.json`. El doctor de proyecto falla si el adapter apunta a `.opencode/plans/` o fija `model`.
