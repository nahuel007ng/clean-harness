# Reglas del proyecto para el harness V5

## Antes de cambiar

- Lee este archivo y localiza la implementación real, sus callers y sus tests.
- Decide si la tarea es directa, planificada o crítica.
- Usa `/pre-plan` solo si el alcance, el riesgo o la incertidumbre lo justifican.
- Carga una skill de dominio solo cuando la tarea corresponda a ella.
- Las skills externas se instalan desde el registro del harness, a nivel de proyecto y con revisión explícita.

## Durante el cambio

- Corrige la causa raíz y reutiliza patrones existentes.
- No añadas abstracciones, dependencias ni documentación especulativa.
- Conserva validación en límites de confianza, seguridad, accesibilidad y manejo de errores.
- Mantén los cambios acotados a la tarea.

## Cierre

- Ejecuta la verificación más pequeña que pruebe el cambio y luego las comprobaciones relevantes del proyecto.
- Actualiza documentación solo si cambia un contrato, una decisión, la arquitectura o la operación.
- El Executor puede crear commits locales atómicos únicamente después de verificar una unidad coherente.
- El Reviewer informa hallazgos; no edita ni crea commits.
