# Corte 7 — Nombres en lugar de identificadores

## Cambios

- Administrador y reclutador: la lista de postulaciones presenta nombre del candidato y título de la vacante. El ID de postulación sigue visible solo como referencia para soporte.
- Administrador: la revisión muestra nombre y título en lugar de IDs numéricos.
- Gestión de vacantes: los formularios de asignación de requisitos y edición/cierre permiten seleccionar la vacante por título. Las habilidades y competencias se eligen por nombre.
- Los identificadores permanecen en las peticiones HTTP y en PostgreSQL. No se cambia el esquema de la base de datos.

## Seguridad y comportamiento

Los nombres se entregan únicamente a usuarios autorizados mediante las rutas existentes de administración y reclutamiento. Los catálogos de vacantes, habilidades y competencias requieren autenticación. Se mantienen sus controles de acceso.

Los selects usan el `id` como `value` y muestran las etiquetas legibles. Tras crear/cerrar una vacante, se actualiza el listado de vacantes abiertas. También se incluye «Actualizar listas de opciones».

## Comprobación manual

1. Entrar como administrador; abrir «Postulaciones y ranking IA»: confirmar que aparecen nombres y títulos, no solo números.
2. Abrir una revisión: confirmar que muestra nombre y título correctos.
3. Entrar como reclutador: comprobar la misma lista y abrir una evaluación.
4. Como administrador, abrir «Requisitos de vacantes»: seleccionar una vacante por título y una habilidad/competencia por nombre; confirmar que el nivel se guarda.
5. Abrir «Editar o cerrar vacante»: seleccionar por título, cargar y confirmar que corresponden los datos.
6. Cambiar a candidato: verificar que sus permisos no permiten acceder a las rutas de personal.

No se necesita ejecutar migraciones ni preparar otra base de datos.
