# Intención de permisos (núcleo V6)

Traduce la intención, no las llaves de ningún TUI. Cada adapter la proyecta a su mecanismo real.

- Lectura y exploración: permitidas para todos los roles.
- Escritura de código: requiere aprobación. El Planner nunca edita código ni crea commits.
- Shell: requiere aprobación; `git` de solo lectura (`status`, `diff`, `log`, `branch`, `ls-files`) queda permitido.
- Git destructivo y red (`push`, `force`, `amend`, `reset`, `clean`, `config`, hooks, scripts del proyecto): denegados para el Executor.
- Directorios externos: el Planner los lee por defecto para analizar dependencias; el Executor pide aprobación antes de tocarlos. La lectura normal permanece permitida.
- Red para documentación: denegada para el Planner; a petición para el Executor.
- Skills externas: nunca instalación implícita. Solo propuesta + aprobación + registro en `.harness/skills-lock.json`.
- Nunca fijar proveedor, modelo ni credenciales en el núcleo ni en los adapters.
