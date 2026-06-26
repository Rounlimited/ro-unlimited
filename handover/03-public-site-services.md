# RO Unlimited — Owner Manual & Technical Handover
## Chapter 3 — Public Site & RO Services

### 3.1 Public page inventory
All public routes live in `src/app` (not under `/admin` or `/api`).

| Route | File | Shows |
|---|---|---|
| `/` | `app/page.tsx` | Home: hero video (Sanity), division cards, Why RO, CTA |
| `/residential` | `app/residential/page.tsx` | Residential division: stats, scope gallery, 5-phase process |
| `/commercial` | `app/commercial/page.tsx` | Commercial division: proof stats, vetting pillars, process |
| `/grading` | `app/grading/page.tsx` | Land grading & site prep |
| `/process` | `app/process/page.tsx` | 6-phase build process timeline |
| `/our-story` | `app/our-story/page.tsx` | Company story + values |
| `/join` | `app/join/page.tsx` | Trades recruitment + apply (`/api/trade-apply`) |
| `/contact` | `app/contact/page.tsx` | Contact form → `/api/contact` (emails owner; commercial RFPs → Sanity) |
| `/maintenance` | `app/maintenance/page.tsx` | Branded 503 page (message from Sanity) |
| `/services` | `app/services/page.tsx` | Services hub: 5 category cards + process |
| `/services/{cat}` | `app/services/{cat}/page.tsx` | Service category page (roofing/septic/electrical/plumbing/repairs) |
| `/services/{cat}/[sub]` | `app/services/{cat}/[sub]/page.tsx` | Sub-service deep-dive (~8 per category, ~40 total) |
| `/studio` | `app/studio/[[...tool]]` | Embedded Sanity Studio |
| SEO | `app/robots.ts`, `app/sitemap.ts`, `app/not-found.tsx` | robots, sitemap, 404 |

### 3.2 The RO Services system (most important part of the public site)
Data-driven by two reusable templates + per-service data files. To change service content you edit data, not layout.

**Five categories** (`src/lib/services-data.ts` → `SERVICE_CATEGORIES`):
| Category | Slug | Data file | Sub-services |
|---|---|---|---|
| Roofing | roofing | `roofing-data.ts` | repair, replacement, storm, inspection, gutters, flashing (~8) |
| Septic | septic | `septic-data.ts` | pumping, inspection, installation, tank repair, drain field, replacement, sewer line, emergency (8) |
| Electrical | electrical | `electrical-data.ts` | panel upgrades, rewiring, generator, EV charger, solar/battery, smart home, lighting, surge (8) |
| Plumbing | plumbing | `plumbing-data.ts` | pipe repair, water heater, fixtures, drain/sewer, sump, faucet/valve, leak detection, water treatment (8) |
| Repairs | repairs | `repairs-data.ts` | drywall, deck/fence, concrete, chimney, carpentry, paint, pressure wash, debris (8) |

**Templates** (`src/components/sections/`):
- `ServicePageTemplate.tsx` — category page: hero, "services included" grid, photo gallery, FAQ, cross-links, CTA.
- `SubServicePage.tsx` — sub-service page: hero, overview blocks, gallery, warning signs (expandable), maintenance tips (expandable), process steps, cost table (item/cost/lifespan), FAQ, sibling cross-links, CTA. (Roofing also has `RoofingSubServicePage.tsx`.)

**Sub-service data shape** (`src/lib/sub-service-types.ts` → `SubService`): id, slug, title, tagline, heroDescription, heroImage, cardImage, overview[], galleryImages?, warningSigns[], maintenanceTips[], processSteps[], faq[], costData[], seoKeywords[].

### 3.3 Where content comes from (Sanity vs code)
- **Sanity** holds only the hero video (+ a couple hero/maintenance settings) and the maintenance message (`src/lib/sanity/queries.ts`, GROQ on the `siteSettings` singleton). It also stores `project` (portfolio), `inviteToken`, `commercialRfp`.
- **Everything else is hardcoded TypeScript** in `src/lib/*-data.ts` and `src/lib/constants.ts` (`COMPANY`, `DIVISIONS`, `TRUST_STATS`).
- **Service images** resolve: a custom image uploaded via admin `/admin/service-media` (Supabase, `GET /api/admin/service-images?division={cat}&serviceId={id}`) **overrides** the default in `/public/images/services/...`.

### 3.4 How to add a NEW service category (e.g. "Masonry")
1. `src/lib/masonry-data.ts` exporting `SubService[]`.
2. Add the category to `SERVICE_CATEGORIES` in `services-data.ts`.
3. `src/app/services/masonry/page.tsx` → `<ServicePageTemplate category={...} />`.
4. `src/app/services/masonry/[sub]/page.tsx` → look up by `params.sub` → `<SubServicePage .../>`.
5. Drop images in `/public/images/services/masonry/`.

### 3.5 Site shell
- `src/app/layout.tsx` — metadata, Organization JSON-LD, providers (`GSAPProvider`, `ROLoader`), `SiteChrome` (Navbar + content + Footer). Viewport `viewport-fit=cover` (iOS safe areas).
- `src/components/layout/`: Navbar, Footer, SiteChrome.
- `src/components/sections/Hero.tsx` + `HeroVideo.tsx`: homepage hero — video bg (Sanity), pinned GSAP build, waits for `ro:site-ready`.

### 3.6 Contact / lead capture
- `/contact` → `/api/contact` → Resend email to owner (`EMAIL_FORWARD_TO`); commercial RFPs also saved to Sanity as `commercialRfp`.
- `/join` → `/api/trade-apply`.
