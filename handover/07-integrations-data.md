# RO Unlimited — Owner Manual & Technical Handover
## Chapter 7 — Integrations & Data

### 7.1 Supabase (database + auth) — RO's own project
- Project ref **`ocizuduhqsmewcmtilae`**, URL `https://ocizuduhqsmewcmtilae.supabase.co`. (The original manual's `czyphstkjyqhpzlwxued` is dead/legacy.)
- Clients: `src/lib/supabase/server.ts` (`createAdminClient()` service-role; `createServerClient()` SSR), `src/lib/supabase/client.ts` (browser anon). Auth invite-only; roles via `user_metadata.role`.
- **Key tables:** CRM — customers, estimates, estimate_line_items, estimate_payment_schedules, estimate_phases, estimate_status_history, cost_items, disclaimers, state_terms, templates, intakes. People — employee_profiles, employee_intakes, employee_documents, employee_equipment, employee_email_access, vendors. Email — email_accounts, email_messages, email_attachments, email_contacts. Drive — user_files, user_folders, file_shares, folder_shares, user_shares. Ops/AI — tasks, ai_conversations, ai_memories, activity_log, user_activity, admin_notifications, push_subscriptions, preferences, app_settings (maintenance flag), user_onboarding, projects, photos.
- DDL: a Supabase Management PAT *(see Credentials Vault — NotebookLM Ch 8.6)* has table-creation rights via the Management API.

### 7.2 Sanity CMS
- Project **`3at2yyx0`**, dataset `production`, API version `2024-01-01`, Studio `/studio`. Clients in `src/lib/sanity/`.
- Docs: siteSettings (singleton: hero video + settings), project, inviteToken, sitePhoto, commercialRfp. Inbound-email attachments upload to the Sanity asset CDN.
- ⚠️ Read + write tokens are the **same value** and may be **read-only** — writes can 403. Create an Editor token at sanity.io/manage → `3at2yyx0` → API → Tokens, then update `.env.local` + Vercel.

### 7.3 Email — Resend
- Inbound: `/api/email/inbound` (webhook, Svix-verified with `RESEND_WEBHOOK_SECRET`) → fetch message → attachments to Sanity CDN → store `email_messages` in Supabase. `EMAIL_FORWARD_TO = build@rounlimited.com`.
- Outbound: `/api/email/compose`, `/api/email/reply`, estimate sends, `/api/contact`. Surfaces in admin Inbox.

### 7.4 Push notifications
- Web-push (VAPID): `PWAInstall.tsx` subscribes (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`); `/api/admin/push-subscribe` stores in `push_subscriptions`; `/api/admin/push-send` broadcasts (internal auth `x-push-secret` = `PUSH_SECRET`). The SW shows the notification.
- Firebase (project `ro-unlimited`) configured for FCM + the TWA; service account JSON at `C:/Users/databackup/ro-unlimited-firebase-adminsdk.json`.

### 7.5 AI providers
Anthropic Claude, Groq (Llama 3.3 + Whisper), xAI Grok, Brave Search, RentCast — see Chapter 5. (`TAVILY_API_KEY` exists, may be unused.)

### 7.6 API route map (`src/app/api`)
- `/api/admin/*` (~60): estimates (+ line-items, payment-schedule, pdf, send, share-link, status, pricing-check, ai-assist), customers, employees (+ documents/equipment/skills/reviews/email-access), vendors, projects, tasks (+ count), intakes, drive (+ file), upload (+ upload-config), photos, service-images, cost-library, disclaimers, state-terms, templates, settings, preferences, notifications, push-subscribe/send, activity, briefing, ai-chat, ai-conversations, ai-memories, transcribe, invite/invite-token/access-link, create-account, onboarding, migrate*.
- `/api/email/*`: inbound, threads, drafts, compose, reply, contacts.
- `/api/shared/*`, `/api/estimate/[token]`, `/api/intake/[token]`: token-gated public access.
- `/api/cron/*`: reminders, follow-ups, daily-briefing, email-cleanup.
- Public: `/api/contact`, `/api/trade-apply`.

### 7.7 Cron jobs (`vercel.json`)
- `/api/cron/follow-ups` — daily 13:00 UTC · `/api/cron/daily-briefing` — daily 12:00 UTC · `/api/cron/email-cleanup` — daily 03:00 UTC · (`/api/cron/reminders` for task reminders). All require the `CRON_SECRET` (or `PUSH_SECRET`) header.

### 7.8 Environment variable reference (values in Chapter 8)
`NEXT_PUBLIC_SANITY_PROJECT_ID/DATASET/API_VERSION`, `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN` · `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_SITE_URL` · `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `EMAIL_FORWARD_TO` · `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PUSH_SECRET` · `TELEGRAM_BOT_TOKEN`, `TELEGRAM_STORAGE_CHAT_ID`, `TELEGRAM_API_URL`, `TELEGRAM_FILE_SERVER`, `NEXT_PUBLIC_TELEGRAM_UPLOAD_URL` · `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `GROK_API_KEY`, `BRAVE_SEARCH_API_KEY`, `RENTCAST_API_KEY`, `TAVILY_API_KEY` · `CRON_SECRET` · `MAINTENANCE_MODE` · `CF_*`, `FIREBASE_*`, `OCI_*`.
