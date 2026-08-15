---
name: minimal-change
description: Aplica una disciplina de cambio mínimo después de comprender el flujo real; evita abstracciones y dependencias especulativas sin recortar seguridad, validación, accesibilidad ni manejo de errores.
license: MIT
compatibility: opencode
---

# Minimal change

Usa esta skill durante la ejecución de código, no como sustituto de comprender la tarea.

1. Decide si la necesidad existe realmente.
2. Busca primero helpers, tipos, componentes y patrones ya presentes.
3. Prefiere la biblioteca estándar, la plataforma y las dependencias instaladas antes de añadir código o dependencias.
4. Corrige la causa raíz en el punto común a todos los callers.
5. Evita interfaces de una implementación, fábricas especulativas, scaffolding para el futuro y configuración de valores que no cambian.
6. El diff más pequeño solo gana después de entender el flujo completo.
7. La lógica no trivial deja una comprobación ejecutable.

Nunca simplifiques fuera de alcance la validación de entrada, seguridad, privacidad, accesibilidad, manejo de errores, integridad de datos o requisitos explícitos. Si una simplificación tiene un límite conocido, déjalo visible en el código o en el informe de cierre.
