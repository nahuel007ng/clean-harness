# clean-harness

Este repositorio contiene el harness portable, no el harness de un proyecto concreto.

## Reglas de trabajo

- Mantener el núcleo pequeño: cada regla debe justificar su coste.
- No fijar proveedores, modelos ni credenciales en plantillas.
- Preferir configuración declarativa y scripts sin dependencias externas.
- Verificar cada cambio con `node scripts/doctor.mjs`.
- No ejecutar migraciones reales durante el desarrollo del harness.
- Los cambios del harness deben documentar únicamente decisiones durables.

## Límites

- No leer ni modificar el vault de Babel Tower desde este repositorio.
- No añadir compatibilidad con versiones antiguas sin un caso de uso verificable.
- No convertir una skill opcional en una regla global.
- No instalar skills externas durante el desarrollo sin registrar fuente, perfil y revisión.
