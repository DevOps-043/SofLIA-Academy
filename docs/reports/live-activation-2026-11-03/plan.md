# Plan de activación revisable

Estado: plan aprobado y ejecutado el 2026-11-03 en Learning principal mrqnnmuckznvukjvfkly. Se conserva como registro histórico del alcance autorizado. Resultado: [ejecución y verificaciones](execution.md).

## Diagnóstico de solo lectura

El estudio, sus comandos/revisiones, Realtime y las cinco migraciones de grabaciones existen. Los buckets live-studio-assets y live-recordings son privados. El commit del estudio es SECURITY INVOKER, ejecutable solo por service_role. Su cuerpo previo tiene MD5 9ab207c904968e0bc56a3587fbde3d74; la definición SQL sin datos está respaldada en previous-studio-commit.sql.

No existen video_provider, live_video_credentials ni la función de finalización Video. Tampoco existen núcleo v1 ni guarda de cadencia. Hay una sesión programada y un estado de estudio; no se observaron sesiones live. La rama qa-load-testing no contiene las dependencias del aula. La base Engine carece de las tres tablas de autoría síncrona; no está incluida en esta autorización.

## Operación propuesta sobre Learning principal

1. Repetir preflight.sql y comprobar que la definición previa no cambió. No leer usuarios, contenidos, tokens ni contraseñas.
2. Aplicar la migración local 20261019120000_live_video_sdk.sql mediante apply_migration. Añade la columna con default zoom-meeting, una tabla privada de credenciales y una RPC restringida. No convierte la reunión existente ni habilita el proveedor.
3. Aplicar 20261103120000_live_studio_participation.sql. Conserva el núcleo previo y añade validación de cadencia, revisiones e idempotencia. Se añadió una guarda de formato: un servidor legacy conserva JSON legacy, mientras el servidor actualizado utiliza el formato nuevo; una escritura posterior que intente degradar estado nuevo se rechaza.
4. Ejecutar postflight.sql: comprobar RLS, revocación de EXECUTE para anon/authenticated, bucket privado, Realtime y presencia de las guardas. Comprobar que las cantidades de sesiones/estados se conservan y que el proveedor previo sigue Meeting.
5. Registrar versiones reales asignadas por Supabase, hashes de archivos, resultado y avisos. No crear sesiones de prueba ni modificar el contenido existente.

Las dos migraciones se ejecutan en transacciones independientes; si una falla, se conserva su rollback transaccional y se registra el estado parcial sin ocultarlo. No se configura Zoom, no se leen/modifican .env, no se compra capacidad, no se publica código ni se inicia grabación dentro de esta operación.

## Compatibilidad y paso posterior

Instalar las migraciones no demuestra el funcionamiento audiovisual. Publicar Learning compatible antes de emitir operaciones de participación/entrega y no mantener un pool mixto de backends antiguos y nuevos. El código nuevo amplía estado persistido cuando escribe; un backend antiguo ya no puede leerlo estrictamente después de esa activación. La guarda legacy evita que instalar SQL por sí solo provoque la ampliación.

Configurar Video SDK, worker/Storage y conexión Engine exige revisar su entorno administrado. El piloto requiere instructor/alumno autorizados y una sesión elegida. La autorización de SQL no implica permiso para publicar nuevos cursos, enviar invitaciones, habilitar cargos o alterar organizaciones.

## Reversión conservadora

Mantener Meeting como default. Ante problemas, retirar primero las operaciones nuevas y restaurar el backend compatible. previous-studio-commit.sql respalda la definición previa; solo restaurarla no convierte estados nuevos a legacy, por lo que no se debe usar como rollback automático después de la activación. No borrar tablas, grabaciones ni ledger. Mantener esquema Video mientras existan sesiones/grabaciones asociadas.
