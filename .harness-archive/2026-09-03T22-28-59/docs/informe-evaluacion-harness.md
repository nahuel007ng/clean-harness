# Informe de evaluación: clean-harness

## Resumen ejecutivo

`clean-harness` es una base portable para configurar OpenCode dentro de un repositorio de software. Su propósito es que el uso de agentes de IA sea repetible, revisable y seguro sin depender de un proveedor o modelo concreto.

No es un framework de aplicación ni un generador de código. Instala reglas de trabajo, roles con permisos diferenciados, comandos operativos, skills internas y scripts de comprobación. Cada proyecto conserva sus decisiones y su código; el harness aporta una disciplina común para planificar, ejecutar, verificar, revisar y, cuando corresponde, crear commits locales atómicos.

Puede ser valioso para equipos o personas que usan OpenCode en varios proyectos y quieren reducir cambios innecesarios, permisos excesivos, instrucciones dispersas y pérdida de contexto entre sesiones. Es menos adecuado si no se usa OpenCode, si se busca una automatización totalmente autónoma sin aprobaciones, o si el coste de incorporar reglas comunes supera el de proyectos pequeños y efímeros.

## Origen y evolución

El harness se construyó como una versión portable (V5) del entorno de trabajo para agentes. La decisión fundacional fue separar las reglas operativas del modelo que las ejecuta: las plantillas no contienen IDs de modelos, proveedores ni credenciales.

La evolución registrada en el repositorio muestra tres necesidades que se fueron incorporando:

1. Una base mínima de roles, permisos, verificación, commits y migración segura.
2. Perfiles de skills externas, instalados solo con intención explícita y con un registro local de lo instalado.
3. Detección del stack y planes persistentes con estado e historial de commits, para transferir trabajo de planificación a ejecución incluso entre sesiones distintas.

El repositorio es la fuente de verdad operativa. Las reglas activas viven en `AGENTS.md`, la configuración en `.opencode/` y las comprobaciones en scripts y tests. No depende de una wiki o vault externo para funcionar.

## Qué problema resuelve

| Problema habitual | Respuesta del harness |
| --- | --- |
| El comportamiento cambia al cambiar de modelo o proveedor. | Mantiene las reglas y permisos en archivos versionados del proyecto; el modelo se selecciona en OpenCode. |
| Un agente planifica, edita y revisa con la misma autoridad. | Define tres responsabilidades: Planner, Executor y Reviewer, con permisos distintos. |
| Se aplican procesos pesados a cambios triviales. | Clasifica las tareas como directas, planificadas o críticas; `pre-plan` es opcional. |
| Se pierde el contexto de un trabajo complejo al terminar una sesión. | Guarda planes en `.opencode/plans/` con objetivo, alcance, verificaciones, estado e historial de commits. |
| Las skills externas se agregan sin trazabilidad ni revisión. | Sugiere perfiles según el stack, exige `--apply` para instalar y registra la copia local en `.harness/skills-lock.json`. |
| Una migración o instalación puede sobrescribir configuración existente. | Los scripts comienzan en modo de vista previa y no sobrescriben destinos existentes. |
| Los commits automáticos mezclan cambios o validaciones no ejecutadas. | Solo permite commits locales y atómicos tras verificación; bloquea push, amend, reset, clean y el bypass de hooks. |

## Cómo está compuesto

La instalación copia la plantilla a un proyecto destino sin modificar archivos que ya existan. El resultado principal es:

| Componente | Función |
| --- | --- |
| `AGENTS.md` | Reglas de trabajo aplicables al proyecto: comprender antes de editar, cambio mínimo, verificaciones y documentación durable. |
| `.opencode/opencode.json` | Configuración base y permisos globales. Lectura y búsqueda están permitidas; edición y shell requieren aprobación. |
| `.opencode/agents/` | Roles Planner, Executor y Reviewer. |
| `.opencode/commands/` | Comandos `/pre-plan`, `/plan`, `/execute-plan`, `/verify` y `/review`. |
| `.opencode/skills/` | Skills internas para cambio mínimo, commits, frontend, backend y mobile. |
| `.opencode/plans/` | Planes persistentes para tareas no directas. |
| `.harness/skills-lock.json` | Se crea solo al instalar skills externas y deja constancia de fuente, perfil, estado de revisión y fecha. |

Los scripts del propio harness son dependencias nativas de Node.js, sin instalación de paquetes del proyecto objetivo.

## Modelo operativo

### Roles

| Rol | Responsabilidad | Límites relevantes |
| --- | --- | --- |
| Planner | Analizar alcance, riesgo y verificaciones; guardar un plan cuando procede. | No edita código ni crea commits. Solo puede escribir planes. Puede leer directorios externos para analizar dependencias. |
| Executor | Comprender el flujo, aplicar el cambio mínimo, verificar y opcionalmente crear un commit local. | El acceso externo pide aprobación. No puede hacer push, amend, reset, clean ni omitir hooks. |
| Reviewer | Revisar diff, flujo afectado, tests y evidencia. | No edita ni crea commits; informa hallazgos por severidad. |

Las capacidades de dominio no se convierten en agentes permanentes: frontend, backend y mobile se cargan como skills solo cuando la tarea lo requiere. Esto evita agrandar los permisos y el contexto de todas las tareas.

### Rutas de trabajo

Una tarea directa puede pasar de ejecución a verificación. Si el alcance, riesgo o incertidumbre lo justifican, se usa `/pre-plan` para clasificarla y `/plan` para crear un contrato de ejecución persistente.

Un plan comienza con `estado: pendiente`. Al iniciarlo, el Executor lo cambia a `en progreso`. Solo después de cumplir los criterios y ejecutar las verificaciones lo marca como `concluido` y agrega los commits creados bajo ese plan. Esto permite saber qué trabajo está activo y retomar una tarea sin depender de la memoria de una conversación.

## Dónde se aplica bien

Es especialmente apropiado para:

- Repositorios Git que usan OpenCode y reciben cambios de mantenimiento, funcionalidades o refactors acotados.
- Equipos que alternan modelos o proveedores y necesitan que las normas de ejecución no cambien con esa elección.
- Proyectos web, backend, PostgreSQL, React Native/Expo y Android. El detector puede sugerir perfiles para esas tecnologías basándose solo en archivos del proyecto.
- Trabajo asíncrono o por turnos, donde una sesión planifica y otra implementa.
- Entornos donde conviene limitar el acceso a directorios externos y conservar evidencia de qué se verificó antes de un commit.
- Repositorios que quieren adoptar IA gradualmente sin introducir un orquestador, servicios externos ni dependencias de runtime.

No pretende reemplazar:

- La arquitectura, estándares de dominio, CI, revisión humana o controles de seguridad propios del proyecto.
- El gestor de secretos ni las políticas corporativas de acceso a código y datos.
- Un pipeline de entrega o despliegue; los commits permitidos son locales y el push está bloqueado.
- La configuración de una herramienta distinta de OpenCode.

## Requisitos y supuestos

- Node.js disponible para ejecutar los scripts `.mjs`.
- OpenCode instalado y usado como agente de desarrollo del proyecto destino.
- Un repositorio o directorio objetivo existente y permisos de escritura sobre él al aplicar la instalación.
- Git es recomendable para aprovechar el protocolo de diffs y commits, aunque la copia de plantillas no exige que el destino sea un repositorio Git.
- Conectividad y `npx` solo son necesarios si se decide instalar una skill externa.

El detector de stack lee hasta 5.000 archivos y no ejecuta Gradle, ADB, scripts del proyecto ni código externo. Excluye directorios generados y de configuración del agente, y evita inferir el stack desde documentación o scripts del harness.

## Cómo aplicarlo a un proyecto

### 1. Comprobar la fuente

Desde el repositorio de `clean-harness`:

```text
node scripts/doctor.mjs
```

Debe informar `DOCTOR: OK` antes de usar la plantilla.

### 2. Revisar la instalación sin escribir

```text
node scripts/install.mjs --target C:\ruta\al\proyecto
```

El comando lista cada archivo como `nuevo` o `conflicto` y muestra los perfiles de skills sugeridos. No escribe en esta fase.

Si hay conflictos, no sobrescribe archivos. La recomendación es comparar y adaptar manualmente las reglas existentes en vez de reemplazarlas a ciegas.

### 3. Aplicar la plantilla

Cuando la vista previa sea correcta:

```text
node scripts/install.mjs --target C:\ruta\al\proyecto --apply
node scripts/doctor.mjs --project C:\ruta\al\proyecto
```

El segundo comando comprueba la estructura, el frontmatter de agentes, las restricciones de permisos, la ausencia de un modelo fijado y, si existe, el lockfile de skills.

### 4. Evaluar e instalar skills externas solo si aportan valor

```text
node scripts/skills.mjs suggest --target C:\ruta\al\proyecto
node scripts/skills.mjs show web
node scripts/skills.mjs install --profile web --target C:\ruta\al\proyecto
node scripts/skills.mjs install --profile web --target C:\ruta\al\proyecto --apply
```

`suggest` y el primer `install` son vistas previas. La instalación real copia las skills dentro del proyecto y actualiza `.harness/skills-lock.json`. El perfil `design-heavy` contiene una skill marcada como `review-required`, por lo que exige además `--allow-review-required` después de revisar el riesgo indicado en el registro.

### 5. Usar el flujo diario

| Tipo de tarea | Flujo sugerido |
| --- | --- |
| Cambio pequeño y bien entendido | Executor -> verificación focalizada -> comprobaciones relevantes. |
| Cambio con incertidumbre o varias áreas | `/pre-plan` -> `/plan` -> `/execute-plan <ruta-del-plan>` -> `/verify` o `/review`. |
| Cambio crítico | Plan persistente, ejecución con verificaciones explícitas y revisión independiente antes de integrar. |

La adopción inicial debe ajustar `AGENTS.md` a los comandos de build, test, lint, convenciones y restricciones reales del proyecto. El harness entrega el marco; no puede adivinar los criterios funcionales ni la arquitectura específica.

## Migración desde una configuración anterior

El migrador archiva únicamente las rutas incluidas en un manifiesto explícito. No infiere qué carpetas son del harness y protege segmentos como `docs`, `wiki`, `vault`, `knowledge` y `.kb` si se incluyen en el manifiesto.

```text
node scripts/migrate.mjs --target C:\ruta\al\proyecto --manifest C:\ruta\manifest.json
node scripts/migrate.mjs --target C:\ruta\al\proyecto --manifest C:\ruta\manifest.json --apply
```

El primer comando es obligatorio en la práctica: es un dry-run que muestra origen, destino y motivo. Con `--apply`, las rutas se mueven a `.harness-archive/<marca-de-tiempo>/`; no se eliminan. El archivo `migrations/manifest.example.json` sirve como punto de partida para declarar rutas antiguas de `.opencode` o `.agents`.

## Beneficios y costes

### Beneficios esperables

- Menor dependencia del modelo gracias a instrucciones, permisos y verificaciones versionadas.
- Mejor trazabilidad de trabajo complejo mediante planes que sobreviven a la sesión.
- Menor riesgo de modificaciones accidentales por separación de autoridad y aprobaciones explícitas.
- Menos skills innecesarias gracias a perfiles y detección no invasiva del stack.
- Commits más auditables, al requerir un diff acotado y verificación previa.
- Adopción reversible: la instalación no sobrescribe y la migración archiva en lugar de borrar.

### Costes y límites

- Añade archivos de configuración y un protocolo que puede ser excesivo para prototipos de vida corta.
- Los permisos `ask` introducen interacción humana; es una decisión de control, no una automatización sin fricción.
- La detección de stack es heurística y limitada a tecnologías registradas; una sugerencia no sustituye la revisión técnica.
- Las skills externas siguen siendo código/instrucciones de terceros. El lockfile aporta trazabilidad, no garantiza su seguridad ni calidad.
- La verificación se apoya en los comandos definidos por cada proyecto. El harness verifica su propia estructura, no la corrección funcional de una aplicación.
- La primera instalación no fusiona configuraciones existentes. Un proyecto ya configurado requiere una migración o adaptación deliberada.

## Criterio de decisión para un proyecto

La siguiente lista permite decidir si conviene adoptarlo:

| Pregunta | Señal favorable |
| --- | --- |
| ¿El proyecto se trabaja con OpenCode de forma recurrente? | Sí: el harness es directamente aplicable. |
| ¿Hay más de una persona, sesión o modelo participando en los cambios? | Sí: roles, planes y estado persistente aportan trazabilidad. |
| ¿Importa restringir escrituras, shell y acceso a otros directorios? | Sí: el modelo de permisos justifica su coste. |
| ¿Existen tests, lint o builds que se puedan documentar y ejecutar? | Sí: el protocolo de verificación puede aportar evidencia útil. |
| ¿El proyecto usa uno de los stacks detectados? | Sí: puede aprovechar perfiles de skills, tras revisión explícita. |
| ¿La prioridad es velocidad máxima sin aprobaciones ni proceso? | No: el harness no está optimizado para ese objetivo. |
| ¿Ya hay una configuración madura de agentes? | Depende: conviene comparar reglas y migrar de forma explícita, no instalar encima. |

## Recomendación de evaluación

Para un proyecto candidato, el piloto más útil es instalarlo primero en una rama o copia de trabajo, sin skills externas. Luego se recomienda ejecutar dos tareas reales: una directa y una que requiera plan persistente. La evaluación debería responder si las aprobaciones son aceptables, si `AGENTS.md` se puede adaptar sin duplicar reglas y si la evidencia de verificación y los handoffs mejoran el trabajo frente al flujo actual.

Si el piloto es positivo, se pueden instalar únicamente los perfiles de skills que correspondan al stack. Si no aporta valor, basta con eliminar la configuración añadida o restaurar desde el archivo de control de versiones; el harness no modifica el runtime de la aplicación.

## Referencias internas

- `README.md`: uso rápido y principios.
- `docs/decisions.md`: decisiones de diseño que se consideran durables.
- `docs/skills.md`: política y comandos de skills externas.
- `templates/project/`: archivos que se copian a cada proyecto.
- `scripts/doctor.mjs`: validación estructural de la plantilla o de una instalación.
- `scripts/install.mjs`, `scripts/migrate.mjs` y `scripts/skills.mjs`: operaciones de adopción.
