# Threat model STRIDE - SofLIA Academy

Ultima revision tecnica: 2026-08-27

Alcance: flujos criticos de Auth, file uploads, LIA chat, multi-tenant data access, OAuth Google/Microsoft y pagos/subscripciones.

Cadencia obligatoria: revision cada 6 meses o antes de cualquier cambio mayor en auth, Supabase RLS, storage, integraciones IA, pagos o arquitectura multi-tenant.

Estado de revision: pendiente de firma por Security Owner y Platform Owner. Este documento deja el baseline tecnico listo para revision humana.

## Registro de revision

| Fecha | Reviewer | Rol | Decision | Notas |
|---|---|---|---|---|
| Pendiente | Security Owner | Security | Pendiente | Revision humana requerida para cerrar 5.4 |
| Pendiente | Platform Owner | Platform | Pendiente | Revision humana requerida para cerrar 5.4 |

## Supuestos

- Supabase Auth y Postgres/RLS son controles de plataforma, pero no reemplazan validaciones de aplicacion.
- El service role solo debe ejecutarse en contexto server-side confiable.
- No se usan webhooks propios para integraciones internas; el proyecto opera con REST.
- Los logs no deben persistir passwords, tokens, prompts completos con PII, ni payloads de usuarios.
- Cambios de CSP deben conservar tests de nonce y pasar validacion en staging antes de produccion.

## Activos criticos

| Activo | Riesgo principal | Control base |
|---|---|---|
| Cuentas Admin/Business | Escalacion de privilegios | MFA, lockout, sesiones revocables, auditoria |
| Datos multi-tenant | Acceso cruzado entre organizaciones | `requireOrgAccess`, RLS, tests de aislamiento |
| Evidencia de reportes | URL bearer publica o lectura de objetos ajenos | Bucket privado, ownership/admin y URL firmada corta |
| Prompts y respuestas LIA | Exposicion de PII e inyeccion de prompt | Sanitizacion, minimizacion, guardrails |
| Archivos subidos | Malware, XSS, contenido activo | MIME/magic bytes, limites, antimalware |
| Tokens OAuth/sesiones | Secuestro de cuenta | state/PKCE, cookies seguras, rotacion |
| Pagos/subscripciones | Fraude, cambios no autorizados | auth por rol, idempotencia, audit log |

## STRIDE por flujo

| Flujo | STRIDE | Amenaza | Prob. | Impacto | Mitigacion actual / requerida | Owner |
|---|---|---|---|---|---|---|
| Auth login/register/reset | Spoofing | Fuerza bruta o credential stuffing contra login | Alta | Alto | Lockout 5 fallos / 15 min Redis-ready, rate limits, mensajes genericos | Security |
| Auth login/register/reset | Information disclosure | Email enumeration por login/reset | Media | Medio | Login devuelve mensaje generico; reset mantiene respuesta uniforme | Security |
| Auth register | Spoofing | Alta directa mediante Supabase Auth o metadata que simula email verificado | Confirmada | Alto | Signup directo deshabilitado, marcador server-only, confirmacion canonica y cuarentena | Security |
| Auth login/register/reset | Tampering | Password debil o filtrado aceptado | Media | Alto | Minimo 12 chars, complejidad, HIBP k-anonymity | Security |
| Auth login/register/reset | Repudiation | Falta de rastro de revocacion o incidentes | Media | Alto | `security_audit_log` append-only, correlacion y alertas programadas | Platform |
| OAuth Google/Microsoft | Spoofing | Callback sin state/CSRF correcto | Media | Alto | Verificar state en callback y documentar en auth policy | Security |
| OAuth Google/Microsoft | Information disclosure | Tokens OAuth en logs o errores | Baja | Alto | Logger sanitizado; no registrar query/cookies completas | Platform |
| File uploads | Tampering | Extension/MIME falsificados | Alta | Alto | Magic bytes, re-encoding de imagenes y antimalware fail-closed en buckets documentales | Platform |
| File uploads | Denial of service | Archivos grandes o muchos uploads | Media | Alto | Rate limit upload, limites de payload, bucket policies | Platform |
| File uploads | Elevation of privilege | Path traversal o overwrite de archivos ajenos | Media | Alto | Matriz bucket/rol, nombres opacos y paths obligatoriamente prefijados por usuario | Platform |
| LIA chat | Information disclosure | PII en prompt enviada a modelos externos | Media | Alto | Sanitizacion de contexto, minimizacion y redaccion de logs | AI Platform |
| LIA chat | Tampering | Prompt injection que induce acciones mutativas | Alta | Alto | Guardrails, confirmacion para acciones mutativas, tests existentes | AI Platform |
| LIA chat | Denial of service | Abuso de costo por chats IA | Media | Medio | Rate limit AI chat y circuit breakers | Platform |
| Multi-tenant access | Elevation of privilege | Usuario accede datos de otra organizacion | Alta | Critico | Guard central por slug/membresia, `requireOrgAccess`, RLS forzado y tests de aislamiento | Platform |
| Multi-tenant access | Information disclosure | Query sin filtro `org_id` o `select('*')` | Media | Alto | Grants minimos, politicas owner/org y tablas sensibles exclusivas de `service_role` | Platform |
| Supabase Data API | Information disclosure | Uso de la clave publica `anon` contra grants, vistas o RLS permisivos | Confirmada | Critico | RLS forzado, grants deny-by-default, cierre de vistas/RPC/Storage y pruebas negativas | Security |
| Pagos/subscripciones | Tampering | Cambio de plan no autorizado | Media | Alto | Auth por rol Business/Admin, validacion server-side | Payments |
| Pagos/subscripciones | Repudiation | Cambios sin audit trail | Media | Alto | Audit log append-only y contexto de actor/organizacion | Payments |
| Pagos/subscripciones | Denial of service | Reintentos duplican cambios/cargos | Baja | Alto | Requiere idempotency keys donde haya proveedor de pagos | Payments |

## Secure design review checklist

- Auth y roles se validan en servidor, no solo en UI.
- Endpoints multi-tenant filtran por org y validan membership.
- Inputs mutativos usan Zod o validadores equivalentes.
- Respuestas de auth no revelan existencia de cuentas.
- Logs usan `logger` sanitizado y no incluyen payloads sensibles.
- CSP enforced usa nonce por request y no permite `unsafe-inline`/`unsafe-eval` en scripts.
- Migraciones destructivas incluyen rollback documentado.
- Dependencias nuevas pasan por audit/licencias.

## Riesgos residuales

| Riesgo | Estado | Siguiente tarea |
|---|---|---|
| Migracion de contencion aun no aplicada en produccion | Operativo critico | Seguir `remediation-2026-08-27.md` dentro de ventana con backup |
| Alcance forense del incidente aun no determinado | Operativo critico | Analizar logs de Data API/Auth/Storage y evaluar notificacion legal sin copiar PII |
| Credenciales potencialmente expuestas aun no rotadas | Operativo critico | Revocar sesiones/tokens y rotar secretos durante el despliegue |
| Restore drill real requiere ejecucion periodica | Operativo | Ejecutar y firmar `backup-restore-drill.md` |
| MFA obligatorio por rol | Decision de rollout | Activar por fases despues de verificar enrolamiento y recuperacion |
| Video grande por upload directo requiere scanner de storage/media | Operativo | Mantener el flujo dedicado y exigir scanner del proveedor antes de declarar antimalware estricto para video |

## Revision y firmas

| Fecha | Revisor | Cambios | Aprobacion |
|---|---|---|---|
| 2026-05-19 | Security Owner | Pendiente de firma humana sobre baseline STRIDE y MFA/login hardening | Pendiente |
| 2026-05-19 | Platform Owner | Pendiente de cross-review humano sobre tenant isolation, CORS y upload hardening | Pendiente |
