# RO Unlimited — Owner Manual & Technical Handover
## Chapter 1 — Owner Overview & "At a Glance"

> Last updated: 2026-06-25. This manual replaces the original March 2026 handover and reflects the system as it actually exists today. Each chapter is standalone; read Chapter 8 (Credentials & Access Vault) for every secret in one place, and Chapter 10 if you are a developer/agent about to take over.

### 1.1 Why this manual exists
RO Unlimited **owns** its website and admin platform outright. Every account, domain, server, and credential belongs to RO directly (under `rounlimitedco@gmail.com` or RO's own service accounts). This manual exists so that **any** competent web developer or AI coding agent can take over the entire system — get it running, deploy changes, manage content, and understand every layer — even if the current development team is no longer involved.

### 1.2 Who's who
- **RO Unlimited Construction & Development** — the business and the **owner** of everything here. Upstate South Carolina / 864 area code. Phone (864) 304-0139. Primary account email `rounlimitedco@gmail.com`.
- **NexaVision Group** — the **development agency** that built and maintains the site and admin app. Contact: Den Chai, `info@nexavisiongroup.com`. NexaVision's dev login is `admin@nexavisiongroup.com` (a `super_admin` account). This is normal — NexaVision is the builder, so some NexaVision-owned shared tooling (a shared Brave Search key, the Cloudflare account) and the dev account are part of the system. None of it blocks RO from owning or transferring the platform.

### 1.3 What the system actually is
Two things in one Next.js codebase:
1. **The public marketing site** (`rounlimited.com`) — Home, Residential, Commercial, Land Grading, the full **Services** section (Roofing, Septic, Electrical, Plumbing, Repairs — each ~8 sub-service pages), Build Process, Our Story, Join, Contact. Mobile-first with GSAP animations + hero video.
2. **A private business platform** (`rounlimited.com/admin`) — invite-only: Estimate builder (PDF + email send), Customers/CRM, Employees/HR, Vendors, Tasks/Reminders, an email Inbox, **RO Drive** file storage, Photos/Portfolio, and a powerful **built-in AI assistant**. Plus a **native Android app** and a self-hosted **Oracle Cloud** server for large-file storage.

### 1.4 Live URLs
| What | URL |
|---|---|
| Public website | https://rounlimited.com (and https://www.rounlimited.com) |
| Admin portal | https://rounlimited.com/admin |
| Sanity CMS Studio | https://rounlimited.com/studio |
| Maintenance page (when enabled) | https://rounlimited.com/maintenance |

### 1.5 The master account (the master key)
A single Google account logs into GitHub, Vercel, Sanity, Supabase, and GoDaddy. If access to any service is lost, recovering this Gmail is step one.
- **Email:** `rounlimitedco@gmail.com` · **Phone on file:** (864) 304-0139
- **Action:** keep 2FA on this Gmail account — the single most important security control.

### 1.6 Technology at a glance
- **Framework:** Next.js 14 (App Router) · React 18 · TypeScript
- **Styling/animation:** Tailwind CSS · GSAP 3.14 + ScrollTrigger · Framer Motion
- **CMS:** Sanity (hero video + a few settings; most content is in code)
- **Database & auth:** Supabase (PostgreSQL, invite-only) — RO's own project `ocizuduhqsmewcmtilae`
- **Hosting:** **RO's own Vercel project** (`ro-unlimited`), fronted by **Cloudflare**; domain at **GoDaddy**
- **Email:** Resend · **Storage:** Telegram bot + self-hosted **Oracle Cloud** server · **Push:** Firebase/web-push (VAPID) · **AI:** Anthropic Claude + Groq + xAI Grok

### 1.7 Hosting & ownership summary (correction vs old manual)
- Served by **one** Vercel project on **RO's own** account (team `rounlimiteds-projects`, project `ro-unlimited`). Both `rounlimited.com` and `www.rounlimited.com` come from this single RO-owned project. (As of 2026-06-25, `www` was moved off a NexaVision-owned Vercel project onto RO's own, so there is **no external hosting dependency** and one `git push` deploys everything.)
- **Cloudflare** fronts Vercel for DNS/proxy and also fronts the Oracle subdomains (`upload.rounlimited.com`, `dav.rounlimited.com`).
- Domain `rounlimited.com` is registered at **GoDaddy**.

### 1.8 New developer productive in under an hour
1. Clone `https://github.com/Rounlimited/ro-unlimited.git`, `git checkout master`.
2. `npm install` (`.npmrc` sets `legacy-peer-deps=true` — required).
3. Create `.env.local` from Chapter 8.
4. `npx next dev -p 3100 -H 0.0.0.0` → http://localhost:3100.
5. Push to `master` → Vercel auto-deploys in ~2 minutes.
(AI agent? Read Chapter 10 first — use Claude Code, feed it the bootstrap JSON.)

### 1.9 How this manual is organized (10 chapters)
1. Owner Overview & At a Glance (this chapter)
2. Architecture & Tech Stack
3. Public Site & RO Services
4. Admin App
5. Built-in AI Assistant
6. RO Drive & Oracle Infrastructure
7. Integrations & Data
8. Credentials & Access Vault
9. Operations & Handover
10. AI Dev Handoff: Use Claude Code (bootstrap JSON; Claude Pro minimum, Max recommended)

### 1.10 Update log
| Date | By | What changed |
|---|---|---|
| March 2026 | NexaVision Group | Initial handover; all accounts migrated to RO ownership |
| 2026-06-25 | NexaVision Group | Full rewrite into 10 chapters: admin business platform (estimates/CRM/AI/Drive), the Services section, RO Drive + Oracle infra, native Android app, corrected Supabase project + single RO-owned Vercel, full current credentials, and the Claude Code AI-dev handoff. Mirrored in the repo `handover/` folder + top-level `CLAUDE.md`. |
