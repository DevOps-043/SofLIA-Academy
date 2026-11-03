# Preparación de sesiones desde Engine

Estado: implementación local coordinada, pendiente de despliegue y piloto. Fecha: 2026-11-03.

Engine permite a un revisor de la organización activa consultar sus sesiones de Learning y entregar una preparación aprobada. Learning vuelve a comprobar membresía, permiso docente, organización, curso y estado programado. No se entregan notas, respuestas ni criterios privados del facilitador.

El contrato canónico está en [engine-preparation.contract.ts](../../apps/web/src/features/live/engine-preparation.contract.ts). Hub y Engine mantienen copias verificables mediante sus sincronizadores. La sesión de autoría y la sesión de impartición son identidades diferentes; cada entrega conserva artefacto, sesión de autoría y revisión.

La ruta [live-engine-preparation](../../apps/web/src/app/api/internal/jobs/live-engine-preparation/route.ts) pertenece a los jobs internos que delegan autenticación al handler. Verifica HMAC SHA-256 sobre el JSON normalizado, propósito y timestamp, con ventana de cinco minutos. Reutiliza COURSEFORGE_API_KEY exclusivamente en servidor; Engine utiliza su SOFLIA_API_KEY y un SOFLIA_API_URL HTTPS administrado. No acepta destinos ni claves del navegador. La clave compartida confía en la identidad que Engine obtiene de su sesión autenticada; el receptor comprueba sus permisos académicos nuevamente.

Las solicitudes y la preparación completa se limitan a 32 KiB. El aula admite doce láminas, veinte prácticas y los límites de texto del contrato. Engine rechaza un exceso con diagnóstico, sin truncar ni enviar una preparación parcial. La primera entrega transporta láminas y consignas; guía, respuestas, notas y criterios permanecen en Engine. No se crean quizzes con respuestas inferidas ni archivos ficticios.

La entrega reemplaza la preparación académica previa y exige sesión programada sin respuestas ni entregas. Conserva UUID determinista por payload y CAS del estudio. El SQL vuelve a comprobar la ventana de preparación y rechaza una revisión anterior del mismo artefacto/sesión, incluso si la clase inicia durante HTTP. Repetir el mismo comando no repite la escritura.

La migración SOFIA [20261103120000](../../supabase/migrations/20261103120000_live_studio_participation.sql) requiere la migración del estudio. Es aditiva y reejecutable; conserva el commit previo privado como núcleo y mantiene denegado el acceso público a ambas funciones. Agrega validación de reacciones, espera de mensajes, fechas de base de datos y guardas de entrega. Una escritura legacy mantiene su JSON anterior; una vez ampliado el estado, se rechaza degradarlo. No mantener backends de ambas generaciones después de activar el formato nuevo.

Participación se negocia por X-Soflia-Studio-Participation: 1. El snapshot legacy conserva su forma estricta anterior. La cadencia usa ledger privado por actor; el participante solo recibe sus propias marcas. HTTP 429 no se reintenta como fallo de red.

Activación: Video SDK y participación se aplicaron con aprobación explícita en Learning principal el 2026-11-03; consultar el [registro de ejecución](../reports/live-activation-2026-11-03/execution.md). Falta publicar Learning compatible, preparar el esquema de autoría de Engine con autorización propia, configurar la conexión de servidor y verificar contratos antes de entregar Hub/Engine. Ensayar actor sin curso, organización ajena, repetición, clase iniciada, retiro de membresía y revisión antigua. No se enviaron cursos reales durante esta implementación.

Rollback: retirar la entrega nueva y el intervalo coordinadamente, conservar estado, tablas y archivos. No retirar la migración Video mientras existan aulas de ese proveedor.
