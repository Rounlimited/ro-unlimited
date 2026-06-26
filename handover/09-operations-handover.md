# RO Unlimited — Owner Manual & Technical Handover
## Chapter 9 — Operations & Handover

### 9.1 Day-1: run locally
1. `git clone https://github.com/Rounlimited/ro-unlimited.git` · `cd ro-unlimited` · `git checkout master`.
2. `npm install` (Node 18+; `.npmrc legacy-peer-deps=true` mandatory).
3. Create `.env.local` from Chapter 8.16.
4. `npx next dev -p 3100 -H 0.0.0.0` → http://localhost:3100.

### 9.2 Deploy to production
- **Standard:** `git push origin master` → Vercel auto-builds + deploys to apex + www (same RO-owned project) in ~2 min. **One project to deploy.**
- **CLI:** `cd C:\websites\rounlimited\git` then `VERCEL_ORG_ID=team_r4Z6lWU4vIqkjE1TtMKg4pjc VERCEL_PROJECT_ID=prj_IAbUrfvGyPPd0Qw8qpL0ffeuZTIH npx vercel --prod --token <RO_VERCEL_TOKEN> --yes` (token in Credentials Vault — NotebookLM Ch 8.4 / `.env.local`).
- **Rollback:** Vercel → project `ro-unlimited` → Deployments → Promote a prior "Ready" build (~30s).
- After a deploy, bump `CACHE_NAME` in `public/sw.js` for major admin changes.

### 9.3 Maintenance mode
- Admin toggle: `/admin/settings` → Site Status (admin/super_admin). Stored in Supabase `app_settings` (`maintenance_mode` + `maintenance_message`). `src/middleware.ts` serves `/maintenance` (503) for public routes; `/admin` + `/api` stay open. ~15s to propagate.
- Emergency: set `MAINTENANCE_MODE=on`/`off` in Vercel env to force it.

### 9.4 Native Android app — build & release
1. Edit `native-app/` (or just deploy the website — the app loads it live).
2. Bump `versionCode`/`versionName` in `app/build.gradle`.
3. `cd native-app && ./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release.apk` (signed with `ro-admin` keystore = in-place update).
4. Host at `https://rounlimited.com/<name>.apk`; user opens + taps Update.

### 9.5 Cron jobs
`vercel.json`: follow-ups 13:00 UTC, daily-briefing 12:00 UTC, email-cleanup 03:00 UTC. Require `CRON_SECRET`.

### 9.6 If the dev team ever changes
RO owns everything, so a new dev needs: (1) this manual; (2) login to GitHub/Vercel/Sanity/Supabase/GoDaddy/Cloudflare/Oracle with the master account; (3) `.env.local` (Chapter 8.16).
Revoke when NexaVision departs (optional): remove `admin@nexavisiongroup.com` from Supabase; remove NexaVision from Vercel team / Sanity members; rotate GitHub PAT, Vercel token, Sanity token; decide whether to migrate the shared Cloudflare account + Brave key. None required for the site to keep running — it already runs entirely on RO's own infrastructure.

### 9.7 Known issues & pending work
- RO Drive files >20 MB can't download — Oracle `telegram-bot-api` needs `--local` (Ch 6.7).
- Sanity write token may be read-only — create an Editor token (Ch 7.2).
- Most `/api/admin/*` routes not yet server-auth-gated — add `getServerUser()` (Ch 4.2).
- NexaVision fragments kept by choice: Cloudflare account + Brave key; dormant `site2-staging` / paused `site2.rounlimited.com`.
- Optional historical: domain GoDaddy→Porkbun (cost), contact form → Leads dashboard.

### 9.8 Security checklist (yearly + when a dev leaves)
- [ ] Vault stored securely (this notebook + password manager + printed copy).
- [ ] 2FA on `rounlimitedco@gmail.com`.
- [ ] GitHub PAT, Vercel token, Sanity token current.
- [ ] Vercel team / Sanity members / Supabase users = current people only.
- [ ] Oracle SSH key + OCI creds secured; TLS certs auto-renewing.
- [ ] GoDaddy + Cloudflare logins secured.
- [ ] Update log current.

### 9.9 Quick contacts
- RO Unlimited (owner): (864) 304-0139 · `rounlimitedco@gmail.com` · Upstate SC.
- NexaVision Group (developer): Den Chai · `info@nexavisiongroup.com`.
