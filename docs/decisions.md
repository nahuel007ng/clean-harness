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
