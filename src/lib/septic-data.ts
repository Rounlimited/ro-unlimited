// ═══════════════════════════════════════════════════════════════
//  SEPTIC SUB-SERVICE DATA
//  8 detailed sub-service pages for /services/septic/[sub]
// ═══════════════════════════════════════════════════════════════

import type { SubService } from './sub-service-types';
export type SepticSubService = SubService;

export const SEPTIC_SUB_SERVICES: SepticSubService[] = [

  // ═══ 1. SEPTIC PUMPING ═══
  {
    id: 'septic-pumping',
    slug: 'septic-pumping',
    title: 'Septic Pumping',
    tagline: 'Routine Maintenance That Keeps Your System Alive',
    heroDescription: 'Every septic tank fills up. Sludge and scum build on the bottom and top, and once they crowd the outlet baffle, solids start flowing into your drain field — permanently damaging it. RO coordinates professional pumping on a 3–5 year cycle so your tank keeps doing its job and your drain field lasts decades longer.',
    heroImage: '/images/services/septic/subs/septic-pumping-hero.jpg',
    cardImage: '/images/services/septic/subs/septic-pumping-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/septic-pumping-hero.jpg',
      '/images/services/septic/subs/septic-truck.jpg',
      '/images/services/septic/subs/septic-lid-open.jpg',
      '/images/services/septic/subs/pumping-hose.jpg',
      '/images/services/septic/subs/septic-tank-closeup.jpg',
      '/images/services/septic/subs/septic-access.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Septic pumping is the physical removal of sludge (settled solids at the bottom), scum (grease and fats on top), and liquid from your septic tank. A vacuum truck pumps everything out through the access riser, leaving the tank mostly empty. Bacteria repopulate within days and the tank returns to normal operation — with the baffle clear and fresh capacity for solids to settle.',
      },
      {
        heading: 'When You Need It',
        content: 'Standard recommendation: pump every 3–5 years for a family of four with a 1,000-gallon tank. Smaller tanks, larger families, garbage disposal use, and heavy laundry days shorten that interval. Signs it\'s overdue: slow drains throughout the house, gurgling toilets, odors near the tank or drain field, or sewage backing up into lowest-level fixtures. Never wait for a backup — that usually means the tank is already past full.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'A standard 1,000–1,500 gallon tank pumping in Upstate SC runs $300–$600 including travel, disposal fees, and inspection. Larger tanks (2,000 gallons) run $500–$900. If your access lid is buried and has to be dug up, add $75–$150. Emergency same-day pumping during backups typically adds a $150–$300 emergency fee. Most pumping jobs take 30–60 minutes on site.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC clay soils hold moisture longer than sandy soils, which means your drain field has less margin for error. Once solids reach the drain field, they clog the gravel bed and soil pores permanently — and drain field replacement runs $5,000–$15,000. Regular pumping is the single cheapest insurance against the most expensive septic failure mode. A $500 pumping every 4 years is 30× cheaper than one drain field replacement.',
      },
    ],
    warningSigns: [
      { trigger: 'Multiple drains running slow at once', detail: 'If sinks, showers, and toilets all drain sluggishly, the problem is downstream of all fixtures — your tank is full or the line from the house is restricted. Single-fixture slowness is usually a local clog; house-wide slowness points to the septic system.' },
      { trigger: 'Gurgling toilets or drains', detail: 'Gurgling means air is pulling back through the trap because the main line can\'t breathe normally. A tank at capacity restricts flow and creates this backpressure.' },
      { trigger: 'Sewage odors outside near the tank or drain field', detail: 'A properly functioning septic system should never smell. Odors mean either the tank is venting because it\'s over-full, or effluent is surfacing in the drain field — both require immediate pumping and inspection.' },
      { trigger: 'Standing water or soggy ground over the drain field', detail: 'Wastewater should percolate down into the soil, not up. Surface saturation means the drain field can\'t absorb effluent fast enough — often because the tank let solids through and clogged the field.' },
      { trigger: 'Unusually lush green grass over the tank or field', detail: 'Grass thrives on the nitrogen in effluent. A noticeably darker, faster-growing strip over your system is a sign that too much untreated water is reaching the root zone — the tank may be overflowing.' },
      { trigger: 'Sewage backing up into the lowest drain in the house', detail: 'This is an emergency. Stop running water, call immediately. Basement floor drains or ground-level tubs are the first to back up when a tank is completely full.' },
      { trigger: 'It\'s been more than 5 years since your last pumping', detail: 'Even without visible symptoms, overdue tanks accumulate sludge that starts carrying into the drain field. By the time you notice symptoms, damage may already be done.' },
    ],
    maintenanceTips: [
      { tip: 'Keep a pumping log', detail: 'Write down every pumping date, the volume removed, and the condition of the baffles. This history is invaluable for timing the next service and spotting problems early.' },
      { tip: 'Install a riser to ground level', detail: 'If your access lid is buried, installing a plastic riser that extends to grade makes future pumpings $75–$150 cheaper each time. It pays for itself after one pumping.' },
      { tip: 'Use garbage disposals sparingly', detail: 'Every food scrap you grind up ends up as sludge in the tank. Disposal use can cut pumping intervals in half. Compost organic waste instead when possible.' },
      { tip: 'Spread out laundry loads', detail: 'Doing 6 loads on Saturday overwhelms the tank — solids that should settle get flushed into the drain field. Spread laundry across the week to maintain settling time.' },
      { tip: 'Keep a baffle filter clean', detail: 'If your tank has an effluent filter on the outlet baffle (most newer systems do), it should be pulled and rinsed every 6–12 months. A clogged filter causes backups even with a mostly empty tank.' },
      { tip: 'Don\'t add septic additives', detail: 'Commercial "tank treatments" don\'t help and some actively harm the bacterial ecosystem. A healthy tank needs no additives. The only thing that extends intervals is regular pumping and responsible use.' },
    ],
    processSteps: [
      { num: '01', title: 'Locate & Uncover Access', description: 'We locate your tank lid (using records, probes, or a locator device if needed) and uncover the access riser. If there\'s no riser, we dig down to the lid — typically 12–24 inches deep.' },
      { num: '02', title: 'Pre-Pump Inspection', description: 'Before pumping, we measure sludge and scum depth, check baffle condition, and note the water level relative to the outlet. This tells us whether the tank is functioning properly or has hidden issues.' },
      { num: '03', title: 'Pump the Tank', description: 'A vacuum truck removes all liquid, sludge, and scum through a 4-inch hose. The tank is agitated during pumping to break up compacted sludge and ensure everything comes out — not just the easy liquid on top.' },
      { num: '04', title: 'Post-Pump Inspection', description: 'With the tank empty, we inspect the interior walls for cracks, check baffle integrity, and confirm the inlet and outlet pipes are unobstructed. Anything concerning gets photographed and documented.' },
      { num: '05', title: 'Restore & Report', description: 'We seal the lid, backfill if we dug to reach it, and restore the ground. You get a written report of sludge depth, tank condition, and a recommended next-pump date based on your usage.' },
    ],
    faq: [
      { q: 'How often should I really pump?', a: 'The honest answer: it depends on tank size, household size, and usage. The Upstate SC average for a family of four with a 1,000-gallon tank is every 3–4 years. Larger tanks or smaller households stretch to 5+ years. We\'ll give you a specific timeline based on what we find in yours.' },
      { q: 'Can I just pump every 10 years to save money?', a: 'No. Solids will overflow into the drain field long before year 10. A $500 pumping every 4 years is far cheaper than a $10,000 drain field replacement at year 7. We\'ve seen this math play out many times.' },
      { q: 'Does pumping kill the bacteria in my tank?', a: 'No. Pumping removes excess sludge and scum but leaves residual bacteria in the tank walls and pipes. A healthy bacterial colony rebuilds within days of pumping as new waste enters.' },
      { q: 'What if you find cracks in my tank during pumping?', a: 'We document with photos, explain the severity, and give you options. Small cracks above the water line can be monitored. Cracks at or below the water line mean groundwater is entering (or effluent is escaping) and the tank needs repair or replacement.' },
      { q: 'Do I need to be home during the pumping?', a: 'Not necessarily, but we recommend it the first time so you know where your tank is and what condition it\'s in. Subsequent visits can be unattended if the access is clearly marked.' },
    ],
    costData: [
      { item: 'Standard Pump (1,000–1,500 gal)', cost: '$300–$600', lifespan: '3–5 years between pumps' },
      { item: 'Large Tank Pump (2,000 gal)', cost: '$500–$900', lifespan: '3–5 years between pumps' },
      { item: 'Access Riser Installation', cost: '$150–$400', lifespan: '25+ years' },
      { item: 'Emergency Same-Day Pumping', cost: '$450–$900', lifespan: 'One-time' },
      { item: 'Baffle/Filter Replacement', cost: '$100–$300', lifespan: '15–20 years' },
    ],
    seoKeywords: ['septic pumping Greenville SC', 'septic tank pump out Upstate SC', 'septic service near me', 'how often pump septic tank SC'],
  },

  // ═══ 2. SEPTIC INSPECTION ═══
  {
    id: 'septic-inspection',
    slug: 'septic-inspection',
    title: 'Septic Inspection',
    tagline: 'Know Before You Buy — Or Before It Fails',
    heroDescription: 'A septic inspection is not a visual walk-around. It\'s a full internal assessment of tank condition, baffle integrity, drain field function, and effluent flow — the only way to know whether a system has 10 years of life left or is already failing. Required for most real estate closings with septic systems, and smart maintenance for current owners.',
    heroImage: '/images/services/septic/subs/septic-inspection-hero.jpg',
    cardImage: '/images/services/septic/subs/septic-inspection-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/septic-inspection-hero.jpg',
      '/images/services/septic/subs/inspector-checking.jpg',
      '/images/services/septic/subs/septic-lid-open.jpg',
      '/images/services/septic/subs/drain-field-view.jpg',
      '/images/services/septic/subs/inspection-notes.jpg',
      '/images/services/septic/subs/septic-tank-closeup.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'A septic inspection evaluates every component of the system: tank condition, sludge and scum depth, baffle integrity, distribution box function, drain field absorption rate, and recent pumping history. A thorough inspection includes pumping the tank (so the interior can actually be seen) and running water through the house to observe flow and absorption in real time.',
      },
      {
        heading: 'When You Need It',
        content: 'Three main scenarios: (1) Buying a home with a septic system — you should never close without one, regardless of what the seller says. (2) Selling a home — in SC, buyers increasingly demand an inspection and lenders sometimes require one. (3) Maintenance inspections — a baseline inspection every 5–10 years catches problems before they become expensive. Also essential after heavy rain events, if you notice any warning signs, or after tree roots have invaded.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'A basic visual inspection runs $150–$300 but only catches obvious failures. A proper full inspection with tank pumping, camera scoping, and drain field load test runs $400–$800. Real estate transaction inspections typically run $500–$700 and include DHEC-compatible documentation. Most inspections take 2–4 hours on site, with a written report delivered within 48 hours.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'South Carolina DHEC requires permitted septic systems but doesn\'t mandate regular inspections. That means failed or marginal systems often aren\'t discovered until they back up — which can happen years after a home is sold. Upstate SC\'s clay-heavy soils mean drain fields fail sooner than in sandy regions, and many rural properties have older systems approaching end-of-life. An inspection today can save a buyer from a $15,000+ post-closing surprise.',
      },
    ],
    warningSigns: [
      { trigger: 'You\'re buying a home with septic and the seller says "it works fine"', detail: '"Works fine" is not a diagnosis. It means water goes down. A failing system can still pass water until it doesn\'t — and then you own the problem. Get an independent inspection every time.' },
      { trigger: 'No pumping records for the last 5+ years', detail: 'If the seller can\'t produce records, assume the system hasn\'t been maintained. An inspection reveals whether sludge depth is dangerous and whether damage has already occurred.' },
      { trigger: 'The system is over 20 years old', detail: 'Average septic system lifespan is 25–40 years. Tanks older than 20 years warrant inspection to check for cracks, root intrusion, and baffle deterioration before problems escalate.' },
      { trigger: 'Unknown system location or age', detail: 'Rural properties sometimes have systems the current owner never located. A professional inspection finds the tank, assesses its age, and determines whether it\'s still on a permit (required for some transactions).' },
      { trigger: 'Visible signs: odors, soft ground, slow drains', detail: 'Any visible symptom means an inspection is overdue. Catching a failing system before complete failure often means a $3,000 repair instead of a $15,000 replacement.' },
      { trigger: 'Recent heavy construction or landscaping over the system', detail: 'Driving heavy equipment, adding fill dirt, or installing pools, decks, or driveways over a system can crack tanks and compress drain fields. Inspection confirms whether damage occurred.' },
    ],
    maintenanceTips: [
      { tip: 'Schedule a baseline inspection at 5 years', detail: 'Even with regular pumping, an inspection every 5–10 years catches slow-developing problems: root intrusion, baffle deterioration, early drain field saturation. Fixing these early costs thousands less than waiting.' },
      { tip: 'Keep inspection reports with property records', detail: 'When you eventually sell, a history of documented inspections dramatically speeds up the buyer\'s due diligence and can prevent price renegotiation.' },
      { tip: 'Re-inspect after major events', detail: 'Hurricane flooding, major construction, tree removal near the system, or extended vacancy can all affect system function. A $300 check-up afterward confirms everything still works.' },
      { tip: 'Ask about camera scoping', detail: 'Modern inspections can include a camera inspection of the main sewer line from house to tank. This catches root intrusion, sags, and cracks that pumping alone won\'t reveal.' },
      { tip: 'Don\'t skip the drain field portion', detail: 'Cheap inspections only look at the tank. A complete inspection includes visual assessment of the drain field, probing for wet spots, and running water to observe absorption rate.' },
    ],
    processSteps: [
      { num: '01', title: 'Record Review & Location', description: 'We pull DHEC records when available, interview the homeowner about maintenance history, and locate the tank using records, probes, or electronic locators. Every component is noted on a site diagram.' },
      { num: '02', title: 'Tank Assessment', description: 'We open the tank, measure sludge and scum, and inspect baffles. If the tank is due for pumping, we coordinate that first so we can actually see the tank walls, inlet and outlet tees, and identify cracks or damage.' },
      { num: '03', title: 'Flow & Load Test', description: 'We run water through the house — sinks, tubs, washing machine — for 15–30 minutes while watching effluent flow through the distribution box (if accessible) and observing drain field absorption. This catches restrictions pumping alone won\'t show.' },
      { num: '04', title: 'Drain Field Survey', description: 'We walk the drain field looking for wet spots, odors, depressions, or unusually green vegetation. Where practical, we probe the soil to confirm absorption is happening below the surface, not above.' },
      { num: '05', title: 'Written Report', description: 'You receive a detailed written report with photos, sludge/scum measurements, component condition, and a specific remaining-life estimate. For real estate transactions, we provide DHEC-compatible documentation.' },
    ],
    faq: [
      { q: 'Do I need an inspection if I\'m not buying or selling?', a: 'Not required by law, but strongly recommended every 5–10 years. Inspections catch problems while they\'re affordable. We see homeowners spend $20,000 on a failed system that a $500 inspection 3 years earlier would have caught at the $3,000-repair stage.' },
      { q: 'What happens if the inspection fails?', a: 'Depends on what fails. A marginal drain field might need a $2,000–$5,000 repair; a dead system needs full replacement. For home purchases, a failed inspection is leverage for price reduction or for the seller to repair before closing. We always give a clear scope and estimate.' },
      { q: 'Can I skip pumping during the inspection to save money?', a: 'You can, but then the inspection is mostly guesswork. Without an empty tank, we can\'t see the walls, baffles, or measure real sludge levels. We recommend combining pumping and inspection — saves a service visit and gives a real picture.' },
      { q: 'Does my homeowner\'s insurance cover septic failures?', a: 'Almost never. Septic is classified as maintenance, not sudden damage. That\'s why inspections matter — you can\'t file an insurance claim for a system that quietly failed over 10 years.' },
      { q: 'Is DHEC approval required for new owners?', a: 'SC doesn\'t require a transfer approval for existing systems, but any repairs or replacement must go through DHEC permitting. An inspection establishes the baseline the new owner inherits.' },
    ],
    costData: [
      { item: 'Basic Visual Inspection', cost: '$150–$300', lifespan: '1-time (valid 90 days)' },
      { item: 'Full Inspection with Pumping', cost: '$600–$1,100', lifespan: '1-time (valid 1 year)' },
      { item: 'Real Estate Transaction Inspection', cost: '$500–$800', lifespan: '1-time (valid 90 days)' },
      { item: 'Camera Line Scope Add-On', cost: '$150–$300', lifespan: '1-time' },
      { item: 'Dye Test (drain field absorption)', cost: '$100–$200', lifespan: '1-time' },
    ],
    seoKeywords: ['septic inspection Greenville SC', 'septic inspection before buying house', 'real estate septic inspection Upstate SC', 'septic system evaluation SC'],
  },

  // ═══ 3. NEW SEPTIC INSTALLATION ═══
  {
    id: 'new-installation',
    slug: 'new-installation',
    title: 'New Septic Installation',
    tagline: 'From Soil Test to Final Inspection — One Crew, One Standard',
    heroDescription: 'Installing a new septic system is the single most regulated part of residential construction. Soil type, slope, water table depth, setbacks from wells and property lines — every variable affects what can go in and what it costs. RO handles the full scope: soil evaluation, DHEC permitting, system design, excavation, tank and drain field installation, and final inspection.',
    heroImage: '/images/services/septic/subs/new-installation-hero.jpg',
    cardImage: '/images/services/septic/subs/new-installation-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/new-installation-hero.jpg',
      '/images/services/septic/subs/excavator-tank.jpg',
      '/images/services/septic/subs/tank-setting.jpg',
      '/images/services/septic/subs/drain-field-pipe.jpg',
      '/images/services/septic/subs/soil-test.jpg',
      '/images/services/septic/subs/backfill.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'A new septic system installation puts in place the complete sewage treatment and disposal infrastructure for a home that isn\'t on municipal sewer. That includes a septic tank (usually 1,000–1,500 gallons for a 3–4 bedroom home), distribution box, and drain field (typically 200–400 feet of perforated pipe in gravel trenches). For challenging sites, systems can include lift pumps, sand filters, or engineered mound beds.',
      },
      {
        heading: 'When You Need It',
        content: 'Three scenarios: (1) New construction on a rural lot without municipal sewer access — most common. (2) Complete system replacement when the existing system has failed beyond repair. (3) Adding a second system for an accessory dwelling, in-law suite, or workshop with plumbing. Any of these require DHEC permits, and in most cases a licensed installer like RO.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Standard gravity-flow installation for a 3–4 bedroom home in Upstate SC runs $5,000–$15,000 all-in, including permits, soil test, tank, drain field, and labor. Sites with clay soils or poor percolation may require alternative systems (sand filters, mounds, aerobic treatment) that run $15,000–$25,000. Timeline: soil test and permitting 1–3 weeks, installation 2–5 days, DHEC inspection and backfill 1–2 additional days. Total 2–4 weeks start to finish.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC has a wide range of soil conditions — sandy piedmont, clay-heavy bottomland, shallow bedrock near foothills. A cookie-cutter system that works on one lot may fail on the next. Getting the right system designed for your specific site is the single biggest factor in longevity. Cheap shortcuts on installation show up 5 years later as drain field failure. RO does it right the first time.',
      },
    ],
    warningSigns: [
      { trigger: 'Your contractor doesn\'t mention a soil test', detail: 'DHEC requires a perc test (percolation test) before any new system permit. If the contractor is quoting without a soil evaluation, they\'re either planning to skip it (illegal) or they haven\'t done this before.' },
      { trigger: 'The quote is dramatically cheaper than others', detail: 'A $3,000 quote on a new system almost always means something is being skipped — smaller tank than code requires, undersized drain field, or skipped permits. Do not reward shortcuts. The permit and inspection matter.' },
      { trigger: 'No permit number on the quote', detail: 'A legitimate installer will either have the permit in hand or include the permit fee and timeline in the quote. Work without a DHEC permit is illegal and will create problems at sale time.' },
      { trigger: 'You\'re told an "engineered system" isn\'t necessary on a difficult lot', detail: 'If your lot has clay soils, steep slope, shallow water table, or proximity to a stream, a simple gravity-flow system may not pass DHEC. An installer steering you away from an engineered design to save money is gambling with your long-term system health.' },
      { trigger: 'No written warranty', detail: 'Reputable installers warranty tank and drain field workmanship for at least 1 year, often 2–5 years. If warranty terms aren\'t written into the quote, they don\'t exist.' },
      { trigger: 'No plan for protecting the install site during construction', detail: 'Other trades driving heavy equipment over a new drain field will compact the soil and destroy absorption. The installer should mark the area and coordinate with the GC to protect it.' },
    ],
    maintenanceTips: [
      { tip: 'Document everything during install', detail: 'Photos of the tank setting, drain field layout, and distribution box location become invaluable 10 years later when you need to pump, repair, or sell. Keep copies with your property records.' },
      { tip: 'Mark tank access with a permanent riser', detail: 'Spend the extra $150–$400 during installation to add a plastic riser that extends to grade. Saves $100+ on every future pumping and makes inspections trivial.' },
      { tip: 'Don\'t landscape over the drain field', detail: 'Grass is fine. Deep-rooted trees, shrubs, and garden beds are not — roots will invade and clog perforations. Keep the area clear of anything that needs watering or has aggressive roots.' },
      { tip: 'Keep the "as-built" drawing', detail: 'Your installer should provide a dimensioned drawing showing tank, drain field, and distribution box locations. Store this with deed documents — it prevents future owners from digging into components.' },
      { tip: 'First pumping at 3 years', detail: 'New systems should be pumped at 3 years to establish a baseline sludge accumulation rate. After the first pump, we can dial in your specific interval.' },
    ],
    processSteps: [
      { num: '01', title: 'Site Assessment & Soil Test', description: 'A certified soil classifier evaluates the site, digs test pits, and measures percolation rate. This determines what system type is permittable and where it must be located. Results inform the design.' },
      { num: '02', title: 'System Design & DHEC Permit', description: 'We design the system to match soil conditions, home size, and site constraints, then submit to DHEC for permit. Approval typically takes 2–3 weeks. You receive full plans before any excavation.' },
      { num: '03', title: 'Excavation & Tank Setting', description: 'We excavate for tank and drain field, set the concrete tank on a level gravel bed, and plumb the inlet line from the house. Tank is tested for watertightness before backfill.' },
      { num: '04', title: 'Drain Field Construction', description: 'Gravel trenches are dug to design specs, perforated distribution pipe is laid with correct slope, and the field is covered with filter fabric and soil. Distribution box is set and connected to tank and field.' },
      { num: '05', title: 'Inspection & Backfill', description: 'DHEC inspector confirms all components meet permit specs before any covering. Once passed, we backfill, grade, and seed. You get the final inspection report and warranty documentation.' },
    ],
    faq: [
      { q: 'How long does the whole process take?', a: '2–4 weeks typical, but can stretch to 8+ weeks during high-demand seasons or with complex sites. The soil test and DHEC permit account for 1–3 weeks; the physical installation is 3–7 days; final inspection and backfill add 1–2 days. We\'ll give you a specific schedule after the soil test.' },
      { q: 'Can I live in the house during installation?', a: 'If it\'s an existing home with an old system, yes — but plumbing use will be limited during the 1–2 days the old system is disconnected and the new one connected. For new construction, the septic usually goes in before occupancy permit, so it\'s a non-issue.' },
      { q: 'What\'s the difference between a gravity system and an engineered system?', a: 'Gravity systems use natural soil slope to move effluent from tank to drain field — cheapest and simplest. Engineered systems use pumps, filters, or elevated beds to compensate for poor soil, high water tables, or steep terrain. Engineered systems cost 2–4× more but are the only option on challenging sites.' },
      { q: 'Do I need a contractor for new construction septic?', a: 'Yes, and in SC it must be a licensed installer. DIY septic installation is illegal and will fail DHEC inspection, meaning you can\'t get a certificate of occupancy on the house.' },
      { q: 'How big a tank and drain field do I need?', a: 'Determined by number of bedrooms (DHEC uses bedrooms as a proxy for occupancy). 3-bedroom: 1,000-gallon tank, ~300 ft drain field. 4-bedroom: 1,250-gallon tank, ~400 ft field. 5-bedroom: 1,500-gallon tank, ~500 ft field. Soil conditions can increase these numbers.' },
    ],
    costData: [
      { item: 'Standard 3–4 BR Gravity System', cost: '$5,000–$12,000', lifespan: '25–40 years' },
      { item: 'Soil Test & Permit', cost: '$600–$1,200', lifespan: '1-time' },
      { item: 'Engineered Mound System', cost: '$15,000–$25,000', lifespan: '20–35 years' },
      { item: 'Aerobic Treatment System', cost: '$10,000–$18,000', lifespan: '15–25 years' },
      { item: 'Pump Station (if needed)', cost: '$1,500–$3,500', lifespan: '10–15 years' },
    ],
    seoKeywords: ['new septic installation Greenville SC', 'septic system installer Upstate SC', 'DHEC permit septic install', 'new construction septic SC'],
  },

  // ═══ 4. SEPTIC TANK REPAIR ═══
  {
    id: 'septic-repair',
    slug: 'septic-repair',
    title: 'Septic Tank Repair',
    tagline: 'Fix It Right — Or Pay to Replace It Later',
    heroDescription: 'Septic tanks don\'t fail all at once. Baffles deteriorate, lids crack, inlet and outlet pipes shift, and small cracks let groundwater in. Catching problems early means a $500 repair; ignoring them leads to drain field damage and a $15,000 full replacement. RO diagnoses and repairs tank-level issues before they cascade.',
    heroImage: '/images/services/septic/subs/septic-repair-hero.jpg',
    cardImage: '/images/services/septic/subs/septic-repair-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/septic-repair-hero.jpg',
      '/images/services/septic/subs/baffle-repair.jpg',
      '/images/services/septic/subs/tank-crack.jpg',
      '/images/services/septic/subs/riser-install.jpg',
      '/images/services/septic/subs/lid-replacement.jpg',
      '/images/services/septic/subs/tank-inlet.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Septic tank repair covers any work that keeps the tank itself functioning: baffle replacement (the T-shaped fittings at inlet and outlet that keep scum from escaping), lid and riser replacement, inlet and outlet pipe repairs, crack sealing, and effluent filter installation or replacement. Drain field issues are a separate category — tank repairs specifically address the tank and its immediate connections.',
      },
      {
        heading: 'When You Need It',
        content: 'Most tank repairs are discovered during pumping or inspection. Missing or broken baffles are extremely common in tanks over 20 years old — concrete baffles crack, steel baffles rust away, plastic baffles become brittle. Cracks in the tank walls allow groundwater infiltration (which overloads the drain field) or effluent escape (which contaminates groundwater). Failed inlet or outlet pipes cause immediate symptoms: backups, slow drains, or surface flooding.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Most repairs run $300–$2,500 depending on complexity. Baffle replacement: $250–$600. Lid replacement: $400–$900 (more if buried). Effluent filter install: $150–$350. Inlet/outlet pipe repair: $500–$1,500. Tank crack repair: $1,000–$2,500. Most repairs take 2–6 hours on site. Complex repairs requiring excavation can take a full day.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC has many 30+ year-old concrete tanks where baffles have failed. Once baffles are gone, scum and solids flow straight into the drain field, clogging it within months. Repairing a $400 baffle can save a $10,000 drain field. Similarly, unseen tank cracks let in thousands of gallons of groundwater each year, overloading the drain field even with perfect maintenance.',
      },
    ],
    warningSigns: [
      { trigger: 'Solids visible in the outlet pipe', detail: 'If you can see grease or solids in the outlet, the outlet baffle has failed. Every flush is now sending waste directly to your drain field. This is urgent — drain field damage is actively occurring.' },
      { trigger: 'Water level in tank is higher than the outlet pipe', detail: 'The tank should equalize at the outlet elevation. If water is rising above that, either the outlet is restricted (baffle or filter clogged) or the drain field can\'t absorb fast enough. Both need attention.' },
      { trigger: 'Water level in tank is below the outlet pipe', detail: 'The tank is leaking. Effluent is escaping through a crack or failed joint into the surrounding soil — contaminating groundwater and creating a site that can no longer be considered "on a functional septic system."' },
      { trigger: 'Groundwater visible in the tank after pumping', detail: 'Some seepage is normal in very wet conditions, but if the tank fills from below after pumping, there are cracks letting groundwater in. This overloads the system 24/7 and must be addressed.' },
      { trigger: 'Cracked or crumbling tank lid', detail: 'A cracked lid is a safety hazard — they\'ve been known to collapse under the weight of a person or equipment, with fatal consequences. Replace immediately, don\'t wait.' },
      { trigger: 'Strong sewage smell near the tank', detail: 'Odors mean gases are escaping that shouldn\'t be. Causes: cracked lid, failed vent, or effluent surfacing around the tank. All are fixable but none should be ignored.' },
      { trigger: 'Effluent filter found clogged during inspection', detail: 'If your tank has an outlet filter, it should be pulled and rinsed annually. A clogged filter causes backups even when tank volume is fine — easy fix but easily overlooked.' },
    ],
    maintenanceTips: [
      { tip: 'Inspect baffles at every pumping', detail: 'Baffles are only visible when the tank is empty. A 10-second visual check during pumping catches failures before they damage the drain field.' },
      { tip: 'Replace concrete baffles with PVC', detail: 'If you\'re repairing a baffle, use PVC instead of concrete. PVC won\'t rot, rust, or crumble. Cost is identical but lifespan is 40+ years vs. 20 for concrete.' },
      { tip: 'Add an effluent filter if your tank doesn\'t have one', detail: 'Newer installations include filters on the outlet baffle; older tanks don\'t. A $100–$200 filter catches residual solids that slip past the baffle, extending drain field life significantly.' },
      { tip: 'Install risers instead of digging to lids', detail: 'Every time you dig up a buried lid, you risk cracking it or damaging the seal. A one-time riser install ($150–$400) eliminates future digging entirely.' },
      { tip: 'Never drive over the tank', detail: 'Concrete tanks are rated for ground load, not vehicle load. Driving over them cracks lids and walls. Mark the tank location and keep vehicles off.' },
    ],
    processSteps: [
      { num: '01', title: 'Diagnosis', description: 'We start with a pumping so we can see the tank interior, then assess baffle condition, wall integrity, pipe connections, and fitting seals. Every issue is photographed before we touch anything.' },
      { num: '02', title: 'Scope & Estimate', description: 'Based on the diagnosis, we lay out exactly what needs repair, show you the photos, and give a written estimate. For multiple issues, we prioritize what\'s urgent vs. what can wait.' },
      { num: '03', title: 'Repair Work', description: 'Most baffle and filter repairs are done through the existing access lid — no excavation. Crack repair and pipe work may require exposing parts of the tank. We protect the site and minimize disturbance.' },
      { num: '04', title: 'Test & Verify', description: 'After repair, we run water through the house to verify flow is correct, the tank seals properly, and the drain field is receiving effluent — not groundwater from cracks or solids past failed baffles.' },
      { num: '05', title: 'Documentation & Next Steps', description: 'You get a written report of what was repaired, photos before and after, and a recommended timeline for the next inspection. If drain field damage was suspected, we schedule a follow-up to confirm it\'s still functioning.' },
    ],
    faq: [
      { q: 'Can I repair my own baffle?', a: 'Not recommended. It requires working in a confined space with hazardous gases (hydrogen sulfide, methane) and proper fittings. One-person DIY has resulted in fatalities nationally. Professional repair is safer and typically $300–$500 — worth every penny.' },
      { q: 'How do I know if my tank has cracks?', a: 'After pumping, the tank should hold water at the outlet level. If the level drops over a few hours, it\'s leaking. If it rises, groundwater is entering. Either way, the tank has integrity issues requiring repair.' },
      { q: 'What if my tank is steel and rusted out?', a: 'Steel tanks were common in the 1960s–70s and most have rusted through by now. Repair is usually not cost-effective — the whole tank needs replacement with concrete or plastic. We\'ll give you the math when we assess.' },
      { q: 'Will a repair restore a failing drain field?', a: 'Often yes — if the drain field was damaged by a failed baffle (solids flowing through), stopping the flow of solids and pumping regularly can let the drain field recover over 6–18 months. If damage is severe, repair alone won\'t fix it and field work is also needed.' },
      { q: 'How long do repairs last?', a: 'Depends on what\'s repaired. PVC baffles: 40+ years. Concrete crack sealing: 10–20 years. Effluent filters: 15–20 years before replacement. Lid and riser: 25+ years. We track repair dates in our records so we can help you plan long-term.' },
    ],
    costData: [
      { item: 'Baffle Replacement (PVC)', cost: '$250–$600', lifespan: '40+ years' },
      { item: 'Lid Replacement', cost: '$400–$900', lifespan: '25–40 years' },
      { item: 'Effluent Filter Install', cost: '$150–$350', lifespan: '15–20 years' },
      { item: 'Inlet/Outlet Pipe Repair', cost: '$500–$1,500', lifespan: '20–30 years' },
      { item: 'Concrete Crack Sealing', cost: '$1,000–$2,500', lifespan: '10–20 years' },
    ],
    seoKeywords: ['septic tank repair Greenville SC', 'septic baffle replacement SC', 'septic lid replacement Upstate SC', 'septic tank crack repair'],
  },

  // ═══ 5. DRAIN FIELD REPAIR ═══
  {
    id: 'drain-field-repair',
    slug: 'drain-field-repair',
    title: 'Drain Field Repair',
    tagline: 'Fix the Most Expensive Part of Your System — Before You Replace It',
    heroDescription: 'Drain fields are the most expensive, most fragile, and most commonly failed component of a septic system. Once a field floods, smells, or stops absorbing, many installers jump straight to "you need a replacement." RO diagnoses root causes — compaction, root invasion, biomat buildup, failed baffles upstream — and restores function where possible instead of tearing it all out.',
    heroImage: '/images/services/septic/subs/drain-field-repair-hero.jpg',
    cardImage: '/images/services/septic/subs/drain-field-repair-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/drain-field-repair-hero.jpg',
      '/images/services/septic/subs/drain-field-trench.jpg',
      '/images/services/septic/subs/field-pipe.jpg',
      '/images/services/septic/subs/gravel-trench.jpg',
      '/images/services/septic/subs/distribution-box.jpg',
      '/images/services/septic/subs/wet-field.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'A drain field (leach field, absorption field) is a series of perforated pipes laid in gravel trenches that distribute effluent from the tank into the soil for final treatment. Repair covers everything from replacing the distribution box (D-box), to jetting clogged lines, to rehabilitating compacted soil, to replacing a single failed trench. Full replacement is the last resort, not the first.',
      },
      {
        heading: 'When You Need It',
        content: 'Signs of drain field trouble: standing water over the field, septic odors outside, toilets backing up despite recent tank pumping, drains throughout the house running slow simultaneously, or unusually lush green grass only over the field. Once you see these, repair is time-critical — the field has already started failing and continued use accelerates the damage.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Repairs vary widely. D-box replacement: $800–$2,000. Jetting and line cleaning: $400–$1,200. Single trench replacement: $2,000–$5,000. Full rehabilitation (aerating soil, replacing gravel, new fabric): $4,000–$10,000. Repairs take 1–4 days; full replacement runs $5,000–$15,000 and takes 5–10 days. Our diagnosis tells you which path you\'re on before you commit.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC clay soils are marginal for drain fields even when perfectly designed. Once compacted by construction traffic, landscaping equipment, or vehicle use, clay loses most of its absorption capacity. We see fields misdiagnosed as "failed" when really the issue was a clogged effluent filter upstream or a cracked D-box. Fixing the real problem costs 20–40% of a full replacement.',
      },
    ],
    warningSigns: [
      { trigger: 'Standing water or soggy ground over the field', detail: 'Healthy drain fields absorb water within hours. Persistent wet spots mean absorption has failed somewhere — the trenches are saturated, the soil is compacted, or the field has reached end of life. Ignoring this for months can kill an otherwise salvageable field.' },
      { trigger: 'Sewage odors near the field even when the tank was just pumped', detail: 'If pumping didn\'t solve the odor, the field is the culprit. Effluent is surfacing, which is both a health hazard and a clear sign the field can\'t take on more volume.' },
      { trigger: 'Drains backing up despite recent tank pumping', detail: 'A freshly pumped tank with continued drain problems means the field is refusing water — the tank fills from the house faster than it can drain to the field. This requires immediate diagnosis before full system backup.' },
      { trigger: 'Unusually green or fast-growing grass over the field', detail: 'Nitrogen from effluent is feeding the grass — which means effluent is reaching the root zone instead of percolating deep into the soil. The field is saturated at the surface, not absorbing properly.' },
      { trigger: 'Recent construction traffic or landscaping over the field', detail: 'Driving vehicles or operating heavy equipment over a drain field compresses the soil, collapsing pore space and destroying absorption. Damage can happen in a single day and may be partially reversible if caught early.' },
      { trigger: 'Trees or shrubs planted near or over the field', detail: 'Roots naturally grow toward nutrient sources. A mature tree can send roots 100+ feet to reach a drain field and clog pipes in a season. Inspection reveals whether roots are already inside the distribution piping.' },
      { trigger: 'System is over 25 years old', detail: 'Biomat (the biological layer that naturally forms in the trench gravel) eventually saturates, reducing absorption. Older fields approach this limit regardless of care. Inspection determines remaining life.' },
    ],
    maintenanceTips: [
      { tip: 'Keep everything off the drain field', detail: 'No vehicles, sheds, decks, gardens, or trees. Grass and shallow-rooted groundcovers only. Even foot traffic during wet conditions can compact soil — keep the field undisturbed.' },
      { tip: 'Divert rainwater away from the field', detail: 'Gutter downspouts, driveway runoff, and landscape drainage should direct water away from the field — not toward it. An already-saturated field can\'t accept effluent.' },
      { tip: 'Pump the tank on schedule', detail: 'The single biggest cause of drain field failure is neglected tanks sending solids downstream. Regular pumping protects the field more than any other maintenance.' },
      { tip: 'Space out high-volume water use', detail: 'The field has a daily absorption limit. Doing 6 loads of laundry in one day can saturate the field for 48+ hours. Spread usage across days.' },
      { tip: 'Install an effluent filter at the tank outlet', detail: 'A $150–$350 filter catches residual solids before they reach the field. Adding one to an older tank is one of the cheapest life-extensions available.' },
    ],
    processSteps: [
      { num: '01', title: 'Full System Diagnosis', description: 'Drain field problems are often caused by upstream issues. We start by inspecting the tank, baffles, and D-box — because fixing a field without fixing the cause just repeats the failure. Photos and measurements at every step.' },
      { num: '02', title: 'Identify Failure Mode', description: 'We probe the field, measure saturation depth, and determine whether failure is due to compaction, root intrusion, biomat saturation, or upstream debris. Different causes mean different repair strategies.' },
      { num: '03', title: 'Repair Strategy', description: 'We present options: jetting to remove biomat and roots ($400–$1,200), D-box replacement ($800–$2,000), partial trench replacement ($2,000–$5,000), or full rehabilitation ($4,000–$10,000). We recommend the least-invasive approach that restores function.' },
      { num: '04', title: 'Execute & Restore', description: 'Depending on scope, work may include excavating trenches, installing new distribution piping, replacing gravel, installing filter fabric, or restoring the D-box. All DHEC permit requirements are handled.' },
      { num: '05', title: 'Test & Monitor', description: 'After repairs, we run water through the system and verify absorption is happening. For severe cases, we schedule a 30-day follow-up to confirm the repair held and the field is functioning normally.' },
    ],
    faq: [
      { q: 'Is my field really dead, or can it be saved?', a: 'Depends on the cause. Compaction and biomat issues often respond to aeration and jetting. Root intrusion can be cleared if the piping isn\'t broken. Age-related end-of-life can\'t be reversed. Diagnosis tells us which camp you\'re in before spending money on a repair that won\'t work.' },
      { q: 'How long does a repair last?', a: 'Quality jetting can add 5–10 years to a field that\'s clogging but still structurally sound. D-box replacement effectively restores a field indefinitely if that was the only issue. Partial trench replacement is equivalent to a 20+ year fix for the affected section.' },
      { q: 'What\'s the difference between repair and replacement?', a: 'Repair addresses specific failed components or clogs. Replacement removes the entire old field and installs a new one — which requires DHEC permit, soil retest, and often relocation to a new area of the yard. Repair is 20–60% of replacement cost.' },
      { q: 'Can I use the system during repairs?', a: 'Mostly yes, with restricted use. We\'ll tell you to minimize water use during the repair and for a week or two afterward while the field stabilizes. Plan accordingly — run dishwasher and laundry at a cousin\'s house if you can.' },
      { q: 'What if the repair doesn\'t work?', a: 'We stand behind our diagnoses. If we recommend and perform a repair that doesn\'t solve the problem, we credit the repair cost toward full replacement. The only way to know definitively is to try — but we only try when we believe there\'s a realistic chance.' },
    ],
    costData: [
      { item: 'Distribution Box Replacement', cost: '$800–$2,000', lifespan: '20–30 years' },
      { item: 'Line Jetting & Root Removal', cost: '$400–$1,200', lifespan: '5–10 years' },
      { item: 'Partial Trench Replacement', cost: '$2,000–$5,000', lifespan: '20–30 years' },
      { item: 'Full Field Rehabilitation', cost: '$4,000–$10,000', lifespan: '15–25 years' },
      { item: 'Effluent Filter Upgrade', cost: '$150–$350', lifespan: '15–20 years' },
    ],
    seoKeywords: ['drain field repair Greenville SC', 'leach field repair Upstate SC', 'septic drain field failing', 'septic field jetting SC'],
  },

  // ═══ 6. FULL SYSTEM REPLACEMENT ═══
  {
    id: 'system-replacement',
    slug: 'system-replacement',
    title: 'System Replacement',
    tagline: 'When Repair Doesn\'t Make Sense — A Full New System',
    heroDescription: 'Some systems are beyond repair: rusted-through steel tanks, collapsed drain fields, repeated failures despite maintenance. Full replacement is a major investment but the right move when the math doesn\'t favor repeated repairs. RO handles permitting, demolition, design, and installation — so you go from a failing system to a fresh 30-year asset in 2–3 weeks.',
    heroImage: '/images/services/septic/subs/system-replacement-hero.jpg',
    cardImage: '/images/services/septic/subs/system-replacement-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/system-replacement-hero.jpg',
      '/images/services/septic/subs/tank-removal.jpg',
      '/images/services/septic/subs/new-tank-setting.jpg',
      '/images/services/septic/subs/new-drain-field.jpg',
      '/images/services/septic/subs/excavation-wide.jpg',
      '/images/services/septic/subs/finished-installation.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Full replacement removes the existing tank, distribution box, and drain field, and installs entirely new components. This is required when the tank has structurally failed (rusted-through steel, shattered concrete), when the drain field has reached end of life, or when repeated repairs haven\'t restored function. New systems are installed to current code with modern materials, typically lasting 25–40 years.',
      },
      {
        heading: 'When You Need It',
        content: 'Repair vs. replace is a math problem. If the combined cost of realistic repairs is >50% of replacement, replacement usually wins — you avoid paying repair costs on something that may fail again. Age is another factor: systems over 30 years old often have multiple failure points, making piecewise repair costly. Failed DHEC inspections during real estate transactions often force replacement.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Full gravity-flow replacement for a 3–4 bedroom home in Upstate SC runs $7,000–$15,000, including demolition of old system, DHEC permit, soil retest if required, new tank, new drain field, and final inspection. Sites requiring engineered systems (mound, aerobic, pump-fed) run $15,000–$25,000. Timeline: 2–3 weeks total — 1–2 weeks for permitting, 3–7 days for installation, 1–2 days for inspection and backfill.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Many Upstate SC homes built in the 1960s–80s have original septic systems reaching end of life simultaneously. Replacing rather than repeatedly repairing gets you decades of trouble-free service. It also protects property value — homes with documented new systems sell more easily and at higher prices than homes with "we keep fixing it" systems.',
      },
    ],
    warningSigns: [
      { trigger: 'You\'ve had 2+ repairs in the last 5 years', detail: 'Systems that need repeated intervention are telling you they\'re near end of life. Continuing to repair is pouring money into something that will eventually require replacement anyway. Do the math.' },
      { trigger: 'Tank is steel or has cracked concrete walls', detail: 'Steel tanks installed before the 1980s are almost universally rusted through. Cracked concrete tanks leak effluent into groundwater and pull groundwater in. Neither can be reliably repaired — replacement is the answer.' },
      { trigger: 'Drain field has failed despite maintenance', detail: 'If you\'ve pumped on schedule, installed effluent filters, and still see field failure, the field itself has reached end of life. Biomat saturation, soil exhaustion, or original installation errors can\'t be repaired — only replaced.' },
      { trigger: 'Multiple components need repair at once', detail: 'When we find a failed baffle, a cracked D-box, and a marginal drain field during the same inspection, piecewise repair rarely makes sense. Replacement gives you a coherent new system instead of a patched-together old one.' },
      { trigger: 'System failed DHEC inspection for real estate sale', detail: 'A failed inspection blocks most home sales. Replacement typically must happen before closing, either paid by seller or negotiated into the price. Don\'t let a failed inspection turn into a $20,000 surprise mid-closing.' },
      { trigger: 'You\'re adding bedrooms or a guesthouse', detail: 'DHEC sizes systems by bedroom count. Adding a bedroom or accessory dwelling may require replacement (or supplementation) with a larger system. Plan this before starting construction.' },
    ],
    maintenanceTips: [
      { tip: 'Protect the new system during construction', detail: 'If replacement is part of a larger project, make sure other trades aren\'t driving over the new field or dumping materials on it. Damage to a brand-new field voids warranty and starts the clock over.' },
      { tip: 'Get the as-built drawing on file', detail: 'Your installer provides a dimensioned drawing of the new system. Keep copies with your deed. This prevents future homeowners or contractors from damaging components they didn\'t know existed.' },
      { tip: 'Pump at 3 years for a baseline', detail: 'New tanks get pumped at the 3-year mark. This establishes your household\'s actual sludge accumulation rate, which sets your ongoing pumping schedule more accurately than the generic "every 3–5 years" rule.' },
      { tip: 'Install access risers during replacement', detail: 'A brand-new install is the perfect time to add risers. Adds maybe $200 to the project cost, saves $100+ on every future pumping for 30+ years. Easy math.' },
      { tip: 'Keep warranty documentation', detail: 'New systems come with tank warranties (often 20+ years from the manufacturer) and installation warranties (1–5 years from the installer). Keep these documents — they\'re useful if problems arise.' },
    ],
    processSteps: [
      { num: '01', title: 'Replacement Assessment', description: 'We confirm replacement is actually the right call by reviewing all repair options and cost-of-repair vs. replacement. If repair can realistically add 10+ years, we\'ll say so. If not, we move to design.' },
      { num: '02', title: 'Design & Permit', description: 'Depending on age of records, a new soil test may be required. We design a system appropriate to your site, current code, and your home\'s bedroom count, then submit to DHEC. Permit issuance: 1–3 weeks.' },
      { num: '03', title: 'Demolition & Removal', description: 'The old tank is pumped, then excavated and removed. The old drain field is excavated or capped and abandoned in place per DHEC rules. Old materials are hauled and disposed properly.' },
      { num: '04', title: 'New System Install', description: 'New tank is set on a level gravel bed. New drain field trenches are dug, new pipe and gravel laid, new D-box set and connected. All connections are pressure-tested before any backfill.' },
      { num: '05', title: 'Inspection & Restoration', description: 'DHEC inspector verifies every component meets permit specs. Once passed, we backfill carefully, grade the site, and seed grass. You get final inspection documents, warranty paperwork, and an as-built drawing.' },
    ],
    faq: [
      { q: 'Do I have to put the new system in the same spot?', a: 'Sometimes yes, sometimes no — depends on what caused the old failure and what DHEC approves. If the old location failed because of soil exhaustion, we\'ll need a new location. If the location is fine and the old system just wore out, we can reuse it.' },
      { q: 'How much yard damage will there be?', a: 'Significant during installation — tank excavation requires a 15×15 area dug 6+ feet deep, drain field requires 200–400 feet of trench. After installation, we restore grading and seed grass. Full visual recovery takes one growing season.' },
      { q: 'Can my existing plumbing be reused?', a: 'Usually yes. The main sewer line from the house to the tank often survives because it\'s only one pipe. Internal house plumbing is unaffected. We verify the line is intact before connecting the new tank.' },
      { q: 'Will replacement increase my property value?', a: 'Yes, demonstrably. Homes with new septic systems sell faster and at higher prices than homes with older or failing systems. For homes purchased to flip or sell soon, a new system is often a positive ROI.' },
      { q: 'What if you find bedrock or high water table during excavation?', a: 'We stop and redesign. Bedrock or high water table often means an engineered alternative system (mound, aerobic) is needed instead of gravity-flow. We adjust the design and resubmit to DHEC. This can add 1–2 weeks and $5,000–$10,000 — we\'ll be upfront as soon as we know.' },
    ],
    costData: [
      { item: 'Full Gravity Replacement (3–4 BR)', cost: '$7,000–$15,000', lifespan: '25–40 years' },
      { item: 'Demolition & Old System Removal', cost: '$1,500–$4,000', lifespan: '1-time' },
      { item: 'Engineered Replacement System', cost: '$15,000–$25,000', lifespan: '20–35 years' },
      { item: 'Site Restoration & Seeding', cost: '$500–$1,500', lifespan: '1-time' },
      { item: 'Upgrade to 5-BR System', cost: '$2,000–$4,000 add-on', lifespan: '25–40 years' },
    ],
    seoKeywords: ['septic replacement Greenville SC', 'septic system replacement Upstate SC', 'new septic system install', 'replace old septic tank SC'],
  },

  // ═══ 7. SEWER LINE CLEANING ═══
  {
    id: 'line-cleaning',
    slug: 'line-cleaning',
    title: 'Sewer Line Cleaning',
    tagline: 'Clear the Line from House to Tank — Before It Clears Itself',
    heroDescription: 'The sewer line between your house and septic tank is a common failure point — roots push through joints, grease builds up, and pipes sag over decades. When the line restricts, everything in the house slows or backs up. RO uses high-pressure jetting and camera inspection to clear blockages, diagnose the root cause, and recommend targeted repair where needed.',
    heroImage: '/images/services/septic/subs/line-cleaning-hero.jpg',
    cardImage: '/images/services/septic/subs/line-cleaning-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/line-cleaning-hero.jpg',
      '/images/services/septic/subs/jetting-hose.jpg',
      '/images/services/septic/subs/camera-line.jpg',
      '/images/services/septic/subs/roots-pipe.jpg',
      '/images/services/septic/subs/cleanout.jpg',
      '/images/services/septic/subs/clear-pipe.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Sewer line cleaning uses high-pressure water (hydro-jetting) or mechanical augers to clear blockages in the line running from your house to the septic tank. Modern jetters deliver 3,000–4,000 PSI water that slices through roots, dissolves grease, and flushes debris — leaving the pipe wall cleaner than snaking would. Camera inspection verifies the line is clear and identifies any damaged sections for repair.',
      },
      {
        heading: 'When You Need It',
        content: 'Sudden or gradual flow restrictions in the main sewer line are the trigger. Multiple fixtures running slow at once, gurgling toilets, or toilet overflow that isn\'t caused by a full tank all point to line issues. Homes with mature trees near the line, older clay or Orangeburg pipes, or known root problems benefit from preventive jetting every 1–3 years before symptoms start.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Standard hydro-jetting of a 100-foot sewer line runs $300–$700 in Upstate SC. Camera inspection add-on: $150–$300. Emergency same-day service during backups: $450–$900. Mechanical auger (cheaper, less thorough): $150–$400. Most jobs take 1–3 hours on site. If camera inspection reveals damage, repair is a separate service.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Many Upstate SC sewer lines from the 1960s–1980s are clay tile or Orangeburg (a tar-impregnated fiber pipe that fails catastrophically at 40–50 years). Root intrusion through aging joints is the #1 cause of backups in older homes. Jetting and camera inspection together are the cheapest way to stay ahead of line failures — and the best way to know whether you need repair or just cleaning.',
      },
    ],
    warningSigns: [
      { trigger: 'Multiple drains slow simultaneously', detail: 'If sinks, tubs, and toilets all slow at once, the restriction is downstream of all fixtures — almost always the main line. Single-fixture slowness is local; house-wide is the main line or tank.' },
      { trigger: 'Toilet overflows or backs up but the tank was recently pumped', detail: 'A pumped tank with continued backups means the line between house and tank is blocked. Jetting clears it; camera inspection confirms there\'s no structural damage.' },
      { trigger: 'Gurgling sounds from drains', detail: 'Air is being pulled back through traps because the line can\'t breathe. Happens when flow is restricted and water is backing up behind the blockage.' },
      { trigger: 'Sewage odors inside the house', detail: 'Odors indoors mean water isn\'t flowing away from fixtures fast enough — gases that should vent through the roof are escaping through traps that are drying out or being pushed dry by backpressure.' },
      { trigger: 'Tree roots visible in the yard along the sewer line path', detail: 'If you can see roots from mature trees anywhere near the line path, roots are almost certainly inside the line. Preventive jetting every 1–2 years is cheaper than waiting for a full blockage.' },
      { trigger: 'Previous sewer line repair', detail: 'Homes with partial line repairs often have continued issues as the unrepaired portion ages. Preventive inspections catch new failures early.' },
      { trigger: 'Home is over 40 years old with original sewer line', detail: 'Clay tile and Orangeburg pipes reach end of life around year 40–50. Any original line in this age range should be camera-inspected to assess condition.' },
    ],
    maintenanceTips: [
      { tip: 'Don\'t flush "flushable" wipes, cat litter, or feminine products', detail: 'Septic systems can\'t break these down. They catch on pipe imperfections and build blockages. Anything other than toilet paper and waste should go in the trash.' },
      { tip: 'Be careful with grease', detail: 'Cooking grease poured down the drain cools and solidifies in the line, catching other debris. Scrape into the trash, wipe pans with paper towel, and avoid large grease loads.' },
      { tip: 'Preventive jetting every 1–3 years for homes with trees', detail: 'If you have maples, willows, or large trees near the line, root intrusion is happening whether you see symptoms or not. A $500 preventive jetting every 2 years is cheaper than an emergency backup.' },
      { tip: 'Install a cleanout near the foundation', detail: 'An exterior cleanout ($300–$700 to install) gives us direct access to the main line without going through interior fixtures. Makes every future jetting 30–50% cheaper.' },
      { tip: 'Know your line type', detail: 'Modern PVC sewer lines can be jetted aggressively. Older clay or cast iron need gentler handling. Ask during your first jetting so we can set pressure appropriately for your pipe type.' },
    ],
    processSteps: [
      { num: '01', title: 'Diagnosis & Access', description: 'We identify where the blockage is by observing which fixtures drain and which don\'t, and whether the problem is at the house or the tank. We then access the line through an existing cleanout (preferred) or the tank inlet.' },
      { num: '02', title: 'Camera Inspection (Pre-Cleaning)', description: 'Before jetting, a camera run tells us what we\'re dealing with — roots, grease, solids, pipe damage, or sagging. This prevents aggressive jetting in a damaged section that might worsen the problem.' },
      { num: '03', title: 'Hydro-Jetting', description: 'We run a rotating jetter head through the line at appropriate pressure for the pipe type. Roots are sliced, grease dissolved, and debris flushed into the tank. Passes are repeated until the line is visibly clean.' },
      { num: '04', title: 'Camera Verification', description: 'Second camera run after jetting confirms the line is clear end-to-end. We mark any structural issues (cracks, sags, offsets) on a drawing for future attention — these are repair items, not cleaning items.' },
      { num: '05', title: 'Documentation & Prevention Plan', description: 'You get a video of the camera inspections, a written report, and a recommended interval for preventive jetting based on your pipe condition and root pressure. We track your history for long-term planning.' },
    ],
    faq: [
      { q: 'How is jetting different from snaking?', a: 'Snaking (mechanical auger) punches a hole through a blockage — it clears enough flow to work again but leaves the pipe walls coated. Jetting uses water pressure to scour the entire pipe diameter clean. Jetting typically lasts 3–5× longer before recurrence and is kinder to older pipes.' },
      { q: 'Will jetting damage my pipe?', a: 'Not at appropriate pressure. We match pressure to pipe material — lower for clay or older cast iron, higher for PVC. Camera inspection before jetting also catches any damage that might make jetting inappropriate. We don\'t jet pipes that are structurally compromised.' },
      { q: 'How do I know if I need jetting or full line replacement?', a: 'Camera inspection tells us. A line with root intrusion but intact pipe: jetting works and is appropriate. A line with cracks, collapsed sections, or major offsets: jetting clears it temporarily but won\'t last. We\'ll show you the video and explain.' },
      { q: 'Can I keep using the house during jetting?', a: 'Yes, though we\'ll ask you to minimize water use for the hour we\'re on site. After jetting is complete, normal use is fine immediately.' },
      { q: 'What if the blockage comes back in 3 months?', a: 'Fast recurrence means there\'s either severe root pressure or a structural issue jetting alone can\'t fix. We\'ll do a free camera follow-up to identify the cause and plan a permanent fix — often a short section of pipe replacement or a root-barrier treatment.' },
    ],
    costData: [
      { item: 'Standard Hydro-Jetting', cost: '$300–$700', lifespan: '2–5 years between cleanings' },
      { item: 'Camera Inspection', cost: '$150–$300', lifespan: '1-time (report and video)' },
      { item: 'Jetting + Camera Package', cost: '$400–$900', lifespan: '2–5 years between services' },
      { item: 'Emergency Same-Day Service', cost: '$450–$1,200', lifespan: '1-time' },
      { item: 'Cleanout Installation', cost: '$300–$700', lifespan: '30+ years' },
    ],
    seoKeywords: ['sewer line cleaning Greenville SC', 'hydro jetting septic line Upstate SC', 'septic line camera inspection', 'roots in sewer line SC'],
  },

  // ═══ 8. EMERGENCY SEPTIC SERVICE ═══
  {
    id: 'emergency-service',
    slug: 'emergency-service',
    title: 'Emergency Service',
    tagline: 'Same-Day Response When the System Fails',
    heroDescription: 'Septic emergencies don\'t wait for business hours — sewage backups, flooded drain fields, and tank overflows need immediate response to limit damage and protect your family. RO maintains emergency capacity for same-day pumping, diagnosis, and stabilization. We get your home functional fast, then plan the real repair.',
    heroImage: '/images/services/septic/subs/emergency-service-hero.jpg',
    cardImage: '/images/services/septic/subs/emergency-service-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/emergency-service-hero.jpg',
      '/images/services/septic/subs/emergency-pumping.jpg',
      '/images/services/septic/subs/backup-indoor.jpg',
      '/images/services/septic/subs/overflow-yard.jpg',
      '/images/services/septic/subs/technician-emergency.jpg',
      '/images/services/septic/subs/after-cleanup.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Emergency septic service addresses immediate failures — sewage backing up into the house, effluent flooding the yard, tank overflow, or complete drain blockage. Emergency response focuses on stopping damage first (immediate pumping, temporary bypass, diagnostics) and planning permanent repair second. Most emergencies can be stabilized within 2–4 hours of the call.',
      },
      {
        heading: 'When You Need It',
        content: 'Sewage backing into any drain or fixture. Toilet water rising instead of flushing. Effluent surfacing in the yard or around the tank. Standing water over the drain field during dry weather. Strong sewage odors indoors. Any of these is an emergency — continuing to use the house worsens the problem and creates health hazards. Stop running water and call immediately.',
      },
      {
        heading: 'Cost & Timeline',
        content: 'Emergency response typically runs $450–$1,500 for same-day arrival, diagnosis, and initial pumping or clearing. After-hours (nights, weekends, holidays) adds a $200–$400 premium. Permanent repairs are separate — we quote those once the emergency is stabilized. Typical emergency call: technician on site within 2–4 hours, stabilization within 1–3 hours of arrival, permanent fix scheduled within days.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC summer storms and winter freezes both trigger septic emergencies. Saturated ground prevents drain field absorption, and frozen lines block flow. We maintain 24/7 emergency response because the difference between calling at hour one vs. hour six is the difference between a $600 cleanup and a $6,000 remediation. Fast response limits damage — always.',
      },
    ],
    warningSigns: [
      { trigger: 'Sewage backing up into the house', detail: 'This is the most urgent emergency. Every additional minute of water use pushes more sewage into your home. Stop all water use — no flushing, no showers, no dishwasher — and call immediately.' },
      { trigger: 'Toilet water rising after flushing', detail: 'The main line is blocked downstream. One more flush may overflow. Turn off the water supply to the toilet (shutoff valve at the wall) and don\'t use any other fixtures until we arrive.' },
      { trigger: 'Standing sewage in the yard', detail: 'Effluent surfacing is a biological hazard — contains pathogens that can contaminate soil and groundwater. Keep pets and children away, and stay out of standing water yourself.' },
      { trigger: 'Flooded drain field', detail: 'After heavy rains, saturated drain fields can\'t accept tank effluent. Symptoms are soggy ground over the field and slow drains indoors. Emergency pumping buys time until the ground dries enough to accept normal flow again.' },
      { trigger: 'Septic alarm (for pump-fed systems)', detail: 'If you have an engineered system with a pump, an alarm means the tank is filling faster than it\'s pumping out. Could be a failed pump or a drain field unable to accept. Either way, it\'s urgent.' },
      { trigger: 'Strong sewage odor throughout the house', detail: 'Gases should vent through the roof — if they\'re inside, venting is failing because water isn\'t moving. Often precedes a full backup by hours. Don\'t wait for the backup.' },
    ],
    maintenanceTips: [
      { tip: 'Know your shutoff valves', detail: 'In an emergency, stopping water flow buys time. Know where your main water shutoff is (usually near the water meter) and where individual fixture shutoffs are (behind toilets, under sinks).' },
      { tip: 'Keep a list of emergency numbers', detail: 'RO\'s emergency line, your insurance carrier, and a remediation company (for sewage cleanup) should be on your fridge or in your phone. Finding them mid-crisis costs time.' },
      { tip: 'Know where your tank access is', detail: 'When we arrive at 11 PM, we need to find the tank fast. Mark it clearly, keep access clear, and make sure someone in the household knows where it is.' },
      { tip: 'Don\'t wait to call', detail: 'Septic problems rarely improve on their own — they progress from minor to major. Calling when the first symptom appears often means a $500 stabilization; waiting means a $3,000+ cleanup.' },
      { tip: 'Have a backup water plan', detail: 'If your tank is being pumped and the system is offline for repairs, having a bathroom alternative (neighbor, hotel, cousin) for 24 hours prevents adding to the problem.' },
    ],
    processSteps: [
      { num: '01', title: 'Emergency Call Intake', description: 'When you call, we ask focused questions: what\'s happening, how long, is water actively flowing. We dispatch immediately — usually on site within 2–4 hours during business hours, within 4 hours for after-hours calls.' },
      { num: '02', title: 'Arrival & Assessment', description: 'First priority: stop additional damage. If sewage is flowing into the house, we stop the source (usually pumping the tank to relieve pressure). Then we assess: is the tank full, the line blocked, the field failed, or multiple issues?' },
      { num: '03', title: 'Stabilization', description: 'Most emergencies stabilize with emergency pumping and line clearing. If the problem is deeper — collapsed drain field, tank failure — we install temporary measures to keep the household functional while we plan permanent repair.' },
      { num: '04', title: 'Diagnosis of Root Cause', description: 'Once stabilized, we diagnose what actually caused the emergency. Was it a long-overdue pumping? Failed component? Saturated field after rain? Knowing the cause is essential for preventing the next emergency.' },
      { num: '05', title: 'Permanent Repair Plan', description: 'You get a written scope and estimate for the permanent fix, usually scheduled within days. We don\'t pressure you to decide mid-crisis — once the emergency is handled, we can have the real conversation with clear heads.' },
    ],
    faq: [
      { q: 'How fast can you actually get here?', a: 'During business hours, usually 2–4 hours from your call. After-hours and weekends, 3–5 hours. We keep emergency capacity reserved — we don\'t stack jobs ahead of emergencies. If we can\'t make it in that timeframe, we tell you on the call so you can seek alternative help.' },
      { q: 'What should I do before you arrive?', a: 'Stop all water use. Don\'t flush toilets, run showers, or do laundry. If sewage is indoors, protect family and pets from contact with it. Clear the path to the tank if possible. Have a check or card ready — emergency work is typically payment at service.' },
      { q: 'Will insurance cover the emergency?', a: 'Usually not. Septic failures are considered maintenance, not covered events. However, some homeowner policies cover water damage inside the home from a backup — separate from the septic repair itself. Call your insurer; document everything with photos.' },
      { q: 'Can I just pump the tank myself to hold things over?', a: 'No — pumping requires a vacuum truck and DHEC-compliant waste disposal. Unpermitted dumping is a serious DHEC violation. If the tank is overflowing, stop using water and call.' },
      { q: 'What\'s the difference between emergency pumping and regular pumping?', a: 'Same work, different context. Emergency pumping costs more because we drop other work to respond, and may be after-hours. Once the crisis is stabilized, you can return to a normal pumping schedule.' },
    ],
    costData: [
      { item: 'Emergency Response + Diagnosis', cost: '$250–$500', lifespan: '1-time' },
      { item: 'Emergency Pumping', cost: '$450–$900', lifespan: '1-time (counts toward next regular pump)' },
      { item: 'After-Hours Premium', cost: '+$200–$400', lifespan: '1-time' },
      { item: 'Emergency Line Clearing', cost: '$450–$1,200', lifespan: '1-time' },
      { item: 'Full Emergency Service Call', cost: '$700–$2,500', lifespan: '1-time' },
    ],
    seoKeywords: ['emergency septic service Greenville SC', '24 hour septic pumping SC', 'septic backup emergency Upstate SC', 'septic overflow emergency SC'],
  },

];
