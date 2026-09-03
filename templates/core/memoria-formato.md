# Memoria file-based (núcleo V6)

Sin servidores ni dependencias externas. Dos archivos versionados en el proyecto:

- `.harness/memory/decisions.md`: decisiones durables (enfoque elegido, por qué, alternativas descartadas).
- `.harness/memory/fixes.md`: fixes no obvios (síntoma, causa raíz, fix, cómo verificar).

## Protocolo

- Al iniciar trabajo planificado o crítico, lee ambos archivos antes de proponer enfoques.
- Al cerrar ese trabajo, agrega entradas breves con fecha. Una línea por decisión/fix basta si es clara.
- No dupliques el plan ni el historial de commits. La memoria guarda lo reutilizable entre sesiones, no el detalle efímero.
- `.harness/skills-index.json` (generado por `skills suggest --json`) es índice, no memoria: no mezclar.

## Formato sugerido

```markdown
## 2026-09-03 — Título corto

- Decisión: ...
- Motivo: ...
- Alternativa descartada: ...
```
