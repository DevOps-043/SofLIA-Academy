# Grabaciones de webinars

Estado: implementado y verificado localmente; pendiente de activación y PoC real.
Cambio coordinado: SofLIA-HUB/openspec/changes/record-webinars-and-publish-replays.

Las aulas nuevas pueden usar Video SDK. Su activación, credenciales independientes e importación REST se describen en [aulas con Video SDK](live-video-sdk.md). Los requisitos de anfitrión Meeting y licencia Webinars de esta guía corresponden a las sesiones Meeting anteriores.

## Responsabilidad y acceso

Soflia programa los eventos mediante anfitriones centrales de su cuenta Zoom.
El instructor usa su identidad de Learning y no necesita asociar una cuenta
Zoom ni comprar una licencia individual. La plataforma conserva la obligación
de contratar capacidad de grabación cloud y, para recursos webinar, Zoom Webinars.
Almacenar el vídeo en Soflia no elimina ese requisito del proveedor.

Se configura automático cloud tanto para reuniones como webinars del producto.
La grabación no depende del disco del instructor. Cerrar Hub no interrumpe la
importación del archivo; si la salida del anfitrión termina el evento en Zoom,
la captura también termina. La aplicación nunca reconstruye minutos perdidos.
Para ingresar al webinar, el SDK recibe el correo del anfitrión central o el del
perfil de Learning del participante. Se deriva en el servidor y se transmite
solo en el grant de ingreso, sin crear ni exigir una cuenta Zoom al docente.

Los vídeos quedan en el bucket privado live-recordings de SOFIA. Una política
restrictiva de storage.objects deniega acceso directo de anon/authenticated,
incluso con políticas permisivas generales. Tablas y RPC requieren service_role.
El servidor comprueba organización activa, usuario, membresía, curso,
capacidad docente y moderación. Las URLs Zoom y credenciales nunca son un DTO público.

La intención de repetición empieza desactivada. Una edición completa puede
publicarse al finalizar con intención vigente y autorización revalidada. Huecos,
duración insuficiente o cobertura desconocida exigen revisión expresa de esa
edición. Retirar incrementa revisión; un job tardío no la republica. Un segmento
nuevo invalida la publicación anterior. replay_enabled debe aprobarse por
organización antes de permitir publicaciones.
En webinars, práctica activada o configuración de ensayo desconocida impide la
publicación por intención genérica. El archivo se conserva y exige revisión.

## Contratos y flujo

La fuente compartida está en apps/web/src/features/live/live-studio.contract.ts y
recordings/contract.ts. El Hub sincroniza tres archivos con
scripts/quality/sync-learning-studio.mjs; no mantiene otro contrato manual.
Las operaciones snapshot, intent, publish, play y retry están tipadas y acotadas.
Hub reutiliza /api/auth/live/studio y su IPC existente. La web usa
/api/[orgSlug]/live/[sessionId]/recordings, autenticación web y CSRF del middleware.

El receptor firmado /api/internal/jobs/zoom-live valida cuerpo de hasta 1 MiB,
timestamp/HMAC, cuenta, sesión y anfitrión. Conserva run/files/job antes de responder,
sin descargar vídeos en la petición. UUID identifica cada ejecución. Un inicio
tardío no reabre procesamiento. El cierre se conserva aunque llegue antes del vídeo.

El worker es un proceso Node separado de Next/serverless. Puede ejecutarse como
servicio continuo o por lotes finitos en GitHub Actions (véase más abajo). Reclama trabajos
con lease de cinco minutos, heartbeat de veinte segundos, seis intentos y backoff
con jitter. Postgres limita a dos transferencias globales y una por organización.
Un fallo de un propietario antiguo no modifica el trabajo de otro.

Se seleccionan todos los MP4 del layout principal, con preferencia por pantalla
y presentador. Descarga HTTPS con destinos y redirecciones permitidos; OAuth se
envía únicamente al origen Zoom inicial. Reanuda con Range/If-Range y ETag fuerte;
sin validador vuelve a copiar. Spool separado por lease impide escritores concurrentes.
Un reinicio del proceso conserva los trabajos y assets confirmados, pero una
descarga local de la concesión anterior se reinicia; sus temporales se limpian
administrativamente. No se promete reanudar multipart entre procesos.

FFprobe valida MP4, vídeo, audio y duración; SHA-256 y tamaño se guardan al confirmar.
El SDK oficial S3 sube partes de 8 MiB, dos en memoria, y aborta multipart ante error.
La reserva de cuota y el ledger anteceden a la subida. Un asset incierto queda privado
para reconciliación; nunca se borra porque la respuesta de confirmación se perdió.
La concesión caducada no puede confirmar ni publicar.

Reconciliación cada cinco minutos: ventana inicial de siete días, hasta diez
páginas de cien eventos por anfitrión/ciclo y checkpoint duradero. Tras una caída
prolongada avanza ventanas de hasta treinta días desde el último cierre consultado.
La primera activación no importa automáticamente todo el histórico anterior.
Solo procesa eventos registrados en Soflia y conserva todo el UUID de instancia.
La reconciliación reclama una concesión por anfitrión y conserva su ventana incluso
si caduca el token de página; reinicia esa ventana sin avanzar ni publicar una edición.

El reproductor concede URLs de 120 segundos después de revalidar acceso y edición.
La caché web se separa por identidad y cerca peticiones con el actor esperado;
un cambio de cuenta desmonta el reproductor anterior.
Renueva preservando posición, y ordena segmentos. Storage sirve Range/seek.
Retirar bloquea nuevas concesiones; una ya emitida puede funcionar hasta vencer.
Contenido ya descargado no puede retirarse del dispositivo del usuario.
Una descarga iniciada antes del vencimiento puede terminar después de este;
el TTL limita nuevas peticiones, no revoca bytes o respuestas ya en tránsito.
Learning reutiliza la actualización de treinta segundos de la ficha; Hub usa
Realtime y el bridge SDK por ventana/origen/nonce, sin un nuevo sondeo del renderer.

## Preparación y activación

1. Aplicar en SOFIA, con autorización y respaldo, las migraciones de sesiones y
   estudio previas, después 20261013180000 a 20261013180400 en orden.
   Los archivos son aditivos y reejecutables; prepararlos no acredita su aplicación.
2. Proveer en el entorno administrado las credenciales Supabase/Zoom ya existentes;
   ZOOM_PLATFORM_HOST_IDS contiene IDs estables de uno a veinte anfitriones centrales.
   Verificar licencias, scopes API/eventos, cuota, grabación automática,
   capacidad webinar, privacidad del original, on-demand/correos y retención Zoom.
   Mantener ZOOM_RECORDING_PRIVACY_APPROVED sin aprobar hasta esa revisión.

   El ingreso del instructor al estudio de Hub usa la aceptación del aviso en
   cada intento. Learning valida la versión aceptada en la petición autenticada
   antes de emitir el acceso y conserva las comprobaciones de la cuenta y de
   grabación automática. En Meeting, la aceptación sustituye la aprobación de
   cuenta para ese ingreso. La aprobación de cuenta se sigue usando al programar
   eventos, en el acceso heredado y para activar aulas del proveedor Video.
3. Configurar RECORDING_S3_ENDPOINT, RECORDING_S3_ACCESS_KEY, RECORDING_S3_SECRET_KEY
   y, si hace falta, RECORDING_S3_REGION. Deben corresponder al Storage de SOFIA,
   bucket live-recordings. Aprobar límites globales del proyecto y del bucket;
   el máximo de código de 50 GiB por archivo no aumenta la capacidad contratada.
   RECORDING_DOWNLOAD_HOSTS solo amplía destinos CDN exactos aprobados; no concede OAuth.
4. Proveer Node compatible con el proyecto, dependencias del lockfile y FFprobe
   administrado mediante RECORDING_FFPROBE_PATH o PATH. RECORDING_SPOOL_DIRECTORY
   debe ser privado, propiedad exclusiva del worker, con disco para los vídeos en vuelo.
   Supervisar el proceso y sus recursos; no ejecutar el worker dentro de una petición
   HTTP o función serverless. Un runner de Actions puede ejecutar el lote finito.
5. Ensayar en staging reunión y webinar reales: automático, host/participante,
   ensayo previo, pausas, reconexión, evento perdido, copia S3 y reproducción.
   Comprobar layout, memoria/disco/tiempo y aislamiento. La recuperación SDK por
   record(start) permanece deshabilitada hasta ZOOM_RECORDING_SDK_RECOVERY_VERIFIED.
6. Crear política organizacional con cuota aprobada. Valores iniciales:
   cuota 50 GiB, privado 90 días y publicado 365 días. retention_approved y
   replay_enabled empiezan false. Aprobar publicación tras el ensayo; aprobar
   retención por separado. Revisar consentimiento y aviso del proveedor.
7. Auditar eventos futuros con recordings:maintenance sin --apply. Aplicar solo
   el conjunto revisado con --apply --confirm. Releer cada evento y verificar.
   No hay backfill indiscriminado de reuniones externas a Soflia.

Comandos locales de información, sin credenciales ni peticiones remotas:

```powershell
npm run recordings:worker -- --help
npm run recordings:maintenance -- --help
```

Comandos operativos posteriores a la aprobación, con secretos provistos por el
entorno y sin leer archivos .env desde los scripts:

```powershell
npm run recordings:worker
npm run recordings:worker -- --once
npm run recordings:worker -- --drain
npm run recordings:maintenance
npm run recordings:maintenance -- --apply --confirm
npm run recordings:maintenance -- --purge --apply --confirm
npm run recordings:maintenance -- --spool-clean --apply --confirm
```

## Importación con GitHub Actions

El workflow [.github/workflows/live-recording-importer.yml](../.github/workflows/live-recording-importer.yml)
ejecuta `recordings:worker -- --drain` desde `main` cada dos horas, en el minuto
17 UTC. También admite **Run workflow** desde Actions para importar de inmediato.
Los horarios de GitHub pueden retrasarse; no hay promesa de importación instantánea.
El lote reconcilia primero, procesa hasta diez trabajos y termina al vaciarse la
cola. La ejecución se cancela a las cuatro horas; Actions tiene diez minutos
adicionales para el cierre y la recuperación. La base de datos conserva leases,
backoff y archivos confirmados. Un fallo recuperable produce una ejecución fallida,
no un éxito aparente. La siguiente ejecución respeta `available_at`.

La ejecución usa Ubuntu estándar, Node 22, FFprobe del sistema y `npm ci` sin
scripts de instalación. Las actions están fijadas por SHA, el token de GitHub solo
lee código y no se persiste en Git. No se ejecuta con secretos en pull requests.
No sube vídeos como artifacts ni usa caché. Los temporales privados desaparecen
con el runner; el archivo definitivo permanece en `live-recordings` de Supabase.

Secretos del repositorio, exclusivos del paso de importación:

| Secreto de Actions | Uso |
| --- | --- |
| `RECORDING_SUPABASE_SERVICE_ROLE_KEY` | Clave de servidor de Learning; acceso administrativo, nunca frontend |
| `RECORDING_ZOOM_VIDEO_API_KEY` | Lectura de grabaciones Video SDK de la cuenta y de una sesión |
| `RECORDING_ZOOM_VIDEO_API_JWT_ISSUER` y `RECORDING_ZOOM_VIDEO_API_JWT_SECRET` | Alternativa a la clave S2S si Zoom requiere JWT. Ambos son obligatorios cuando se usa este modo |
| `RECORDING_S3_ACCESS_KEY` | Acceso S3 al almacenamiento aprobado |
| `RECORDING_S3_SECRET_KEY` | Secreto del mismo acceso S3 |

La clave S2S de lectura no requiere credenciales SDK de ingreso ni permisos para
crear sesiones o eliminar grabaciones. Renovarla antes de su vencimiento y
actualizar el secreto de Actions. El par JWT puede tener acceso más amplio al
proyecto y solo se instala con autorización explícita. Las claves S3 y Supabase actuales son administrativas;
limitar quién puede modificar workflows o `main`. Nunca imprimir valores ni
agregar secretos a issues, commits, artifacts o argumentos de shell.

El runner estándar es gratuito en este repositorio mientras sea público,
según [facturación de Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
Esto no cambia el coste de Zoom, Storage o su tráfico. Si cambia la visibilidad
del repositorio, revisar presupuesto antes de mantener el horario.

El disco anunciado del runner estándar es 14 GB; dependencias y sistema ocupan
parte. Antes de descargar se exige espacio libre para el archivo y una reserva
de 1 GiB. El máximo de código de 50 GiB no garantiza que cualquier archivo quepa
en Actions. Un archivo que no quepa falla sin llenar el disco y requiere un
ejecutor con capacidad suficiente. No se fragmenta ni publica un vídeo truncado.

Rollback: deshabilitar únicamente este workflow desde Actions. Las grabaciones
confirmadas, la cola y la captura en Zoom permanecen; habilitarlo de nuevo retoma
los trabajos elegibles. Render no es necesario para esta modalidad.

## Soporte, retención y recuperación

Supervisar jobs en queued/failed, available_at, updated_at, attempts y lease_until;
comparar sesiones finalizadas con runs disponibles. Sin vídeo confirmado, el panel
del instructor indica revisión; un alumno solo ve ediciones publicadas.
Logs estructurados usan runId/attempt/coverage y no incluyen cuerpos/tokens/URLs.
Un error del proveedor queda pendiente con backoff; retry exige autorización docente.
No reiniciar reservas uncertain con nuevos UUID: reconciliar el request Zoom primero.

La purga exige política de retención aprobada y no legal_hold. Reclama antes de
borrar; confirma cada archivo después. Un fallo entre borrar y confirmar se reintenta
idempotentemente. El hold se establece antes de reclamar la purga; intentar
establecerlo con purga ya iniciada devuelve RECORDING_PURGE_IN_PROGRESS.
La limpieza de huérfanos solo toma assets abandonados >24h y sin lease activo.
Spool-clean solo toma concesiones locales >48h, nombres reconocidos y sin hold.
Ninguno de estos comandos se ejecutó contra archivos reales durante la implementación.
El GC de materiales del estudio tiene otro bucket y no administra estas grabaciones.
No se elimina el original Zoom; requiere política y operación administrativa separadas.

Rollback conservador: deshabilitar replay_enabled por organización y detener el
worker de forma controlada; conservar tablas/bucket/ledger/vídeos. Retirar concesiones
nuevas desde la publicación. Conservar la política de captura obligatoria del proveedor.
No revertir con DROP ni borrar assets. Reanudar reconciliación al corregir la causa.

## Dependencias y límites comprobados

@aws-sdk/client-s3 y @aws-sdk/lib-storage 3.1151.0, Apache-2.0, fijadas exactamente
en package.json/lockfile. Son clientes oficiales de multipart y firmas S3;
evitan implementar criptografía/protocolo propios. Solo se importan en el servidor.
FFprobe es una dependencia operativa y no se descarga ni ejecuta con shell del renderer.

Fuentes oficiales: [Zoom REST](https://developers.zoom.us/docs/api/meetings/),
[multipart Supabase](https://supabase.com/docs/guides/storage/uploads/s3-uploads)
y [compatibilidad S3](https://supabase.com/docs/guides/storage/s3/compatibility).
La licencia/capacidad de la cuenta real y el flujo audiovisual real siguen pendientes
de PoC autorizada; las pruebas locales no los acreditan.

## Diagnóstico seguro

npm run recordings:health -- --help describe el diagnóstico. Sin --database comprueba exclusivamente la presencia de nombres de configuración y la aprobación de privacidad, sin leer archivos .env ni contactar servicios. No imprime valores. Con --database consulta contadores de trabajos pendientes/en ejecución/fallidos, leases vencidos y última actividad. La última actividad no demuestra que un worker esté vivo: el resultado conserva worker_liveness como unknown. Ni configuración completa ni contadores sustituyen el piloto de captura, archivo y reproducción real.

La preparación desde Engine y la participación negociada del aula se describen en [integración de preparación](architecture/live-engine-preparation.md). Estas funciones no activan grabación, licencias ni publicación por organización.
