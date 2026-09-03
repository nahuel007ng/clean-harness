# Reglas del proyecto (núcleo agnóstico V6)

Estas reglas no dependen de ningún TUI. La sintaxis concreta vive en `adapters/<tui>/`.

## Antes de cambiar

- Lee este archivo y localiza la implementación real, sus callers y sus tests.
- Clasifica la tarea por evidencia, no por tamaño percibido:
  - `directa`: decidir o verificar requiere 1-3 archivos, o es un cambio mecánico ya entendido sin investigación ni decisión de diseño pendiente.
  - `delegada`: entender requiere 4+ archivos, la lectura prepara una escritura, hay investigación amplia, o hay que cambiar 2+ archivos no triviales.
  - `planificada/crítica`: hay ambigüedad durable y artefactos escritos (propuesta, spec, tareas) la reducirían materialmente.
- El tamaño nunca fuerza un plan. Solo una petición explícita o una propuesta aceptada inicia planificación.
- Revisa `.harness/plans/`: si hay un plan `en progreso`, continúalo o ciérralo antes de iniciar otro; si el árbol tiene cambios sin commitear sin plan activo, aclara su origen antes de editar.
- Lee `.harness/memory/decisions.md` y `fixes.md` antes de proponer enfoques ya decididos.
- Carga una skill de dominio local solo cuando la tarea corresponda a ella. Las skills externas nunca se descargan durante la tarea: se proponen y se registran tras aprobación explícita.

## Durante el cambio

- Corrige la causa raíz y reutiliza patrones existentes.
- No añadas abstracciones, dependencias ni documentación especulativa.
- Conserva validación en límites de confianza, seguridad, accesibilidad y manejo de errores.
- Mantén los cambios acotados a la tarea. Cada acción (tests, builds, installs, revisión) puede usar un trabajador fresco sin cambiar la ruta elegida.

## Cierre

- Ejecuta la verificación más pequeña que pruebe el cambio y luego las comprobaciones relevantes del proyecto.
- Actualiza documentación solo si cambia un contrato, una decisión, la arquitectura o la operación.
- El Executor puede crear commits locales atómicos únicamente después de verificar una unidad coherente. Nunca push, force, amend, reset, clean, cambios de `git config` ni bypass de hooks.
- Al terminar un plan, marca su frontmatter `estado: concluido` y añade al final `## Historial de commits` con los commits generados durante su ejecución.
- La revisión informa hallazgos por severidad con veredicto `aprobado`, `aprobado con observaciones` o `requiere cambios`. Es informativa: nunca bloquea ni autoriza delivery por sí sola.
- Registra decisiones reutilizables en `.harness/memory/` en el cierre de trabajo planificado o crítico.
