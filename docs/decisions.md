# Decisiones del harness V5

## 1. El harness es portable y el modelo es intercambiable

Las plantillas no fijan proveedor ni modelo. El modelo se selecciona en OpenCode según la tarea y el contexto disponible.

## 2. Los roles representan permisos y responsabilidades

Se mantienen solo Planner, Executor y Reviewer. Las capacidades de dominio se cargan como skills porque frontend, backend y mobile describen conocimiento de ejecución, no límites de autoridad.

## 3. No existe una tubería obligatoria para cada cambio

Las tareas directas pueden ir de ejecución a verificación. El plan y la revisión se añaden cuando el riesgo o el alcance lo justifican.

## 4. El repositorio es la fuente de verdad operativa

Las reglas activas viven en `AGENTS.md`, la configuración en `.opencode` y las comprobaciones en los scripts y tests del proyecto. El vault no forma parte del runtime del harness.

## 5. La simplificación es una skill, no una inyección global

`minimal-change` toma la idea central de Ponytail: entender primero, corregir la causa raíz y evitar trabajo especulativo. Se carga para ejecutar código y no altera planificación ni revisión.

## 6. Los commits son checkpoints verificables

El Executor puede crear un commit local por unidad funcional cuando el árbol estaba limpio, el diff está acotado y la verificación focalizada pasó. No se permiten push, force, amend, reset ni bypass de hooks.

## 7. La migración requiere intención explícita

El migrador opera sobre un manifiesto de rutas. No deduce que una carpeta de documentación, wiki o vault sea harness y no sobrescribe destinos existentes.

## 8. Las skills externas se gestionan por perfil

Las skills de skills.sh son dependencias operativas externas, no parte automática del núcleo. Se registran con fuente, perfil, estado de auditoría y fecha de revisión. Se instalan por proyecto, con copia local y solo mediante una acción explícita.

## 9. La inicialización sugiere skills según el repositorio

El inicializador inspecciona nombres y contenido de archivos para detectar señales de stack. Muestra perfiles sugeridos, pero no ejecuta herramientas del proyecto ni descarga dependencias automáticamente. La instalación requiere `--apply` y deja un `.harness/skills-lock.json`, de forma que cambiar de modelo no cambie silenciosamente las instrucciones operativas.

Los perfiles Android se separan por necesidad: base Kotlin/Android, Compose y diseño, QA con dispositivo, automatización avanzada y CameraX. La detección no instala todo el pack Android ni confunde una skill con permisos de ADB: el acceso real sigue dependiendo de SDK, emulador, dispositivo y permisos del entorno.

## 10. El acceso externo distingue planificación de ejecución

La configuración global deja `external_directory` en `ask` para que el usuario pueda aprobar acceso externo durante la sesión. El Planner lo puede usar por defecto para leer repositorios relacionados, pero mantiene `edit: deny`; el Executor conserva `external_directory: ask` y requiere aprobación antes de tocar rutas externas. La lectura normal permanece permitida (`read: allow`).

## 11. Los planes persistentes son el contrato entre sesiones

`/pre-plan` sigue siendo un análisis efímero. Cuando una tarea requiere planificación, `/plan` guarda el resultado en `.opencode/plans/YYYY-MM-DD-<slug>.md`. El Planner solo puede escribir dentro de esa carpeta; el archivo contiene el handoff y las verificaciones que una sesión nueva del Executor debe leer antes de editar. Los proyectos deben mantener esos Markdown fuera de las reglas que ignoran la configuración generada. `/execute-plan <ruta>` ofrece el handoff explícito para esa segunda sesión.

## 12. El estado del plan vive en el plan

Cada plan declara su estado en el frontmatter (`pendiente`, `en progreso`, `concluido`). El Executor lo mueve a `en progreso` al comenzar y a `concluido` al terminar con verificación, añadiendo entonces la sección final `## Historial de commits` con los commits generados bajo ese plan. Así el archivo responde por sí mismo qué trabajo está activo, evita retomar planes ya cerrados y deja evidencia de qué commits corresponden a cada plan sin depender de la memoria de una sesión.

## 13. El harness es portable entre TUI

La codificación de OpenCode (`.opencode`, frontmatter `mode`/`permission`, comandos con `$ARGUMENTS`, `compatibility`) es la referencia, no un límite. El núcleo —reglas de trabajo, roles, planes con estado, verificación y política de commits— se conserva al portar el harness a otro TUI; cambian solo los mecanismos de cada herramienta (archivo de reglas, configuración y permisos, agentes, comandos, skills y ruta de planes). El procedimiento de adaptación, la tabla de intención de permisos y el ejemplo de Codex viven en `docs/tui-portabilidad.md`. Un puerto propio debe seguir esa guía y documentarse como decisión durable, sin modificar las plantillas de OpenCode del núcleo.

## 14. El cierre de procesos se verifica, no se espera

Los comandos con procesos hijos (emuladores, servidores, Gradle, Flutter, ADB, npm) pueden terminar su trabajo real y dejar vivo el wrapper, el hub o un proceso huérfano; esperar su salida en foreground puede bloquear al Executor indefinidamente aunque la tarea ya haya terminado. Por eso el Executor aplica cierre verificable: ejecución en segundo plano con PID y logs cuando corresponde, consulta de avance, comprobación posterior de salida esperada, artefactos, puertos y procesos, limpieza limitada a lo iniciado por la tarea y distinción entre «terminó correctamente pero el wrapper no cerró» y «está bloqueado». Esta política vive en el agente Executor, aplica a cualquier stack y no depende de conocer el dominio concreto.

## 15. El nucleo V6 es agnostico y los TUI son adapters

templates/core/ no menciona ningun TUI (sin .opencode, $ARGUMENTS, mode/permission ni compatibility). templates/adapters/<tui>/ es la unica zona con sintaxis del TUI; opencode queda como referencia ejecutable. Un puerto nunca modifica el nucleo y se valida con doctor --agent <tui>.

## 16. El routing es organico y el tamano no fuerza planes

directa (1-3 archivos o cambio mecanico entendido), delegada (4+ archivos para entender o 2+ no triviales para escribir), planificada/critica solo si artefactos durables reducen ambiguedad real. Solo una peticion explicita o una propuesta aceptada inicia planificacion. La revision nunca decide la ruta.

## 17. SDD-lite y review por riesgo son opcionales e informativos

El plan admite secciones Propuesta/Spec/Tareas solo cuando reducen ambiguedad; la revision ajusta esfuerzo por riesgo (estructural/un foco/cuatro focos) con veredicto que nunca bloquea delivery.

## 18. La memoria es file-based y versionada

.harness/memory/decisions.md y fixes.md sustituyen a cualquier servidor externo. Se leen al iniciar trabajo planificado y se escriben al cerrarlo. Los planes viven en .harness/plans/ compartidos por los tres TUI.

## 19. Bootstrap por el modelo del TUI destino con archivo previo

El port lo ejecuta el modelo dentro del repo destino con docs/bootstrap-v6.md: investiga la doc oficial del TUI, inventaria legacy con detect-legacy.mjs, archiva con manifiesto a .harness-archive/<timestamp>/ (protegidos docs/wiki/vault/knowledge/.kb), hace init fresco project-local y solo importa build/test/lint, memoria y re-suggest de skills. Nunca mezcla agentes viejos ni fija modelos.

## 20. Skills V6: suggest + record, cero descargas en el port

suggest es informativo sin red; install/record --apply solo escriben .harness/skills-lock.json tras instalacion manual aprobada. find-skills es opcional con gate review-required y nunca se preinstala.

## 21. Migrate omite rutas inexistentes y templates/project se elimina en V6

migrate.mjs omite con aviso las rutas del manifiesto que no existen en vez de fallar: el manifiesto ejemplo cubre los 7 rastros posibles y cada proyecto solo tiene algunos. La fuente unica pasa a templates/core/ + templates/adapters/<tui>/; templates/project/ (V5) se elimina para evitar doble fuente de verdad.
