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
