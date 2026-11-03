# Aplicación en Learning principal

Fecha: 2026-11-03. Estado: dos migraciones aplicadas y postflight aprobado; despliegue y piloto pendientes.

El usuario aprobó el [plan revisado](plan.md) con «Aprobar estas dos migraciones en Learning principal». La operación se limitó a mrqnnmuckznvukjvfkly. Se repitió el preflight y se comprobó el MD5 del cuerpo previo del commit antes de aplicar las dos migraciones mediante Supabase apply_migration. El [respaldo previo](previous-studio-commit.sql) contiene la definición, sin datos del aula.

## Historial y evidencia

| Archivo local | Versión remota confirmada | Resultado |
| --- | --- | --- |
| 20261019120000_live_video_sdk.sql | 20261103184110 | Aplicada |
| 20261103120000_live_studio_participation.sql | 20261103184120 | Aplicada |

Los [resultados agregados y hashes SHA-256](execution.json) identifican los bytes locales aplicados. Supabase asignó versiones distintas de los prefijos locales: no ejecutar un db push suponiendo que ambos historiales ya coinciden. Antes de usar el CLI, revisar y reconciliar explícitamente el historial; esta operación no lo alteró manualmente.

## Comprobaciones posteriores

- Una sesión programada, con zoom-meeting; un estado de estudio, sin ampliación del JSON legacy.
- Columna video_provider disponible y tabla live_video_credentials vacía, con RLS y sin SELECT público ni autenticado.
- live_studio_commit, su núcleo privado y live_finalize_video_session son SECURITY INVOKER; EXECUTE denegado a anon/authenticated y permitido a service_role.
- Guardas SQL de cadencia y compatibilidad presentes. Realtime del estudio permanece registrado.
- Los dos buckets académicos y de grabaciones permanecen privados.

El asesor de seguridad informó RLS sin políticas (INFO) para las tablas privadas de comandos/estado/credenciales. Es el cierre deliberado a clientes: solo el backend service_role opera sobre ellas. El postflight comprobó los privilegios. No abrir políticas para eliminar este aviso. [Descripción del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

La regresión SQL local confirma que una escritura legacy conserva el formato anterior; la primera escritura del backend nuevo lo amplía y una degradación posterior se rechaza. La suite coordinada de Learning aprobó 171 pruebas en 27 archivos. TypeScript (tsconfig.recordings.json) y ESLint del archivo de regresión, ejecutado desde apps/web, aprobaron tras el ajuste. La revisión independiente del plan y la migración no encontró bloqueos P1/P2; se reforzó la comprobación de que existen ambos buckets.

## Pendientes y recuperación

No se desplegó código, habilitó Video SDK ni inició una clase/grabación. Publicar Learning compatible de forma coordinada antes de habilitar las operaciones nuevas; evitar backends antiguos y nuevos simultáneos tras la primera escritura del formato ampliado. La instalación SQL por sí sola conserva el formato legacy.

La base remota de Engine aún carece de course_delivery_workspaces, course_delivery_versions y course_delivery_runs. Su migración requiere revisión y autorización separadas; no forma parte de la aprobación de Learning. También faltan configuración administrada de Zoom/worker/conexión entre productos y piloto con instructor y alumno autorizados.

Para recuperación, seguir la [reversión conservadora del plan](plan.md#reversión-conservadora). Restaurar solo la función previa no convierte el estado ampliado; no automatizar esa reversión después de activar el backend nuevo. No se borraron tablas, archivos ni historial.
