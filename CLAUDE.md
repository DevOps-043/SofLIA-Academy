# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SofLIA Academy** is a B2B educational platform for enterprise AI training. It is a pure B2B product — no consumer-facing subscriptions or communities. Built as a monorepo with Next.js for the frontend, Express for the backend, and Supabase as the database.

**Tech Stack:**
- Frontend: Next.js ^15.5.18, React 18.3.1, TypeScript 5.9.3, TailwindCSS 3.4.18
- Backend: Express 4.18.2, TypeScript 5.3.3, Node.js 22+
- Database: Supabase (PostgreSQL) — 78+ migrations
- Authentication: Supabase Auth (+ SSO Google/Microsoft via OAuth, MFA support)
- State Management: Zustand 5.0.2 (client state), SWR 2.2.x (server state)
- UI Components: Radix UI, Headless UI, Lucide React, custom components with Framer Motion 12.x
- Rich Text Editor: TipTap 3.x (notebook feature)
- 3D / WebGL: React Three Fiber 9.x, @react-three/drei, Three.js 0.181.x (business-user dashboard)
- Video: hls.js 1.x (HLS streaming), video.js 8.x, YouTube embed
- Data Visualization: Nivo charts (v0.99.0), Recharts 3.x, Tremor
- AI: multi-provider — Google Gemini via `@google/genai` 2.x + `@google/generative-ai` 0.24.x, and OpenAI via `openai` 7.x (Responses API). Provider selectable per purpose from `/admin/ai-settings`
- Internationalization: next-i18next, react-i18next (Spanish, English, Portuguese)
- Calendar: FullCalendar 6.x (Study Planner), react-big-calendar 1.x
- Animations: Framer Motion 12.x (authenticated pages), GSAP 3.14.x (landing only), CSS @keyframes (landing only)
- Maps: Leaflet 1.9.x, React Leaflet 4.2.x
- Layout: react-grid-layout 1.5.x, swapy 1.0.x (drag-and-drop)
- Colors: node-vibrant 4.x (extract colors from images for org branding)
- Particles: tsParticles 3.x (dashboard backgrounds)
- Session Recording: rrweb
- Serverless: Netlify Functions (cron jobs — lesson inactivity tracking)
- Testing: Vitest 4.x (unit), Playwright 1.59.x (E2E), Testing Library
- Security: DOMPurify 3.x (HTML sanitization), custom security layer (`lib/security/`)
- PDF/Export: @react-pdf/renderer 4.x, jsPDF 4.x, pdfmake, ExcelJS 4.x, jszip

## Repository Structure

```
SofLIA-Academy/
├── apps/
│   ├── web/              # Frontend (Next.js)
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router pages
│   │   │   ├── features/ # Business domain features (18 modules)
│   │   │   ├── core/     # Cross-cutting logic (stores, providers, i18n, theme)
│   │   │   ├── lib/      # Infrastructure utilities
│   │   │   └── shared/   # Reusable generic components & utilities
│   │   └── tailwind/     # Custom Tailwind keyframes and animation definitions
│   └── api/              # Backend (Express — mostly placeholder; real logic is in Next.js API routes)
│       └── src/
│           ├── features/ # Business domain features
│           ├── core/     # Middleware & config
│           └── shared/   # Shared types & constants
├── packages/
│   ├── shared/          # Shared types between frontend & backend
│   └── ui/              # Shared UI components (@aprende-y-aplica/ui)
├── netlify/
│   └── functions/       # Serverless cron jobs
├── supabase/
│   ├── config.toml      # Supabase configuration
│   └── migrations/      # Database migrations (78+)
└── docs/                # Documentation and design system
```

## Commands

```bash
# Development
npm run dev          # Start both frontend (:3000) and backend (:4000) concurrently
npm run dev:web      # Start frontend only
npm run dev:api      # Start backend only

# Building
npm run build        # Build all workspaces
npm run build:web    # Build frontend only
npm run build:api    # Build backend only
npm run build:packages  # Build shared packages

# Code Quality
npm run type-check   # Type check all workspaces
npm run lint         # Lint all workspaces

# Bundle Analysis (Frontend)
npm run analyze --workspace=apps/web           # Analyze all bundles
npm run analyze:server --workspace=apps/web    # Server bundle only
npm run analyze:browser --workspace=apps/web   # Browser bundle only

# Workspace-specific operations
npm install <package> --workspace=apps/web     # Install in web app
npm install <package> --workspace=apps/api     # Install in API
npm run <command> --workspace=apps/web         # Run command in specific workspace

# Clean build (Windows)
npm run clean --workspace=apps/web && npm run build --workspace=apps/web
```

## Architecture

### Screaming Architecture
Organized by business features, not technical layers. The feature name tells you immediately what the code does.

**Feature Structure:**
```
features/[feature-name]/
├── components/     # Feature-specific components
├── hooks/          # Feature-specific hooks
├── services/       # Feature-specific services
├── types.ts        # Feature-specific types
└── index.ts        # Barrel exports
```

**Main Features (18 modules):**
- `admin/` — Platform super-admin panel: company management, users, courses, learning paths, activities, AI content, course import/export, transcoding, TTS translation
- `auth/` — Authentication, SSO (Google/Microsoft), registration, MFA
- `business-panel/` — Org admin panel (Business role) + business-user analytics + org-level reports + hierarchy chat + join requests + progress tracking
- `certificates/` — Certificate generation and PDF export (snapshots + backfill support)
- `courses/` — Course management, learning content, SofLIA Dialogue Engine (AI activities), quiz, notes, reading voice, lesson auto-notes
- `landing/` — Landing page components (CSS animations only — no framer-motion)
- `learning-paths/` — Ordered course groupings with org/user assignments and access resolution
- `lia/` — SofLIA AI chat interface (persistent history, context-aware, multilingual)
- `notebook/` — Rich-text note-taking (TipTap), tree navigation, course-integrated auto-notes
- `notifications/` — User notification system (v1: channels and action types)
- `onboarding/` — User onboarding flows and questionnaire
- `profile/` — User profile management (demographics, skills, avatar, account settings)
- `responsive-smoke/` — Automated UI responsiveness and visual regression testing
- `scorm/` — SCORM 1.2/2004 e-learning content integration
- `skills/` — Skills catalog and tracking
- `study-planner/` — AI-powered study planning (Gemini 2.5 + Google Calendar integration)
- `tours/` — Guided onboarding tours (Joyride + OnboardingVideoPlayer)
- `video-tracking/` — Video progress and lesson completion tracking

### Dependency Rules
```
features/  → Can import from core/ and shared/
core/      → Can import from shared/
shared/    → Cannot import from anywhere (pure infrastructure)
```

### Frontend Organization (apps/web/src/)

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages (Server Components by default) |
| `features/` | Business domain features (self-contained, 18 modules) |
| `core/` | Cross-cutting logic: stores (Zustand), providers, contexts, hooks, services/api.ts (Axios), i18n, theme tokens, layout, middleware, reporting, types, utils |
| `lib/` | Infrastructure utilities (see lib directories below) |
| `shared/` | Generic hooks (useDebounce), utility functions, generic components |

**core/ subdirectories:**
`components/`, `contexts/`, `hoc/`, `hooks/`, `i18n/`, `layout/`, `lib/`, `middleware/`, `providers/`, `reporting/`, `services/`, `stores/`, `theme/`, `types/`, `utils/`

**lib/ subdirectories:**
`ai/`, `ai-moderation/`, `analytics/`, `api/`, `auth/`, `cache/`, `course-content/`, `course-import/`, `data/`, `holidays/`, `lia/`, `lia-context/`, `logger/`, `media/`, `middleware/`, `nanobana/`, `oauth/`, `observability/`, `openapi/`, `performance/`, `privacy/`, `queue/`, `rate-limit/`, `reading/`, `resilience/`, `rrweb/`, `sanitize/`, `schemas/`, `scorm/`, `security/`, `services/`, `slug/`, `subscription/`, `supabase/`, `upload/`, `utils/`, `validation/`

### Backend Organization (apps/api/src/)

**Note:** The Express backend is mostly placeholder. All real business logic lives in Next.js API routes (`app/api/`).

| File Pattern | Purpose |
|--------------|---------|
| `[feature].controller.ts` | HTTP request handlers |
| `[feature].service.ts` | Business logic |
| `[feature].routes.ts` | Route definitions |
| `[feature].types.ts` | DTOs and Zod validation schemas |

## Important Patterns

### Supabase Integration
- Browser client: `createClient()` from `lib/supabase/client.ts`
- Server Components: `createServerClient()` from `lib/supabase/server.ts`
- Protected routes: middleware in `lib/supabase/middleware.ts`
- Database types: `lib/supabase/types.ts`

### API Communication
- Frontend uses `core/services/api.ts` (Axios with interceptors and token refresh)
- API base URL: `http://localhost:4000/api/v1`
- **Do NOT use webhooks** — always use REST API endpoints
- Most operations are Next.js API routes (`app/api/`), not Express

### Path Aliases
```typescript
@/*           → apps/web/src/*
@/features/*  → apps/web/src/features/*
@/core/*      → apps/web/src/core/*
@/lib/*       → apps/web/src/lib/*
@/components/*→ apps/web/src/shared/components/*
@/utils/*     → apps/web/src/shared/utils/*
@/hooks/*     → apps/web/src/shared/hooks/*
@shared/*     → packages/shared/src/*
```

### Organization Color System

Organization admins can configure custom branding. The color system has two layers:

**CSS Variables (injected by `OrganizationGlobalCSSInjector` when in org layout):**
- `--org-action-color` — primary action color (contrast-resolved from brand color)
- `--org-on-action-color` — text color on top of action color
- `--org-accent-color` — org accent color
- `--org-primary-button-color` — raw brand primary (may be #000 for some orgs)

**`useBusinessPanelTheme()` hook** — computes all semantic tokens from org styles with guaranteed contrast ratios. Use this hook for any component in the business panel. Do NOT use raw org CSS vars directly in components — always go through this hook or `OrganizationStylesContext`.

**`resolveBusinessPanelActionColor()`** — exported utility that picks `accentColor` over `primaryColor` when `primaryColor` would be invisible on the current surface. Required when computing action colors outside the hook.

## Internationalization (i18n)

Supports **Spanish (default)**, **English**, and **Portuguese** via `next-i18next` + `react-i18next`. All translations are client-side bundled — no lazy loading, no URL-based routing.

### Namespaces (registered in `core/i18n/i18n.ts`)
| Namespace | File | Usage |
|-----------|------|-------|
| `common` | `common.json` | Shared UI (profile, actions, studyPlanner, certificates, liaPersonalization, notebook) |
| `learn` | `learn.json` | Course learning page (lessons, quiz, scorm, activities, dialogue) |
| `business` | `business.json` | Business panel (users, teams, hierarchy, analytics, join-requests) |
| `admin` | `admin.json` | Admin panel (delete modals, user management, roles) |
| `dashboard` | `dashboard.json` | User dashboard |
| `content` | `content.json` | Course content management |
| `my-courses` | `my-courses.json` | User courses list |

### Key Naming Convention
```
// Hierarchical: feature.section.element
"admin.users.deleteModal.title"
"profile.security.emailLabel"
"studyPlanner.calendar.addTitle"
"learn.scorm.confirmDelete"
"learn.dialogue.startButton"

// Generic reusable actions (always in common.json under actions.*)
"actions.save"        // Save
"actions.cancel"      // Cancel
"actions.delete"      // Delete
"actions.deleting"    // Deleting...
"actions.confirm"     // Confirm
"actions.loading"     // Loading...
"actions.saving"      // Saving...
"actions.edit"        // Edit
"actions.close"       // Close
"actions.back"        // Back
"actions.retry"       // Retry
"actions.updating"    // Updating...
"actions.create"      // Create
"actions.saveChanges" // Save changes
```

### Namespace Decision Rule
| Situation | Action |
|-----------|--------|
| Feature already has a namespace (`business`, `learn`, etc.) | Add to that namespace |
| New feature with >50 keys | Create dedicated namespace + register in `core/i18n/i18n.ts` |
| New feature with <50 keys | Add section in `common.json` |
| Generic button/action text used in multiple features | Always `actions.*` in `common.json` |

### Rules
- **Never hardcode visible text** — always use `t()` with a key
- **Never use native `confirm()`** — use inline state-based confirmation UI or modal
- **Always sync ES/EN/PT** — if you add a key to one language, add it to all three
- **ES is source of truth** — EN and PT must be real translations, not copies of Spanish
- **Module-level arrays with labels** must be moved inside the component to use `t()`
- **Default prop fallbacks** like `confirmText = 'Confirmar'` must use `t('actions.confirm')` resolved inside the component

```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('common');
const { t } = useTranslation('business');
const { t: tc } = useTranslation('common');  // alias when two namespaces needed

// Language switching
import { useLanguage } from '@/core/i18n/I18nProvider';
const { language, changeLanguage } = useLanguage(); // 'es' | 'en' | 'pt'
```

## Styling & Design System

### SofLIA Color Palette (CSS Variables in globals.css)

**CRITICAL:** Always use Tailwind classes or CSS variables. NEVER hardcode hex colors like `#0F1419` or `#1E2329`.

```css
/* Primary Colors */
--color-primary: #0A2540      /* Azul Profundo - Technology + trust */
--color-accent: #00D4B3       /* Aqua - Learning + Living AI */
--color-bg-dark: #0F1419      /* Dark mode background */
--color-bg-light: #FFFFFF     /* Light mode background */

/* Secondary Colors */
--color-success: #10B981      /* Green - Achievement */
--color-warning: #F59E0B      /* Amber - Alert */
--color-error: #ef4444        /* Red - Error */

/* Gray Scale (Neutral) */
--color-gray-50: #f8fafc
--color-gray-100: #f1f5f9
--color-gray-200: #E9ECEF     /* Light gray - Structure */
--color-gray-500: #6C757D     /* Dark gray - Typography */
--color-gray-800: #1E2329     /* Dark gray with blue tint */
--color-gray-900: #0F1419     /* Main dark background */
```

### Tailwind Class Mapping

**Light Mode:**
- Background: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Text: `text-gray-900` (primary), `text-gray-600` (secondary)
- Borders: `border-gray-200`

**Dark Mode:**
- Background: `bg-gray-900`, `bg-gray-800`
- Text: `text-white` (primary), `text-gray-400` (secondary)
- Borders: `border-white/10`

**Organization Branded Elements:**
- Use `primaryColor` and `accentColor` from `useBusinessPanelTheme()` or `OrganizationStylesContext`
- Apply via inline styles: `style={{ backgroundColor: theme.actionColor }}`
- Gradients: `linear-gradient(135deg, ${theme.primary}, ${theme.accentColor})`
- For components outside org layout: use CSS var with fallback: `var(--org-accent-color, var(--color-accent))`

### Component Patterns

**Architecture:**
- Mobile-first responsive design (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- Component modularity: break large components (>300 lines) into smaller pieces
- Extract business logic into custom hooks (`use[Feature]Logic.ts`)
- One component = one responsibility

**Styling Best Practices:**
- Use `cn()` from `shared/utils/cn.ts` for className merging
- Prefer Tailwind classes over inline styles
- Use inline styles only for dynamic colors (org branding) or values not expressible in Tailwind
- Radix UI and Headless UI for accessible components
- Framer Motion for animations in authenticated pages; CSS @keyframes for landing page

**Theme Management:**
- Access theme via `useThemeStore()` from `@/core/stores/themeStore`
- `resolvedTheme` returns `'light'` or `'dark'`
- All components must support both themes

### Data Visualization
- **Nivo** (`@nivo/*`): Complex, customizable visualizations (business panel analytics)
- **Recharts** 3.x: Simple, performant charts
- **Tremor** (`@tremor/react`): Business dashboards and metric cards

## Database Schema (Supabase)

Migrations in `supabase/migrations/` (78+). Full TypeScript types in `lib/supabase/types.ts`.

**Key tables by domain:**
- **Users & Orgs**: `usuarios`, `organizations`, `organization_users`, `organization_invitations`, `user_demographics`
- **Org Branding**: `organizations.branding_enabled` (column) — controls whether BrandingTab is accessible
- **Hierarchy (optional)**: `organization_regions`, `organization_zones`, `organization_teams`, `hierarchy_chats`, `hierarchy_chat_messages`
- **Join Requests**: org membership request tables (managed via business panel)
- **Courses**: `cursos`, `modulos`, `lecciones`, `actividades`, `user_lesson_progress`, `lesson_tracking`, `user_course_enrollments`
- **Quiz & Progress**: `user_quiz_attempts`, `user_course_progress` (org-scoped), `module_learning_summaries`
- **SofLIA Dialogue**: tables managed in `features/courses/services/soflia-dialogue/dialogue-tables.ts`
- **Notes**: `lesson_auto_notes`, `user_notes` (notebook tables)
- **Study Planner**: `study_plans`, `study_sessions`, `study_preferences`, `calendar_integrations`, `organization_planner_config`, `organization_holidays`
- **Learning Paths**: `learning_paths`, `learning_path_items`, `organization_learning_path_assignments` (+ `intro_video_url`), `organization_course_intro_videos`, `user_learning_path_progress`, `user_learning_path_assignments`
- **Intro Videos Storage**: bucket `intro-videos` (500 MB, public, video/mp4 + webm/ogg/quicktime)
- **Analytics**: `business_user_analytics_insight_cache` (server-side AI insight cache)
- **SofLIA Chat**: `lia_conversations`, `lia_messages`, `lia_personalization`, `lia_live_voice_sessions`
- **TTS / Reading**: `tts_reading_audio_assets` and progress tracking
- **Certs & Skills**: `certificates`, `skills`, `user_skills`
- **Notifications**: notification channel and action tables (v1 schema — see migration `20260625090000`)

## Development Guidelines

### TypeScript
- Strict typing enabled (`strict: true`)
- Avoid `any`, prefer `unknown` if needed
- Define interfaces for all props and data structures

### Component Guidelines

**General Rules:**
- Use Server Components by default, add `'use client'` only when needed
- Client Components required for: event handlers, browser APIs, React hooks, context consumers
- One component = one responsibility
- Break components >300 lines into smaller, focused components

**Modular Component Architecture (Example: HierarchyChat):**
```
features/business-panel/components/hierarchy/HierarchyChat/
├── index.ts                   # Barrel exports
├── types.ts                   # Shared types and constants
├── HierarchyChat.tsx          # Main component (orchestrator)
├── ChatHeader.tsx             # Sub-component: Header
├── ChatMessages.tsx           # Sub-component: Messages list
├── ChatInput.tsx              # Sub-component: Input area
└── hooks/
    └── useChatLogic.ts        # Custom hook with business logic
```

### Naming Conventions
- Files: kebab-case (`user-profile.tsx`)
- Components: PascalCase (`UserProfile`)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE

### User Roles
| Role | Description | Routes |
|------|-------------|--------|
| `Admin` | Platform super admin | `/admin/*` |
| `Business` | Organization admin | `[orgSlug]/business-panel/*` |
| `BusinessUser` | Organization employee | `[orgSlug]/business-user/*` (pages in `app/`, logic in `features/business-panel/`) |

## Environment Variables

See `.env.example` for all variables. Key ones:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend (.env)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=          # Proveedor OpenAI (nunca NEXT_PUBLIC_*)
OPENAI_ORGANIZATION=     # Opcional: imputa el consumo a una organizacion
OPENAI_PROJECT=          # Opcional: imputa el consumo a un proyecto
OPENAI_ALLOW_NETLIFY_AI_GATEWAY=false # Opt-in; por defecto se exige una clave propia de OpenAI
USER_JWT_SECRET=
```

## Key Files

- `lib/supabase/types.ts` — Database schema TypeScript types (SINGLE source of truth in web; regenerate with `npm run gen:types --workspace=apps/web`; the old `lib/supabase/schema/` tree was removed — never recreate parallel type copies; apps/api keeps its own minimal table types on purpose)
- `supabase/scripts/Database.sql` — Schema dump of the real database (100 tables, context only, not runnable). **This is the reference when `types.ts` drifts.** A table missing from `types.ts` makes `.from('x')` resolve to `never`, which cascades into `not assignable to 'never'` + `No overload matches this call` + `Property X does not exist` — three symptoms of one problem. Note `supabase.storage.from('avatars'|'certificates')` targets Storage buckets, not tables.
- `lib/ai/model-settings/` — Per-purpose Gemini configuration (model, tokens, temperature, thinking level) resolved from DB → env → defaults; see "AI Model Settings"
- `apps/web/src/app/layout.tsx` — Root layout with all providers
- `core/services/api.ts` — Axios client with interceptors and token refresh
- `core/theme/color-tokens.ts` — Design system hex constants (`DESIGN_HEX_COLOR`)
- `apps/web/tailwind/keyframes.js` — Custom CSS keyframe definitions
- `apps/web/tailwind/animations.js` — Tailwind animation name registrations
- `apps/web/src/lib/utils/motion.ts` — `useMotionSafe()` hook (native matchMedia, no framer-motion dependency)
- `apps/web/src/core/components/MotionGuardProvider.tsx` — Sets `data-reduce-motion` on root for low-performance/reduced-motion devices
- `supabase/migrations/` — Database migration history (78+)
- `netlify/functions/` — Serverless cron jobs (lesson inactivity tracking)
- `features/business-panel/components/PremiumSelect.tsx` — Custom dropdown component (use instead of native `<select>` in business panel)
- `features/business-panel/components/dashboard/StatCard.tsx` — Dashboard stat card with optional hover navigation arrow
- `features/business-panel/components/business-panel-sidebar/navigation.ts` — Sidebar nav order config
- `features/business-panel/hooks/useBusinessPanelTheme.ts` — `useBusinessPanelTheme()` hook + `resolveBusinessPanelActionColor()` utility
- `features/business-panel/contexts/OrganizationStylesContext.tsx` — `useOptionalOrganizationStylesContext()` (safe outside org layout)
- `features/business-panel/services/reports-analytics/reports-analytics.server.service.ts` — Org-level analytics queries
- `features/business-panel/services/business-user-analytics/business-user-analytics.server.service.ts` — Per-user analytics queries
- `features/courses/services/soflia-dialogue/` — SofLIA Dialogue Engine (AI-powered activity conversations)
- `features/courses/hooks/useCourseIntroVideos.ts` — Intro video state machine
- `features/notebook/` — Notebook feature (TipTap editor, tree navigation, auto-notes)
- `lib/security/` — Prompt injection detection, agent policy, bot protection, security audit log
- `lib/resilience/circuit-breaker.ts` — Circuit breaker for external service calls
- `lib/upload/validation.ts` — Storage bucket whitelist + file validation
- `apps/web/src/app/downloads/page.tsx` — Downloads page (latest release, changelog, requirements)

## Testing URLs

- Frontend: http://localhost:3000
- Backend Health: http://localhost:4000/health
- API Base: http://localhost:4000/api/v1

## Org-Scoped Routes (`[orgSlug]/`)

| Route | Role | Description |
|-------|------|-------------|
| `[orgSlug]/business-panel/dashboard` | Business | Org admin dashboard |
| `[orgSlug]/business-panel/users` | Business | User management |
| `[orgSlug]/business-panel/hierarchy` | Business | Regional/zone/team structure |
| `[orgSlug]/business-panel/join-requests` | Business | Org membership join requests |
| `[orgSlug]/business-panel/courses` | Business | Assigned courses |
| `[orgSlug]/business-panel/learning-paths` | Business | Learning path management + intro videos |
| `[orgSlug]/business-panel/analytics` | Business | Org-scoped SofLIA/planner analytics |
| `[orgSlug]/business-panel/progress` | Business | Employee course progress tracking |
| `[orgSlug]/business-panel/reports` | Business | Reports and analytics with AI insights |
| `[orgSlug]/business-panel/reviews` | Business | Content reviews |
| `[orgSlug]/business-panel/settings` | Business | Org settings + branding + SofLIA context |
| `[orgSlug]/business-panel/subscription` | Business | Subscription management |
| `[orgSlug]/business-user/dashboard` | BusinessUser | Employee dashboard (3D backgrounds, LPs, courses) |
| `[orgSlug]/business-user/analytics` | BusinessUser | Personal learning analytics |
| `[orgSlug]/business-user/notebook` | BusinessUser | Personal notebook (TipTap) |
| `[orgSlug]/dashboard` | BusinessUser | General user dashboard |
| `[orgSlug]/courses/[slug]` | BusinessUser | Course detail page |
| `[orgSlug]/certificates` | BusinessUser | User certificates |
| `[orgSlug]/profile` | BusinessUser | Profile settings |

## Learning Paths

Ordered course groupings assigned to organizations or individual users:
- Feature: `features/learning-paths/` (access resolution, server services)
- Admin management: `features/admin/components/AdminLearningPathsPage.tsx`, `LearningPathManagementPage.tsx`
- Business panel page: `app/[orgSlug]/business-panel/learning-paths/page.tsx` → `features/business-panel/components/BusinessLearningPathsPage.tsx`
- API routes: `app/api/admin/learning-paths/` (CRUD + item reorder), `app/api/[orgSlug]/business/learning-paths/`
- Access resolution: `features/learning-paths/services/learning-path-access.server.ts`
- Hook: `features/admin/hooks/useAdminLearningPaths.ts`
- DB tables: `learning_paths`, `learning_path_items`, `organization_learning_path_assignments`, `user_learning_path_progress`, `user_learning_path_assignments`

## Intro Videos (Courses & Learning Paths)

Each organization can upload a custom intro video per learning path and per course. Shown to users before the Joyride tour on first course open.

**Business flow:**
1. Business admin opens `[orgSlug]/business-panel/learning-paths` → clicks "Gestionar videos" → `BusinessLearningPathVideosModal`
2. Uploads LP intro video and/or per-course intro videos (stored in bucket `intro-videos`)
3. API: `PUT /api/[orgSlug]/business/intro-videos/learning-path/[lpId]` and `/course/[courseId]`

**User flow:**
1. User opens `/courses/[slug]/learn` → `useCourseIntroVideos` fetches `GET /api/courses/[slug]/intro-videos`
2. If user is on position-1 course of their oldest assigned LP → shows LP intro + course intro (2 videos)
3. For any other course → shows only the course intro video
4. Video is **mandatory on first visit** (`isSkippable={false}` on `OnboardingVideoPlayer`)
5. After watching: `POST /api/courses/[slug]/intro-videos/watched` marks `course_intro_watched_at` / `lp_intro_watched_at`
6. Subsequent visits: videos do NOT auto-play again
7. **Restart button** replays intro video(s) first (skippable), then launches Joyride tour

**Key files:**
- `features/courses/hooks/useCourseIntroVideos.ts` — fetch, state, `restartWithIntroVideos(afterFn)`
- `features/business-panel/components/BusinessLearningPathVideosModal.tsx` — upload/preview/delete modal
- `features/business-panel/hooks/useBusinessLearningPathVideos.ts` — upload logic
- `features/tours/components/OnboardingVideoPlayer.tsx` — accepts `isSkippable?: boolean`
- `app/courses/[slug]/learn/course-learn-shell/IntroVideoOverlay.tsx` — renders the player inside course shell
- DB: `organization_learning_path_assignments.intro_video_url`, `organization_course_intro_videos`, `user_course_enrollments.course_intro_watched_at`, `user_learning_path_progress.lp_intro_watched_at`

## Notebook

Personal rich-text note-taking for organization employees (`BusinessUser` role):
- Feature: `features/notebook/` — components, hooks, services, types
- Page: `app/[orgSlug]/business-user/notebook/page.tsx` (list), `app/[orgSlug]/business-user/notebook/[noteId]/page.tsx` (editor)
- Editor: TipTap 3.x with extensions: Highlight, Placeholder, Subscript, Superscript, TaskList, TaskItem, TextAlign, TextStyle, StarterKit
- Auto-notes: Lessons can generate auto-notes via `features/courses/services/lesson-auto-note.service.ts` (DB: `lesson_auto_notes`)
- Note service: `features/courses/services/note.service.ts` — CRUD for user notes
- API: `app/api/[orgSlug]/business-user/notebook/` or within courses API
- **AI enrichment (second-brain phase 1)** — async pipeline that summarizes notes, extracts key concepts and detects tasks (design: `docs/LIBRO_APUNTES_SEGUNDO_CEREBRO_BLUEPRINT.md`):
  - DB: `notebook_note_metadata` (1:1 enrichment), `notebook_ai_enrichment_jobs` (service-role-only queue, idempotent per content hash), `notebook_derived_tasks` (statuses: suggested/open/done/dismissed) — migration `20260717090000`
  - Services: `notebook-enrichment.server.service.ts` (enqueue/read/tasks), `notebook-enrichment.processor.server.ts` (Gemini batch, cron), `notebook-enrichment.normalizer.ts` (pure logic, unit-tested)
  - Cron: Netlify `process-notebook-enrichment` → `GET /api/cron/process-notebook-enrichment` (CRON_SECRET)
  - UI: `NoteEnrichmentPanel` in the note editor (polls while a job is pending); i18n namespace `notebook` under `enrichment.*`
  - Rules: enrichment is fire-and-forget on note create/update (never blocks the save); compendiums are never enriched; AI-suggested tasks require explicit user confirmation; note content is injection-scanned and data-framed before reaching Gemini

## SofLIA Dialogue Engine

AI-powered activity conversations in the courses learning page. Replaces static activities with guided AI dialogue:
- Location: `features/courses/services/soflia-dialogue/`
- Architecture: policy engine → session management → tutor service → evaluator → result persistence
- Key services:
  - `dialogue-policy-engine.service.ts` — determines whether dialogue is enabled for an activity
  - `dialogue-session.service.ts` — session lifecycle (create, progress, close)
  - `dialogue-runtime.service.ts` — main orchestrator per turn
  - `dialogue-tutor.service.ts` — generates tutor responses via Gemini
  - `dialogue-evaluator.service.ts` — evaluates user answers
  - `dialogue-result.service.ts` — computes final results
  - `dialogue-result-persistence.service.ts` — persists completed dialogue results
  - `dialogue-result-submission-sync.service.ts` — syncs result to activity submission
- DB: table definitions in `dialogue-tables.ts`, TypeScript row types in `dialogue-table-rows.ts`
- 4 test files in `__tests__/`

## Business Panel

### Dashboard (Business Role)
- Component: `features/business-panel/components/BusinessPanelDashboard.tsx`
- Hook: `features/business-panel/hooks/useBusinessPanelDashboardLogic.ts`
- Layout: Full-width single-column (no Quick Actions sidebar — navigation arrows on StatCards instead)
- StatCard: `features/business-panel/components/dashboard/StatCard.tsx`
  - Shows `ChevronRightIcon` on hover only when `href` prop is defined
  - Uses CSS `scaleIn` animation (no framer-motion)
  - Accepts: `title`, `value`, `delay`, `href?`, `theme`, `iconColor`, `icon`
- Sidebar order: Dashboard → Usuarios → Estructura → Cursos → Rutas → Reportes y Analítica → Revisiones → Configuración
- Navigation config: `features/business-panel/components/business-panel-sidebar/navigation.ts`

### Feedback & Toast Standard (Business Panel)

**Rule:** All transient action feedback (assign, revoke, save, update, mutation errors) uses `ToastNotification` with `position="top-right"`. Never use inline feedback banners for action results — they cause layout shifts and feel like page reloads.

**Component:** `core/components/ToastNotification/ToastNotification.tsx`
- Props: `{ isOpen, onClose, message, type?: 'success'|'error'|'info', duration?, position?: 'top-center'|'top-right' }`
- Portal-based (no layout shift), auto-dismiss 5 s, Framer Motion entrance, progress bar

**Hook template (copy-paste for any business panel feature hook):**
```typescript
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'

const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>
  ({ isOpen: false, message: '', type: 'success' })
const showToast = useCallback((msg: string, type: ToastType = 'success') =>
  setToast({ isOpen: true, message: msg, type }), [])
const hideToast = useCallback(() => setToast(prev => ({ ...prev, isOpen: false })), [])
```

**Component wiring (in the page component):**
```tsx
<ToastNotification
  isOpen={logic.toast.isOpen}
  onClose={logic.hideToast}
  message={logic.toast.message}
  type={logic.toast.type}
  position="top-right"
/>
```

**Forbidden patterns (never do these after mutations):**
- Inline `feedback` state banners rendered inside page content
- `window.location.reload()` or `router.refresh()` after mutations
- `refetch()` that calls `setIsLoading(true)` after mutations — use `refetchSilent()` instead to avoid full-page skeleton flash

**Exception:** Unrecoverable data-loading errors (API unavailable, auth failure) may be shown inline at the top of page content — those are not transient and must stay visible until the user acts.

**Optimistic updates pattern (for list mutations like revoke):**
```typescript
// 1. Immediately hide the row in UI
setPendingRevokeIds(prev => new Set(prev).add(id))
// 2. Call API
// 3. On success: showToast + refetchSilent()
// 4. On error: remove from pendingRevokeIds (rollback) + showToast(..., 'error')
```

**In-scope for this pattern (rows with animation):** Use `<AnimatePresence>` around lists + `exit` prop on `motion.div` rows. Already implemented in `BusinessLearningPathsPage/Assignments.tsx`.

### Settings (Business Role)
- Component: `features/business-panel/components/BusinessSettings.tsx` — zero framer-motion (plain HTML + CSS)
- Tabs: Organización, Branding (Enterprise only — controlled by `organizations.branding_enabled`)
- Dropdowns: Always use `PremiumSelect` (never native `<select>`)
- Spinner: Use individual border properties — do NOT mix `borderColor` shorthand with `borderTopColor` in same React style object

### Premium UI Components (Business Panel)
**PremiumSelect** — custom dropdown that follows the SofLIA design system (org colors, animated chevron, checkmark on selected, backdrop-blur menu):
- File: `features/business-panel/components/PremiumSelect.tsx`
- Props: `value`, `onChange(val: string)`, `options: { value, label, icon? }[]`, `placeholder`, `icon?`, `className?`
- Use instead of native `<select>` **everywhere** in the business panel

**PremiumDatePicker** — custom date picker with org branding
- File: `features/business-panel/components/premium-date-picker/`

## Business User Analytics

Personal analytics dashboard for organization employees:
- Page: `app/[orgSlug]/business-user/analytics/` → `BusinessUserAnalyticsPageClient.tsx`
- Feature: `features/business-panel/components/business-user-analytics/`
  - `sections/PerformanceCards.tsx`, `sections/CourseProgressBars.tsx`, `sections/NextGoals.tsx`, `sections/AiInsightsCard.tsx`
  - `shared/` — shared sub-components
- Service: `features/business-panel/services/business-user-analytics/business-user-analytics.server.service.ts`
- Insights: `features/business-panel/services/business-user-analytics/business-user-analytics.insights.service.ts`
- API: `GET /api/[orgSlug]/business-user/analytics/` (metrics), `GET /api/[orgSlug]/business-user/analytics/insights/` (AI insights)
- DB: `business_user_analytics_insight_cache` — caches AI insights server-side
- Types: `features/business-panel/types/business-user-analytics.types.ts`
- **Important**: Analytics sections must use `useBusinessPanelTheme()` for colors — never use `var(--dash-*)` CSS variables (those are undefined)

## Reports & Analytics (Business Panel)

Full org-level analytics for the business admin:
- Component: `features/business-panel/components/BusinessReportsAnalytics.tsx`
- Hook: `features/business-panel/hooks/useBusinessReportsAnalytics.ts`
- Services:
  - `reports-analytics.server.service.ts` — main data queries (course completions, enrollments, activity submissions, user progress)
  - `reports-analytics.export.service.ts` — Excel/CSV export (ExcelJS)
  - `reports-analytics.insights.service.ts` — AI-generated insights (Gemini)
  - `reports-analytics.helpers.ts` — shared formatting and aggregation utilities
- API: `GET /api/[orgSlug]/business/reports-analytics/` (data), `GET /api/[orgSlug]/business/reports-analytics/insights/` (AI insights)
- Types: `features/business-panel/types/reports-analytics.types.ts`

## Business User Dashboard (3D)

The `BusinessUser` dashboard uses Three.js for atmospheric 3D backgrounds:
- Page: `app/[orgSlug]/business-user/dashboard/`
- 3D Components: `Background3DEffects.tsx`, `Scene3D.tsx`, `CourseCard3D.tsx`
- Particles: `ParticlesBackground.tsx` (tsParticles)
- LearningPathView: Rich horizontal scroll view of assigned LP courses with hover previews — organized in `components/LearningPathView/` (28 sub-files)
- ModernNavbar: Glassmorphism navbar with org branding — `components/modern-navbar/`

## AI Model Settings (multi-provider: Gemini + OpenAI)

Provider, model, max output tokens, temperature and **thinking level** are configured **per purpose in the database**, not in `.env`. Super-admins change them at `/admin/ai-settings` with no redeploy.

**Provider is inferred from the model name.** An admin only types `gemini-3.5-flash` or `gpt-5.1` and the platform routes to Google or OpenAI. An explicit provider (`google`/`openai`) is the escape hatch for names the registry doesn't recognize yet (stored as `ai_model_settings.provider`; `NULL` = auto).

Unrecognized model names are **rejected on save** rather than defaulting to a provider — a typo must fail in the panel, not silently in production.

**Precedence (per purpose):** database override → legacy env var → code default.
Absence of a DB row means "inherit", so deploying changes nothing until an admin overrides something.

**Key files:**
- `lib/ai/providers/ai-text-gateway.server.ts` — **single entry point**: `generateAiText()`, `streamAiText()`, `isAiPurposeAvailable()`, `hasAiProviderCredentials()`
- `lib/ai/providers/provider-registry.ts` — model→provider inference + OpenAI capability heuristics (pure; usable in the browser)
- `lib/ai/providers/google.adapter.server.ts` / `openai.adapter.server.ts` — per-provider translation of the neutral contract
- `lib/ai/providers/types.ts` — neutral contract (`AiContentPart`, `AiTurn`, `AiGenerationResult`, `AiTextStream`)
- `lib/ai/providers/openai-reasoning.ts` — thinking level → OpenAI `reasoning.effort`
- `lib/ai/prompts/` — **prompt variants**: `buildPromptModelProfile()`, `selectPromptVariant()` (pure, usable in the browser)
- `lib/ai/ai-error.ts` — `describeAiProviderError()`, parses both providers' error shapes
- `lib/ai/model-settings/purposes.ts` — catalog of purposes (source of truth; add a purpose here and it appears in the panel)
- `lib/ai/model-settings/ai-model-settings.server.service.ts` — resolver with 60s in-process cache; **degrades to env/defaults if the DB read fails** (never breaks SofLIA)
- `lib/ai/model-settings/thinking.ts` — thinking level → `thinkingConfig.thinkingBudget` (Gemini)
- API: `GET /api/admin/ai-settings`, `PUT|DELETE /api/admin/ai-settings/[purpose]` (`requireAdmin`)
- UI: `features/admin/components/AdminAiSettings/`, i18n under `admin.aiSettings.*`
- DB: `ai_model_settings` (+ `ai_model_settings_audit`, written by trigger) — service-role only, RLS with no client policies. Migrations `20260722140000`, `20260801120000` (provider column)

**Separate models per purpose** — notably `lia_general` (SofLIA chat) vs `soflia_dialogue_tutor` / `soflia_dialogue_evaluator` (SofLIA inside course activities).

**Purposes restricted to Google** (`supportedProviders: ['google']`): `lia_dictation` and `video_processing` send inline audio/video, which OpenAI covers with different APIs. The panel hides the other provider for them.

**Env vars:** `GOOGLE_API_KEY`/`GEMINI_API_KEY` (Google) and `OPENAI_API_KEY` (+ optional `OPENAI_ORGANIZATION`, `OPENAI_PROJECT`, `OPENAI_STORE_RESPONSES`). Never create a `NEXT_PUBLIC_OPENAI_*` — it would ship the key in the browser bundle.

### Prompt variants (one hand-written prompt per provider)

A prompt tuned for Gemini is not a good prompt for OpenAI. Every AI prompt in the platform has **two hand-written texts**, never one template rendered two ways:

- `*.google*.ts` — the **original prompt, frozen**. Calibrated with real usage; it must not be touched to improve OpenAI.
- `*.openai*.ts` — a **copy, rewritten** for OpenAI models. Each file documents in its header what it changed and why.
- `*.ts` (the selector) — picks one via `selectPromptVariant(profile, { google, openai }, ...args)`.

The gateway builds a `PromptModelProfile` from the *resolved* provider + model + thinking level and hands it to the prompt builder.

**Why separate texts and not a shared template:** a common prompt with swappable pieces ends up being the lowest common denominator — mediocre in both. And editing shared wording to help OpenAI would silently degrade Gemini's already-validated behaviour. With separate variants, a change in one **cannot** affect the other.

Typical adaptations in the OpenAI copies: no ``` fence prohibition (the API guarantees JSON), no uppercase emphasis, no repeated rules, decision trees instead of prose warnings, XML-ish tags for untrusted data, and reasoning hints only when `profile.reasonsInternally` is false (asking GPT-5/o-series to "think step by step" burns their reasoning budget).

`src/lib/ai/prompts/__tests__/frozen-google-prompts.test.ts` guards the invariant: it fails if any Gemini variant loses its original wording. **Every AI purpose is covered** — 18 frozen prompts across SofLIA chat, courses, analytics, notebook, moderation, forensics and the auxiliary services.

**Usage:**
```typescript
// Resolves provider, model, tokens, temperature and reasoning automatically
await generateAiText({ circuitBreakerName: '...', prompt, purpose: 'lia_general' })

// Two hand-written prompts; the selector picks the one for the resolved provider
await generateAiText({
  circuitBreakerName: '...',
  prompt: (profile) => buildMyPrompt(profile, data),
  purpose: 'reports_analytics_insights',
  systemInstruction: (profile) => buildMySystemPrompt(profile, locale),
})

// Streaming (SofLIA chat): neutral async iterable of visible text chunks
const { textChunks } = await streamAiText({ circuitBreakerName: '...', prompt, purpose: 'lia_general' })
for await (const piece of textChunks) { /* ... */ }

// JSON output: `responseAsJson` (free-form) or `jsonSchema` (schema-bound)
await generateAiText({ ..., purpose: 'ai_moderation', responseAsJson: true })
```

**Rules:**
- **Never instantiate a provider SDK directly** — always go through `generateAiText`/`streamAiText`. A raw SDK call makes the panel lie: changing the model there would have no effect on that route.
- Never read `process.env.GEMINI_MODEL` (or `*_GEMINI_MODEL`) in new code — declare a purpose instead
- Never check `GOOGLE_API_KEY` to decide whether AI is available — use `isAiPurposeAvailable(purpose)`, which checks the *configured* provider's credentials
- Values a call site must control (e.g. JSON output) go in the call arguments, not the DB
- Documented exceptions that stay on the raw Gemini SDK: `api/admin/ai/process-video` (File API upload flow) and `api/lia/live-token` (Gemini Live voice protocol). Both are pinned to `supportedProviders: ['google']`.
- Exception: `GEMINI_TTS_MODEL` stays env-only on purpose — it is part of the audio cache key and is derived synchronously

## SofLIA AI Assistant

AI-powered chat over Gemini or OpenAI (selectable per purpose from the admin panel):
- Feature: `features/lia/components/` (chat UI and history)
- Config: `lib/lia/`, `lib/lia-config.ts`, `lib/lia-context/`, `lib/ai/providers/`
- Model settings: **database-driven**, not env vars — see "AI Model Settings" (purpose `lia_general`)
- Multilingual (ES, EN, PT) with automatic language detection
- Context-aware: course lessons, study planner, dashboard, general
- Persistent conversation history with editable titles
- Proactive Study Planner actions (move/delete/create sessions)
- Live Voice: `app/api/lia/live-token/` — Gemini Live ephemeral token for real-time voice sessions (DB: `lia_live_voice_sessions`)

```typescript
import { useLIAChat } from '@/features/lia/hooks/useLIAChat';
const { sendMessage, messages, isLoading } = useLIAChat({ context: 'course_lesson' });
```

## Study Planner

AI-powered study planning with Google Calendar integration:

**AI Engine:**
- Uses **Google Gemini 2.5** (`@google/generative-ai`)
- Anti-hallucination prompt system v2.0 with REGLA #00 date safety protocol (`prompts/study-planner.prompt.rules.ts`)
- Proactive session actions via `<action>JSON</action>` tags: `rebalance_plan`, `move_session`, `delete_session`, `create_session`, `recover_missed_session`, `reduce_session_load`

**Google Calendar Integration:**
- Full read/write via `features/study-planner/services/calendar-google.service.ts`
- Platform secondary calendar: `SofLIA - Sesiones de Estudio`
- Free/busy analysis, event CRUD, calendar sync (`api/study-planner/calendar/sync-sessions/`)
- Calendar change detection (`api/study-planner/calendar/check-changes/`)

**Organization Config:**
- Per-org planner config: `organization_planner_config` table
- Holiday awareness: `organization_holidays` table
- Planning window (deadline) per course assignment: `study_sessions_assignments`

**Architecture:**
- V2 planning actions: `actions/planning-actions-v2.service.ts`, `actions/session-actions-v2.service.ts`
- Schedule preview: `components/schedule-preview/` (panel, week grid, event blocks)
- Calendar views: `components/calendar/CalendarDayView.tsx`, `CalendarWeekView.tsx`
- Tests: `services/__tests__/`, `dashboard/chat/__tests__/`

## Security Layer

**Location:** `lib/security/`

Enterprise-grade security system protecting AI endpoints and API routes:
- `prompt-injection-detector.ts` — multi-signal detection (clone-rule, clone-signals, rules engine); used on all AI chat endpoints
- `agent-policy.ts` + `agent-traffic-policy.ts` — policies for trusted agent-to-agent calls
- `bot-protection.ts` — automation signal detection, CAPTCHA-like verification
- `security-audit-log.ts` — structured security event logging
- `trusted-agent-auth/` — agent handshake and authentication
- `security-alerts.ts` — security event dispatching
- `cors.ts` — CORS configuration
- `signed-token.ts` — cryptographic signed tokens
- Security API routes: `app/api/security/agent-handshake/`, `/automation-signal/`, `/csp-report/`, `/verify-human/`

**Circuit Breaker:** `lib/resilience/circuit-breaker.ts` — protects against cascading failures in external service calls (Gemini, Supabase)

## Animation & Bundle Optimization

~350KB gzipped removed from the landing page cold-start bundle:

| Library | Removed from | Replacement |
|---------|-------------|-------------|
| `framer-motion` (~200KB) | Landing page components | CSS `@keyframes` + Tailwind animation classes |
| `react-joyride` (~80KB) | `TourProvider.tsx` | `next/dynamic()` lazy import |
| `gsap` (~70KB) | `BusinessLogo.tsx` | CSS animations |

**framer-motion in authenticated pages is intentional** — those chunks are lazy-loaded per route. Only the landing page was optimized.

### CSS Animation Patterns (Landing Page Only)

```tsx
// Entrance stagger — replaces motion.div initial/animate
const FADE_UP = 'animate-[slideInUp_0.6s_cubic-bezier(0.16,1,0.3,1)_both]'
<div className={FADE_UP} style={{ animationDelay: '150ms' }} />

// Hover/tap — replaces whileHover/whileTap
<button className="hover:scale-[1.03] active:scale-[0.97] transition-transform duration-300" />

// StatCard entrance (business panel)
<div className="animate-[scaleIn_0.5s_ease-out_both]" style={{ animationDelay: `${delay * 80}ms` }} />
```

Custom keyframes are in `tailwind/keyframes.js`; registered in `tailwind/animations.js`.

### Reduced Motion Guard

- `lib/utils/motion.ts` — `useMotionSafe()` hook; uses native `window.matchMedia` (no framer-motion)
- `core/components/MotionGuardProvider.tsx` — sets `document.documentElement.dataset.reduceMotion='true'`
- CSS in `global-overrides-17.css`: `[data-reduce-motion="true"] * { animation-duration: 0.01ms !important }`

## Component Refactoring Guidelines

### When to Refactor

- Component exceeds 300 lines
- Multiple responsibilities in one file
- Business logic mixed with UI rendering

### Steps

1. **Extract business logic** → Create `use[Feature]Logic.ts` custom hook
2. **Identify sub-components** → Split by UI sections (Header, Body, Footer, etc.)
3. **Create types file** → Move shared types and constants to `types.ts`
4. **Add barrel export** → Create `index.ts` for clean imports

### Custom Hooks Pattern

```typescript
// hooks/useFeatureLogic.ts
export const useFeatureLogic = (props) => {
  const [state, setState] = useState()
  const handleAction = () => { /* business logic */ }
  return { state, handleAction }
}
```

## Critical Rules

### Architecture & Structure
- **Screaming Architecture** — organize by features, not technical layers
- **Monorepo workspaces** — use `--workspace=apps/web` for all package operations
- **Component size** — refactor components over 300 lines into modular structure
- **No platform name "SOFIA"** — the platform is **SofLIA**. Use "SofLIA" everywhere

### Styling & Colors (CRITICAL)
- **NO hardcoded hex colors** — never use `#0F1419`, `#1E2329`, etc. in code
- **Use Tailwind classes** — `bg-gray-900`, `text-white`, `border-white/10`, etc.
- **CSS Variables** — use `--color-primary`, `--color-accent` for platform colors
- **Theme support** — all components must support both light AND dark mode
- **Organization colors** — use `useBusinessPanelTheme()` for any business panel component; use `--org-accent-color` CSS var with platform fallback for components outside org layout

### UI Components
- **No native `<select>`** in business panel — always use `PremiumSelect` from `features/business-panel/components/PremiumSelect.tsx`
- **Border shorthand conflict** — never mix `borderColor` (shorthand) with `borderTopColor` (non-shorthand) in the same React `style` object; React 18 warns on rerender. Use all four individual properties: `borderTopColor`, `borderRightColor`, `borderBottomColor`, `borderLeftColor`

### Animations
- **No framer-motion on landing page** — use CSS `@keyframes` + Tailwind animation classes; framer-motion is fine in authenticated pages
- **No animation removal without checking** — many authenticated page animations use `useMotionSafe()` which respects reduced-motion preferences

### API & Data
- **No webhooks** — always use REST API endpoints
- **Supabase direct** — most backend logic is in Next.js API routes via Supabase, not the Express API
- **Analytics sections** — always use `useBusinessPanelTheme()` for colors; never use `var(--dash-*)` CSS variables (undefined, cause invisible elements)

### Code Quality
- **Responsive design** — mobile-first for all components
- **Translations** — keep es/en/pt files in sync, ES is source of truth
- **TypeScript strict** — no `any` types, prefer `unknown`
- **B2B only** — this is a pure enterprise platform. Do not add consumer-facing features

---

## Claude Code Commands

**Memory & Context:**
- `/remember` — Save information for future conversations (stores in Claude's memory)
- `/clear` — Clear conversation history

**To update this CLAUDE.md file:**
- Just ask Claude to update it directly (e.g., "Update CLAUDE.md with X information")
- Or edit manually: `code CLAUDE.md`
