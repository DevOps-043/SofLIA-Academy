# Aulas con Zoom Video SDK

Estado: SQL aprobado aplicado en Learning principal; despliegue, activación y prueba con cuenta real pendientes. Actualizado: 2026-11-03.

El cambio `migrate-zoom-video-sdk` del Hub añade Video SDK 2.6.0. Learning mantiene la autorización y programación; Hub reproduce el aula en su iframe aislado. El campo `video_provider` fija el proveedor por aula. Las anteriores conservan Meeting SDK; cambiar el entorno solo afecta a nuevas programaciones.

## Preparación

1. En Learning principal se aplicó con aprobación `supabase/migrations/20261019120000_live_video_sdk.sql` con versión remota 20261103184110; participación tiene versión 20261103184120. Consultar el [reporte de ejecución](reports/live-activation-2026-11-03/execution.md). En otros entornos, revisar y aplicar después de las migraciones del estudio y grabaciones. Es aditiva e idempotente; crea credenciales privadas con RLS y una función accesible exclusivamente por service_role. Revisar el historial remoto antes de usar db push, porque sus versiones difieren de los prefijos locales.
2. Habilitar Video SDK y grabación cloud en Zoom Build Platform. Configurar en el servidor `ZOOM_VIDEO_SDK_KEY`, `ZOOM_VIDEO_SDK_SECRET`, `ZOOM_VIDEO_API_KEY` y `ZOOM_VIDEO_ACCOUNT_ID`. La clave API de Platform Studio autentica las solicitudes REST mediante `x-api-key`. El importador solicita a Zoom un token temporal para descargar cada grabación y lo mantiene en memoria. Las claves SDK firman exclusivamente el ingreso. No usar prefijos públicos ni distribuir credenciales administrativas al Hub.
3. Verificar privacidad, avisos, regiones, retención y presupuesto; entonces establecer `ZOOM_VIDEO_RECORDING_PRIVACY_APPROVED=true`. Se conservan las reglas de [grabaciones privadas](live-recordings.md).
4. Publicar Learning con la migración y el contrato sincronizado del Hub. Mantener inicialmente `LIVE_VIDEO_PROVIDER=zoom-meeting` o sin configurar. Tras la prueba real, habilitar nuevas aulas con `LIVE_VIDEO_PROVIDER=zoom-video`. Un valor desconocido se rechaza; no hay cambio silencioso de proveedor ante un fallo.
5. Conservar el worker `scripts/live-recording-worker.ts`, almacenamiento privado, ffprobe y retención existentes. Video se reconcilia por REST con cursor por cuenta y ventanas paginadas; no requiere nuevos webhooks. Sin anfitriones Meeting configurados, el worker puede procesar únicamente Video. Con aulas Meeting históricas, conservar también sus credenciales y anfitriones para recuperar sus grabaciones.

La clave API necesita permisos para crear/borrar configuración de sesiones, consultar sesiones vivas, terminarlas, listar grabaciones de cuenta/instancia y descargarlas. Revisar scopes vigentes antes de otorgarlos: [credenciales](https://developers.zoom.us/docs/build/get-credentials/), [peticiones](https://developers.zoom.us/docs/build/api-request/), [API Video SDK](https://developers.zoom.us/docs/api/video-sdk/).

## Contrato y operación

El grant `zoom` acepta Meeting histórico o `{provider:"zoom-video",sessionName,token,userName,password,recording_required:true}`. Learning deriva nombre, usuario, rol y clave de sesión. Video no utiliza ZAK. El JWT dura trece horas y expone solo identificadores y permisos de ingreso. Como credencial bearer puede reutilizarse hasta caducar: cerrar el aula impide nuevas emisiones y termina instancias vivas, pero no revoca criptográficamente un token ya entregado. No almacenar grants ni registrarlos en logs.

Programar crea una configuración REST con nombre `soflia_<request_id>`, contraseña aleatoria y `auto_recording=cloud`; sin confirmación de esa opción no se entrega el aula. La primera unión inicia la instancia multimedia. Si todos salen y vuelven, Zoom puede generar otra instancia: se conserva cada grabación por su ID real, comprobando nombre y clave antes de importar. Cuenta y anfitrión internos llevan prefijo `video:` para no mezclarse con Meeting.

Ante una programación `uncertain`, no generar automáticamente otro request_id. Comprobar el nombre en Platform Studio y reconciliar la solicitud antes de repetir: una respuesta perdida puede ocultar creación o transacción confirmada. Los logs conservan IDs de solicitudes y nunca contraseñas o URLs de descarga.

## Límites y consumo

Video no reserva anfitriones ni licencias Meetings. Capacidad y simultaneidad dependen del contrato Video SDK; no se afirma capacidad ilimitada. La agenda conserva el máximo actual de ocho horas por aula; un curso de doce horas puede programarse como cuatro aulas de tres horas. El consumo suma el tiempo conectado de todos, incluidos docentes. Grabación y almacenamiento pueden añadir cargos. Instalar el SDK no contrata un plan ni garantiza créditos gratuitos.

Hub muestra hasta nueve cámaras a la vez para limitar carga local; mantiene audio y lista de participantes. Conectar audio permite escuchar y hablar; cámara y pantalla requieren acción del usuario. La categoría Webinar conserva las herramientas académicas de Soflia; Video SDK no añade automáticamente el producto Zoom Webinars, sus panelistas ni controles de publicación restringida. Hub sincroniza las salas académicas con subsesiones audiovisuales cuando la cuenta lo permite. Usa user_key firmado para asignar participantes, conserva separados los IDs de sesión principal y subsesiones, espera la visita antes de cambiar la presencia académica y devuelve al grupo principal a quien ya no esté en el plan autorizado. No utiliza nombres visibles para identificar personas. Las escenas y composición audiovisual conservan sus límites actuales.

## Prueba y reversión

Con instructor y dos alumnos asignados, comprobar audio, cámara, pantalla, cancelación del selector, salida durante ingreso, reconexión, cierre y revocación académica. Abrir dos aulas simultáneas y revisar aislamiento/consumo. Confirmar grabación cloud, importar al almacenamiento privado, revisar cobertura y publicar usando los permisos actuales de Learning. Intentar acceso desde otra organización. Ensayar una clase de tres horas antes de un curso pagado. Los mocks no demuestran calidad de red, permisos de la cuenta ni facturación.

Para revertir nuevas programaciones, volver a `LIVE_VIDEO_PROVIDER=zoom-meeting`. Conservar código compatible, migración, credenciales y worker mientras existan aulas Video o grabaciones pendientes. No eliminar tablas ni archivos como rollback. Los checkouts principales y sus cambios anteriores se preservan durante la preparación en worktrees.
