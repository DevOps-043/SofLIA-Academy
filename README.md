# SofLIA Academy

SofLIA Academy es una plataforma B2B de capacitacion en inteligencia artificial para organizaciones. Combina gestion de cursos, rutas de aprendizaje, certificaciones, analitica empresarial, asistencia con IA y automatizaciones operativas sobre una arquitectura monorepo con Next.js, Express y Supabase.

Este README esta actualizado a Junio 2026 con base en los ultimos commits y los cambios staged actuales del repositorio.

## Contenido

- [Resumen](#resumen)
- [Stack](#stack)
- [Roles y superficies](#roles-y-superficies)
- [Arquitectura](#arquitectura)
- [Modulos principales](#modulos-principales)
- [Cambios recientes](#cambios-recientes)
- [Instalacion local](#instalacion-local)
- [Variables de entorno](#variables-de-entorno)
- [Comandos](#comandos)
- [Base de datos](#base-de-datos)
- [Jobs y automatizaciones](#jobs-y-automatizaciones)
- [Internacionalizacion](#internacionalizacion)
- [Testing y calidad](#testing-y-calidad)
- [Convenciones](#convenciones)

## Resumen

La plataforma esta orientada a empresas que necesitan capacitar equipos en IA, medir progreso y emitir certificados verificables. El producto cubre:

- Cursos estructurados con modulos, lecciones, videos, quizzes, actividades, preguntas y notas.
- Panel empresarial para organizaciones, usuarios, equipos, jerarquias, reportes y analitica.
- Dashboard de empleado con cursos asignados, rutas, progreso, certificados y recomendaciones.
- SofLIA, asistente con Google Gemini, contexto de curso/planner/dashboard y acciones proactivas.
- Study Planner con IA, sesiones de estudio, calendario, deadlines organizacionales y feriados.
- Certificados con snapshots, PDF, hash verificable, reparacion/backfill y pagina publica de verificacion.
- Notificaciones in-app y canales externos, incluyendo cola para WhatsApp via SofLIA Hub.
- Multi-tenant branding por organizacion, white-label y soporte de tema claro/oscuro.
- i18n en Espanol, Ingles y Portugues.

## Stack

| Capa | Tecnologia |
| --- | --- |
| Frontend | Next.js 15.5.x, React 18.3.1, TypeScript 5.9.x |
| UI | Tailwind CSS 3.4.x, Radix UI, Headless UI, lucide-react, Framer Motion/Motion |
| Estado y data | Zustand, SWR, Axios, React Hook Form, Zod |
| Charts | Recharts, Nivo, Tremor |
| Backend principal | Next.js API routes sobre Supabase |
| Backend secundario | Express 4.x en `apps/api` para endpoints REST versionados |
| Base de datos | Supabase/PostgreSQL con migraciones SQL y tipos generados |
| Auth | Supabase Auth, SSO Google/Microsoft, middleware multi-tenant |
| IA | Google Gemini (`@google/generative-ai`, `@google/genai`) |
| Calendario | FullCalendar, integraciones Google Calendar y flujos de planner |
| Serverless | Netlify Functions programadas y background functions |
| Monorepo | npm workspaces (`apps/*`, `packages/*`) |

Requisitos:

- Node.js `>=22`
- npm `>=10.5.1`
- PowerShell en Windows o shell compatible

## Roles y superficies

| Rol | Descripcion | Rutas principales |
| --- | --- | --- |
| Admin | Administrador de plataforma SofLIA | `/admin/*` |
| Business | Administrador de organizacion | `/[orgSlug]/business-panel/*`, `/business-panel/*` |
| BusinessUser | Colaborador/empleado de organizacion | `/[orgSlug]/business-user/*`, `/dashboard`, `/courses/*` |
| Publico | Landing, auth, verificacion y paginas legales | `/`, `/business`, `/auth/*`, `/verification/*`, `/terms`, `/privacy` |

## Arquitectura

El repositorio usa arquitectura por dominio ("Screaming Architecture"). El codigo de negocio vive en features y no en carpetas genericas por capa.

```text
SofLIA-Academy/
+-- apps/
|   +-- web/                  # Next.js App Router, API routes y UI principal
|   |   +-- src/
|   |       +-- app/          # Rutas, layouts y API routes de Next.js
|   |       +-- core/         # Providers, stores, componentes core, servicios compartidos
|   |       +-- features/     # Dominios de negocio
|   |       +-- lib/          # Infraestructura: Supabase, Gemini, auth, cache, seguridad
|   |       +-- shared/       # Hooks/utilidades puras reutilizables
|   +-- api/                  # Express API secundaria
+-- packages/
|   +-- shared/               # Tipos/utilidades compartidas
|   +-- ui/                   # Componentes UI compartidos
+-- netlify/functions/        # Jobs serverless programados/background
+-- supabase/
|   +-- migrations/           # Migraciones SQL
|   +-- scripts/              # Snapshots/scripts de DB
+-- docs/                     # Documentacion tecnica y decisiones
```

Reglas de dependencia:

```text
features/ -> puede importar core/ y shared/
core/     -> puede importar shared/
shared/   -> no depende de features ni core
```

Notas importantes:

- La mayor parte del backend productivo vive en Next.js API routes bajo `apps/web/src/app/api`.
- `apps/api` existe como API Express versionada y mantiene modulos placeholder/REST para dominios especificos.
- No se usan webhooks para integraciones internas. Las integraciones salientes usan REST y colas cuando aplica.

## Modulos principales

Los modulos activos en `apps/web/src/features` son:

| Modulo | Responsabilidad |
| --- | --- |
| `admin` | Administracion global, empresas, usuarios, cursos, reportes y contenido |
| `auth` | Login, registro, SSO, invitaciones, sesiones y rutas protegidas |
| `business-panel` | Panel empresarial, dashboards, usuarios, equipos, jerarquia, analitica y settings |
| `certificates` | Emision, consulta, snapshots, PDF y verificacion de certificados |
| `courses` | Catalogo, curso, lecciones, actividades, preguntas, quizzes y aprendizaje |
| `landing` | Landing B2B, header, contenido publico y conversion |
| `learning-paths` | Rutas ordenadas de aprendizaje, asignaciones y acceso |
| `lia` | UI y hooks del asistente SofLIA |
| `notebook` | Notas del usuario, editor y contenidos guardados |
| `notifications` | Notificaciones in-app, acciones, preferencias, catalogo y entregas externas |
| `onboarding` | Flujos de incorporacion a organizaciones |
| `profile` | Perfil, seguridad, preferencias y certificados del usuario |
| `responsive-smoke` | Escenarios de prueba responsive |
| `scorm` | Integracion de contenido SCORM |
| `skills` | Catalogo y tracking de habilidades |
| `study-planner` | Planes de estudio con IA, calendario, sesiones y acciones proactivas |
| `tours` | Onboarding guiado con tours interactivos |
| `video-tracking` | Tracking granular de reproduccion y progreso en videos |

## Cambios recientes

Snapshot basado en los ultimos commits y el stage actual:

- Sistema de notificaciones v1:
  - Catalogo central de eventos/canales (`in_app`, `email`, `push`, `sms`, `whatsapp`).
  - `system_login_unusual` reemplaza el spam de login normal y evita mostrar IP al usuario.
  - Acciones optimistas para marcar como leida, archivar y eliminar.
  - RPCs ligeras en Supabase para mutaciones de notificaciones.
  - `dedup_key`, preferencias `whatsapp_enabled` y tabla `notification_channel_deliveries`.
  - Cola REST outbound hacia SofLIA Hub para WhatsApp con firma, retries y backoff.
  - Recordatorios diarios `learning_daily_summary` via Netlify Function.
- Certificados:
  - Emision conectada a notificacion `certificate_generated`.
  - Accion directa a certificados y deduplicacion por usuario/curso/certificado.
- Business panel y analytics:
  - Suite de analitica empresarial localizada.
  - Mejoras en estadisticas de usuario, KPIs, reportes y hooks de jerarquia.
  - Seccion de contexto SofLIA por organizacion.
- Multi-tenant branding y UI:
  - Sistema de branding por organizacion, logos, tema y motion guard.
  - Ajustes de dropdown de usuario, navbar, landing y comportamiento responsive.
- Cursos y aprendizaje:
  - Preguntas de curso con alcance de leccion (`lesson_scope`) y nueva migracion.
  - Mejoras en la experiencia de aprendizaje, tabs, preguntas y prefetch.
- Infraestructura:
  - Netlify Functions para lecciones inactivas, inbox de CourseEngine, TTS, privacidad, video transcoding, recordatorios y entregas de notificaciones.
  - Tipos de Supabase actualizados para nuevas tablas/RPCs.

## Instalacion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivos de entorno locales:

```bash
# Frontend
apps/web/.env.local

# Backend Express, si se usa localmente
apps/api/.env
```

3. Ejecutar frontend y backend juntos:

```bash
npm run dev
```

4. Ejecutar solo frontend:

```bash
npm run dev:web
```

5. Ejecutar solo backend Express:

```bash
npm run dev:api
```

URLs locales por defecto:

| Servicio | URL |
| --- | --- |
| Web | `http://localhost:3000` |
| Express API | `http://localhost:4000` |
| Health API | `http://localhost:4000/health` |

En Windows, si PowerShell bloquea `npm.ps1`, usa `npm.cmd`:

```powershell
npm.cmd run dev:web
```

## Variables de entorno

Variables habituales para desarrollo:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# IA / SofLIA
GOOGLE_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_MAX_TOKENS=
GEMINI_TEMPERATURE=

# Auth / API Express
USER_JWT_SECRET=
SUPABASE_JWT_SECRET=
JWT_SECRET=
JWT_EXPIRES_IN=7d

# OAuth / SSO
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
# Callbacks HTTPS exactos de Project Hub, separados por coma (obligatorio en producción)
PROJECT_HUB_SSO_REDIRECT_URIS=https://project-hub.example.com/api/auth/callback/learning

# Notificaciones externas / WhatsApp
SOFLIA_HUB_NOTIFICATIONS_URL=
SOFLIA_HUB_API_KEY=
SOFLIA_HUB_TIMEOUT_MS=8000
SOFLIA_HUB_WHATSAPP_ENABLED=false

# Jobs opcionales
LEARNING_REMINDERS_BATCH_SIZE=500
LEARNING_REMINDERS_LOCAL_HOUR=9
NOTIFICATION_DELIVERY_BATCH_SIZE=50
NOTIFICATION_DELIVERY_PROCESSING_STALE_MINUTES=15
VIDEO_TRANSCODING_ENABLED=false
```

No subas `.env`, `.env.local` ni service-role keys al repositorio.

## Comandos

### Desarrollo

```bash
npm run dev
npm run dev:web
npm run dev:api
```

### Build

```bash
npm run build
npm run build:web
npm run build:api
npm run build:packages
```

### Calidad

```bash
npm run lint
npm run type-check
npm run type-check --workspace=apps/web
npm run type-check:core --workspace=apps/web
npm run type-check:app --workspace=apps/web
npm run type-check:features --workspace=apps/web
```

### Tests

```bash
npm run test --workspace=apps/web
npm run test --workspace=apps/web -- notifications
npm run test --workspace=apps/web -- subscriptionFeatures
npm run test:coverage --workspace=apps/web
npm run test --workspace=apps/api
```

### Performance y carga

```bash
npm run performance:public
npm run performance:lighthouse
npm run load:smoke
npm run load:700
npm run load:stress
npm run load:report
```

### OpenAPI y auditorias

```bash
npm run generate:openapi
npm run audit:pagination
npm run audit:route-validation
```

## Base de datos

La base de datos principal es Supabase/PostgreSQL. Las migraciones viven en `supabase/migrations`.

Areas de datos principales:

| Dominio | Tablas/artefactos |
| --- | --- |
| Usuarios y organizaciones | `users`, `usuarios`, `organizations`, `organization_users`, invitaciones |
| Cursos | `courses`, `cursos`, `modulos`, `lecciones`, actividades, quizzes, preguntas |
| Progreso | `user_lesson_progress`, `lesson_tracking`, enrollments y scope organizacional |
| Study Planner | `study_plans`, `study_sessions`, preferencias, holidays y planner config |
| Learning Paths | `learning_paths`, items, assignments y resolucion de acceso |
| SofLIA | `lia_conversations`, `lia_messages`, personalizacion y contexto |
| Certificados | `certificates`, `user_course_certificates`, templates, ledger/snapshots |
| Notificaciones | `user_notifications`, `user_notification_preferences`, `notification_channel_deliveries` |
| Business analytics | vistas, KPIs, reportes y tablas de jerarquia |
| Comunidad/contenido | comunidades, posts, comentarios, news, reels, workshops |
| AI directory | `ai_apps`, `ai_prompts`, favoritos |

Archivos importantes:

- `apps/web/src/lib/supabase/types.ts`: tipos generados/curados de Supabase.
- `apps/web/src/lib/supabase/schema/`: esquema modularizado por tablas, vistas y funciones.
- `supabase/scripts/Database.sql`: snapshot auxiliar de base de datos.

Al agregar columnas o RPCs:

1. Crear migracion SQL no destructiva en `supabase/migrations`.
2. Actualizar tipos en `apps/web/src/lib/supabase/types.ts`.
3. Actualizar tipos modulares en `apps/web/src/lib/supabase/schema`.
4. Agregar pruebas de servicio/API cuando cambie comportamiento.

## Jobs y automatizaciones

Netlify ejecuta funciones tradicionales y programadas desde `netlify/functions`.

| Funcion | Frecuencia | Proposito |
| --- | --- | --- |
| `process-inactive-lessons` | cada 5 min | Cerrar o actualizar sesiones/lecciones inactivas |
| `process-inbox` | cada 5 min | Procesar inbox de CourseEngine |
| `process-tts-reading-audio` | cada 5 min | Pre-generar audio TTS para lecturas |
| `process-learning-reminders` | cada hora | Crear recordatorios diarios por zona horaria |
| `process-notification-deliveries` | cada 5 min | Procesar entregas externas de notificaciones |
| `process-privacy-deletions` | bajo demanda/programable | Procesar solicitudes de privacidad |
| `process-security-alerts` | bajo demanda/programable | Procesar alertas de seguridad |
| `transcode-video-background` | background | Transcoding HLS via FFmpeg |

La configuracion de schedules vive en `netlify.toml`.

## Internacionalizacion

La app soporta:

- Espanol (`es`)
- Ingles (`en`)
- Portugues (`pt`)

Los archivos estan en `apps/web/public/locales/{lang}`. Namespaces principales:

| Namespace | Uso |
| --- | --- |
| `common` | Acciones, UI compartida, perfil, notificaciones, certificados |
| `business` | Panel empresarial, usuarios, equipos, analytics |
| `admin` | Panel admin |
| `dashboard` | Dashboard del usuario |
| `learn` | Experiencia de aprendizaje |
| `my-courses` | Cursos del usuario |
| `communities` | Comunidades |
| `news` | Noticias |
| `instructor` | Flujos de instructor |
| `tours` | Tours guiados |
| `legal` | Terminos/privacidad |
| `notebook` | Notebook/notas |

Reglas:

- No hardcodear texto visible en componentes nuevos.
- Mantener ES/EN/PT sincronizados.
- Usar `actions.*` para acciones genericas reutilizables.
- Para features grandes, crear namespace dedicado y registrarlo en `core/i18n/i18n.ts`.

## Testing y calidad

Herramientas principales:

- Vitest para unit/integration tests.
- Testing Library para componentes React.
- Playwright para responsive smoke tests y flujos visuales.
- TypeScript con varios tsconfigs de type-check por area.
- ESLint y Prettier.
- Zod para validacion de payloads y query params.

Suites utiles:

```bash
npm run test --workspace=apps/web -- notifications
npm run test --workspace=apps/web -- subscriptionFeatures
npm run test:responsive --workspace=apps/web
npm run type-check:features --workspace=apps/web
```

## Convenciones

### Arquitectura

- Crear features bajo `apps/web/src/features/[feature]`.
- Separar componentes, hooks, servicios, tipos y barrels.
- Mantener componentes grandes divididos; si supera ~300 lineas, extraer subcomponentes o hooks.
- Preferir Server Components en App Router; usar `'use client'` solo cuando sea necesario.

### API

- Validar entradas con Zod.
- Usar Supabase con filtros de ownership en la misma mutacion cuando sea posible.
- Preferir respuestas compactas para mutaciones de UI.
- No crear sistemas paralelos si ya existe feature/service para el dominio.
- No usar webhooks internos; usar REST y colas cuando haya entrega externa.

### UI

- Usar Tailwind y tokens CSS existentes.
- Evitar hex hardcodeado salvo que el sistema de diseno lo requiera explicitamente.
- Soportar tema claro y oscuro.
- Usar `lucide-react` para iconos cuando exista un icono adecuado.
- Mantener layouts mobile-first y sin texto solapado.

### Git

- El repo suele tener trabajo en curso. Antes de editar, revisar `git status --short`.
- No revertir cambios ajenos.
- Si solo se pide documentacion, limitar los cambios al documento solicitado.

## Referencias internas

- `AGENTS.md`: reglas de trabajo para agentes/codex.
- `docs/ARQUITECTURA-COMPLETA.md`: contexto historico de arquitectura.
- `docs/PRD_MASTER.md`: requerimientos de producto.
- `docs/tech-debt/`: deuda tecnica y auditorias.
- `docs/codex-tasks/`: backlog tecnico por areas.

## Estado del repositorio

Snapshot al actualizar este README:

- Feature folders web: 17.
- API route files en `apps/web/src/app/api`: aproximadamente 493.
- Migraciones Supabase: 78.
- Documentos en `docs`: aproximadamente 169.
- Netlify Functions activas: jobs de lecciones, inbox, TTS, privacidad, seguridad, video, recordatorios y notificaciones.

Estos numeros son orientativos; el codigo y las migraciones son la fuente de verdad.

---

Mantenido por el equipo SofLIA Academy.
