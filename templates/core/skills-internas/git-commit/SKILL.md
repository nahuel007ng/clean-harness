---
name: git-commit
description: Crea commits locales convencionales, atómicos y basados en el diff verificado; nunca incluye secretos ni reescribe historia.
license: MIT
---

# Git commit

Úsala solo cuando el Executor haya terminado una unidad coherente y sus verificaciones hayan pasado.

## Precondiciones

- El árbol estaba limpio al iniciar la tarea o los archivos ya fueron aislados de forma segura.
- El diff contiene únicamente la unidad actual.
- `git diff --check` pasa.
- No hay secretos, credenciales, claves privadas ni archivos `.env` en lo que se va a confirmar.
- No se usa `--no-verify`.

## Procedimiento

1. Ejecuta `git status --short`.
2. Inspecciona `git diff` y determina los archivos de la unidad.
3. Añade solo esos archivos con `git add -- <rutas explícitas>`.
4. Inspecciona `git diff --cached`.
5. Crea un mensaje Conventional Commit en presente, imperativo y menor de 72 caracteres.
6. Ejecuta `git commit -m "tipo(alcance): descripción"`.
7. Verifica el resultado con `git status --short` y `git log -1 --oneline`.

## Prohibido

`push`, `--force`, `--amend`, `--no-verify`, `reset`, `clean`, cambios de `git config` y confirmar archivos ajenos a la tarea.
