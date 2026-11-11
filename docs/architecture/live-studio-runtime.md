# Backend del estudio síncrono

Estado: implementación local, pendiente de despliegue. Actualizado: 2026-10-12.

La migración `supabase/migrations/20261012193000_live_studio_runtime.sql` depende del aula colaborativa. `POST /api/auth/live/studio` verifica bearer Hub, organización y acceso de curso. El contrato y reducer en `apps/web/src/features/live/live-studio*.ts` son la fuente para la copia generada en Hub.

El RPC service-role revalida acceso, bloquea la sesión, compara revisión y deduplica por actor/comando. La presencia fusiona exclusivamente al actor; renovar fecha no publica revisión. Realtime publica solo `live_studio_revisions` con SELECT RLS autorizado, nunca mensajes, entregas o respuestas. Clientes no leen/escriben las tablas de estado ni el ledger directamente.

Storage usa bucket privado `live-studio-assets` de hasta 25 MB por objeto, URLs de subida y lectura firmadas y comprobación de ruta, MIME y tamaño. Las escenas/materiales Engine deben estar previamente subidos a la sesión de destino. Importar manifiesto v1 valida curso y límites, sin ejecutar contenido. No hay publicador automático Engine en esta fase.

Configurar `ZOOM_MEETING_SDK_CLIENT_ID` y `ZOOM_MEETING_SDK_CLIENT_SECRET` de la cuenta maestra. Conservar OAuth S2S para programación. El host de la sesión requiere permiso para obtener ZAK. El rol de firma se deriva del servidor y se revalida contexto tras llamadas externas. Credenciales SDK y ZAK no se persisten en navegador ni se registran.

El job de retención limpia ledger/estado y reclama hasta 100 assets por ejecución. Storage API borra bytes antes de confirmar el ledger. Subidas huérfanas y material retirado tienen 24 horas de gracia; archivos de sesiones cerradas siguen la política de organización. El bloqueo de sesión impide publicar archivos ya reclamados y los fallos conservan reclamaciones para reintento. Verificar la programación del job en staging. Salas académicas, moderación del aula y escenas sincronizadas están separadas de salas de audio, expulsión audiovisual y fuente transmitida en Zoom. No se declara completada la integración de esas rutas.

Pruebas de migración PGlite cubren reejecución, CAS, deduplicación, acceso RLS, revocación y presencia concurrente. El frontend y operación completa se documentan en `docs/architecture/learning-live-workspace.md` y `docs/operations/live-studio-runtime.md` del repositorio SofLIA-HUB.

Rollback: retirar endpoint o volver al cliente anterior, preservando tablas y bucket. No se ejecutó SQL remoto, no se publicó y no se modificaron secretos.

## Preparación y participación coordinadas

La continuación del 3 de noviembre de 2026 añade reacciones y cadencia transaccionales, negociación de respuesta legacy y entrega firmada de preparación desde Engine. El contrato, autorización, límites y migración están en [preparación de sesiones](live-engine-preparation.md). La firma del servidor no sustituye membresía, permiso docente ni comprobación de curso en SofLIA Academy.
