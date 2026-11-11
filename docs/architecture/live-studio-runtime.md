# Backend del estudio síncrono

Estado: implementación local, pendiente de despliegue. Actualizado: 2026-10-12.

La migración `supabase/migrations/20261012193000_live_studio_runtime.sql` depende del aula colaborativa. `POST /api/auth/live/studio` verifica bearer Hub, organización y acceso de curso. El contrato y reducer en `apps/web/src/features/live/live-studio*.ts` son la fuente para la copia generada en Hub.

El RPC service-role revalida acceso, bloquea la sesión, compara revisión y deduplica por actor/comando. La presencia fusiona exclusivamente al actor; renovar fecha no publica revisión. Realtime publica solo `live_studio_revisions` con SELECT RLS autorizado, nunca mensajes, entregas o respuestas. Clientes no leen/escriben las tablas de estado ni el ledger directamente.

Storage usa bucket privado `live-studio-assets` de hasta 25 MB por objeto, URLs de subida y lectura firmadas y comprobación de ruta, MIME y tamaño. Las escenas/materiales Engine deben estar previamente subidos a la sesión de destino. Importar manifiesto v1 valida curso y límites, sin ejecutar contenido. No hay publicador automático Engine en esta fase.

Configurar `ZOOM_MEETING_SDK_CLIENT_ID` y `ZOOM_MEETING_SDK_CLIENT_SECRET` de la cuenta maestra. Conservar OAuth S2S para programación. El host de la sesión requiere permiso para obtener ZAK. El rol de firma se deriva del servidor y se revalida contexto tras llamadas externas. Credenciales SDK y ZAK no se persisten en navegador ni se registran.

El job de retención limpia ledger/estado y reclama hasta 100 assets por ejecución. Storage API borra bytes antes de confirmar el ledger. Subidas huérfanas y material retirado tienen 24 horas de gracia; archivos de sesiones cerradas siguen la política de organización. El bloqueo de sesión impide publicar archivos ya reclamados y los fallos conservan reclamaciones para reintento. Verificar la programación del job en staging. Salas académicas, moderación del aula y escenas sincronizadas están separadas de salas de audio, expulsión audiovisual y fuente transmitida en Zoom. No se declara completada la integración de esas rutas.

Pruebas de migración PGlite cubren reejecución, CAS, deduplicación, acceso RLS, revocación y presencia concurrente. El frontend y operación completa se documentan en `docs/architecture/learning-live-workspace.md` y `docs/operations/live-studio-runtime.md` del repositorio SofLIA-HUB.

Rollback: retirar endpoint o volver al cliente anterior, preservando tablas y bucket. No se ejecutó SQL remoto, no se publicó y no se modificaron secretos.


## Reacciones y cadencia de mensajes

El cambio local de 24 de octubre añade `reaction` y `chat_interval` al contrato
académico. Reacciones: seis emojis permitidos, identidad derivada del servidor,
ventana visible de cinco segundos, cien eventos como máximo y un segundo entre
reacciones por usuario. No se insertan en mensajes. El acceso bloqueado y la
configuración de reacciones se verifican; el modo lectura solo afecta mensajes.
Eventos visibles únicamente en la sala actual.

El instructor establece 0–300 segundos de espera entre mensajes de participantes;
0 la desactiva. Es por usuario/sesión y sobrevive cambios de sala e historial.
El ledger separado de mensajes mantiene solo la participación propia en la
proyección; se poda a cinco minutos al procesar comandos. El instructor está
exento de espera de mensajes. Dominio valida primero y la RPC verifica de nuevo
contra estado persistido bajo bloqueo de sesión, antes de guardar hora de base
de datos. CAS/idempotencia y los permisos existentes se conservan. HTTP 429 no
se debe reintentar automáticamente.

Migración incremental: `supabase/migrations/20261024180000_live_studio_participation.sql`.
Reentrante, reemplaza live_studio_commit, sin nuevas tablas o permisos. Se probó
localmente en PGlite, incluida aplicación doble, roles, deduplicación, concurrencia
y payload con ledger manipulado. No se aplicó SQL remoto ni se publicó API.

Orden de rollout: migración en staging, API Academy, comprobar consumidores
anteriores, después Hub que negocia por cabecera `X-Soflia-Studio-Participation: 1`. Sin negociación, el servicio
proyecta exactamente los campos del snapshot anterior; nuevos comandos requieren
negociación. El contrato conserva la unión Meeting/Video ya consumida por Hub,
sin activar un proveedor adicional ni cambiar credenciales. Probar dos cuentas
reales antes de generalizar. Para rollback de funcionalidad, poner intervalo 0 y
revertir UI/API coordinadamente; conservar estado y función mientras exista Hub
nuevo. No hacer DROP. Restaurar función anterior solo después de retirar los
comandos nuevos; los datos no requieren borrado.


Validación local de este cambio: 21 archivos / 133 pruebas de live aprobados;
SQL de participación aplicado dos veces en PGlite con concurrencia, deduplicación,
roles y timestamp sellado por base de datos. Tipos estrictos del contrato y dominio
aprobados. El typecheck global mantiene errores de módulos/configuración ajenos
al cambio y ESLint no encuentra @typescript-eslint/recommended; no se modificó
su baseline. El reporte completo del consumidor está en Hub, cambio OpenSpec
redesign-participant-studio, reports/reactions-and-chat-interval.md. El ejemplo
loopback no acredita Realtime Supabase ni una reunión Zoom real.


Corrección de ingreso con API anterior: Hub ya no agrega participation_version al
JSON, porque el contrato anterior es estricto. La cabecera nueva se ignora en el
servidor anterior y se interpreta en el nuevo. La respuesta moderna confirma
snapshot.participation_version=1; sin confirmación Hub oculta comandos nuevos y
conserva aula/chat/medios anteriores. El parámetro JSON opcional queda aceptado
solo para consumidores intermedios. La cabecera no autoriza ninguna operación:
se siguen verificando bearer, organización, membresía y rol en el servidor.
