# RO Unlimited — Owner Manual & Technical Handover
## Chapter 2 — Architecture & Tech Stack

### 2.1 The codebase in one paragraph
A single **Next.js 14 App Router** project (TypeScript) holds both the public site and the admin platform. Public pages are mostly static/SSR from TypeScript data files (plus a little Sanity). The admin app is a client-heavy PWA backed by **Supabase** with dozens of `/api/*` route handlers. It deploys to **RO's own Vercel** project, fronted by **Cloudflare**. Large file storage + the Android upload path run through a self-hosted **Oracle Cloud** server (Chapter 6). Repo root: `C:\websites\rounlimited\git` · GitHub `Rounlimited/ro-unlimited` (`master` = production).

### 2.2 Full stack & key versions (package.json)
- next `^14.2.0`, react/react-dom `^18.3.0`, typescript `5.9.3`
- tailwindcss `^3.4`, gsap `^3.14` + `@gsap/react`, framer-motion `^11`, styled-components `^6.3`, lucide-react
- CMS: sanity `^5.13`, next-sanity `^12.1`, @sanity/client `^7.16`, @sanity/image-url
- DB/auth: @supabase/supabase-js `^2.98`, @supabase/ssr `^0.9`, pg `^8.20`
- Email resend `^6.9`; webhooks svix `^1.87`; push web-push `^3.6`
- PDF/sign @react-pdf/renderer `^4.3`, signature_pad; rich text @tiptap/react `^3.20`
- Android wrapper @capacitor/core & @capacitor/android `^8.2`; tours react-joyride
- Build: sharp, autoprefixer, postcss

### 2.3 Build configuration (gotchas a new dev MUST know)
- `next.config.js`: `typescript.ignoreBuildErrors:true`, `eslint.ignoreDuringBuilds:true` — **builds succeed with TS/ESLint errors (intentional)**; `reactStrictMode:false`; `images.domains:['cdn.sanity.io']`; `experimental.serverActions.bodySizeLimit:'200mb'`.
- `.npmrc`: `legacy-peer-deps=true` — **required** (Sanity peer deps). Remove and Vercel builds fail.
- `tsconfig.json`: `@/*` → `./src/*`; `moduleResolution:"bundler"`; excludes `src_backup_pre_rebuild`.
- `vercel.json`: extends timeouts (`api/admin/upload` 60s, `api/admin/drive` + `…/file` 300s) and defines the cron jobs (Chapter 7).

### 2.4 Repository structure
```
src/
  app/
    page.tsx                  # Home
    residential/ commercial/ grading/ process/ our-story/ join/ contact/ maintenance/
    services/                 # hub + 5 categories, each with [sub] routes
    studio/[[...tool]]/        # Sanity Studio
    admin/                    # the admin app (Chapter 4) — 25+ pages
    api/                      # route handlers (Chapter 7)
  components/ layout/ sections/ admin/ animations/
  lib/ constants.ts  *-data.ts  sanity/  supabase/
  middleware.ts               # maintenance gate
public/ sw.js  icons/  images/services/*
next.config.js  vercel.json  .npmrc  tsconfig.json  tailwind.config.ts
native-app/                   # native Android project (Chapter 6)
```

### 2.5 Hosting & request path
`Browser → Cloudflare (DNS+proxy) → Vercel edge → RO's "ro-unlimited" project (current production deployment)`
- Vercel project (RO-owned): team `rounlimiteds-projects` / `team_r4Z6lWU4vIqkjE1TtMKg4pjc`, project `ro-unlimited` / `prj_IAbUrfvGyPPd0Qw8qpL0ffeuZTIH`. Serves both apex + www from the same deployment.
- Cloudflare: account `info.mw48@gmail.com`, zone `rounlimited.com` id `fdc34df2d9480a03932e9d853f924d2c`.
- GoDaddy: domain registrar.

### 2.6 DNS topology (reconciled)
- `rounlimited.com` + `www` → Cloudflare → Vercel → RO project (ownership proven by a `_vercel` TXT record in Cloudflare).
- `upload.rounlimited.com` → Cloudflare → Oracle nginx :8081 (self-hosted Telegram Bot API; Let's Encrypt).
- `dav.rounlimited.com` → Cloudflare → Oracle nginx :8085 (WebDAV; Let's Encrypt).
- Cloudflare tunnel `ro-storage` (id `aea938be-…`) maps `storage.rounlimited.com` → Oracle :8081.
- `site2.rounlimited.com` is **paused/offline** (domain removed from Vercel); the `site2-staging` branch holds a dormant redesign.

### 2.7 Deploy model (summary — full in Chapter 9)
- Push to GitHub `master` → Vercel auto-deploys in ~2 min. One project to deploy now (RO's own).
- CLI: `cd C:\websites\rounlimited\git` then `VERCEL_ORG_ID=team_r4Z6lWU4vIqkjE1TtMKg4pjc VERCEL_PROJECT_ID=prj_IAbUrfvGyPPd0Qw8qpL0ffeuZTIH npx vercel --prod --token <RO Vercel token> --yes`.
- Rollback: Vercel → Deployments → Promote a prior "Ready" build (~30s).

### 2.8 Admin PWA / service worker / native app (summary — Chapters 4 & 6)
- `public/sw.js` (cache name bumped per release, e.g. `ro-admin-v35`): network-only for HTML + `/api`, network-first JS/CSS, cache-first images/fonts. Includes stale-chunk auto-recovery (prevents post-deploy white screens) and a share-target handler for `/admin/drive/upload`.
- The admin app is an installable PWA and is also wrapped as a native Android app (`com.rounlimited.admin`) that loads `rounlimited.com/admin` in a WebView (Chapter 6).

### 2.9 Animation conventions
Scroll/entrance animations use GSAP 3.14 via the `@gsap/react` `useGSAP` hook; ScrollTrigger registered centrally in `components/animations/GSAPProvider.tsx`. Animate only transform/opacity. The `ROLoader` splash fires a `ro:site-ready` event the Hero waits on.
