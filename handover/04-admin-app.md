# RO Unlimited — Owner Manual & Technical Handover
## Chapter 4 — Admin App (the private business platform)

### 4.1 What it is
`rounlimited.com/admin` is an invite-only, mobile-first PWA the RO team uses to run the business: estimates, customers, employees, vendors, tasks, email, file storage, photos, and an AI assistant. Same Next.js codebase as the public site. Also wrapped as a native Android app (Chapter 6).

### 4.2 Authentication & roles
- `src/components/admin/AuthGuard.tsx` wraps all admin routes; checks the Supabase session, redirects to `/admin/login` if not signed in. Public exceptions: `/admin/login`, `/admin/join/[token]`, `/admin/access/[token]`.
- **Auth = Supabase**, invite-only (signups disabled, email autoconfirm on). Register only via invite link → `/admin/join/[token]`; passwordless access links → `/admin/access/[token]`.
- **Roles** (Supabase `user_metadata.role`): `super_admin` (full control + user mgmt), `admin` (default), `developer` (restricted). Owner `rounlimitedco@gmail.com` = admin; NexaVision dev `admin@nexavisiongroup.com` = super_admin.
- ⚠️ As of 2026-06-05 only `/api/admin/settings` enforced server-side `getServerUser()`; most other `/api/admin/*` routes are not yet auth-gated. Hardening them with `getServerUser()` (`src/lib/supabase/server.ts`) is recommended pending work.

### 4.3 App shell (`src/components/admin/AppShell.tsx`)
- Sticky header: logo (→ `/admin`), a history-aware **back button** (every page except dashboard; falls back to `/admin`), the AI trigger (unread badge), a notification bell (daily briefing + unread email).
- Bottom tab bar: Home · Tasks · Menu (center) · Messages. Hidden by default; **swipe-up** reveals it (auto-hides 4s). iOS edge swipe-right = back.
- App drawer (center Menu): searchable 4-col grid of app icons (active + "coming soon"); long-press = feature modal.
- First 10 sessions show an "OPERATIONS — swipe up" canvas hint.
- PWA: `PWAInstall.tsx` registers the service worker, prompts install + notifications, subscribes to web-push, and auto-recovers stale-chunk white screens.

### 4.4 Admin page inventory
**Dashboard & access:** `/admin` (dashboard stats), `/admin/login`, `/admin/join/[token]`, `/admin/access/[token]`, `/admin/settings` (team/roles/invites + **Site Status maintenance toggle**), `/admin/activity` (audit log), `/admin/help`.
**Estimates (core sales tool):** `/admin/estimates` (list/filter), `/admin/estimates/new` (multi-step wizard), `/admin/estimates/[id]` (editor + AI Assist panel), `/admin/estimates/[id]/preview` (PDF + send). Supporting: `/admin/cost-library`, `/admin/disclaimers`, `/admin/templates`.
**CRM / people:** `/admin/customers` (+ `/[id]`), `/admin/employees` (+ `/[id]`: docs/equipment/skills/reviews/email-access), `/admin/vendors` (+ `/[id]`), `/admin/intakes` (+ `/[id]`), `/admin/leads`.
**Communication:** `/admin/inbox` (full email client via Resend; threads, search — Chapter 7).
**Operations:** `/admin/tasks` (reminders/recurrence/push), `/admin/drive` (+ `/upload`, `/upload-files` — RO Drive, Chapter 6), `/admin/photos`, `/admin/projects` (+ `/new`, `/[id]`), `/admin/service-media`, `/admin/checklist` (+ `/company`, `/testimonials`).

### 4.5 How to add a new admin page
1. `src/app/admin/<feature>/page.tsx` (inherits AuthGuard + AppShell via admin layout).
2. `src/app/api/admin/<feature>/route.ts` using `createAdminClient()` (`src/lib/supabase/server.ts`).
3. Add an entry to `APP_ICONS` in `AppShell.tsx` for the drawer.
4. Full-screen overlays need a safe-area top spacer (`pt-safe` / `h-safe-top`) so controls clear the iOS status bar.

### 4.6 Conventions
Server uses the Supabase service-role admin client; the browser uses the anon client. Most reads/writes go through `/api/admin/*`. UI = Tailwind + lucide-react + GSAP. Heavy file routes have extended Vercel timeouts (Chapter 2).

### 4.x — Added 2026-08-23
- **Admin API auth**: `src/middleware.ts` requires a Supabase session for `/api/admin/*` (exceptions: invite-token GET/PUT, access-link GET, push-send POST). Customer PDF: `/api/estimate/[token]/pdf`.
- **Customer activity**: `document_events` + counters; `src/lib/doc-events.ts`; alerts via `src/lib/alerts.ts` routed by `app_settings.alert_routing` (Settings → Alerts, dev-only card; precedence event → division → default). Push devices silently re-register on app open and are tagged with the login (`PWAInstall.tsx`). Pills on the estimates list; Customer Activity panel on estimate + invoice detail.
- **Analytics** `/admin/analytics`: 4 color-coded sections (Estimates gold, Activity orange, Traffic blue via `cloudflare-analytics.ts`, Behaviour teal via `posthog-analytics.ts` lazy-loaded), rule-based plain-English insights (`analytics-insights.ts`), auto-refresh every 2 min.
- **Industry Pulse**: dashboard ticker (seamless loop; speed per login in Settings) + collapsed "Good to know today" card + `/admin/news` with a Tricks-of-the-Trade lane (16 YouTube trade channels). Sources `news-feeds.ts` (39 free), pulse `industry-pulse.ts` (BLS PPI + NWS), curation `news-curator.ts` (hard filters → AI vs live estimate profile → thresholds; learns from `news_feedback`).
- **Settings per login**: Text Size (scales all admin text), Ticker Speed; `estimate_date` on estimates (wizard Step 1 / detail).
- **Ops**: Vercel Hobby crons are daily-only (faster deploys silently rejected) — 6-hourly news + hourly reminders run from the Oracle box (`~/ro-cron/`). GitHub→Vercel webhook sometimes misses pushes: always confirm a deployment started. SW cache `ro-admin-v36`. Mobile nav (`AppShell APP_ICONS`) and desktop nav (`nav-items.ts`) are separate lists — add new pages to both. iPad pass: tablet width cap, md 6-col grids, `@media(hover:none)` for row actions.
- **Fixed silent bugs**: daily briefing never saved/pushed; customer-message notification wrote to a non-existent column; task reminders never scheduled; push devices never tied to logins; duplicate `schedule` key in AppShell.
