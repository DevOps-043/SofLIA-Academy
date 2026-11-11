# Enriquecimiento Zoom-SofLIA V2

Estado: implementación local del aula colaborativa; fases externas pendientes de configuración y validación. Fecha: 10 de octubre de 2026.

Fuente de producto: [Propuesta de enriquecimiento](https://docs.google.com/document/d/1nvA2Z8rbU3l4gLWrdqOt1P85f3J6U7WoqJ_-OeYe1AM/edit). Conserva la [arquitectura Academy–Hub](learning-hub-synchronous-plan.md). No hay aula multimedia web nueva.

## Entrega implementada

| Propuesta | Implementación y límite |
|---|---|
| E1/E2: antesala | Hub muestra reglas, FAQ, inicio y respuesta del LMS antes del clic Entrar. La disponibilidad del LMS no acredita red multimedia ni admisión Zoom. No se añadió vídeo remoto sin un recurso aprobado. |
| E6: Chat y Q&A | Canales SofLIA independientes del chat Zoom, preguntas con voto único, resolución docente y FAQ exacta privada. |
| E6: Muro de prácticas | Aportaciones, enlaces HTTPS y habilidad del curso; revisiones entre pares, sin autorrevisión. IA socrática privada a petición y con consentimiento. |
| E6: Pulse Checks | Una pregunta activa por sesión, 2–6 opciones, una respuesta inmutable por persona, agregados del instructor. Las propuestas de IA se revisan como borrador antes de publicar. |
| Ayuda en grupos | Solicitud contextualizada con sala declarada y resolución docente. No equivale a detectar silencio, invitar bots ni gestionar breakout rooms Zoom. |
| Gobernanza | Política de administrador, consentimiento por sesión/versionado, revocación, auditoría visible al administrador y retención. IA y telemetría parten desactivadas. |
| E10: xAPI/skills | Eventos mínimos en formato xAPI 1.0.3 asociados a `course_skills`. Registran interacción, no acreditan nivel ni actualizan `user_skills`. No hay todavía un LRS conectado. |

## Contrato HTTP

`POST /api/auth/live/workspace`, bearer SOFIA verificado con `getUser`. La ruta queda exenta del login por cookie únicamente porque su handler valida el bearer. No recibe rol ni identidad del cliente. Cuerpo: `organization_slug`, `session_id`, `operation`. El [contrato versionado](../../apps/web/src/features/live/workspace.contract.ts) es la fuente de verdad y se copia de forma reproducible al consumidor Hub.

Operaciones: snapshot, comando con UUID de idempotencia, orientación privada y propuesta de Pulse Check. Comandos: publicar, revisar, votar, resolver, publicar/cerrar/responder Pulse Check, reglas/FAQ, consentimiento y política. Solo el administrador cambia política; instructor responsable o administrador gestionan actividad. Cada RPC revalida cuenta, organización, membresía y curso.

Entrada máxima 32 KiB y salida de Hub 512 KiB; listas de 20 posts por canal, 5 Pulse Checks, 100 habilidades y 20 auditorías. Sin URL Zoom ni secretos en respuestas. `Cache-Control: no-store` y `Referrer-Policy: no-referrer`. Presupuesto IP académico separado de login; límites adicionales por actor distinguen lectura, mutación e IA. El límite de IA existente es compartido con otras generaciones de la plataforma.

## Persistencia y privacidad

La [migración aditiva](../../supabase/migrations/20261010225812_live_collaborative_workspace.sql) crea tablas `live_workspace_*` y `live_learning_events` en SOFIA. RLS habilitado; grants directos y RPC revocados de anon/authenticated. Solo el servidor accede; sus funciones invoker realizan autorización propia. No se reactivan publicaciones Realtime ni tablas de aula antiguas. Escrituras de cada sesión se serializan para proteger invariantes; las políticas organizacionales usan locks compartidos salvo actualización.

La migración admite el esquema de Academy que tiene `course_skills` sin un catálogo local `public.skills`. En ese caso el aula opera y la lista de nombres de habilidades queda vacía; los IDs recibidos siguen validándose contra el curso de la sesión. Si existe el catálogo, se conservan sus claves foráneas y se devuelven sus nombres activos. No se crea un catálogo vacío ni se eliminan controles de acceso para instalar el aula.

Los UUID identifican comandos y eventos. Repetir clave con otro actor, sesión o contenido genera conflicto. El cliente conserva una mutación incierta y reintenta exactamente la misma solicitud antes de permitir una nueva. El registro de idempotencia dura 24 horas; una publicación/pulse conserva su UUID para impedir duplicación tras ese plazo.

FAQ exacta no llama a un modelo ni publica la pregunta. La IA reutiliza el gateway administrado existente, salida Zod, límite de tokens, timeout y evaluación de inyección. No abre enlaces ni ejecuta herramientas. El contexto del instructor contiene hasta 10 preguntas/prácticas de los últimos 15 minutos, únicamente de participantes aún autorizados y con consentimiento vigente. Revalidar las fuentes después de generar impide entregar una propuesta tras revocación. No se envían nombres, votos, transcripciones ni perfiles de RRHH al modelo.

Los eventos xAPI omiten el texto de chat/prácticas. La política/versionado y consentimiento se verifican dentro de la transacción. Revocar telemetría elimina los eventos propios almacenados; deshabilitarla elimina los de la organización. Esto no puede retirar datos que en una futura integración ya hayan salido a terceros. La auditoría conserva actor/acción/versionado durante 90 días, sin contenido de aportaciones.

La retención de aportaciones, respuestas y eventos es 1–90 días (30 por defecto). Las lecturas ya excluyen contenido vencido. El operador debe programar al menos diariamente `POST /api/internal/jobs/live-workspace-retention` con `QUEUE_INTERNAL_SECRET` para ejecutar la purga física. No se creó una automatización personal ni se configuró un scheduler remoto durante esta tarea.

## E9/E10: requisitos externos pendientes

1. **RTMS y termómetro IA:** registrar la app Zoom, verificar scopes/licencias/créditos, procesar webhooks firmados y correlacionar reunión/stream/participante con identidad LMS. El consumidor WebSocket debe ser un servicio persistente, con cola acotada, backpressure, deduplicación por stream/secuencia, cierre y recuperación. Chunks de transcripción requieren autorización de todos los participantes incluidos, retención, presupuesto de tokens y separación entre medidas declaradas e inferencias con evidencia. No correr un consumidor permanente en una función Next.js ni extraer medios de la pestaña sensible. [Documentación RTMS](https://developers.zoom.us/docs/rtms/).
2. **Breakout automático:** confirmar eventos/media que el proveedor realmente ofrece para subsesiones. Definir identidad, autorización por sala, umbral de inactividad y canal de intervención. El botón de ayuda implementado no prueba esa capacidad.
3. **LTI 1.3:** elegir un proveedor y registro de plataforma; verificar issuer/client/deployment, JWKS rotables, nonce/state de un solo uso, aud/azp/exp y claims de recurso/rol/contexto. Aprobar orígenes de iframe y CSP; aplicar ACL del curso y políticas de datos antes del lanzamiento. No tratar un iframe genérico como LTI Advantage ni permitir URLs arbitrarias desde alumnos.
4. **Computer Use:** reutilizar el agente de escritorio y sus aprobaciones vinculadas a identidad, destino, alcance, caducidad y hash de acción. Revalidar política, consentimiento y aprobación justo antes de ejecutar. Vista previa del resultado, protección ante cambios de contexto y auditoría mínima; sin shell genérico ni acciones sobre la pestaña Zoom sensible. El uso del agente existente fuera del aula no queda autorizado por esta propuesta.
5. **LRS y talento:** configurar endpoint/versionado/credenciales y autorización de exportación; consumidor idempotente con acuses, reintentos/backoff y cancelación por revocación. Crear evaluaciones/ontología y validarlas pedagógicamente antes de inferir brechas de habilidades o alertas de RRHH.
6. **Flow of Work:** elegir conexiones Slack/Salesforce y destinatarios. Los borradores y nudges requieren aprobación y reglas corporativas de envío. La propuesta no autoriza envíos a personas ni configuración de integraciones reales desde esta tarea.

El Video SDK crea su propio modelo de sesiones; no reemplaza de forma transparente los recursos REST meeting/webinar actuales. Cualquier migración multimedia requiere una decisión de producto, compatibilidad y un piloto independientes. [Video SDK](https://developers.zoom.us/docs/video-sdk/).

## Despliegue, validación y rollback

Aplicar migración con el flujo habitual de SOFIA, desplegar Academy y luego un Hub compatible con contrato versión 1. Ejecutar purga programada y probar dos organizaciones, instructor, alumnos, revocación durante IA, webinar, arranque frío/caliente y sesión cerrada. No se afirma cumplimiento/certificación ISO 27001 por añadir este panel: exige controles y evidencia operativa adicionales.

Pruebas SQL ejecutan las tres migraciones Live en PGlite y comprueban aislamiento, permisos, concurrencia, votos/respuestas, xAPI y retención. Las pruebas de servicio comprueban FAQ privada y revocación durante generación; las de Hub comprueban antesala, transporte, logout, límites y reintentos. No se ejecutó RTMS ni una reunión Zoom real.

Rollback: regresar aplicaciones a una versión validada conservando tablas/historia; desactivar IA/telemetría en política. No borrar tablas como rollback. La versión de Hub anterior seguirá abriendo Zoom directamente; despliegue coordinado necesario para que todos usen antesala.
