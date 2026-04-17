// ═══════════════════════════════════════════════════════════════
//  REPAIRS SUB-SERVICE DATA
//  8 detailed sub-service pages for /services/repairs/[sub]
// ═══════════════════════════════════════════════════════════════

import type { SubService } from './sub-service-types';
export type RepairsSubService = SubService;

export const REPAIRS_SUB_SERVICES: RepairsSubService[] = [

  // ═══ 1. DRYWALL REPAIR ═══
  {
    id: 'drywall-repair',
    slug: 'drywall-repair',
    title: 'Drywall Repair',
    tagline: 'Invisible Patches, Smooth Finishes, No Trace of Damage',
    heroDescription: 'A bad drywall patch is worse than the hole — visible bumps, mismatched texture, and an obvious "fixed it myself" look. RO\'s drywall crew handles everything from nail-pop touch-ups to full water-damage rebuilds, with proper feathering, primer, and texture matching that disappears into the wall.',
    heroImage: '/images/services/repairs/subs/drywall-repair-hero.jpg',
    cardImage: '/images/services/repairs/subs/drywall-repair-card.jpg',
    galleryImages: [
      '/images/services/repairs/subs/drywall-repair-hero.jpg',
      '/images/services/repairs/subs/drywall-patch.jpg',
      '/images/services/repairs/subs/drywall-mud.jpg',
      '/images/services/repairs/subs/drywall-sanding.jpg',
      '/images/services/repairs/subs/drywall-texture.jpg',
      '/images/services/repairs/subs/drywall-finished.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Drywall repair restores damaged wall and ceiling surfaces — patching holes, fixing cracks, replacing water-damaged sections, repairing nail pops, and matching existing texture. A proper repair includes structural backing for larger holes, multiple coats of joint compound, careful sanding, and texture matching so the patch is invisible after paint.',
      },
      {
        heading: 'When You Need It',
        content: 'Most common triggers: doorknob dents, accidental holes from moving furniture, settling cracks at corners and ceilings, water leaks (always fix the leak first), nail pops as houses settle, and post-renovation patches where outlets or plumbing were moved. Larger jobs include full-room re-mudding after textured ceilings come down, or hanging new drywall after framing repairs.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Small patches (under 6 inches) run $100–$250 per hole including materials, finishing, and primer. Medium repairs (6–24 inches with backing) run $250–$600. Full sheet replacements run $400–$900 per sheet hung and finished. Complete room re-mudding runs $1,500–$4,000. Most repairs take one visit; texture and paint matching may need a return for the topcoat after compound dries (24–48 hours).',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC humidity makes drywall mud dry slower than in dry climates — pushing through with too-thin coats causes shrinkage and visible patches months later. Properly executed repairs use multiple thin coats with proper drying time between, so the finish stays smooth as the house settles through seasonal humidity swings. Bad patches show up the first hot summer when humidity changes pull them tight.',
      },
    ],
    warningSigns: [
      { trigger: 'Cracks appearing or growing along corners or above doors', detail: 'These are typically settling cracks. Small ones can be patched with mesh tape and joint compound. Cracks that recur after patching may indicate structural movement that needs investigation before drywall work.' },
      { trigger: 'Brown or yellow staining on ceilings or walls', detail: 'Active or past water damage. Drywall absorbs water and loses structural integrity. The leak source must be fixed before any drywall repair, otherwise the patch fails within months.' },
      { trigger: 'Soft or sagging drywall', detail: 'Drywall is failing structurally — usually from extended water exposure or improper installation. This requires removal of the affected section, not just a patch. Mold inspection may also be needed.' },
      { trigger: 'Visible nail or screw heads pushing through paint', detail: 'Nail pops are extremely common as homes settle. Each pop needs the fastener reset, the area patched with compound, sanded flush, primed, and painted. Cheap "fix" of just dabbing paint over them never lasts.' },
      { trigger: 'Texture mismatch from previous repair attempts', detail: 'Bad texture matching is the #1 sign of DIY repair. Proper matching requires identifying the texture type (orange peel, knockdown, popcorn, smooth) and applying with matching tools and pressure.' },
      { trigger: 'Cracks radiating from corners of windows or doors', detail: 'Common stress points. Usually cosmetic but can indicate framing issues if cracks are wide or the wall feels soft. Inspection determines whether it\'s just settling or needs structural attention.' },
      { trigger: 'Drywall coming loose from wall or ceiling', detail: 'Fastener failure — the screws or nails have lost their grip. Requires re-fastening with new screws into solid framing, then re-mudding the dimples. Ceilings especially urgent due to fall risk.' },
    ],
    maintenanceTips: [
      { tip: 'Address small holes immediately', detail: 'A nail-hole-sized puncture is a 5-minute fix today. Left alone for years, edges deteriorate and the area gets touched repeatedly, growing into a fist-sized repair. Keep a small tube of spackle and touchup paint on hand.' },
      { tip: 'Use cabinet bumpers behind doorknobs', detail: 'A $2 rubber bumper inside the door stops the doorknob from punching the wall. Saves the most common drywall repair we see.' },
      { tip: 'Don\'t let water damage sit', detail: 'Once a leak is fixed, soaked drywall must dry within 48 hours or mold begins. If sections feel soft after drying, they need replacement, not just paint coverage.' },
      { tip: 'Touch up nail pops as they appear', detail: 'A house settles for years after construction. Nail pops appear gradually. Fixing them in batches once a year is much faster than addressing dozens during a future repaint.' },
      { tip: 'Keep paint sample for future touch-ups', detail: 'After any paint job, label and store a small jar of the actual paint used (with brand, color code, and sheen). Future patches blend perfectly. Without it, even small touch-ups look obvious.' },
    ],
    processSteps: [
      { num: '01', title: 'Assessment & Backing', description: 'We assess the damage, look behind the wall for any plumbing, wiring, or HVAC concerns, and determine whether the patch needs framing backer (anything over 4 inches typically does). Larger holes get wood or backer-board scabs to provide solid mounting.' },
      { num: '02', title: 'Patch & First Coat', description: 'For holes, we cut a clean rectangular opening, install backing, and screw in a drywall patch. Joint compound and tape (mesh or paper) bridge the seam. The first coat is left intentionally rough for adhesion of subsequent coats.' },
      { num: '03', title: 'Build & Feather', description: 'Two or three additional coats of compound, each wider than the last, feathering the patch into the surrounding wall. Each coat is allowed to fully dry (often overnight) before the next. Cutting corners here causes visible patches later.' },
      { num: '04', title: 'Sanding & Texture Match', description: 'Sanded smooth with progressively finer grits, then textured to match the surrounding wall. Texture matching is the single hardest part — orange peel, knockdown, popcorn, and skip trowel each require specific tools and technique.' },
      { num: '05', title: 'Prime & Paint', description: 'Primer seals the new compound and prevents flash-through (where the patch shows through the topcoat). Paint applied to a feathered area surrounding the patch — not just the patch itself — ensures the repair is invisible.' },
    ],
    faq: [
      { q: 'Can\'t I just patch a hole myself?', a: 'For a tiny nail hole, sure. For anything bigger than a pencil eraser, the difference between DIY and professional shows up forever. Proper repairs require backing for larger holes, multiple compound coats with drying time, careful sanding, texture matching, and primer. We\'ve seen $50 DIY attempts that cost $400 to fix.' },
      { q: 'How long does a drywall repair take?', a: 'Most patches need 24–48 hours total because compound has to dry between coats. We typically do the first coat one day, return to finish coats and sand the next day, then prime and paint when dry. Quick cosmetic patches can be done in one visit if needed.' },
      { q: 'Will the patch be visible?', a: 'When done right, no. The keys are: feathering the compound wide enough, matching texture exactly, primer to prevent flash-through, and paint applied to a wide enough area. We guarantee invisible repairs — if you can see the patch from 4 feet under normal lighting, we redo it.' },
      { q: 'Do you do popcorn ceiling repairs?', a: 'Yes. Popcorn texture matching is technical — we either match exactly or scrape the entire ceiling and re-finish smooth (often the better long-term choice for older homes with damaged popcorn).' },
      { q: 'What about water damage repair?', a: 'We handle the drywall side after the leak is fixed. If the source is unknown, we coordinate with our plumbing team to find it first. Mold-affected drywall is removed and disposed of properly — we don\'t cover over mold.' },
    ],
    costData: [
      { item: 'Small Patch (under 6")', cost: '$100–$250', lifespan: 'Permanent if leak-free' },
      { item: 'Medium Patch with Backing', cost: '$250–$600', lifespan: 'Permanent' },
      { item: 'Full Sheet Replacement', cost: '$400–$900', lifespan: '40+ years' },
      { item: 'Water Damage Section Repair', cost: '$500–$1,500', lifespan: 'Permanent' },
      { item: 'Full Room Re-Mudding', cost: '$1,500–$4,000', lifespan: '20+ years' },
    ],
    seoKeywords: ['drywall repair Greenville SC', 'drywall patch Upstate SC', 'water damage drywall SC', 'ceiling repair Greenville'],
  },

  // ═══ 2. INTERIOR PAINTING ═══
  {
    id: 'interior-painting',
    slug: 'interior-painting',
    title: 'Interior Painting',
    tagline: 'Prep Done Right. Cuts Are Sharp. Results Last.',
    heroDescription: 'Interior painting is 80% prep, 20% paint — and the painters who skip prep show every flaw on the wall. RO sands, fills, primes, and tapes properly before any color goes on. The result is sharp lines at every edge, no roller marks, no missed spots, and a finish that holds up for years.',
    heroImage: '/images/services/repairs/subs/interior-painting-hero.jpg',
    cardImage: '/images/services/repairs/subs/interior-painting-card.jpg',
    galleryImages: [
      '/images/services/repairs/subs/interior-painting-hero.jpg',
      '/images/services/repairs/subs/painter-rolling.jpg',
      '/images/services/repairs/subs/cutting-in.jpg',
      '/images/services/repairs/subs/paint-cans.jpg',
      '/images/services/repairs/subs/painted-room.jpg',
      '/images/services/repairs/subs/trim-painting.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Interior painting covers walls, ceilings, trim, doors, and cabinetry inside the home. Done right, it includes surface prep (cleaning, sanding, filling, caulking), masking and protection of floors and furniture, primer where needed, two coats of quality paint cut in by hand at every edge, and a complete cleanup. Done wrong, it\'s just paint slapped over problems.',
      },
      {
        heading: 'When You Need It',
        content: 'Most homes get repainted every 5–10 years, with high-traffic areas (kitchens, bathrooms, hallways) needing it more often. Triggers: paint looking dull or stained, color tired, small repairs accumulated, water damage repaired, prepping to sell, or just wanting a fresh look after a renovation.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'A single average bedroom (12×12 ft, walls only, two coats) runs $400–$800 in Upstate SC including paint and labor. Full room with ceiling, trim, and doors: $700–$1,500. Whole house interior repaint (1,500–2,500 sq ft): $4,000–$10,000. Most rooms take 1–2 days; whole house jobs are 4–10 days. Quality paint costs more upfront but lasts 2–3× longer than budget brands.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'High humidity in Upstate SC accelerates paint failure when prep is skipped — especially in bathrooms and basements. We use the right paint for each room (mildew-resistant in wet areas, washable in kitchens, scuff-resistant in halls). Cheap paint cracks, peels, and discolors within a year here. Quality paint with proper prep lasts 8–12 years.',
      },
    ],
    warningSigns: [
      { trigger: 'Paint peeling or bubbling', detail: 'Either the surface wasn\'t prepped (oils, dust, or moisture under the paint) or the paint type is wrong for the surface. Just painting over it makes it worse — peeling sections must be scraped, sanded, primed, and repainted.' },
      { trigger: 'Visible roller marks or brush strokes', detail: 'Wrong roller nap for the surface, paint applied too thick, or paint dried too fast. Quality painters use the right nap (3/8" for smooth walls, 1/2" for textured), thin proper coats, and back-roll to even out finish.' },
      { trigger: 'Yellowing on ceilings or walls', detail: 'Most common cause: cigarette smoke or kitchen grease. Sealing primer (Kilz, Bin) is required before topcoat or yellowing bleeds through. Sometimes 2–3 coats of primer are needed for heavy nicotine staining.' },
      { trigger: 'Color looks different in different lights', detail: 'Often normal — colors shift with natural vs. artificial light. But if the variation is dramatic, it could be uneven coverage (single thin coat, or different paint batches). Two proper coats from one batch eliminate this.' },
      { trigger: 'Crackling or alligator-skin texture', detail: 'Paint applied over incompatible primer or surface, or applied too thick. Requires complete sanding (sometimes stripping) and proper prep. Painting over it makes it more obvious.' },
      { trigger: 'Drips or sags on walls or trim', detail: 'Sloppy application or wrong viscosity. A professional painter sands these out and recoats. Cheap painters leave them and you live with them.' },
    ],
    maintenanceTips: [
      { tip: 'Wipe walls regularly with a damp cloth', detail: 'Modern washable paints (eggshell, satin, semi-gloss) handle gentle cleaning. Wiping prevents grime buildup that forces a full repaint years earlier.' },
      { tip: 'Touch up scuffs immediately', detail: 'A quick dab with leftover paint covers a scuff for years. Letting scuffs accumulate creates a "tired" wall that needs full repainting.' },
      { tip: 'Use the right sheen for each room', detail: 'Flat for low-traffic ceilings, eggshell for living areas, satin for high-traffic, semi-gloss for trim and bathrooms. Wrong sheen wears out fast.' },
      { tip: 'Address mildew immediately', detail: 'Bathrooms and basements develop mildew on paint. Wipe with diluted bleach (1:10 ratio) at the first sign — once it stains the paint, only repainting fixes it.' },
      { tip: 'Keep small touch-up jars labeled', detail: 'After painting, save a small jar with the brand, color code, and sheen written on it. Future touch-ups blend perfectly. Without it, even matching the same color looks different.' },
    ],
    processSteps: [
      { num: '01', title: 'Surface Prep', description: 'Walls washed (TSP for grease areas), holes filled with spackle, cracks bridged with mesh tape and compound, glossy surfaces sanded to dull, dust wiped off. This is where most painters cut corners — and it shows.' },
      { num: '02', title: 'Mask & Protect', description: 'Floors covered with drop cloths or rosin paper. Trim and adjacent surfaces taped with quality painter\'s tape (not regular masking). Furniture moved to room center and covered. HVAC vents masked to prevent dust circulation.' },
      { num: '03', title: 'Prime', description: 'Stain blocker on water marks, smoke damage, or dark walls being painted lighter. Bonding primer on glossy or slick surfaces. Skipping primer where it\'s needed shows through within months as bleed-through or peeling.' },
      { num: '04', title: 'Cut In & Paint', description: 'Edges around trim, ceilings, and corners are hand-cut with a brush — no taping shortcuts that leave fuzzy lines. Walls then rolled with proper-nap roller, two coats minimum, back-rolled to even out.' },
      { num: '05', title: 'Final Inspection & Cleanup', description: 'Walk-through with you to identify any touch-ups needed. We don\'t consider the job done until you sign off. Tape pulled before paint fully cures (avoids tearing), drop cloths removed, furniture replaced, full cleanup.' },
    ],
    faq: [
      { q: 'Do I need to move out during painting?', a: 'No, but plan for the affected rooms to be off-limits for 1–2 days. We work in sections so you keep most of the house functional. Modern low-VOC paints are safe to be around within hours of application.' },
      { q: 'What about my furniture?', a: 'For most rooms we move furniture to the center and cover. For full-room repaints with heavy or fragile pieces, we may ask you to clear the room. We never paint around things — that always shows.' },
      { q: 'Can you match my existing color?', a: 'Yes. We can take a sample from your wall to a paint store for color matching, or we can use a code if you have one. Custom mixing adds 15–30 minutes per color.' },
      { q: 'What paint brands do you use?', a: 'Sherwin-Williams and Benjamin Moore for premium jobs. Both have washable, durable lines that last 10+ years in normal conditions. We can use cheaper paint to fit a budget but we\'ll be honest about the tradeoff.' },
      { q: 'How many coats do you apply?', a: 'Two coats minimum on every job — that\'s what gives even color and durability. Some color changes (light to dark, or dark to white) need three coats plus primer. We don\'t cut corners on coats.' },
    ],
    costData: [
      { item: 'Single Bedroom (walls only)', cost: '$400–$800', lifespan: '8–12 years' },
      { item: 'Full Room (walls + ceiling + trim)', cost: '$700–$1,500', lifespan: '8–12 years' },
      { item: 'Kitchen Cabinets Repaint', cost: '$1,500–$4,000', lifespan: '10+ years' },
      { item: 'Whole House Interior', cost: '$4,000–$10,000', lifespan: '8–12 years' },
      { item: 'Color Change with Primer', cost: '+$100–$300 per room', lifespan: 'Same as paint' },
    ],
    seoKeywords: ['interior painting Greenville SC', 'house painter Upstate SC', 'kitchen cabinet painting SC', 'professional painter near me'],
  },

  // ═══ 3. EXTERIOR PAINTING ═══
  {
    id: 'exterior-painting',
    slug: 'exterior-painting',
    title: 'Exterior Painting',
    tagline: 'Weather-Tight Finish That Holds Up to SC Sun & Storms',
    heroDescription: 'Exterior paint takes a beating in Upstate SC — UV, rain, humidity, freeze-thaw cycles. A botched exterior job peels in 18 months. RO\'s exterior painting includes proper power washing, scraping, caulking, priming raw wood, and two coats of exterior-grade paint that holds up for 8–15 years.',
    heroImage: '/images/services/repairs/subs/exterior-painting-hero.jpg',
    cardImage: '/images/services/repairs/subs/exterior-painting-card.jpg',
    galleryImages: [
      '/images/services/repairs/subs/exterior-painting-hero.jpg',
      '/images/services/repairs/subs/painter-ladder.jpg',
      '/images/services/repairs/subs/house-exterior-fresh.jpg',
      '/images/services/repairs/subs/spray-painting.jpg',
      '/images/services/repairs/subs/exterior-trim.jpg',
      '/images/services/repairs/subs/power-washing.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Exterior painting covers siding, trim, doors, shutters, and exterior wood surfaces. Done right, it includes power washing, scraping loose paint, sanding rough edges, caulking gaps, priming raw or repaired wood, and two coats of weather-rated paint applied at proper temperature and humidity. The whole point is paint that bonds to the substrate and stays bonded.',
      },
      {
        heading: 'When You Need It',
        content: 'Most exterior paint lasts 8–12 years on wood siding, 10–15 on fiber cement, 5–8 on stucco. Triggers: visible peeling or fading, chalking surface (powdery residue when rubbed), bare wood showing, mildew streaks, or just being tired of the color. Selling a house? Fresh exterior paint is one of the highest-ROI improvements.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Single-story 1,500 sq ft house with wood siding: $4,000–$8,000. Two-story 2,500 sq ft: $6,000–$14,000. Brick or stucco repaint: $5,000–$12,000. Trim and doors only: $1,500–$4,000. Most exterior jobs take 5–10 working days, weather-dependent. We schedule around forecasts to avoid painting in rain or extreme heat.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC summers push surface temperatures past 130°F on south-facing walls. Exterior paint must be rated for that or it bubbles and peels. Humidity also matters — paint applied above 85% humidity won\'t bond properly. Quality exterior products with proper application withstand 100°F summers and 20°F winters for over a decade. Cheap paint or wrong-temperature application fails in 1–3 years.',
      },
    ],
    warningSigns: [
      { trigger: 'Paint peeling in sheets', detail: 'Moisture is escaping from inside the wall (interior humidity, leaky plumbing, no vapor barrier). Painting over it just re-peels. Source must be addressed first — sometimes attic or foundation ventilation.' },
      { trigger: 'Chalking surface (white powder when rubbed)', detail: 'UV degradation of the binder. Common on south-facing walls. Surface must be washed and primed before recoating, otherwise new paint won\'t bond.' },
      { trigger: 'Mildew streaks down siding', detail: 'Surface mildew grows in shaded humid areas. Bleach-based cleaner kills it before painting. If you paint over mildew, it grows through the new paint within months.' },
      { trigger: 'Bare wood showing where paint failed', detail: 'Wood has been exposed to weather. Must be sanded smooth, treated with a wood conditioner if very dry, then primed before topcoat. Painting wet bare wood seals in moisture and causes rot.' },
      { trigger: 'Cracked or missing caulk at trim joints', detail: 'Water entry points. Must be removed and re-caulked with paintable exterior caulk before painting. Paint over old cracked caulk and the cracks return immediately.' },
      { trigger: 'Wood rot at trim or siding bottoms', detail: 'Painting over rot just hides it temporarily. Rotted sections must be cut out and replaced with new wood, or treated with a wood hardener for minor rot. Otherwise it spreads.' },
      { trigger: 'Lead paint on pre-1978 homes', detail: 'EPA RRP rules require certified lead-safe practices on homes built before 1978. We are RRP-certified and follow proper containment, dust control, and disposal. DIY removal of lead paint is dangerous and illegal.' },
    ],
    maintenanceTips: [
      { tip: 'Power wash annually', detail: 'A gentle wash (under 1,500 PSI) every spring removes pollen, mildew, and dirt that degrade paint. Catches small problems before they spread.' },
      { tip: 'Re-caulk problem areas every 2–3 years', detail: 'Caulk degrades faster than paint. Inspect window and door trim, corners, and any exterior joints annually. Re-caulk before water gets behind the paint.' },
      { tip: 'Trim vegetation away from walls', detail: 'Bushes touching siding hold moisture against the paint and accelerate failure. Keep at least 12 inches of clearance.' },
      { tip: 'Touch up bare spots immediately', detail: 'Bird strikes, kid baseballs, ladder scrapes — any bare wood exposed to weather rots in months. A quick touch-up with leftover paint and primer keeps it protected.' },
      { tip: 'Repaint south and west walls first when needed', detail: 'These get the most sun exposure and degrade fastest. They may need touch-up coats years before north walls do. Spot painting these saves a full house repaint.' },
    ],
    processSteps: [
      { num: '01', title: 'Inspection & Prep Plan', description: 'We walk the entire exterior, noting peeling, rot, caulk failures, and color match needs. Quote includes any wood replacement or repair work needed before paint goes on.' },
      { num: '02', title: 'Wash, Scrape & Sand', description: 'Power wash (proper PSI for surface type), let dry 24–48 hours, scrape loose paint, sand rough edges, treat any wood rot or replace damaged sections. Mildew killed with diluted bleach.' },
      { num: '03', title: 'Caulk & Prime', description: 'Bare wood gets primer (oil-based for raw wood, latex for repaired sections). Caulk gaps at trim, corners, and joints. Stain blocker on tannin-rich woods (cedar, redwood) to prevent bleed-through.' },
      { num: '04', title: 'Two Coats of Paint', description: 'Two coats minimum, sprayed and back-brushed (or rolled and brushed) for proper coverage and adhesion. Painted only when temperature is 50–85°F and humidity below 85% — patience pays off here.' },
      { num: '05', title: 'Touch-Up & Cleanup', description: 'Walk-through with you to identify any missed spots or touch-ups. All paint debris cleaned up, plants and walkways protected throughout, no overspray on cars or glass. Final color samples saved for you.' },
    ],
    faq: [
      { q: 'When is the best time of year to paint outside in SC?', a: 'Spring (March–May) and fall (October–November) are ideal — moderate temperature and humidity. Summer is workable if we paint in early mornings to avoid hot afternoons. Winter is too cold for proper bonding most days.' },
      { q: 'How long does the paint actually last?', a: 'Quality exterior paint with proper prep: 8–12 years on wood siding, 12–15 on fiber cement (Hardie), 5–8 on stucco. Cheap paint or skipped prep: 2–4 years. The difference is upfront prep, not the paint itself.' },
      { q: 'Do you spray or brush?', a: 'Both — spray for speed and uniform coverage on big surfaces, brush and roller for back-rolling and detail work. Spraying alone (without back-brushing) leaves a thin film that fails fast. We do both for proper bond.' },
      { q: 'What about HOA color approval?', a: 'We work with HOA-required colors. Bring us the approved palette and we\'ll match exactly. We can also help you submit color samples for approval if you\'re changing color schemes.' },
      { q: 'Will you paint a brick house?', a: 'Yes, but it\'s a major commitment — once painted, brick must be repainted regularly (you can\'t go back to natural brick). Done right with masonry primer and elastomeric paint, it lasts 10–15 years and looks stunning. Done wrong, it peels in patches.' },
    ],
    costData: [
      { item: 'Single-Story 1,500 sq ft', cost: '$4,000–$8,000', lifespan: '8–12 years' },
      { item: 'Two-Story 2,500 sq ft', cost: '$6,000–$14,000', lifespan: '8–12 years' },
      { item: 'Brick or Stucco Repaint', cost: '$5,000–$12,000', lifespan: '10–15 years' },
      { item: 'Trim & Doors Only', cost: '$1,500–$4,000', lifespan: '6–10 years' },
      { item: 'Wood Rot Repair (per board)', cost: '$75–$300', lifespan: 'Permanent if maintained' },
    ],
    seoKeywords: ['exterior painting Greenville SC', 'house painter Upstate SC', 'exterior house painting near me', 'siding painting SC'],
  },

  // ═══ 4. DECK REPAIR & BUILDING ═══
  {
    id: 'deck-building',
    slug: 'deck-building',
    title: 'Deck Repair & Building',
    tagline: 'New Decks Built Right. Old Decks Brought Back to Life.',
    heroDescription: 'A deck is a serious structure — joists carry tons of live load, fasteners corrode, ledger boards fail. RO builds new decks (wood, composite, PVC) to current code with proper footings, hardware, and railings, and we restore failing decks instead of writing them off when they\'re salvageable.',
    heroImage: '/images/services/repairs/subs/deck-building-hero.jpg',
    cardImage: '/images/services/repairs/subs/deck-building-card.jpg',
    galleryImages: [
      '/images/services/repairs/subs/deck-building-hero.jpg',
      '/images/services/repairs/subs/deck-framing.jpg',
      '/images/services/repairs/subs/deck-boards.jpg',
      '/images/services/repairs/subs/deck-railing.jpg',
      '/images/services/repairs/subs/deck-stained.jpg',
      '/images/services/repairs/subs/deck-stairs.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Deck work covers full new builds (footings, framing, decking, railings, stairs), partial repairs (replacing rotted boards, failed ledger boards, sagging joists), and refinishing (sanding, staining, sealing). Modern code requires specific hardware: proper joist hangers, hurricane ties at framing connections, and structural-grade fasteners. DIY decks often skip these and fail catastrophically.',
      },
      {
        heading: 'When You Need It',
        content: 'New build triggers: adding outdoor living space, replacing a rotted-out old deck, or building a deck for a hot tub. Repair triggers: bouncy or sagging deck (joist or ledger issues), rotted boards, loose railings (most common cause of deck-related injuries), or boards splintering badly. Refinishing every 2–4 years keeps wood decks looking new and prevents rot.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'New pressure-treated wood deck (200 sq ft, no stairs): $5,000–$10,000. Composite or PVC same size: $8,000–$18,000. Larger decks with stairs and railings scale up — 400 sq ft composite with stairs: $15,000–$30,000. Repair work: rotted board replacement $40–$100 per board, ledger replacement $1,500–$4,000, full railing replacement $30–$80 per linear foot. Most builds take 5–14 days; repairs 1–5 days.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC humidity and rainfall accelerate wood rot. Pressure-treated wood lasts 15–25 years if properly stained and sealed every 2–4 years. Composite (Trex, TimberTech) lasts 25–30 years with no maintenance. The cheapest deck (untreated wood, no maintenance) fails in 5–8 years. Lifecycle cost favors composite or properly maintained pressure-treated.',
      },
    ],
    warningSigns: [
      { trigger: 'Bounce or movement when walking on the deck', detail: 'Joists are undersized, spaced too far apart, or have rot. Bounce gets worse over time and eventually causes structural failure. Deck inspection determines root cause.' },
      { trigger: 'Loose or wobbly railings', detail: 'The #1 cause of deck-related injuries. Posts may be rotted at the base, fasteners failed, or railing was never properly attached. Falling against a loose railing can be fatal — fix immediately.' },
      { trigger: 'Boards springy or soft underfoot', detail: 'Decking boards are rotting from underneath where you can\'t easily see. Press on them with a screwdriver — if it sinks in, the board needs replacement.' },
      { trigger: 'Cracks in support posts', detail: 'Splits parallel to the wood grain are usually cosmetic. Splits perpendicular to the grain or wide cracks indicate structural compromise — post needs replacement.' },
      { trigger: 'Sagging in the middle of the deck', detail: 'Joists are deflecting under load. Could be undersized lumber, rot, or failed beam connections. A structural inspection determines what needs reinforcement or replacement.' },
      { trigger: 'Black or dark staining at ledger board', detail: 'The ledger (the board attaching deck to house) is one of the most failure-prone parts of any deck. Black staining = water infiltration and rot. Failed ledgers cause deck collapses — this is urgent.' },
      { trigger: 'Visible rust on hardware', detail: 'Joist hangers, screws, and bolts must be hot-dipped galvanized or stainless steel. Rust means the hardware is failing — and rust on screws can split the wood around them, accelerating failure.' },
    ],
    maintenanceTips: [
      { tip: 'Stain or seal wood decks every 2–4 years', detail: 'Wood deck finishes wear under SC sun and rain. Re-staining when color fades (but before bare wood appears) extends deck life dramatically. Wait until bare wood is exposed and you\'re looking at sanding before staining.' },
      { tip: 'Sweep regularly to prevent debris buildup', detail: 'Leaves and dirt trap moisture against deck boards, accelerating rot. A weekly sweep in fall keeps the surface dry and extends life.' },
      { tip: 'Check fasteners annually', detail: 'Walk the deck and look for popped nails, loose screws, or rusted hardware. Tighten or replace as needed. A 30-minute annual check prevents major repairs.' },
      { tip: 'Inspect ledger and railings each spring', detail: 'These are the highest-risk failure points. Ledger water staining or railing wobble caught early is a $200 fix; ignored, it\'s a $5,000 repair or worse.' },
      { tip: 'Keep gutters clear above the deck', detail: 'Overflow gutters dump water onto the deck, accelerating wear. Maintaining roof gutters protects the deck below.' },
    ],
    processSteps: [
      { num: '01', title: 'Design & Permit', description: 'For new builds, we design to your space and needs, calculate load requirements, and pull required building permits. SC requires permits for any deck attached to the house — we handle all of it.' },
      { num: '02', title: 'Footings & Framing', description: 'Footings dug to frost depth and inspected before pour. Posts set, beams sized to span, joists installed with proper hangers, ledger lag-bolted to house with flashing to prevent water infiltration.' },
      { num: '03', title: 'Decking Installation', description: 'Boards installed with proper gapping for expansion (especially composite), hidden fasteners or stainless screws to prevent rust streaks. Rim board finished cleanly. Stairs framed with proper rise/run code.' },
      { num: '04', title: 'Railings & Finish', description: 'Railings installed with code-compliant height (36–42") and baluster spacing (less than 4" gap). Posts notched into framing for strength, not just surface-mounted. Stain or sealer applied to wood decks.' },
      { num: '05', title: 'Inspection & Walk-Through', description: 'Local building inspector signs off on the work. We walk you through the deck, point out maintenance considerations, and provide warranty documentation. Cleanup includes removing all construction debris.' },
    ],
    faq: [
      { q: 'Wood, composite, or PVC?', a: 'Wood (pressure-treated): cheapest upfront, requires staining every 2–4 years, lasts 15–25 years. Composite (Trex, TimberTech): 60–100% more expensive than wood, no staining, lasts 25–30+ years. PVC: most expensive, completely waterproof, lasts indefinitely. Lifecycle cost favors composite for most homeowners.' },
      { q: 'Do I need a permit?', a: 'Yes for any deck attached to the house in SC. Free-standing decks under 200 sq ft sometimes don\'t need permits but local rules vary. We always pull permits when required — unpermitted work creates problems at sale time.' },
      { q: 'How long does a new deck take to build?', a: 'Standard 200 sq ft deck: 5–7 working days. 400 sq ft with stairs: 10–14 days. Permit timeline adds 1–2 weeks before construction starts. Weather can extend timelines — we don\'t pour footings or install in rain.' },
      { q: 'Can you save my old deck?', a: 'Often yes. Many "totaled" decks just need ledger replacement, joist sister-ing, board replacement, and re-staining for far less than full replacement. We give honest assessments — some decks are past saving, but many aren\'t.' },
      { q: 'What about hot tubs on the deck?', a: 'Hot tub decks need engineering. A standard deck can\'t support a 4,000–6,000 lb hot tub plus water plus people. We design tub-rated decks with reinforced footings and joists at the design phase — retrofitting later is rarely cost-effective.' },
    ],
    costData: [
      { item: 'New PT Wood Deck (200 sq ft)', cost: '$5,000–$10,000', lifespan: '15–25 years' },
      { item: 'New Composite Deck (200 sq ft)', cost: '$8,000–$18,000', lifespan: '25–30 years' },
      { item: 'Deck Refinishing (sand + stain)', cost: '$1,500–$4,000', lifespan: '2–4 years' },
      { item: 'Ledger Board Replacement', cost: '$1,500–$4,000', lifespan: '20+ years' },
      { item: 'Railing Replacement (per linear ft)', cost: '$30–$80', lifespan: '15–25 years' },
    ],
    seoKeywords: ['deck builder Greenville SC', 'deck repair Upstate SC', 'composite deck installation SC', 'deck refinishing near me'],
  },

  // ═══ 5. FENCE REPAIR & INSTALLATION ═══
  {
    id: 'fence-installation',
    slug: 'fence-installation',
    title: 'Fence Repair & Installation',
    tagline: 'Fences That Stay Straight, Stay Up, Stay Looking Good',
    heroDescription: 'Fences fall over because posts weren\'t set deep enough, weren\'t set in concrete, or rotted at ground level. RO sets posts properly the first time — at code-required depth, in concrete, with proper drainage — so fences don\'t lean, sag, or fall in the first storm. Wood, vinyl, chain-link, or aluminum.',
    heroImage: '/images/services/repairs/subs/fence-installation-hero.jpg',
    cardImage: '/images/services/repairs/subs/fence-installation-card.jpg',
    galleryImages: [
      '/images/services/repairs/subs/fence-installation-hero.jpg',
      '/images/services/repairs/subs/wood-fence.jpg',
      '/images/services/repairs/subs/post-setting.jpg',
      '/images/services/repairs/subs/vinyl-fence.jpg',
      '/images/services/repairs/subs/fence-gate.jpg',
      '/images/services/repairs/subs/finished-fence.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Fence work covers new installations (post setting, panel or board attachment, gates), replacement of failed fences, and repair work (replacing rotted posts, broken pickets, sagging gates, leaning sections). Common materials: pressure-treated wood, vinyl, aluminum, chain-link, and composite.',
      },
      {
        heading: 'When You Need It',
        content: 'New fence triggers: privacy from neighbors, pet containment, pool safety code requirements, defining property lines, or aesthetic improvement. Repair triggers: leaning posts, fallen sections after storms, rotted bottoms, broken gates, or pickets falling off. A 50-year-old chain-link is often worth replacing rather than patching repeatedly.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Wood privacy fence (6 ft tall): $25–$45 per linear foot installed. Vinyl: $30–$60/ft. Aluminum: $35–$70/ft. Chain-link: $15–$30/ft. Standard residential lot fencing (200–300 linear feet) runs $5,000–$15,000 depending on material and gates. Repairs: post replacement $150–$400 per post, picket replacement $25–$50 per board, gate repair $200–$600. Most installs take 2–5 days; repairs 1–2 days.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC clay soils hold water at fence post bases, accelerating wood rot. Posts set in concrete (not just dirt-tamped) and with gravel for drainage at the bottom last 3× longer. Cheap installs that skip concrete or use undersized posts fail in the first 5 years. We use 4×4 minimum (often 6×6 for tall fences), 36" depth in concrete with gravel, and metal post bases for gates.',
      },
    ],
    warningSigns: [
      { trigger: 'Fence leaning in one direction', detail: 'Post is failing — either rotted at base, undersized, or set too shallow. Pushing it back upright temporarily doesn\'t fix it; the post needs replacement or the fence will continue to lean.' },
      { trigger: 'Posts wiggling in the ground', detail: 'Concrete around the post has cracked or the post itself has deteriorated. A post that wiggles will fail completely in the next storm. Replace before that happens.' },
      { trigger: 'Bottom of wood pickets rotting', detail: 'Common in Upstate SC. Pickets touching ground or grass wick moisture and rot. Solution: replace rotted pickets, leave 1–2" gap at bottom for new ones, or add a kickboard.' },
      { trigger: 'Gates dragging or not closing', detail: 'Either the gate post has settled (most common) or the gate itself has sagged. Gate posts need to be set deeper than line posts (48"+ depth) and sometimes need diagonal bracing for tall gates.' },
      { trigger: 'Pickets popping off', detail: 'Wrong fasteners or fasteners failing. Galvanized ring-shank nails or stainless screws are required for outdoor use. Cheap nails rust and lose grip within years.' },
      { trigger: 'Visible rot at posts where fence meets ground', detail: 'Posts rot at the soil line where moisture and oxygen meet. Once visible rot appears, the post structurally is much weaker than it looks. Replace before it falls.' },
      { trigger: 'Chain-link sagging or rusting through', detail: 'Mesh has lost tension or is rusting. Re-tensioning is possible if mesh isn\'t too rusted. Heavy rust means replacement of affected sections.' },
    ],
    maintenanceTips: [
      { tip: 'Stain wood fences every 3–5 years', detail: 'Same principle as decks — staining preserves wood and prevents rot. Wait too long and you\'re replacing pickets instead of just staining.' },
      { tip: 'Trim vegetation away from fence', detail: 'Vines and bushes against the fence trap moisture and accelerate rot. Keep at least 6–12" clear on both sides.' },
      { tip: 'Check posts annually', detail: 'Walk the fence line each spring. Push on each post. Wiggle = problem. Catching a single failing post is much cheaper than waiting until the whole section falls.' },
      { tip: 'Tighten chain-link tension annually', detail: 'Chain-link mesh stretches over time. Tightening at the tension bar maintains the fence shape and prevents sagging.' },
      { tip: 'Lubricate gate hinges twice a year', detail: 'A drop of oil on hinges prevents squeaking and reduces wear. Stiff hinges put strain on the gate frame and accelerate failure.' },
    ],
    processSteps: [
      { num: '01', title: 'Layout & Permit Check', description: 'We measure, locate property lines (recommend a survey if unclear), and check for any HOA or local restrictions. SC sometimes requires permits for fences over 6 ft — we handle if needed.' },
      { num: '02', title: 'Call Before You Dig', description: 'SC811 utility location service called before any digging. Marks placed for gas, electric, water, and communications lines. Hitting a buried line is dangerous and expensive — we never skip this.' },
      { num: '03', title: 'Set Posts', description: 'Post holes dug to 36" minimum (48" for gate posts), gravel for drainage, post centered and plumbed, concrete poured around the post. Concrete cures 24–48 hours before any panels go up.' },
      { num: '04', title: 'Install Panels or Boards', description: 'Pre-built panels (vinyl, aluminum) attached to posts with manufacturer hardware. Wood fence: rails attached to posts, then pickets nailed or screwed evenly to rails. Gates installed with proper hardware (heavy-duty hinges for wood gates).' },
      { num: '05', title: 'Stain & Cleanup', description: 'For new wood fences, we recommend waiting 30–60 days for the wood to dry before initial stain. We can return for staining or you can hire it out. All concrete and dirt cleaned up, posts wrapped if requested.' },
    ],
    faq: [
      { q: 'How tall can my fence be?', a: 'Most SC residential zones allow 6 ft in back yards, 4 ft in front. Some areas allow 8 ft with permit. HOAs often have additional restrictions. We check local codes during the quote process.' },
      { q: 'Wood, vinyl, or aluminum?', a: 'Wood: cheapest upfront, looks classic, needs staining every 3–5 years, lasts 15–25 years. Vinyl: 50–100% more upfront, no maintenance, lasts 30+ years. Aluminum: best for see-through (pool fences, ornamental), lasts 30+ years, no maintenance. Chain-link: cheapest of all, basic, lasts 20+ years.' },
      { q: 'Do I need a permit?', a: 'Depends on locality and fence height. Most jurisdictions in Upstate SC don\'t require permits for residential fences under 6 ft, but pool barriers always need permits and inspections. We confirm before starting.' },
      { q: 'Can you replace just one section?', a: 'Yes — single picket, single panel, or single post replacements are common. Matching weathered material to a new section is the trickiest part. New sections will look noticeably different until they weather.' },
      { q: 'What about my neighbor\'s fence on the property line?', a: 'Property line fences are tricky. We strongly recommend talking to your neighbor before installing on or near the line. Some jurisdictions require shared cost if the fence benefits both properties — but that\'s typically a private agreement, not legal requirement.' },
    ],
    costData: [
      { item: 'Wood Privacy Fence (per linear ft)', cost: '$25–$45', lifespan: '15–25 years' },
      { item: 'Vinyl Fence (per linear ft)', cost: '$30–$60', lifespan: '30+ years' },
      { item: 'Aluminum Fence (per linear ft)', cost: '$35–$70', lifespan: '30+ years' },
      { item: 'Chain-Link Fence (per linear ft)', cost: '$15–$30', lifespan: '20+ years' },
      { item: 'Single Post Replacement', cost: '$150–$400', lifespan: '15–25 years' },
    ],
    seoKeywords: ['fence installation Greenville SC', 'fence repair Upstate SC', 'wood privacy fence builder SC', 'vinyl fence installer near me'],
  },

  // ═══ 6. DOOR & WINDOW REPLACEMENT ═══
  {
    id: 'door-window',
    slug: 'door-window',
    title: 'Door & Window Replacement',
    tagline: 'Sealed Tight, Hung Right, Lasting Decades',
    heroDescription: 'Doors and windows that don\'t close right, leak air, or stick are draining your energy bill and frustrating your daily life. RO replaces failed units with properly sized, properly sealed, and properly insulated installs — interior doors, exterior doors, single windows, or whole-house replacements.',
    heroImage: '/images/services/repairs/subs/door-window-hero.jpg',
    cardImage: '/images/services/repairs/subs/door-window-card.jpg',
    galleryImages: [
      '/images/services/repairs/subs/door-window-hero.jpg',
      '/images/services/repairs/subs/door-installation.jpg',
      '/images/services/repairs/subs/window-install.jpg',
      '/images/services/repairs/subs/exterior-door.jpg',
      '/images/services/repairs/subs/window-trim.jpg',
      '/images/services/repairs/subs/finished-door.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Door and window work covers new installations, replacements, and repairs. Includes interior doors (hollow or solid core), exterior doors (steel, fiberglass, wood), French and patio doors, sliding glass doors, single-hung and double-hung windows, casement and awning windows, and bay/bow windows. Proper installation is everything — even a $1,000 window leaks if installed wrong.',
      },
      {
        heading: 'When You Need It',
        content: 'Common triggers: drafty windows, condensation between panes (seal failed), windows that won\'t open or close, doors sticking or not latching, rotting frames, broken glass, security upgrades (impact-rated for storms), or aesthetic upgrades. Old single-pane windows can lose 25–35% of a home\'s heating/cooling — replacement pays back over years in energy savings.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Single interior door replacement (slab only): $150–$400 installed. Pre-hung interior door: $300–$700. Exterior door: $700–$2,500 depending on material and style. Single window replacement: $500–$1,500 standard, $2,000+ for large or specialty. Whole-house window replacement (15 windows): $8,000–$25,000+. Most single replacements take 2–4 hours; whole-house takes 2–5 days.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC summer humidity and winter cold both punish windows. Dual-pane low-E windows with proper installation maintain energy efficiency for 20–30 years. Cheap windows or bad installation lose efficiency in 5–8 years and lead to comfort problems and high bills. We install with foam insulation around the frame, proper flashing tape, and silicone caulk inside and out — not just nailed in and trimmed over.',
      },
    ],
    warningSigns: [
      { trigger: 'Condensation between window panes', detail: 'The seal between panes has failed and moisture is inside. The window is no longer insulating properly. Replacement is the only fix — the seal can\'t be repaired.' },
      { trigger: 'Drafts felt around windows or doors', detail: 'Air is leaking through the frame, weatherstripping, or improperly installed insulation. New weatherstripping fixes minor leaks; major drafts often mean the unit needs replacement or reinstallation.' },
      { trigger: 'Windows or doors hard to open or close', detail: 'Frame has shifted (settling), hardware is failing, or the unit has swelled with humidity. Sometimes a simple adjustment fixes it; sometimes the unit needs full replacement.' },
      { trigger: 'Visible rot at frame or sill', detail: 'Water has been getting into the frame structure. Once rot is visible, surrounding framing is also likely affected. Replacement and re-flashing prevent further damage.' },
      { trigger: 'Cracked, broken, or fogged glass', detail: 'Single broken pane in a dual-pane unit means the whole unit needs replacement (you can\'t just replace one pane). Cracks let in water and air.' },
      { trigger: 'Locks don\'t engage properly', detail: 'Door has shifted out of square, hardware is failing, or strike plate is misaligned. Adjustments often fix it; sometimes a new door is needed if the existing one is beyond adjustment.' },
      { trigger: 'Energy bills suddenly higher', detail: 'Failing windows are often the cause. Compare your bill to last year — a sudden jump with no other changes points to envelope problems (windows, doors, insulation, or roof leaks).' },
    ],
    maintenanceTips: [
      { tip: 'Lubricate hinges and tracks annually', detail: 'A drop of silicone spray on hinges, tracks, and locks each spring keeps everything moving smoothly. Stiff mechanisms wear out faster and stress the unit.' },
      { tip: 'Replace weatherstripping when worn', detail: 'Door and window weatherstripping wears out every 5–10 years. Replacing it ($20–$40 in materials) restores air seal without replacing the door.' },
      { tip: 'Caulk around exterior trim every 2–3 years', detail: 'Exterior caulk degrades in SC sun. Re-caulking gaps prevents water entry that rots frames and damages walls.' },
      { tip: 'Clean window tracks and weep holes', detail: 'Dirt in tracks prevents windows from sealing. Weep holes (small holes at the bottom outside of windows) drain water — keep them clear or water collects in the frame and rots it.' },
      { tip: 'Tighten door hinges as they loosen', detail: 'Heavy doors loosen hinge screws over time. A quick re-tighten (or longer screws into the framing) prevents the door from drooping and starting to rub.' },
    ],
    processSteps: [
      { num: '01', title: 'Measure & Order', description: 'Existing units measured precisely (rough opening, not just visible glass). Replacement units ordered to fit — typically 2–4 weeks lead time for stock items, 6–12 weeks for custom.' },
      { num: '02', title: 'Remove Old Unit', description: 'Trim removed carefully (saved for reuse if good condition). Old unit cut free and removed without damaging surrounding wall. Existing flashing and underlayment inspected for hidden water damage.' },
      { num: '03', title: 'Prep Opening', description: 'Rough opening cleaned and squared. New flashing tape installed at sill and jambs to direct any future water away from the framing. Insulation around opening checked.' },
      { num: '04', title: 'Install & Seal', description: 'New unit set into opening, plumbed and squared, fastened per manufacturer specs. Foam insulation around frame (not just fiberglass batt — foam seals air better). Caulked inside and out with quality silicone.' },
      { num: '05', title: 'Trim & Test', description: 'Interior trim reinstalled or replaced. Exterior trim caulked at all joints. Locking mechanism, weatherstripping, and operation all tested. Cleanup includes removing old unit and any debris.' },
    ],
    faq: [
      { q: 'Are new windows worth the cost?', a: 'Energy-wise: new dual-pane low-E windows save 20–30% on heating/cooling vs. old single-pane. Comfort-wise: huge improvement (no drafts, less outside noise, no condensation). ROI: rarely pays for itself in pure energy savings within 10 years, but combined with comfort and home value, it usually makes sense.' },
      { q: 'Should I get vinyl, fiberglass, or wood windows?', a: 'Vinyl: cheapest, no maintenance, lasts 25–30 years, limited color options. Fiberglass: 30–50% more expensive, stronger frame, better insulation, lasts 40+ years. Wood: most expensive, traditional look, requires periodic staining, can last 50+ years if maintained. Vinyl is the most popular and a solid choice for most homes.' },
      { q: 'Can I replace just one window?', a: 'Yes — singles or pairs are common. The challenge is matching style and color exactly to surrounding windows. New windows often look noticeably different from 20-year-old windows next to them.' },
      { q: 'What about hurricane-rated windows?', a: 'Impact-resistant windows are a major upgrade — designed to withstand 9-pound 2x4 at 50 mph (roughly hurricane debris). Cost is 2–3× standard windows. Worth it if you\'re close to coast or have a vulnerable home.' },
      { q: 'Do you do storm doors and screen doors?', a: 'Yes. Storm doors add efficiency to exterior doors (extra layer of insulation), and screen doors enable airflow without bugs. Both are quick add-on installs.' },
    ],
    costData: [
      { item: 'Interior Door (slab only)', cost: '$150–$400', lifespan: '30+ years' },
      { item: 'Pre-Hung Interior Door', cost: '$300–$700', lifespan: '30+ years' },
      { item: 'Exterior Door (steel/fiberglass)', cost: '$700–$2,500', lifespan: '20–40 years' },
      { item: 'Single Window Replacement', cost: '$500–$1,500', lifespan: '20–30 years' },
      { item: 'Whole-House Windows (15 units)', cost: '$8,000–$25,000', lifespan: '20–30 years' },
    ],
    seoKeywords: ['door replacement Greenville SC', 'window installation Upstate SC', 'replacement windows SC', 'exterior door installer near me'],
  },

  // ═══ 7. CONCRETE PATCHWORK ═══
  {
    id: 'concrete-patchwork',
    slug: 'concrete-patchwork',
    title: 'Concrete Patchwork',
    tagline: 'Sidewalks, Driveways, Slabs — Repaired or Replaced Right',
    heroDescription: 'Cracked walkways are trip hazards. Spalling driveways look terrible and trap water that makes cracks worse. RO repairs and replaces residential concrete — sidewalks, driveways, patios, garage floors, small slabs — with proper subgrade prep, reinforcement, and finishing for surfaces that last decades.',
    heroImage: '/images/services/repairs/subs/concrete-hero.jpg',
    cardImage: '/images/services/repairs/subs/concrete-card.jpg',
    galleryImages: [
      '/images/services/repairs/subs/concrete-hero.jpg',
      '/images/services/repairs/subs/concrete-pour.jpg',
      '/images/services/repairs/subs/concrete-finishing.jpg',
      '/images/services/repairs/subs/sidewalk-repair.jpg',
      '/images/services/repairs/subs/driveway-concrete.jpg',
      '/images/services/repairs/subs/concrete-tools.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Concrete work covers repair (crack sealing, spall repair, surface resurfacing) and full replacement (sidewalks, driveways, patios, slabs, walkway extensions). New concrete requires proper subgrade preparation (compacted gravel base), forming, reinforcement (rebar or wire mesh), proper concrete mix, finishing technique, and curing time. Skipping any of these causes premature failure.',
      },
      {
        heading: 'When You Need It',
        content: 'Repair triggers: cracks wider than 1/4 inch, lifted/sunken sections (trip hazards), spalling surface (flaking off in chunks), or surface deterioration from de-icing salts. Replacement triggers: extensive cracking throughout, sections that have settled significantly, or just wanting an upgrade (stamped concrete, pavers integrated, etc.).',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Crack sealing: $150–$500 depending on length. Spall repair (small areas): $300–$800. Sidewalk section replacement: $8–$15 per square foot. Standard driveway (600 sq ft): $4,000–$8,000. Stamped or colored concrete: 30–60% more than plain. Most repairs take 1 day; new pours take 1–2 days, with 7–14 days curing before heavy use, 28 days for full strength.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC freeze-thaw cycles damage concrete that wasn\'t poured properly. Insufficient air entrainment in the mix causes spalling. Inadequate subgrade prep causes settling and cracking. Proper concrete pours (correct mix, proper subgrade compaction, reinforcement, controlled curing) last 30+ years. Cheap pours fail in 5–10 years.',
      },
    ],
    warningSigns: [
      { trigger: 'Cracks wider than 1/4 inch', detail: 'Hairline cracks are normal and usually cosmetic. Cracks you can fit a quarter into mean ground movement, water infiltration, or structural failure. Sealing prevents water entry that worsens damage.' },
      { trigger: 'Lifted or sunken sections', detail: 'Subgrade has settled (sunken) or tree roots/frost has lifted concrete. Trip hazard requiring grinding (small differences) or replacement of affected sections (large differences).' },
      { trigger: 'Surface flaking off in chunks (spalling)', detail: 'Common in older concrete or where de-icing salts were used. Surface layer fails. Resurfacing applies a new top layer; severe spalling requires replacement of the slab.' },
      { trigger: 'Pooling water on a flat surface', detail: 'Concrete settled or was never properly sloped. Standing water accelerates damage and causes ice in winter. Replacement with proper slope (1/8 inch per foot minimum) prevents recurrence.' },
      { trigger: 'White powder on surface (efflorescence)', detail: 'Salt deposits from water moving through concrete. Cosmetic but indicates moisture infiltration. Sealing with concrete sealer prevents and reduces.' },
      { trigger: 'Visible rebar showing', detail: 'Concrete cover over rebar has been broken away. Rebar will rust and expand, causing more concrete to break off. Spot repair with patching compound or section replacement.' },
      { trigger: 'Tree roots lifting concrete', detail: 'Root pressure can crack and lift slabs. Removing the tree (rarely good option), root barriers, or sectional replacement with reinforcement to resist root pressure.' },
    ],
    maintenanceTips: [
      { tip: 'Seal concrete every 2–4 years', detail: 'A penetrating sealer ($30–$80 per gallon, covers 200–300 sq ft) reduces water absorption, prevents salt damage, and extends lifespan significantly. DIY-able for small areas.' },
      { tip: 'Avoid rock salt on concrete', detail: 'Rock salt (sodium chloride) damages concrete. Use calcium chloride or magnesium chloride for ice melt — gentler on concrete. Sand for traction is even better when possible.' },
      { tip: 'Fill cracks before they grow', detail: 'Hairline cracks let water in. Once water freezes, cracks expand. Filling with concrete crack sealer (caulk-like product) early prevents propagation.' },
      { tip: 'Don\'t park heavy vehicles on residential driveways', detail: 'Standard residential driveways are 4" thick rated for cars. Heavy trucks, RVs, and boats stress beyond design and crack the slab. Reinforced 6"+ pours are needed for heavy loads.' },
      { tip: 'Keep tree roots away from concrete', detail: 'Plant trees at least 10–15 ft from concrete surfaces. Existing trees with concrete being lifted may need root pruning (carefully) or removal.' },
    ],
    processSteps: [
      { num: '01', title: 'Demolition (if replacing)', description: 'Old concrete broken up with jackhammer or saw, chunks hauled away, area cleared down to subgrade. We use saw cuts where partial replacement is needed for clean edges.' },
      { num: '02', title: 'Subgrade Preparation', description: 'Soil compacted, gravel base laid (2–4 inches typical), gravel compacted, edges formed with lumber or composite forms. This step prevents future settling — skipping it means cracked concrete within years.' },
      { num: '03', title: 'Reinforcement', description: 'Rebar grid (#4 rebar at 18" spacing for driveways) or wire mesh placed on chairs to position it in the middle of the pour depth. Reinforcement is what prevents cracks from spreading once they start.' },
      { num: '04', title: 'Pour & Finish', description: 'Concrete poured (proper PSI mix for the application, usually 3,500–4,000 PSI for residential), screeded level, edged at form lines, then finished with bull float and trowel. Texture (broom finish typical) added before set.' },
      { num: '05', title: 'Cure & Seal', description: 'Concrete covered with curing compound or kept moist for 7+ days for proper strength development. Vehicles off for 7–14 days, full strength at 28 days. Sealer applied after 28 days for protection.' },
    ],
    faq: [
      { q: 'Can my old concrete be repaired or does it need replacement?', a: 'Depends on extent of damage. Small cracks, isolated spalling, or single sections — repair. Extensive cracking, multiple lifted sections, or crumbling surface — replacement is usually more cost-effective long-term. We give honest assessments.' },
      { q: 'How long until I can use new concrete?', a: 'Walking: 24 hours. Light vehicles: 7 days. Full strength (heavy loads, full use): 28 days. We post signs and barricades during cure period — driving on uncured concrete causes permanent damage.' },
      { q: 'Stamped or colored concrete cost much more?', a: 'Stamped: 30–50% more than plain. Colored (integral or surface): 10–25% more. Both look great but require sealing and maintenance for color longevity. Worth it for visible patios and walkways.' },
      { q: 'Can you match my existing concrete color?', a: 'Approximately, never exactly. Concrete colors change over time as the surface ages and the cement formula shifts. New patches will be lighter and more uniform than old; they\'ll weather to similar but not identical color over months.' },
      { q: 'What about concrete in winter?', a: 'We pour year-round in SC, but cold-weather pours (below 40°F) require heated water in mix and insulating blankets during cure. Adds cost. We schedule for warmer days when possible.' },
    ],
    costData: [
      { item: 'Crack Sealing (per linear ft)', cost: '$5–$15', lifespan: '5–10 years' },
      { item: 'Spall Repair (per square ft)', cost: '$8–$25', lifespan: '5–15 years' },
      { item: 'Sidewalk Replacement (per sq ft)', cost: '$8–$15', lifespan: '30+ years' },
      { item: 'Driveway Replacement (600 sq ft)', cost: '$4,000–$8,000', lifespan: '30+ years' },
      { item: 'Stamped or Colored Concrete (per sq ft)', cost: '+$3–$8 add-on', lifespan: '30+ years' },
    ],
    seoKeywords: ['concrete repair Greenville SC', 'driveway replacement Upstate SC', 'sidewalk repair near me', 'concrete contractor SC'],
  },

  // ═══ 8. PUNCH LIST & HANDYMAN ═══
  {
    id: 'punch-list',
    slug: 'punch-list',
    title: 'Punch List & Handyman',
    tagline: 'Small Jobs Done Professionally — One Visit, Many Fixes',
    heroDescription: 'A loose handrail, a sticking drawer, a busted light fixture, gutters need cleaning — none of these alone justify a service call, but together they\'re wearing on you. RO\'s punch-list service bundles small repairs into one efficient visit so you finally cross everything off the list.',
    heroImage: '/images/services/repairs/subs/punch-list-hero.jpg',
    cardImage: '/images/services/repairs/subs/punch-list-card.jpg',
    galleryImages: [
      '/images/services/repairs/subs/punch-list-hero.jpg',
      '/images/services/repairs/subs/handyman-toolbox.jpg',
      '/images/services/repairs/subs/cabinet-hinge.jpg',
      '/images/services/repairs/subs/light-fixture.jpg',
      '/images/services/repairs/subs/handrail-repair.jpg',
      '/images/services/repairs/subs/handyman-working.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Punch-list and handyman service handles the small jobs that don\'t fit any single trade — minor electrical (replacing fixtures, outlets), plumbing (faucets, toilet repairs), carpentry (trim, shelving), hardware (hinges, locks, knobs), exterior maintenance (gutter cleaning, caulking), and small repairs of all kinds. We bring one experienced handyman who can knock out 5–15 items in a single visit.',
      },
      {
        heading: 'When You Need It',
        content: 'Triggers: post-renovation punch list (small items contractors left undone), getting a house ready to sell, accumulated honey-do list, new home move-in fixes, rental property turnover, or just being too busy to handle small repairs. Anything that takes 15 minutes to 2 hours and you\'d rather not do yourself.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Most punch-list visits run $300–$800 for a half-day (3–4 hours), $600–$1,400 for a full day. Hourly rate $75–$125 depending on job complexity. Materials separate (we keep common ones on the truck). Most lists of 5–10 small items fit in a half-day. Larger lists or items requiring specific parts may need a return visit.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Many home repair companies don\'t want small jobs — they need full-day projects to be profitable. Homeowners get stuck calling 5 different specialists for what could be one visit. RO\'s punch-list service is specifically designed for this gap — fair hourly pricing, experienced handyman who can handle most trades, and willingness to do the small stuff that keeps your home in shape.',
      },
    ],
    warningSigns: [
      { trigger: 'Multiple small repairs accumulated', detail: 'When the honey-do list crosses 5+ items, individual service calls become inefficient. Bundling into a punch-list visit costs less per item and gets everything done in one trip.' },
      { trigger: 'Loose handrails or stairs', detail: 'Safety items that need addressing. A loose stair railing on basement steps is one fall away from an emergency room visit. Always priority on a punch-list visit.' },
      { trigger: 'Slow leaks under sinks or behind toilets', detail: 'Small leaks become big damage. Caught early on a handyman visit, they\'re a $50 fix. Caught after subfloor rot, they\'re thousands.' },
      { trigger: 'Smoke detector batteries beeping', detail: 'Safety. We replace all detector batteries during punch-list visits and check the units themselves are within 10-year replacement age.' },
      { trigger: 'Sticking doors or drawers', detail: 'Annoying but fixable in 5–15 minutes per item. Wrong adjustment for years means people stop opening them, work around them, or break them.' },
      { trigger: 'Burnt-out exterior lights or hard-to-reach bulbs', detail: 'Many homeowners avoid changing bulbs in 14-foot ceilings or on exterior fixtures requiring ladders. We have ladders and replace them quickly during a visit.' },
      { trigger: 'Gutters not cleaned in 2+ years', detail: 'Standard maintenance that prevents water damage to roof, fascia, foundation, and landscaping. Always worth bundling into a punch-list visit.' },
    ],
    maintenanceTips: [
      { tip: 'Keep a running list', detail: 'Note small repairs as they come up rather than trying to remember at quote time. A simple notebook or phone list ensures nothing gets missed during a punch-list visit.' },
      { tip: 'Schedule annual maintenance visits', detail: 'A yearly handyman visit (2–4 hours) catches small issues before they grow. Many homeowners do this in spring when they\'re thinking about home maintenance.' },
      { tip: 'Buy parts in advance for specific items', detail: 'If you have a specific replacement fixture you want (door knob, light, faucet), have it ready when we arrive. Saves an hour of shopping that we\'d charge you for.' },
      { tip: 'Tackle safety items first', detail: 'Smoke detectors, GFCI outlets, handrails, stair tread issues, exterior lighting. These get priority on every visit because they prevent worse outcomes.' },
      { tip: 'Address water issues immediately', detail: 'Slow leaks, dripping faucets, running toilets — water damage is the most expensive home repair category. Even a $5 toilet flapper saves you from a $300 water bill.' },
    ],
    processSteps: [
      { num: '01', title: 'Inventory the List', description: 'Send us your list (text, email, photos) ahead of time. We give you a rough estimate and time block. The more detail you provide, the more accurate our quote.' },
      { num: '02', title: 'Materials Prep', description: 'For specific items needing parts (specialty hardware, particular fixtures), we either pick up materials in advance or have you provide them. Common items (caulk, screws, switches) are stocked on the truck.' },
      { num: '03', title: 'Tackle the List', description: 'Half-day or full-day visit. We work through items in priority order (safety first, then water/electrical issues, then cosmetic). You can add items during the visit if time permits.' },
      { num: '04', title: 'Walk-Through & Status', description: 'We walk through completed items with you, identify anything that needs follow-up (parts not available, larger scope than expected), and discuss a plan for those.' },
      { num: '05', title: 'Cleanup & Documentation', description: 'All debris removed, materials stored or returned. You get an itemized list of what was completed and what (if anything) needs follow-up. Future visits build on this list.' },
    ],
    faq: [
      { q: 'How small a job will you take?', a: 'Anything we can drive to. Some companies refuse jobs under $300 — we\'ll do a $100 single-item visit if it fits in our schedule. Most punch lists end up bundling 5+ items naturally because once you start thinking, more comes to mind.' },
      { q: 'Can you handle electrical and plumbing during a punch-list visit?', a: 'Minor work — yes (replacing fixtures, fixing leaky faucets, swapping outlets and switches). Major work (new circuits, water heaters, sewer line work) — we route to our licensed electrical or plumbing teams. We\'re honest about what\'s in handyman scope vs. what needs a specialist.' },
      { q: 'Do you bring materials?', a: 'Common consumables (caulk, screws, basic hardware, weatherstripping) — yes, on the truck. Specific items (a particular faucet, specific paint color) — we either pick up or ask you to provide. Material costs are separate from labor.' },
      { q: 'How is this different from calling a plumber or electrician?', a: 'Specialists bill higher rates and only do their trade. Handyman service is one person who can do many trades at a lower rate. For complex single-trade work, call the specialist. For mixed lists of small items, handyman is more efficient.' },
      { q: 'Can you help me get a house ready to sell?', a: 'Yes — this is a common request. We focus on cosmetic and functional items that improve showing condition: paint touch-ups, hardware updates, caulking, door adjustments, light fixture replacements. Small investments that improve buyer impression.' },
    ],
    costData: [
      { item: 'Half-Day Visit (3–4 hours)', cost: '$300–$800', lifespan: 'Per visit' },
      { item: 'Full-Day Visit (7–8 hours)', cost: '$600–$1,400', lifespan: 'Per visit' },
      { item: 'Hourly Rate', cost: '$75–$125/hour', lifespan: 'Per hour' },
      { item: 'Annual Maintenance Visit', cost: '$400–$1,000', lifespan: '1 year' },
      { item: 'Pre-Sale Punch List', cost: '$500–$2,000', lifespan: 'One-time' },
    ],
    seoKeywords: ['handyman Greenville SC', 'home repair Upstate SC', 'punch list service SC', 'general handyman near me'],
  },

];
