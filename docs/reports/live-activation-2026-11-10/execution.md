# Activación del importador de grabaciones

Fecha de corte 2026-11-10. Se eligió GitHub Actions por solicitud expresa del usuario.

## Configuración aplicada

- Repositorio público `DevOps-043/SofLIA-Learning`, runner estándar Ubuntu 24.04 y Node 22.
- Ejecución cada dos horas, en el minuto 17 UTC, y disparo manual.
- Lote finito de diez trabajos como máximo, con cuatro horas de presupuesto.
- Credenciales S3 y de servidor de Learning conservadas como secretos de Actions.
- Par de API credentials de Zoom autorizado expresamente y guardado como secretos de Actions.
- En Netlify, el mismo par se guarda en una única variable secreta de producción,
  limitada a Functions. El servidor firma JWT de quince minutos.
- Storage conserva el bucket privado `live-recordings`. La consulta de control
  encontró cero archivos almacenados y cero trabajos pendientes al corte.

## Evidencia externa

La [ejecución de Actions 42867075640](https://github.com/DevOps-043/SofLIA-Learning/actions/runs/42867075640)
terminó correctamente en `b8a97386`. Consultó Zoom, completó la reconciliación
y vació una cola de cero trabajos. Esta ejecución acredita conectividad y autenticación.

La [ejecución final 42873522340](https://github.com/DevOps-043/SofLIA-Learning/actions/runs/42873522340)
repitió la verificación correctamente en `383212eb`, la versión publicada en Netlify.

El [deploy de producción 6af3585281a9ef4f8bb0fbe9](https://app.netlify.com/projects/soflia-learning/deploys/6af3585281a9ef4f8bb0fbe9)
publicó `383212ebe67b10c5ee837b1007ecfc089b231093`. La API de Netlify confirmó
`state=ready`, ese commit y publicación el 2026-11-10 a las 17:49:40 UTC.

La grabación sintética previa `soflia-pilot-ad7ba630da` se consultó en Zoom con
un JWT temporal. Zoom emitió `download_access_token` y la descarga devolvió
HTTP 200, MIME application/octet-stream y 324955 bytes. El tamaño coincidió con
el declarado y la cabecera contenía MP4/ftyp. El archivo carece de session_key
de Learning, por lo que el reconciliador lo excluye de la cola académica.

## Diagnóstico resuelto

Dos claves S2S activas de Platform Studio fueron rechazadas por el endpoint de
grabaciones con HTTP 401 y código 124, tanto con x-api-key como con Bearer.
Un JWT de API credentials de la misma cuenta devolvió HTTP 200. El servidor
ahora admite ese modo y solicita un token separado para descargar el vídeo.

La primera publicación del par en dos variables adicionales excedió los 4 KB
del entorno de AWS Lambda. La configuración de Netlify se redujo a una sola
variable, sustituyendo la clave S2S y retirando únicamente los campos duplicados
creados durante esta activación. La siguiente publicación terminó correctamente.

## Verificación local

- Suite del área live, 172 pruebas aprobadas en 28 archivos.
- TypeScript con `apps/web/tsconfig.recordings.json`, aprobado.
- ESLint de los módulos modificados y `git diff --check`, aprobados.
- CI de tipos app, features y core, Gitleaks y licencias, aprobados en `383212eb`.
- npm audit mantiene un fallo de dependencias preexistentes. Este cambio conserva
  el lockfile y la comprobación de seguridad.

## Pendiente de prueba completa

Al corte no existen aulas Video SDK creadas en Learning. El Hub restauró la
identidad del instructor y mostró su sesión anterior de Zoom Meetings. Hace falta
crear una nueva aula mediante el acceso normal del instructor, conectar desde
Hub, generar una grabación y verificar archivo privado y reproducción autorizada.

La descarga del piloto y el lote vacío no acreditan la transferencia S3 de un aula.
El navegador integrado del Hub devolvió ERR_BLOCKED_BY_CLIENT para Learning.
El acceso por Chrome quedó pendiente de inicio de sesión del instructor y, en la
última comprobación, el conector informó uso local del navegador desactivado.

## Reversión

Deshabilitar el workflow detiene las importaciones nuevas. La base conserva
trabajos, concesiones, metadatos y assets confirmados para reanudar posteriormente.
El cambio de proveedor solo afecta a aulas nuevas. Las aulas existentes conservan
su proveedor para evitar mezclar credenciales y grabaciones.
