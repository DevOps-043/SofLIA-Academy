# Sesiones síncronas de Academy en Soflia Hub

Estado: implementación local y contrato de integración. Decisión de producto confirmada el 10 de octubre de 2026. Destino vigente: aplicación de escritorio Soflia Hub.

## Distribución de responsabilidades

Academy administra cursos, permisos, instructores, reuniones/webinars y agenda. El dashboard muestra sesiones asignadas como tarjetas y abre el escritorio mediante una referencia. Hub autentica al usuario y ejecuta la experiencia Zoom en su navegador integrado. No se agrega un aula web equivalente ni se utiliza el antiguo trigger de monitoreo como autorización de una clase.

Se retiraron de Academy LiveRoom, ZoomStage, useLiveRoom, ChatPanel, ActivityPanel, ActivityCard y los servicios de chat, actividades, archivos, respuestas, asistencia declarada y transcripción en vivo. Se retiraron Meeting SDK, firma de SDK, parche de Webpack, comprobación del bundle y permisos CSP de Zoom para el aula. Los cursos asíncronos y sus actividades no cambian.

La programación y lifecycle REST permanecen en Academy como administración. Hub no requiere credenciales administrativas Zoom ni service-role. Los datos históricos del aula y sus controles RLS se conservan; no se eliminaron datos remotos.

## Acceso al panel de instructor

El menú de perfil y la barra lateral de Empresa apuntan a `/{orgSlug}/instructor`. El menú muestra el acceso a administradores y al docente autorizado por la organización, sin exigir que su rol global sea Instructor. Para miembros consulta `GET /api/{orgSlug}/live/capabilities` con la sesión web verificada; solo devuelve canTeach. Cuenta, organización y membresía deben seguir activas.

La autenticación web de Live usa la misma autorización académica que el acceso de Hub; no rechaza a un docente vinculado por pertenecer al rol global Instructor. Las sesiones y la administración de instructores son funciones permanentes del producto. No requieren una variable de activación: catálogo, formulario y endpoints operan siempre según los permisos del usuario. La configuración de credenciales Zoom y la migración siguen siendo requisitos técnicos de integración.

## Contrato de lanzamiento

```text
soflia://learning-session?organization_slug=<slug>&session_id=<uuid>
```

Solo se aceptan esos dos parámetros, sin URL remota, contraseña, token o rol. La navegación ocurre por clic de la persona; el navegador/OS puede pedir confirmar la apertura de Hub. La ficha de Academy permite volver a abrir la sesión o consultar su estado.

Hub recibe la referencia al arrancar o al estar abierto. La conserva mientras se completa autenticación; aprovecha el inicio federado PKCE existente si está disponible. La lectura de la referencia pendiente es no destructiva y se confirma su consumo al procesarla, para soportar StrictMode y recargas.

## Contrato HTTP entre main y Academy

```text
POST /api/auth/live/access
Authorization: Bearer <access token SOFIA verificado en main>
Content-Type: application/json

{ "organization_slug": "acme", "session_id": "<uuid>" }
```

Academy valida el bearer mediante Supabase Auth y verifica cuenta no bloqueada, organización activa, membresía activa, asignación vigente del curso e instructor. No se usa user_id ni rol enviados por el cliente. Asignaciones canceladas se excluyen del acceso, catálogo y RLS.

Respuesta privada:

```json
{
  "session": {
    "id": "<uuid>", "title": "Clase", "session_type": "meeting",
    "starts_at": "<ISO 8601>", "status": "live"
  },
  "role": "participant",
  "join_url": "<URL Zoom autorizada>"
}
```

Cache-Control es no-store y Referrer-Policy es no-referrer. Solo el instructor responsable con vínculo activo recibe start_url. El ID del anfitrión debe coincidir en el recurso Zoom, las credenciales privadas guardadas al crear la sesión y la vinculación vigente del instructor. Además, Zoom debe confirmar que ese usuario está activo y pertenece a la cuenta maestra configurada. Un administrador que supervisa recibe join_url de participante. Sesiones cerradas, recursos sin acceso, destino no Zoom y cuentas ajenas son rechazados.

El proxy tiene presupuesto específico de acceso académico por IP, separado de login. El handler limita además por usuario verificado. Esto permite clases detrás de NAT sin consumir el límite de intentos de autenticación.

El token OAuth administrativo se conserva solo en memoria hasta antes de su vencimiento. Solicitudes simultáneas comparten su renovación para evitar autenticar la cuenta Zoom por cada alumno. Un 401 invalida el token; no se reintentan automáticamente mutaciones REST.

Hub construye el endpoint desde VITE_LEARNING_BASE_URL; no toma el origen del deep link. Main no sigue redirects HTTP del endpoint y vuelve a comprobar su identidad antes de abrir la pestaña. La URL debe ser HTTPS de zoom.us/zoom.com o sus subdominios, sin credenciales de URL ni puerto no estándar.

## Navegador de Hub

La apertura utiliza una pestaña sensible: la UI expone solo su origen, no conserva la URL de acceso en historial, pestañas cerradas, restauración o sincronización de sesiones. Los duplicados en vuelo se unen y las copias de pestaña conservan el modo sensible. El resto del navegador conserva su comportamiento.

Popups heredan sensibilidad; errores y eventos públicos redactan el destino privado. Se bloquean lectura de documentos y herramientas del agente en esa pestaña. El renderer espera hasta 30 segundos a que la identidad llegue a main, cancelando efectos anteriores si se desmonta o cambia la cuenta. Un 401 del backend se considera denegación.

Zoom proporciona audio, video, pantalla, admisión y chat de su cliente web. Abrir la pestaña no acredita admisión a una reunión ni otorga permisos multimedia automáticamente. El [enriquecimiento V2](zoom-enrichment-v2.md) agrega antesala y colaboración nativa en Hub, con persistencia/autorización Academy: preguntas con votos, prácticas, ayuda y Pulse Checks. La nueva API educativa no restaura el aula multimedia web ni los servicios retirados. RTMS, LTI, LRS externo y Computer Use contextual siguen pendientes de configuración y validación de proveedores reales.

## Reuniones y webinars

La migración aditiva 20261010173000_live_hub_desktop.sql agrega session_type y zoom_webinar_id y conserva zoom_meeting_id para reuniones existentes. La finalización de programación sigue siendo transaccional/idempotente. Se crean reuniones type 2 o webinars type 5; cancelación/finalización consulta el recurso correspondiente.

El webhook administrativo conserva HMAC y cuenta autorizada y agrega eventos webinar.started/ended/deleted. El inicio se refleja desde Zoom, no desde un PATCH de alumno. Se retiran las publicaciones Realtime de mensajes y actividades antiguas, conservando sus tablas.

### Configuración y diagnóstico

Guardar `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID` y `ZOOM_CLIENT_SECRET` configura una sola integración administrativa con la cuenta Zoom maestra. Cada instructor no crea una app ni gestiona claves. Un administrador o propietario de su organización vincula al miembro activo de Academy con un anfitrión activo de esa cuenta maestra. Los correos pueden diferir: la autorización es el vínculo explícito por organización e instructor, conservando el ID canónico devuelto por Zoom.

La programación guarda de forma privada el ID del anfitrión utilizado. La apertura comprueba ese ID frente al recurso de Zoom y al vínculo vigente del instructor; cambiar o retirar el vínculo no concede acceso de anfitrión a sesiones de otro usuario. No se asigna la cuenta maestra automáticamente a todos los miembros o empresas.

Esta integración Server-to-Server solo administra usuarios de la cuenta Zoom conectada. Una empresa con una cuenta Zoom independiente necesitaría una conexión OAuth autorizada para esa empresa; ese flujo no está implementado por las tres variables globales. La cuenta maestra tampoco añade por sí sola licencias de anfitrión, capacidad de sesiones simultáneas ni permisos de webinars. Véase [Aplicaciones internas de Zoom](https://developers.zoom.us/docs/internal-apps/).

Reunión es el tipo predeterminado para una clase. Webinar requiere licencia Zoom Webinars para el anfitrión y los scopes correspondientes; los permisos de reuniones no habilitan webinars. Véase [Crear un webinar](https://developers.zoom.us/docs/api/meetings/#tag/webinars/POST/users/{userId}/webinars).

La programación valida los campos en el cliente y vuelve a validarlos en el servidor. Una fecha pasada informa que se necesita una fecha y hora futura. Los errores de programación y vinculación aparecen en su propio formulario; los fallos de carga del catálogo permanecen en la cabecera. Cambiar el filtro de instructores no convierte un error anterior de un formulario en un fallo de la agenda.

El adaptador Zoom distingue anfitrión inexistente, permisos/licencia, autenticación y límite de solicitudes mediante códigos y estados HTTP. Devuelve mensajes propios sin publicar cuerpos ni mensajes remotos, y no reintenta automáticamente mutaciones. Se conserva la solicitud idempotente ante fallos que requieren reconciliación.

## Límite de revocación

El acceso se vuelve a autorizar en cada apertura desde Hub. Una join_url genérica de Zoom no se convierte en un enlace individual o efímero por consultarla en ese momento. Su copia puede seguir funcionando fuera de Academy según los controles Zoom del recurso. Registro/autenticación Zoom e invalidación de accesos individuales son necesarios si producto requiere esa revocación adicional.

## Despliegue y verificación

1. Aplicar la nueva migración mediante el flujo habitual de Supabase; esta tarea solo la prueba localmente.
2. Desplegar Academy con API de acceso, contrato de tipos y catálogo.
3. Publicar Hub con receptor, IPC y wrapper. Configurar el origen público VITE_LEARNING_BASE_URL y el SSO existente; no agregar secretos al bundle.
4. Verificar scopes REST para reuniones, webinars y lectura de usuario Zoom. Academy no tiene una bandera de activación del módulo.
5. Probar con docente, dos alumnos y dos organizaciones: arranque frío/caliente, login, revocación, webinar, permisos, pantalla, cierre y reapertura.

No se desplegó ni publicó software ni se ejecutó una reunión real. La evidencia de Hub se registra en openspec/changes/launch-learning-live-sessions/reports/verification.md. Rollback de aplicación: volver a una versión compatible y validada, conservando base e historial. Las versiones anteriores de planes Word quedan como antecedentes; los documentos Learning Hub v2 describen la decisión vigente.
