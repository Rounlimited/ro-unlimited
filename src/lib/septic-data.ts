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
    heroImage: '/images/services/septic/subs/vacuum-truck-hero.jpg',
    cardImage: '/images/services/septic/subs/vacuum-truck-card.jpg',
    galleryImages: [
      '/images/services/septic/subs/vacuum-truck-hero.jpg',
      '/images/services/septic/subs/septic-pump-truck.jpg',
      '/images/services/septic/subs/sewer-lid-grass.jpg',
      '/images/services/septic/subs/tanker-truck.jpg',
      '/images/services/septic/subs/septic-tank-set.jpg',
      '/images/services/septic/subs/access-lid-grass.jpg',
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
        heading: 'What Drives the Cost',
        content: 'Three things set the number on a pump-out: tank size, how far the truck has to drive to reach you, and how much digging it takes to get to the lid. A 1,000–1,500 gallon tank is the baseline. Step up to 2,000 gallons and you\'re paying for more volume hauled and more disposal at the treatment plant. If the lid is buried under a foot of sod, that\'s hand-digging before the hose ever comes off the truck — a riser to grade eliminates it permanently. Same-day response during an active backup costs more because we pull a truck off scheduled work to get there. The pumping itself takes 30–60 minutes on site.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC clay soils hold moisture longer than sandy soils, which means your drain field has less margin for error. Once solids reach the drain field, they clog the gravel bed and soil pores permanently — and at that point you\'re not buying a service call, you\'re buying a new drain field: a DHEC permit, an excavator, and days of equipment in your yard. Regular pumping is the best insurance you can buy against the most expensive septic failure mode. A pumping visit every four years is a rounding error next to one drain field replacement.',
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
      { tip: 'Install a riser to ground level', detail: 'If your access lid is buried, a plastic riser that extends to grade takes the dig-out labor off every future visit. It pays for itself in about one pumping, and it means nobody is probing your yard guessing where the lid sits.' },
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
      { q: 'Can I just pump every 10 years to save money?', a: 'No. Solids will overflow into the drain field long before year 10. A pump-out every four years is a maintenance line item — a truck, an hour, done. A drain field replacement is a permit, an excavator, and a week of your yard torn up, and stretching the interval is what moves you from the first to the second by year seven instead of year 25. We\'ve watched this math play out many times.' },
      { q: 'Does pumping kill the bacteria in my tank?', a: 'No. Pumping removes excess sludge and scum but leaves residual bacteria in the tank walls and pipes. A healthy bacterial colony rebuilds within days of pumping as new waste enters.' },
      { q: 'What if you find cracks in my tank during pumping?', a: 'We document with photos, explain the severity, and give you options. Small cracks above the water line can be monitored. Cracks at or below the water line mean groundwater is entering (or effluent is escaping) and the tank needs repair or replacement.' },
      { q: 'Do I need to be home during the pumping?', a: 'Not necessarily, but we recommend it the first time so you know where your tank is and what condition it\'s in. Subsequent visits can be unattended if the access is clearly marked.' },
    ],
    costData: [
      { item: 'Standard Pump (1,000–1,500 gal)', cost: 'Tank size, travel distance, and whether the lid is buried', lifespan: '3–5 years between pumps' },
      { item: 'Large Tank Pump (2,000 gal)', cost: 'More gallons hauled, more disposal at the treatment plant', lifespan: '3–5 years between pumps' },
      { item: 'Access Riser Installation', cost: 'Depth to the lid and the diameter you need over it', lifespan: '25+ years' },
      { item: 'Emergency Same-Day Pumping', cost: 'A truck pulled off booked work; nights and weekends more so', lifespan: 'One-time' },
      { item: 'Baffle/Filter Replacement', cost: 'Filter type, and whether the outlet tee goes with it', lifespan: '15–20 years' },
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
    heroImage: '/images/services/septic/subs/pipe-connection-closeup.jpg',
    cardImage: '/images/services/septic/subs/backhoe-field.jpg',
    galleryImages: [
      '/images/services/septic/subs/pipe-connection-closeup.jpg',
      '/images/services/septic/subs/pipe-install-crew.jpg',
      '/images/services/septic/subs/sewer-lid-grass.jpg',
      '/images/services/septic/subs/pipe-fittings-trench.jpg',
      '/images/services/septic/subs/pipe-on-soil.jpg',
      '/images/services/septic/subs/septic-tank-set.jpg',
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
        heading: 'Scope & Schedule',
        content: 'What you pay for here is depth of scope, not square footage. A visual inspection is one tech, a lid, and a flashlight — it catches the obvious failures and nothing else. A full inspection means pumping the tank so the walls, baffles, and tees can actually be seen, a camera run on the house-to-tank line, and a load test with water actually running through the house. That\'s a different truck, a different crew, and 2–4 hours on site instead of thirty minutes. Real estate inspections add DHEC-compatible documentation and a turnaround your closing date dictates. Written report lands within 48 hours either way — order it early in your due diligence window, not on the last day of it.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'South Carolina DHEC requires permitted septic systems but doesn\'t mandate regular inspections. That means failed or marginal systems often aren\'t discovered until they back up — which can happen years after a home is sold. Upstate SC\'s clay-heavy soils mean drain fields fail sooner than in sandy regions, and many rural properties have older systems approaching end-of-life. An inspection today can keep a buyer from inheriting a full system replacement three months after closing — a job nobody escrowed for and no insurance policy covers.',
      },
    ],
    warningSigns: [
      { trigger: 'You\'re buying a home with septic and the seller says "it works fine"', detail: '"Works fine" is not a diagnosis. It means water goes down. A failing system can still pass water until it doesn\'t — and then you own the problem. Get an independent inspection every time.' },
      { trigger: 'No pumping records for the last 5+ years', detail: 'If the seller can\'t produce records, assume the system hasn\'t been maintained. An inspection reveals whether sludge depth is dangerous and whether damage has already occurred.' },
      { trigger: 'The system is over 20 years old', detail: 'Average septic system lifespan is 25–40 years. Tanks older than 20 years warrant inspection to check for cracks, root intrusion, and baffle deterioration before problems escalate.' },
      { trigger: 'Unknown system location or age', detail: 'Rural properties sometimes have systems the current owner never located. A professional inspection finds the tank, assesses its age, and determines whether it\'s still on a permit (required for some transactions).' },
      { trigger: 'Visible signs: odors, soft ground, slow drains', detail: 'Any visible symptom means an inspection is overdue. Catching a failing system before complete failure usually means a targeted repair — a D-box, a baffle, one trench — instead of a permit, an excavator, and a whole new field.' },
      { trigger: 'Recent heavy construction or landscaping over the system', detail: 'Driving heavy equipment, adding fill dirt, or installing pools, decks, or driveways over a system can crack tanks and compress drain fields. Inspection confirms whether damage occurred.' },
    ],
    maintenanceTips: [
      { tip: 'Schedule a baseline inspection at 5 years', detail: 'Even with regular pumping, an inspection every 5–10 years catches slow-developing problems: root intrusion, baffle deterioration, early drain field saturation. Caught at that stage they\'re repairs. Left alone they become replacements.' },
      { tip: 'Keep inspection reports with property records', detail: 'When you eventually sell, a history of documented inspections dramatically speeds up the buyer\'s due diligence and can prevent price renegotiation.' },
      { tip: 'Re-inspect after major events', detail: 'Hurricane flooding, major construction, tree removal near the system, or extended vacancy can all affect system function. A check-up afterward confirms nothing cracked, shifted, or got compacted while you weren\'t watching.' },
      { tip: 'Ask about camera scoping', detail: 'Modern inspections can include a camera inspection of the main sewer line from house to tank. This catches root intrusion, sags, and cracks that pumping alone won\'t reveal.' },
      { tip: 'Don\'t skip the drain field portion', detail: 'The fast version of an inspection only looks at the tank. A complete one includes visual assessment of the drain field, probing for wet spots, and running water to observe the absorption rate — which is where the expensive failures actually live.' },
    ],
    processSteps: [
      { num: '01', title: 'Record Review & Location', description: 'We pull DHEC records when available, interview the homeowner about maintenance history, and locate the tank using records, probes, or electronic locators. Every component is noted on a site diagram.' },
      { num: '02', title: 'Tank Assessment', description: 'We open the tank, measure sludge and scum, and inspect baffles. If the tank is due for pumping, we coordinate that first so we can actually see the tank walls, inlet and outlet tees, and identify cracks or damage.' },
      { num: '03', title: 'Flow & Load Test', description: 'We run water through the house — sinks, tubs, washing machine — for 15–30 minutes while watching effluent flow through the distribution box (if accessible) and observing drain field absorption. This catches restrictions pumping alone won\'t show.' },
      { num: '04', title: 'Drain Field Survey', description: 'We walk the drain field looking for wet spots, odors, depressions, or unusually green vegetation. Where practical, we probe the soil to confirm absorption is happening below the surface, not above.' },
      { num: '05', title: 'Written Report', description: 'You receive a detailed written report with photos, sludge/scum measurements, component condition, and a specific remaining-life estimate. For real estate transactions, we provide DHEC-compatible documentation.' },
    ],
    faq: [
      { q: 'Do I need an inspection if I\'m not buying or selling?', a: 'Not required by law, but strongly recommended every 5–10 years. Inspections catch problems while they\'re still repairs. We regularly meet homeowners replacing an entire system that an inspection three years earlier would have caught as a failed baffle and a field that was only starting to clog — same house, completely different scope of work.' },
      { q: 'What happens if the inspection fails?', a: 'Depends on what failed. A marginal drain field might need a D-box, a jetting, or one trench rebuilt. A dead system needs full replacement — permit, soil retest, excavation. For home purchases, a failed inspection is leverage for a price reduction or for the seller to repair before closing. Either way you get a written scope and a number built from what we actually found in your tank, not a rate card.' },
      { q: 'Can I skip pumping during the inspection to save money?', a: 'You can, but then the inspection is mostly guesswork. Without an empty tank, we can\'t see the walls, baffles, or measure real sludge levels. We recommend combining pumping and inspection — saves a service visit and gives a real picture.' },
      { q: 'Does my homeowner\'s insurance cover septic failures?', a: 'Almost never. Septic is classified as maintenance, not sudden damage. That\'s why inspections matter — you can\'t file an insurance claim for a system that quietly failed over 10 years.' },
      { q: 'Is DHEC approval required for new owners?', a: 'SC doesn\'t require a transfer approval for existing systems, but any repairs or replacement must go through DHEC permitting. An inspection establishes the baseline the new owner inherits.' },
    ],
    costData: [
      { item: 'Basic Visual Inspection', cost: 'One tech, one lid, no pump truck — scope is the whole story', lifespan: '1-time (valid 90 days)' },
      { item: 'Full Inspection with Pumping', cost: 'Tank size sets the pump-out; the load test adds the hours', lifespan: '1-time (valid 1 year)' },
      { item: 'Real Estate Transaction Inspection', cost: 'DHEC-ready paperwork on a turnaround your closing date sets', lifespan: '1-time (valid 90 days)' },
      { item: 'Camera Line Scope Add-On', cost: 'Footage scoped, pipe material, and whether a cleanout exists', lifespan: '1-time' },
      { item: 'Dye Test (drain field absorption)', cost: 'Field size and how many hours of water it takes to load it', lifespan: '1-time' },
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
    heroImage: '/images/services/septic/subs/excavator-site.jpg',
    cardImage: '/images/services/septic/subs/backhoe-field.jpg',
    galleryImages: [
      '/images/services/septic/subs/excavator-site.jpg',
      '/images/services/septic/subs/pvc-pipe-bundles.jpg',
      '/images/services/septic/subs/underslab-rough-in.jpg',
      '/images/services/septic/subs/pipe-fittings-trench.jpg',
      '/images/services/septic/subs/pipe-on-soil.jpg',
      '/images/services/septic/subs/backhoe-backfill.jpg',
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
        heading: 'Planning It Out',
        content: 'The soil report writes most of this estimate before we do. A gravity-flow system on well-draining piedmont soil for a 3–4 bedroom home is the baseline scope: soil test, permit, tank, drain field, labor. Everything above that is the site talking — a slow perc rate in clay, a water table sitting high, rock close to grade, or a lot too tight to hold the required reserve area all push you toward an engineered design (sand filter, mound bed, aerobic treatment) with imported material, a pump, and power run to it. Bedroom count sets tank size and linear feet of field, so a fifth bedroom is not a rounding adjustment. Timeline: soil test and permitting 1–3 weeks, installation 2–5 days, DHEC inspection and backfill 1–2 more days — 2–4 weeks start to finish, longer when the spring permit queue backs up.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC has a wide range of soil conditions — sandy piedmont, clay-heavy bottomland, shallow bedrock near foothills. A cookie-cutter system that works on one lot may fail on the next. Getting the right system designed for your specific site is the single biggest factor in longevity. Shortcuts taken at install show up five years later as drain field failure, and by then the fix is a permit and an excavator. RO does it right the first time.',
      },
    ],
    warningSigns: [
      { trigger: 'Your contractor doesn\'t mention a soil test', detail: 'DHEC requires a perc test (percolation test) before any new system permit. If the contractor is quoting without a soil evaluation, they\'re either planning to skip it (illegal) or they haven\'t done this before.' },
      { trigger: 'The quote comes in far under everyone else\'s', detail: 'A number well below the rest almost always means something has been left out — a tank smaller than code requires, an undersized drain field, or no permit at all. Ask three questions: what tank size, how many linear feet of field, and what\'s the permit number. If those answers are missing, the quotes aren\'t comparable and you\'re not shopping the same job.' },
      { trigger: 'No permit number on the quote', detail: 'A legitimate installer will either have the permit in hand or include the permit fee and timeline in the quote. Work without a DHEC permit is illegal and will create problems at sale time.' },
      { trigger: 'You\'re told an "engineered system" isn\'t necessary on a difficult lot', detail: 'If your lot has clay soils, steep slope, shallow water table, or proximity to a stream, a simple gravity-flow system may not pass DHEC. An installer steering you away from an engineered design to save money is gambling with your long-term system health.' },
      { trigger: 'No written warranty', detail: 'Reputable installers warranty tank and drain field workmanship for at least 1 year, often 2–5 years. If warranty terms aren\'t written into the quote, they don\'t exist.' },
      { trigger: 'No plan for protecting the install site during construction', detail: 'Other trades driving heavy equipment over a new drain field will compact the soil and destroy absorption. The installer should mark the area and coordinate with the GC to protect it.' },
    ],
    maintenanceTips: [
      { tip: 'Document everything during install', detail: 'Photos of the tank setting, drain field layout, and distribution box location become invaluable 10 years later when you need to pump, repair, or sell. Keep copies with your property records.' },
      { tip: 'Mark tank access with a permanent riser', detail: 'Add a plastic riser that extends to grade while the hole is still open and the crew is still there — that\'s the least it will ever cost to install. It takes the dig-out off every future pumping and turns an inspection into a two-minute job instead of a treasure hunt.' },
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
      { q: 'What\'s the difference between a gravity system and an engineered system?', a: 'Gravity systems use natural soil slope to move effluent from tank to drain field — the simplest design, with no pump and nothing to fail electrically. Engineered systems use pumps, filters, or elevated beds to compensate for poor soil, high water tables, or steep terrain. They carry more material, a pump, an electrical connection, and maintenance you don\'t have with gravity — but on a difficult site they\'re the only design DHEC will permit.' },
      { q: 'Do I need a contractor for new construction septic?', a: 'Yes, and in SC it must be a licensed installer. DIY septic installation is illegal and will fail DHEC inspection, meaning you can\'t get a certificate of occupancy on the house.' },
      { q: 'How big a tank and drain field do I need?', a: 'Determined by number of bedrooms (DHEC uses bedrooms as a proxy for occupancy). 3-bedroom: 1,000-gallon tank, ~300 ft drain field. 4-bedroom: 1,250-gallon tank, ~400 ft field. 5-bedroom: 1,500-gallon tank, ~500 ft field. Soil conditions can increase these numbers.' },
    ],
    costData: [
      { item: 'Standard 3–4 BR Gravity System', cost: 'Bedroom count sets the tank; perc rate sets the field length', lifespan: '25–40 years' },
      { item: 'Soil Test & Permit', cost: 'Number of test pits, site access, and the current DHEC queue', lifespan: '1-time' },
      { item: 'Engineered Mound System', cost: 'Imported sand by the truckload, a pump, and power run to it', lifespan: '20–35 years' },
      { item: 'Aerobic Treatment System', cost: 'Aerator, control panel, electrical, and a service contract after', lifespan: '15–25 years' },
      { item: 'Pump Station (if needed)', cost: 'Vertical lift to the field and how far the effluent travels', lifespan: '10–15 years' },
    ],
    seoKeywords: ['new septic installation Greenville SC', 'septic system installer Upstate SC', 'DHEC permit septic install', 'new construction septic SC'],
  },

  // ═══ 4. SEPTIC TANK REPAIR ═══
  {
    id: 'septic-repair',
    slug: 'septic-repair',
    title: 'Septic Tank Repair',
    tagline: 'Fix It Right — Or Pay to Replace It Later',
    heroDescription: 'Septic tanks don\'t fail all at once. Baffles deteriorate, lids crack, inlet and outlet pipes shift, and small cracks let groundwater in. Caught early, most of it is a couple of hours through the open lid. Ignored, the same failure feeds solids into the drain field and turns into a full system replacement. RO diagnoses and repairs tank-level issues before they cascade.',
    heroImage: '/images/services/septic/subs/pipe-repair-trench.jpg',
    cardImage: '/images/services/septic/subs/pipe-connection-closeup.jpg',
    galleryImages: [
      '/images/services/septic/subs/pipe-repair-trench.jpg',
      '/images/services/septic/subs/jetting-crew.jpg',
      '/images/services/septic/subs/sewer-lateral-cleanout.jpg',
      '/images/services/septic/subs/sewer-lid-grass.jpg',
      '/images/services/septic/subs/access-lid-grass.jpg',
      '/images/services/septic/subs/pipe-fittings-trench.jpg',
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
        heading: 'What It Takes',
        content: 'Tank repairs are light on parts and heavy on access — that\'s where the money goes. Swapping a baffle or dropping in an effluent filter happens through the open lid in a couple of hours; that\'s the easy end. What adds scope is digging: a buried lid, a tank set deep, or a repair that requires exposing the tank wall or the inlet line means an excavator, spoil piles, and restoration afterward. Crack sealing sits at the top because the tank has to be pumped, dried out, patched, and then cured before anyone flushes a toilet — so plan around a day the house can run light on water. Most repairs are done in 2–6 hours. Anything needing the machine is a full day.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC has many 30-plus-year-old concrete tanks where the baffles have failed. Once baffles are gone, scum and solids flow straight into the drain field and clog it within months. A baffle is a length of PVC and an afternoon. The field it protects is a DHEC permit, an excavator, and a week. Unseen tank cracks do the same damage from the other direction — thousands of gallons of groundwater leaking in every year, overloading the field no matter how well you maintain everything else.',
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
      { tip: 'Replace concrete baffles with PVC', detail: 'If you\'re repairing a baffle, use PVC instead of concrete. PVC won\'t rot, rust, or crumble. The material is a wash on price; the lifespan isn\'t — 40-plus years for PVC against roughly 20 for concrete.' },
      { tip: 'Add an effluent filter if your tank doesn\'t have one', detail: 'Newer installations include a filter on the outlet baffle; older tanks don\'t. It catches the residual solids that slip past the baffle — the smallest part in the whole system with the biggest effect on how long your drain field lasts.' },
      { tip: 'Install risers instead of digging to lids', detail: 'Every time you dig up a buried lid you risk cracking it or breaking the seal. A one-time riser install ends the digging permanently and removes that labor from every service call after it.' },
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
      { q: 'Can I repair my own baffle?', a: 'Not recommended. It requires working in a confined space with hazardous gases (hydrogen sulfide, methane) and proper fittings. One-person DIY has resulted in fatalities nationally. Done professionally it\'s usually a same-visit item through the open lid, with two people on site and the gas monitored.' },
      { q: 'How do I know if my tank has cracks?', a: 'After pumping, the tank should hold water at the outlet level. If the level drops over a few hours, it\'s leaking. If it rises, groundwater is entering. Either way, the tank has integrity issues requiring repair.' },
      { q: 'What if my tank is steel and rusted out?', a: 'Steel tanks were common in the 1960s–70s and most have rusted through by now. Repair is usually not cost-effective — the whole tank needs replacement with concrete or plastic. We\'ll give you the math when we assess.' },
      { q: 'Will a repair restore a failing drain field?', a: 'Often yes — if the drain field was damaged by a failed baffle (solids flowing through), stopping the flow of solids and pumping regularly can let the drain field recover over 6–18 months. If damage is severe, repair alone won\'t fix it and field work is also needed.' },
      { q: 'How long do repairs last?', a: 'Depends on what\'s repaired. PVC baffles: 40+ years. Concrete crack sealing: 10–20 years. Effluent filters: 15–20 years before replacement. Lid and riser: 25+ years. We track repair dates in our records so we can help you plan long-term.' },
    ],
    costData: [
      { item: 'Baffle Replacement (PVC)', cost: 'Reachable through the lid, or does the inlet have to be exposed', lifespan: '40+ years' },
      { item: 'Lid Replacement', cost: 'Lid diameter and weight, plus how deep it\'s buried', lifespan: '25–40 years' },
      { item: 'Effluent Filter Install', cost: 'Outlet tee condition and whether a housing has to be added', lifespan: '15–20 years' },
      { item: 'Inlet/Outlet Pipe Repair', cost: 'Excavation depth, pipe material, and how close the run is to the house', lifespan: '20–30 years' },
      { item: 'Concrete Crack Sealing', cost: 'Crack location, pump-out and dry time, then cure before use', lifespan: '10–20 years' },
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
    heroImage: '/images/services/septic/subs/skid-steer-field.jpg',
    cardImage: '/images/services/septic/subs/hand-digging-trench.jpg',
    galleryImages: [
      '/images/services/septic/subs/skid-steer-field.jpg',
      '/images/services/septic/subs/hand-digging-trench.jpg',
      '/images/services/septic/subs/pipe-fittings-trench.jpg',
      '/images/services/septic/subs/drain-rock.jpg',
      '/images/services/septic/subs/pipe-repair-trench.jpg',
      '/images/services/septic/subs/saturated-ground.jpg',
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
        heading: 'Cost Drivers',
        content: 'The diagnosis decides this one, not the size of your yard. Clearing a cracked D-box or jetting biomat and roots out of the laterals is a hose, a machine, and a day. Rebuilding a trench means excavation, hauling out saturated gravel, new pipe and stone, and a DHEC permit before anyone digs. Full rehabilitation — aerating soil, replacing gravel and fabric across the field — is days of equipment and a lot of material moved twice. Access is its own line: a field behind a fence, down a slope, or on the far side of a septic-safe route the truck can\'t take adds hours before a single repair happens. Repairs run 1–4 days. Full replacement is 5–10 days and restarts the permit clock. Our diagnosis tells you which path you\'re on before you commit to anything.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC clay soils are marginal for drain fields even when perfectly designed. Once compacted by construction traffic, landscaping equipment, or vehicle use, clay loses most of its absorption capacity. We see fields written off as "failed" when the real problem was a clogged effluent filter upstream or a cracked D-box. Fixing the actual cause is a service call and a part. Replacing the field is a permit, a soil retest, and heavy equipment across your yard for a week — so it\'s worth finding out which one you have.',
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
      { tip: 'Install an effluent filter at the tank outlet', detail: 'A filter catches residual solids before they ever reach the field. On an older tank that never had one, it\'s the highest-leverage thing you can do for field life — a small part protecting the most expensive component you own.' },
    ],
    processSteps: [
      { num: '01', title: 'Full System Diagnosis', description: 'Drain field problems are often caused by upstream issues. We start by inspecting the tank, baffles, and D-box — because fixing a field without fixing the cause just repeats the failure. Photos and measurements at every step.' },
      { num: '02', title: 'Identify Failure Mode', description: 'We probe the field, measure saturation depth, and determine whether failure is due to compaction, root intrusion, biomat saturation, or upstream debris. Different causes mean different repair strategies.' },
      { num: '03', title: 'Repair Strategy', description: 'We lay out the options in order of how invasive they are: jetting to remove biomat and roots, D-box replacement, partial trench replacement, or full rehabilitation with new gravel and fabric. Each comes with a written scope and a number built from what we found in your field — not off a rate card. We recommend the least-invasive approach that restores function.' },
      { num: '04', title: 'Execute & Restore', description: 'Depending on scope, work may include excavating trenches, installing new distribution piping, replacing gravel, installing filter fabric, or restoring the D-box. All DHEC permit requirements are handled.' },
      { num: '05', title: 'Test & Monitor', description: 'After repairs, we run water through the system and verify absorption is happening. For severe cases, we schedule a 30-day follow-up to confirm the repair held and the field is functioning normally.' },
    ],
    faq: [
      { q: 'Is my field really dead, or can it be saved?', a: 'Depends on the cause. Compaction and biomat issues often respond to aeration and jetting. Root intrusion can be cleared if the piping isn\'t broken. Age-related end-of-life can\'t be reversed. Diagnosis tells us which camp you\'re in before spending money on a repair that won\'t work.' },
      { q: 'How long does a repair last?', a: 'Quality jetting can add 5–10 years to a field that\'s clogging but still structurally sound. D-box replacement effectively restores a field indefinitely if that was the only issue. Partial trench replacement is equivalent to a 20+ year fix for the affected section.' },
      { q: 'What\'s the difference between repair and replacement?', a: 'Repair addresses specific failed components or clogs. Replacement removes the entire old field and installs a new one — which requires a DHEC permit, a soil retest, and often relocation to a fresh area of the yard. Repair keeps the field you already have and the permit you already hold. Replacement starts the whole approval process over.' },
      { q: 'Can I use the system during repairs?', a: 'Mostly yes, with restricted use. We\'ll tell you to minimize water use during the repair and for a week or two afterward while the field stabilizes. Plan accordingly — run dishwasher and laundry at a cousin\'s house if you can.' },
      { q: 'What if the repair doesn\'t work?', a: 'We stand behind our diagnoses. If we recommend and perform a repair that doesn\'t solve the problem, we credit the repair cost toward full replacement. The only way to know definitively is to try — but we only try when we believe there\'s a realistic chance.' },
    ],
    costData: [
      { item: 'Distribution Box Replacement', cost: 'How deep the box sits and how many laterals tie into it', lifespan: '20–30 years' },
      { item: 'Line Jetting & Root Removal', cost: 'Lateral footage, root load, and where the jetter truck can park', lifespan: '5–10 years' },
      { item: 'Partial Trench Replacement', cost: 'Trench length, hauling saturated spoil, and the DHEC permit', lifespan: '20–30 years' },
      { item: 'Full Field Rehabilitation', cost: 'Field size, gravel and fabric replaced, days of equipment on site', lifespan: '15–25 years' },
      { item: 'Effluent Filter Upgrade', cost: 'Filter size and whether the outlet tee will take a housing', lifespan: '15–20 years' },
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
    heroImage: '/images/services/septic/subs/backhoe-loading.jpg',
    cardImage: '/images/services/septic/subs/mini-excavator-demo.jpg',
    galleryImages: [
      '/images/services/septic/subs/backhoe-loading.jpg',
      '/images/services/septic/subs/septic-pump-truck.jpg',
      '/images/services/septic/subs/open-trench.jpg',
      '/images/services/septic/subs/excavator-site.jpg',
      '/images/services/septic/subs/excavation-site-wide.jpg',
      '/images/services/septic/subs/bedded-pipe-trench.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Full replacement removes the existing tank, distribution box, and drain field, and installs entirely new components. This is required when the tank has structurally failed (rusted-through steel, shattered concrete), when the drain field has reached end of life, or when repeated repairs haven\'t restored function. New systems are installed to current code with modern materials, typically lasting 25–40 years.',
      },
      {
        heading: 'When You Need It',
        content: 'Repair vs. replace is a math problem. Once the realistic repair list starts approaching what a whole new system costs, replacement usually wins — you stop paying to keep alive something that can fail again next season. Age is another factor: systems over 30 years old often have multiple failure points, making piecewise repair costly. Failed DHEC inspections during real estate transactions often force replacement.',
      },
      {
        heading: 'Budget & Schedule',
        content: 'A replacement is two jobs stacked on each other. First the old system comes out: pump the dead tank, excavate and haul it or crush and abandon it in place per DHEC rules, and get the old material off site — none of which exists on a new-construction install. From there the drivers are the same as any new system: bedroom count sets tank size and linear feet of field, and the soil report decides whether gravity flow still passes on that lot or whether you\'re into a mound, an aerobic unit, or a pump-fed design. If the original records are old enough, DHEC will want a fresh soil test, and that lands before anything else can move. Schedule: 1–2 weeks permitting, 3–7 days installing, 1–2 days for inspection and backfill — call it 2–3 weeks, longer in a wet season when the excavator can\'t get across the yard without doing damage.',
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
      { trigger: 'System failed DHEC inspection for real estate sale', detail: 'A failed inspection blocks most home sales. Replacement typically must happen before closing, either paid by the seller or negotiated into the price. Find out early — a failed inspection two weeks from closing becomes a scope nobody escrowed for and a permit clock nobody can speed up.' },
      { trigger: 'You\'re adding bedrooms or a guesthouse', detail: 'DHEC sizes systems by bedroom count. Adding a bedroom or accessory dwelling may require replacement (or supplementation) with a larger system. Plan this before starting construction.' },
    ],
    maintenanceTips: [
      { tip: 'Protect the new system during construction', detail: 'If replacement is part of a larger project, make sure other trades aren\'t driving over the new field or dumping materials on it. Damage to a brand-new field voids warranty and starts the clock over.' },
      { tip: 'Get the as-built drawing on file', detail: 'Your installer provides a dimensioned drawing of the new system. Keep copies with your deed. This prevents future homeowners or contractors from damaging components they didn\'t know existed.' },
      { tip: 'Pump at 3 years for a baseline', detail: 'New tanks get pumped at the 3-year mark. This establishes your household\'s actual sludge accumulation rate, which sets your ongoing pumping schedule more accurately than the generic "every 3–5 years" rule.' },
      { tip: 'Install access risers during replacement', detail: 'A brand-new install is the moment to add risers — the hole is open and the crew is already standing in it, so it barely moves the project. Then it takes the dig-out off every pumping for the next 30 years. Easy math.' },
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
      { q: 'What if you find bedrock or high water table during excavation?', a: 'We stop and redesign. Bedrock or high water table often means an engineered alternative system (mound, aerobic) is needed instead of gravity-flow. We adjust the design and resubmit to DHEC. That adds 1–2 weeks to the schedule and a materially different scope — a pump, an electrical run, imported media — and you hear it from us the day we hit it, not on the final invoice.' },
    ],
    costData: [
      { item: 'Full Gravity Replacement (3–4 BR)', cost: 'Bedroom count, the soil report, and how far the old system has to go', lifespan: '25–40 years' },
      { item: 'Demolition & Old System Removal', cost: 'Tank material and depth; hauled out or crushed in place', lifespan: '1-time' },
      { item: 'Engineered Replacement System', cost: 'Pump, control panel, power run, and imported sand or media', lifespan: '20–35 years' },
      { item: 'Site Restoration & Seeding', cost: 'Square footage torn up, slope, and what season you seed in', lifespan: '1-time' },
      { item: 'Upgrade to 5-BR System', cost: 'Bigger tank, more linear feet, and more reserve area to hold', lifespan: '25–40 years' },
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
    heroImage: '/images/services/septic/subs/vacuum-truck-crew.jpg',
    cardImage: '/images/services/septic/subs/line-cleaning-truck.jpg',
    galleryImages: [
      '/images/services/septic/subs/vacuum-truck-crew.jpg',
      '/images/services/septic/subs/jetting-crew.jpg',
      '/images/services/septic/subs/pvc-pipe-stock.jpg',
      '/images/services/septic/subs/pipe-repair-trench.jpg',
      '/images/services/septic/subs/access-lid-grass.jpg',
      '/images/services/septic/subs/hdpe-outfall.jpg',
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
        heading: 'What Moves the Number',
        content: 'Line length and access set the baseline. Jetting a 100-foot run through an existing exterior cleanout is straightforward. That same line with no cleanout means working back through the tank inlet or pulling a toilet, and that\'s time spent before the hose goes in. Pipe material changes the approach — clay and Orangeburg get lower pressure and more passes, PVC takes full pressure and fewer. A mechanical auger is the lighter option and leaves the pipe walls coated; jetting scours the full diameter and buys you far longer before it recurs. Camera work adds a run before and a run after. Same-day response during an active backup costs more because a truck comes off booked work to reach you. Most jobs are 1–3 hours on site. If the camera finds broken pipe, that repair is a separate scope on a separate day.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Many Upstate SC sewer lines from the 1960s–1980s are clay tile or Orangeburg (a tar-impregnated fiber pipe that fails catastrophically at 40–50 years). Root intrusion through aging joints is the number-one cause of backups in older homes. Jetting with a camera run is how you meet a line failure on your schedule instead of at 10 PM on a holiday — and it\'s the only way to know whether you need cleaning or a section of pipe replaced.',
      },
    ],
    warningSigns: [
      { trigger: 'Multiple drains slow simultaneously', detail: 'If sinks, tubs, and toilets all slow at once, the restriction is downstream of all fixtures — almost always the main line. Single-fixture slowness is local; house-wide is the main line or tank.' },
      { trigger: 'Toilet overflows or backs up but the tank was recently pumped', detail: 'A pumped tank with continued backups means the line between house and tank is blocked. Jetting clears it; camera inspection confirms there\'s no structural damage.' },
      { trigger: 'Gurgling sounds from drains', detail: 'Air is being pulled back through traps because the line can\'t breathe. Happens when flow is restricted and water is backing up behind the blockage.' },
      { trigger: 'Sewage odors inside the house', detail: 'Odors indoors mean water isn\'t flowing away from fixtures fast enough — gases that should vent through the roof are escaping through traps that are drying out or being pushed dry by backpressure.' },
      { trigger: 'Tree roots visible in the yard along the sewer line path', detail: 'If you can see roots from mature trees anywhere near the line path, roots are almost certainly inside the line. Preventive jetting every 1–2 years is a scheduled visit. A full blockage is an emergency call and whatever it puts on your floor.' },
      { trigger: 'Previous sewer line repair', detail: 'Homes with partial line repairs often have continued issues as the unrepaired portion ages. Preventive inspections catch new failures early.' },
      { trigger: 'Home is over 40 years old with original sewer line', detail: 'Clay tile and Orangeburg pipes reach end of life around year 40–50. Any original line in this age range should be camera-inspected to assess condition.' },
    ],
    maintenanceTips: [
      { tip: 'Don\'t flush "flushable" wipes, cat litter, or feminine products', detail: 'Septic systems can\'t break these down. They catch on pipe imperfections and build blockages. Anything other than toilet paper and waste should go in the trash.' },
      { tip: 'Be careful with grease', detail: 'Cooking grease poured down the drain cools and solidifies in the line, catching other debris. Scrape into the trash, wipe pans with paper towel, and avoid large grease loads.' },
      { tip: 'Preventive jetting every 1–3 years for homes with trees', detail: 'If you have maples, willows, or large trees near the line, root intrusion is happening whether you see symptoms or not. Jetting on a two-year cycle is scheduled work on a day you pick. An emergency backup is neither of those things.' },
      { tip: 'Install a cleanout near the foundation', detail: 'An exterior cleanout gives us direct access to the main line without coming through interior fixtures. It\'s a one-time install that shortens every future jetting and keeps the dirty end of the job outside your house.' },
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
      { item: 'Standard Hydro-Jetting', cost: 'Line length, pipe material, and whether a cleanout exists', lifespan: '2–5 years between cleanings' },
      { item: 'Camera Inspection', cost: 'Footage scoped and how much has to be cleared to see it', lifespan: '1-time (report and video)' },
      { item: 'Jetting + Camera Package', cost: 'One mobilization instead of two, same access questions', lifespan: '2–5 years between services' },
      { item: 'Emergency Same-Day Service', cost: 'Truck pulled off booked work; nights and weekends add more', lifespan: '1-time' },
      { item: 'Cleanout Installation', cost: 'Depth to the line, distance from the foundation, what\'s on top', lifespan: '30+ years' },
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
    heroImage: '/images/services/septic/subs/urgent-trench-dig.jpg',
    cardImage: '/images/services/septic/subs/excavator-lifting-structure.jpg',
    galleryImages: [
      '/images/services/septic/subs/urgent-trench-dig.jpg',
      '/images/services/septic/subs/vacuum-truck-crew.jpg',
      '/images/services/septic/subs/flood-pump-response.jpg',
      '/images/services/septic/subs/tanker-truck.jpg',
      '/images/services/septic/subs/pipe-install-crew.jpg',
      '/images/services/septic/subs/mini-excavator-site.jpg',
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
        heading: 'Response Time & What Drives It',
        content: 'An emergency call costs more than the same work booked in advance, for one honest reason: a truck and a crew come off scheduled jobs to reach you. Nights, weekends, and holidays add to that again. Past the response premium, the drivers are the ordinary ones — tank size for the pump-out, whether the lid has to be located and dug up in the dark, and whether you\'ve got a blocked line or a field that simply won\'t take water. What you\'re paying for on that first visit is stabilization, not the permanent fix; we scope and quote that after the crisis, when you can think straight. Typical call: tech on site within 2–4 hours, stabilized within 1–3 hours of arrival, permanent repair scheduled within days.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Upstate SC summer storms and winter freezes both trigger septic emergencies. Saturated ground stops drain field absorption, and frozen lines block flow. We keep 24/7 capacity because the gap between calling at hour one and hour six is the gap between pumping a tank and hiring a remediation crew to tear out flooring, baseboard, and drywall. Fast response limits damage — always.',
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
      { tip: 'Don\'t wait to call', detail: 'Septic problems rarely improve on their own — they progress from minor to major. Calling at the first symptom usually means a pump-out and a cleared line. Waiting until it\'s on the floor means a remediation crew, contaminated flooring, and a claim your insurer probably won\'t pay.' },
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
      { item: 'Emergency Response + Diagnosis', cost: 'Drive distance, time of day, and how fast you need us there', lifespan: '1-time' },
      { item: 'Emergency Pumping', cost: 'Tank size, finding and digging the lid in the dark', lifespan: '1-time (counts toward next regular pump)' },
      { item: 'After-Hours Premium', cost: 'Nights, weekends, holidays — a crew called in off schedule', lifespan: '1-time' },
      { item: 'Emergency Line Clearing', cost: 'Where the blockage sits, pipe material, and no cleanout to work from', lifespan: '1-time' },
      { item: 'Full Emergency Service Call', cost: 'How many failures stacked at once and hours to stabilize them', lifespan: '1-time' },
    ],
    seoKeywords: ['emergency septic service Greenville SC', '24 hour septic pumping SC', 'septic backup emergency Upstate SC', 'septic overflow emergency SC'],
  },

];
