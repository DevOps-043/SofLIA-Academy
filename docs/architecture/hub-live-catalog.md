# Agenda de sesiones en Hub

Estado: implementación local. Actualizado: 2026-11-11.

`POST /api/auth/live/catalog` recibe `{ organization_slug, page, view, period? }`, con página entre 0 y 100000 y vista `student` o `instructor`. Usa verificación bearer, límites de cuerpo del aula y rate limit de lectura. Revalida organización activa, membresía y permisos mediante `hubActorContext`; `listLiveCatalog` aplica la autorización académica y paginación de 20 sesiones con periodo `upcoming`.

La salida versión 1 contiene actor verificado, permiso para enseñar, total y metadatos públicos de las sesiones. Nunca incluye URLs Zoom, IDs de reunión, tokens ni rol de anfitrión. Los títulos de cursos e instructores usan el catálogo acotado existente y etiquetas de respaldo cuando no están en esa página de metadatos. La apertura de medios conserva `/api/auth/live/access` y su autorización independiente.

La ampliación de períodos requiere la migración `20261111110000_live_catalog_session_periods.sql` de SOFIA Learning. Publicar esta ruta junto con el cliente Hub es necesario para consultar sesiones reales; sin esa publicación el cliente muestra un error recuperable. La implementación vive en `apps/web/src/app/api/auth/live/catalog/route.ts` y las pruebas en su subdirectorio `__tests__`.

La publicación incluye `apps/web/src/proxy/api-route-auth.ts`: la ruta exacta del catálogo debe delegar autenticación al handler, como `access` y `workspace`, para aceptar bearer desde main sin cookies web. También incluye `apps/web/src/proxy/rate-limits.ts`: POST del catálogo usa `live-access`, sin consumir los cinco intentos de login. Rutas hijas no enumeradas conservan el filtro y presupuesto de autenticación. La delegación no elimina la verificación `getUser`, la membresía activa ni el aislamiento académico del handler.

Diagnóstico confirmado el 2026-10-11: la consulta desde Hub hacia `https://soflia.ai` devolvía 401 con `UNAUTHENTICATED` del filtro web; Hub lo presentaba incorrectamente como falta de acceso a la organización. Los ajustes son locales y necesitan publicarse junto con el endpoint. La consulta sin bearer no acredita que la ruta esté desplegada, porque el filtro rechaza también rutas inexistentes antes de resolverlas.


## Capacidades negociadas y gestión

La cabecera `X-Soflia-Catalog-Capabilities: 1` añade `capabilities` versión 1 con
`role`, `can_manage` y `can_view_history`. Sin esa cabecera la forma de respuesta
v1 se mantiene exactamente, para clientes con validación estricta. La etiqueta
`platform_admin` procede de `users.platform_role` mediante el predicado canónico;
no sustituye membresía activa ni concede privilegios académicos nuevos.
Administrador de organización e instructor conservan los permisos reales de
`liveActorContext`; alumnos no pueden solicitar `period: past` ni suplantar una
vista de instructor. Historial requiere negociación, `view: instructor` y
`canTeach`, con rechazo antes de consultar catálogo.

`upcoming` comprueba inicio más duración de las programadas antes de contar y paginar. Las que siguen en vivo se conservan hasta que Learning las cierre, aunque excedan su duración prevista. `past` incluye
finalizadas/canceladas y programaciones vencidas sin cerrar. La migración es
reentrante, no modifica filas y conserva firma, grants y aislamiento. Restaurar
la definición anterior de `live_catalog` revierte el filtro sin borrar historia.
Las pruebas PGlite la ejecutan dos veces y cubren fechas, conteo, paginación,
clases propias de instructores, vista administrativa y denegación de RPC directo
al rol autenticado. Los alumnos solo reciben próximas asignadas desde Hub.

Learning conserva programación y administración en `/{orgSlug}/instructor` y
las fichas en `/{orgSlug}/live/{sessionId}`. Hub construye destinos desde su origen
configurado y los abre por acción humana en su navegador integrado. No duplica
mutaciones ni exporta tokens a URLs; Learning revalida su propia sesión web.
Aplicar la migración, publicar Learning y distribuir Hub, en ese orden. Este
cambio solo prepara código local: no ejecuta migraciones ni despliegues remotos.
