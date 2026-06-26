# CLAUDE.md — RO Unlimited (read this first)

You are working on **RO Unlimited** — a single Next.js 14 codebase that contains both the **public marketing site** (`rounlimited.com`) and a large **private admin business platform** (`rounlimited.com/admin`: estimates/CRM, employees, vendors, tasks, a real email inbox, RO Drive file storage, a built‑in multi‑model AI assistant, and a native Android app). Storage runs through a Telegram bot + a self‑hosted Oracle Cloud server.

**The full, authoritative handover documentation is in `handover/01..10` (10 markdown chapters), mirrored in the owner's Google NotebookLM notebook `8dbd855d-59d5-49f8-8bd5-480a4fbe07fa`.** Read the relevant chapter before changing a subsystem. Credentials are in `handover/08-credentials-vault.md` and the repo's `.env.local` (never commit `.env.local`).

If you are a brand‑new agent: use **Claude Code** (this tool). Recommended subscription **Claude Pro minimum, Claude Max for a codebase this size**. Optionally connect the NotebookLM manual via the `notebooklm-mcp-cli` MCP connector so you can `notebook_query` it while working.

## Quick facts
- **Repo:** github.com/Rounlimited/ro-unlimited · production branch `master` · local root `C:\websites\rounlimited\git`
- **Stack:** Next.js 14 App Router + React 18 + TypeScript + Tailwind + GSAP. CMS = Sanity (hero video + a couple settings only). DB/auth = Supabase (`ocizuduhqsmewcmtilae`, invite‑only).
- **Install:** `npm install` (`.npmrc` has `legacy-peer-deps=true` — REQUIRED). **Dev:** `npx next dev -p 3100 -H 0.0.0.0`.
- **Deploy:** ONE RO‑owned Vercel project. `git push origin master` → auto‑deploy ~2 min. No NexaVision dependency. CLI: `VERCEL_ORG_ID=team_r4Z6lWU4vIqkjE1TtMKg4pjc VERCEL_PROJECT_ID=prj_IAbUrfvGyPPd0Qw8qpL0ffeuZTIH npx vercel --prod --token <RO_VERCEL_TOKEN> --yes`. Rollback via Vercel → Deployments → Promote a prior Ready build.
- **Hosting path:** Cloudflare (DNS/proxy) → Vercel (project `ro-unlimited`). Domain at GoDaddy.

## Conventions / gotchas (do not trip on these)
- `next.config.js` sets `typescript.ignoreBuildErrors:true` + `eslint.ignoreDuringBuilds:true` — **the build will NOT catch type errors. Don't rely on it.**
- Keep `.npmrc legacy-peer-deps=true` or Vercel builds fail.
- Animate only `transform`/`opacity` via the GSAP `useGSAP` hook.
- Most public content is hardcoded TS in `src/lib/*-data.ts`; only the hero video + maintenance message come from Sanity.
- Full‑screen admin overlays need iOS safe‑area top padding (`pt-safe` / `h-safe-top`).
- Service worker `public/sw.js` is **network‑only** for HTML and `/api`; bump `CACHE_NAME` on major admin releases (it also auto‑recovers stale‑chunk white screens).
- Heavy routes have extended Vercel timeouts in `vercel.json` (`api/admin/drive*` = 300s).

## Where things live
- Public site: `src/app/(home, residential, commercial, services/*, grading, process, our-story, join, contact)`
- Services system: `src/lib/*-data.ts` + `src/components/sections/ServicePageTemplate.tsx` & `SubServicePage.tsx`
- Admin app: `src/app/admin/*` (25+ pages) + `src/components/admin/*` (`AppShell`, `AuthGuard`, `AdminInbox`)
- Built‑in AI: `src/components/admin/AiChatBubble.tsx` + `src/app/api/admin/ai-chat/route.ts` (~35 tools; Claude/Groq/Grok)
- RO Drive: `src/app/admin/drive/page.tsx` + `src/app/api/admin/drive/*` (Telegram + Oracle `129.80.43.28`, ssh key `oracle_ssh_key2`)
- Native Android app: `native-app/` (`com.rounlimited.admin`; keystore `twa/ro-admin.keystore`)
- Data layer: `src/lib/supabase/{client,server}.ts` ; `src/lib/sanity/*`
- Maintenance mode: `src/middleware.ts` + admin `/settings` Site Status (Supabase `app_settings`)

## Known issues / pending work
- RO Drive files **>20 MB can't be downloaded** — Oracle `telegram-bot-api` runs without `--local` (see `handover/06`).
- Sanity write token may be **read‑only** — create an Editor token if writes 403 (`handover/07`).
- Most `/api/admin/*` routes are **not yet server‑auth‑gated** — add `getServerUser()` (`handover/04`).

## Bootstrap JSON (paste into a fresh Claude session to orient instantly)
```json
{
  "project": "RO Unlimited — Next.js public site + admin business platform",
  "repo": "github.com/Rounlimited/ro-unlimited (master) at C:\\websites\\rounlimited\\git",
  "install": "npm install (.npmrc legacy-peer-deps=true)",
  "dev": "npx next dev -p 3100 -H 0.0.0.0",
  "deploy": "git push origin master -> single RO Vercel project auto-deploys (~2 min); no NexaVision dependency",
  "stack": "Next.js 14, React 18, TS, Tailwind, GSAP; Supabase ocizuduhqsmewcmtilae; Sanity 3at2yyx0; Cloudflare->Vercel; GoDaddy domain",
  "subsystems": ["public site src/app", "services src/lib/*-data.ts + ServicePageTemplate/SubServicePage", "admin src/app/admin", "built-in AI src/app/api/admin/ai-chat", "RO Drive Telegram+Oracle src/app/api/admin/drive", "native app native-app/"],
  "credentials": "handover/08-credentials-vault.md + .env.local (never commit .env.local)",
  "known_issues": ["RO Drive >20MB download (Oracle missing --local)", "Sanity write token maybe read-only", "/api/admin/* not all auth-gated"],
  "docs": "Full detail in handover/01..10 and NotebookLM notebook 8dbd855d-59d5-49f8-8bd5-480a4fbe07fa",
  "tooling": "Use Claude Code; Claude Pro min, Max recommended for this size"
}
```
