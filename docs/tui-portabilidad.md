# Portabilidad a otros TUI (referencia V5 — para V6 seguir `portar-v6.md`)

> Referencia histórica V5. El procedimiento vigente es `docs/portar-v6.md`; la ruta de planes vigente es `.harness/plans/` (no configurable por puerto).

El harness V5 está codificado para OpenCode, pero su núcleo no depende de él. Esta guía explica como adaptarlo para usarlo en otro TUI (por ejemplo Codex, Claude Code, Cursor o Gemini CLI) sin cambiar las reglas de trabajo.

La ejecuta quien porta el harness: un LLM con revisión humana. No debe sustituir la documentación oficial del TUI destino; se usa para traducir intención, no para adivinar sintaxis.

## Por qué es necesario

Los cambios que sigue pidiendo el harness (rol, permisos, comandos, skills, planes) se codifican distinto en cada TUI:

- Los permisos globales no siempre viven en un `opencode.json`.
- Los roles con permisos por agente no existen en todos los TUI.
- Los comandos con `$ARGUMENTS` son una convención de OpenCode.
- Las skills se descubren desde directorios distintos.

Si el harness no se adapta, el TUI destino ignora partes por completo (por ejemplo los bloques `permission` del frontmatter) y la disciplina de planificar, verificar y limitar el riesgo se pierde silenciosamente.

## Qué no cambia al portar

- Las reglas de trabajo: comprender antes de editar, cambio mínimo y verificación.
- Los tres roles: Planner, Executor y Reviewer.
- Los planes persistentes: `estado: pendiente/en progreso/concluido` y el `## Historial de commits`.
- Verificar antes de crear un commit local atómico y no hacer push, force, amend, reset ni bypass de hooks.
- La supervisión de procesos del Executor: cierre verificable en vez de espera ciega cuando un comando deja procesos hijos.
- No fijar proveedor, modelo ni credenciales en el puerto.

## Mapa de conceptos

| En OpenCode | Concepto comparable |
| --- | --- |
| `AGENTS.md` | Archivo de reglas del proyecto (Codex: `AGENTS.md`; Claude Code: `CLAUDE.md`; Cursor: `.cursor/rules`; Gemini CLI: `GEMINI.md`). |
| `.opencode/opencode.json` (`permission`, `default_agent`) | Configuración base y modelo de permisos o aprobación del TUI (modos sandbox, ajustes de permisos, gestor de aprobaciones). |
| `.opencode/agents/*.md` (`mode`, `permission`) | Mecanismo de roles, subagentes o prompts con herramientas del TUI. |
| `.opencode/commands/*.md` (`description`, `agent`, `$ARGUMENTS`) | Comandos personalizados o prompts registrados del TUI. |
| `.opencode/skills/*/SKILL.md` (`compatibility`) | Directorio de skills o plugins que resuelve el TUI. |
| `.opencode/plans/YYYY-MM-DD-<slug>.md` | Ruta de planes del proyecto. No depende de OpenCode para su contenido; el puerto define su carpeta (recomendada: `.harness/plans/`). |

## Intención de permisos

Traduce la intención, no las llaves de OpenCode:

- Lectura y exploración: permitidas para todos los roles.
- Escritura de código: requiere aprobación. El Planner nunca edita.
- Shell: requiere aprobación; `git` de solo lectura (`status`, `diff`, `log`, `branch`, `ls-files`) queda permitido.
- Git destructivo y red (`push`, `force`, `amend`, `reset`, `clean`, `config`, hooks, scripts del proyecto): denegados para el Executor.
- Directorios externos: el Planner los lee por defecto; el Executor pide aprobación.
- Red para documentación (`webfetch`, `websearch`): denegada para el Planner; a petición para el Executor.

## Procedimiento

1. Identifica el TUI destino y lee su documentación oficial de configuración, agentes, permisos y comandos. No asumas que existe un equivalente directo para cada concepto.
2. Ubica el equivalente de cada elemento del mapa: reglas, configuración global, permisos, roles, comandos, skills y planes.
3. Si un mecanismo no existe (por ejemplo agentes con permisos propios), decide cómo preservar la intención: secciones separadas de `AGENTS.md`, modos sandbox del TUI o convenciones de proyecto documentadas.
4. Traduce los cinco comandos (`/pre-plan`, `/plan`, `/execute-plan`, `/verify`, `/review`) al mecanismo del TUI y ajusta las referencias en el archivo de reglas del proyecto.
5. Actualiza `compatibility` en los frontmatter de las skills al TUI destino y coloca cada skill en el directorio que este resuelve.
6. Mantén el formato de los planes sin cambios; define la ruta del proyecto (recomendada: `.harness/plans/`) y actualiza las referencias del Planner, el Executor y los comandos.
7. Verifica con el doctor o validador estructural del TUI si existe, y repite la validación del harness adaptada: presencia de los tres roles, planes con ruta válida y ausencia de modelo o proveedor fijado.
8. Documenta la adaptación como decisión durable en el repositorio destino y, si aporta conocimiento al núcleo, en `docs/decisions.md` del harness.

## Reglas de oro

- No fijar proveedor, modelo ni credenciales. La selección del modelo queda en el TUI o en la persona.
- Si el TUI arbitra permisos por modos de sandbox en lugar de por agente, acepta el modo que preserve la intención de la tabla anterior.
- Cada puerto es una decisión nueva: no copies un puerto de memoria sin confirmar el mecanismo real en la documentación del TUI.

## Ejemplo ilustrativo: Codex

Este ejemplo es una referencia puntual, no un contrato. Verifica la documentación actual de Codex antes de aplicarlo.

| Concepto OpenCode | Adaptación en Codex |
| --- | --- |
| Reglas (`AGENTS.md`) | `AGENTS.md` es compatible: se copia y se ajustan las referencias a comandos. |
| Permisos globales (`opencode.json`) | No hay equivalente directo. Codex define el ámbito por modo de sandbox durante la sesión (`read-only`, `workspace-write`, `danger-full-access`) y por aprobación del usuario. Recomendado: sesión en `workspace-write` para el Executor con confirmación previa a ediciones mayores, y `read-only` para el Reviewer. |
| Roles con permisos (`.opencode/agents/`) | No hay agentes con cuadrícula de permisos. Las fronteras se declaran como secciones separadas en `AGENTS.md`: el Planner no usa herramientas de escritura, el Reviewer solo lectura. |
| Comandos (`/pre-plan`, `/plan`, `/execute-plan`, `/verify`, `/review`) | Se sustituyen por instrucciones en `AGENTS.md` o por prompts registrados del TUI que reproduzcan el mismo flujo (plan efímero, plan persistente y handoff, verificación, revisión). |
| Skills | Se colocan en el directorio de skills que resuelva Codex y se actualiza `compatibility`. |
| Planes (`.opencode/plans/`) | Se ubican en `.harness/plans/` y se actualizan las referencias. El archivo del plan no cambia de formato. |

La intención de permisos se mantiene ajustando el modo de sandbox por rol y documentando en `AGENTS.md` qué operaciones requieren confirmación (edición fuera de la unidad, acceso a directorios externos, redes, y cualquier `git` destructivo).