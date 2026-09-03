# Bootstrap V6 (ejecutado por el modelo del TUI destino)

Copia el prompt de tu TUI en una sesión abierta en la raíz del proyecto destino (ej. `multas-en-calle-appmovil`). El modelo ejecuta inventario, archivo, init fresco e import curado. Nada se escribe sin dry-run aprobado.

Fuente del harness: clona `clean-harness` rama/tag V6 a un TEMP fuera del proyecto. Nunca instales desde un pipe opaco.

## Codex (copiar)

```text
Sigue docs/bootstrap-v6.md#codex para instalar Harness Engineering V6 en este repo.
1. Fase investigación: lee la doc oficial de Codex (config, sandbox, skills) y rellena la matriz de docs/portar-v6.md Fase 0 con versión y URLs.
2. Inventario: ejecuta node TEMP/scripts/detect-legacy.mjs --target . y node TEMP/scripts/install.mjs --agent codex --target . (dry-run). Muéstrame el resultado y espera aprobación.
3. Legacy: si hay rastros V4/V5, genera el manifiesto desde migrations/manifest.v5-v6.example.json y archiva con node TEMP/scripts/migrate.mjs --target . --manifest <manifiesto> (dry-run primero, --apply solo tras mi OK). Protegidos docs/wiki/vault/knowledge/.kb.
4. Init fresco: node TEMP/scripts/install.mjs --agent codex --target . --apply. No sobrescribas nada.
5. Import curado: re-ejecuta suggest, rescata solo build/test/lint del AGENTS.md archivado, planes concluidos a .harness/memory/ y skills-lock a re-suggest. No copies agents/commands viejos ni modelos.
6. Verifica con node TEMP/scripts/doctor.mjs --project . --agent codex. Reporta archivadas/instaladas/importadas.
```

## OpenCode (copiar)

```text
Sigue docs/bootstrap-v6.md#opencode para instalar Harness Engineering V6 en este repo.
Mismos 6 pasos con --agent opencode. Los planes viven en .harness/plans/ (no en .opencode/plans/). Respeta permission ask/deny del adapter y no fijes modelo.
```

## Antigravity (copiar)

```text
Sigue docs/bootstrap-v6.md#antigravity para instalar Harness Engineering V6 en este repo.
Mismos 6 pasos con --agent antigravity. Solo-agente inline + Mission Control; espejo en .gemini/skills/. Si tu versión solo lee skills globales, declara el límite y documenta la instalación manual sin escribir en ~. Re-exporta AGENTS.md en GEMINI.md.
```
