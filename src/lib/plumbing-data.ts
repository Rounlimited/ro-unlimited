// ═══════════════════════════════════════════════════════════════
//  PLUMBING SUB-SERVICE DATA
//  8 detailed sub-service pages for /services/plumbing/[sub]
// ═══════════════════════════════════════════════════════════════

import type { SubService } from './sub-service-types';
export type PlumbingSubService = SubService;

export const PLUMBING_SUB_SERVICES: PlumbingSubService[] = [

  // ═══ 1. PIPE REPAIR & RE-PIPING ═══
  {
    id: 'pipe-repair-repiping',
    slug: 'pipe-repair-repiping',
    title: 'Pipe Repair & Re-Piping',
    tagline: 'Old Pipes Out. Reliable Flow In.',
    heroDescription: 'Galvanized steel corrodes from the inside. Polybutylene cracks without warning. If your home was built before 1990 and still has original supply lines, every day is borrowed time. RO\'s plumbing crew replaces failing pipe systems with modern copper or PEX — restoring full water pressure, eliminating rust-colored water, and ending the cycle of patch repairs.',
    heroImage: '/images/services/plumbing/subs/pipe-repair-hero.jpg',
    cardImage: '/images/services/plumbing/subs/pipe-repair-card.jpg',
    galleryImages: [
      '/images/services/plumbing/subs/pipe-repair-hero.jpg',
      '/images/services/plumbing/subs/copper-pipes.jpg',
      '/images/services/plumbing/subs/pipe-fitting.jpg',
      '/images/services/plumbing/subs/plumber-wrench.jpg',
      '/images/services/plumbing/subs/plumber-tools.jpg',
      '/images/services/plumbing/pipe-closeup.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Pipe repair fixes isolated failures — pinhole leaks, corroded fittings, frozen pipe damage. Re-piping replaces the entire supply line system throughout your home, from the main shutoff to every fixture. Modern re-pipes use either copper (the gold standard, 50+ year lifespan) or PEX (cross-linked polyethylene, flexible, freeze-resistant, 25–50 year lifespan). The choice depends on your budget, home layout, and local code requirements.',
      },
      {
        heading: 'When You Need It',
        content: 'Three pipe materials demand attention: Galvanized steel (pre-1960s) corrodes from the inside, building up scale that chokes water pressure and produces rust-colored water. Polybutylene (1978–1995, gray pipes) degrades from chlorine in municipal water and fails without warning — insurers often refuse coverage. Lead supply lines (pre-1950s) are a health hazard with no safe exposure level. If you have any of these, re-piping isn\'t optional.',
      },
      {
        heading: 'What Drives the Scope',
        content: 'Repair or re-pipe is the first fork, and how many failures you have already had decides it more than pipe age does. After that it comes down to access and material. A crawlspace or unfinished basement lets us route new lines with almost no demolition; a slab home or a finished two-story means opening walls and ceilings and putting them back — and that drywall and paint work is a real part of the job, not an afterthought. Count your fixtures, because every one is another run and another set of connections. PEX flexes around framing and needs far fewer joints, so it goes in faster; copper needs a soldered joint at every turn, which is labor hours, not material. Timeline: spot repairs are same-day; a full re-pipe on a 1,500–2,500 sq ft home takes 2–5 days depending on size and how much of the old run we can actually reach. We tell you which walls have to open before we start.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'The red clay under these foothills swells and shrinks with the seasons, and that movement works on buried pipe and slab connections year after year — same story in Greenville and Easley as it is across the line in Toccoa or Hendersonville. Warm, humid summers accelerate corrosion in galvanized lines. And the water through most of this region, while safe, carries enough mineral load to build scale in aging pipe faster than it would in cooler, drier country. A re-pipe doesn\'t just fix today\'s leak; it eliminates the source of the next twenty.',
      },
    ],
    warningSigns: [
      { trigger: 'Rust-colored or brown water from hot taps', detail: 'Galvanized pipes corrode from the inside. Discolored hot water means your galvanized supply lines are deteriorating and shedding iron oxide into your water.' },
      { trigger: 'Low water pressure throughout the house', detail: 'If pressure is low at multiple fixtures, the pipes themselves are likely restricted by internal scale buildup — no amount of valve adjustment will fix corroded pipes.' },
      { trigger: 'Pinhole leaks appearing in copper lines', detail: 'Pinhole leaks in copper indicate aggressive water chemistry eating through the pipe walls. One pinhole means more are coming — targeted repairs only buy time.' },
      { trigger: 'Visible corrosion or green staining at pipe joints', detail: 'Green patina on copper fittings or white/orange crust on galvanized joints means active corrosion. The joints are the weakest points and fail first.' },
      { trigger: 'Your home has gray polybutylene pipes', detail: 'Polybutylene was the subject of one of the largest building-products class actions in U.S. history, brought over catastrophic failure rates. If you see gray flexible pipes at your water heater or main shutoff, replacement is strongly recommended.' },
      { trigger: 'Water damage stains on walls or ceilings with no obvious source', detail: 'Hidden leaks behind walls are common in older supply lines. By the time you see the stain, the leak has been active for days or weeks.' },
      { trigger: 'Your water heater was recently replaced but water is still discolored', detail: 'If new equipment didn\'t fix the discolored water, the problem is the supply pipes feeding it — not the heater itself.' },
    ],
    maintenanceTips: [
      { tip: 'Know where your main shutoff valve is', detail: 'In an emergency, seconds matter. Locate your main water shutoff (usually near the meter or where the main line enters the house) and test it annually to make sure it fully closes.' },
      { tip: 'Check exposed pipes for signs of corrosion annually', detail: 'Look at visible pipes in the basement, crawlspace, and under sinks. Green stains on copper, white buildup on galvanized, or wet spots mean trouble is developing.' },
      { tip: 'Monitor your water bill for unexplained increases', detail: 'A sudden spike in water usage without a change in habits often indicates a hidden leak. Most meters have a low-flow indicator that spins when water is flowing — check it with all fixtures off.' },
      { tip: 'Insulate exposed pipes in unconditioned spaces', detail: 'Pipes in crawlspaces, attics, and exterior walls are what freeze first when a hard cold snap drops through the foothills — and the higher you sit toward the North Carolina line, the longer that cold holds. Foam sleeves go on in an afternoon, and a sleeved pipe is one you never have to open a wall to repair.' },
      { tip: 'Don\'t ignore slow drains as a pressure issue', detail: 'Slow drains are a drain/sewer problem, not a supply problem. But low hot water pressure combined with normal cold pressure points to corroded hot water supply lines specifically.' },
    ],
    processSteps: [
      { num: '01', title: 'Inspection & Assessment', description: 'We inspect your visible plumbing, check water pressure at multiple fixtures, identify pipe material and age, and look for signs of active corrosion or leaks. You get a clear assessment: repair or re-pipe.' },
      { num: '02', title: 'Scope & Estimate', description: 'For re-pipes, we map every supply line run, plan the routing (PEX or copper), identify wall access points, and provide a detailed written estimate. No surprises mid-job.' },
      { num: '03', title: 'Water Shutoff & Installation', description: 'We shut off the main water supply, remove the old piping (where accessible), and install new supply lines to every fixture. PEX uses manifold systems for fewer fittings; copper is soldered joint by joint.' },
      { num: '04', title: 'Testing & Pressure Check', description: 'Every new line is pressure-tested to verify zero leaks before we close any walls. We check flow rates at every fixture and verify proper hot/cold separation.' },
      { num: '05', title: 'Wall Repair & Cleanup', description: 'Any wall openings are patched and finished. We clean up all debris, remove old piping, and walk you through the new system — where shutoffs are, what to watch for, and when to call us.' },
    ],
    faq: [
      { q: 'PEX or copper — which do you recommend?', a: 'For most re-pipes, PEX. It flexes around framing instead of needing a soldered joint at every turn, so it goes in with fewer labor hours and fewer potential leak points, it tolerates a freeze without splitting, and it carries a 25-year warranty. Copper lasts longer (50+ years), handles high heat better, and still reads better to some buyers at resale. We install both — what usually decides it is your home\'s layout, how much of the existing run we can reach, and how long you plan to stay.' },
      { q: 'How long does a full house re-pipe take?', a: 'A typical 3-bedroom home takes 2–3 days with PEX, 3–5 days with copper. We keep water to at least one bathroom each evening so you\'re never without service overnight.' },
      { q: 'Will a re-pipe fix my low water pressure?', a: 'If the low pressure is caused by corroded or scaled pipes (the most common cause in older homes), yes — dramatically. A re-pipe with modern pipe sizing restores full pressure to every fixture.' },
      { q: 'Is polybutylene really that dangerous?', a: 'Polybutylene pipes fail without warning due to chlorine degradation. The class-action settlement that followed confirmed systematic failure across the product line. Many insurance companies refuse to cover homes with polybutylene. We recommend replacement regardless of current symptoms.' },
    ],
    costData: [
      { item: 'Spot Pipe Repair', cost: 'How many failures already, and whether the leak is behind finished wall', lifespan: '5–15 years' },
      { item: 'Full Re-Pipe (PEX, 1,500 sq ft)', cost: 'Fixture count, attic or crawlspace routing, drywall opened and patched back', lifespan: '25–50 years' },
      { item: 'Full Re-Pipe (Copper, 1,500 sq ft)', cost: 'A soldered joint at every turn — labor hours, not material', lifespan: '50+ years' },
      { item: 'Full Re-Pipe (2,500 sq ft)', cost: 'Second story, extra baths, and longer runs each add a day', lifespan: '25–50+ years' },
      { item: 'Polybutylene Replacement', cost: 'Every gray line goes, including the buried service lateral if it\'s PB', lifespan: '25–50 years' },
    ],
    seoKeywords: ['pipe repair Greenville SC', 're-piping Easley SC', 'polybutylene replacement near me', 'whole house repipe Anderson SC'],
  },

  // ═══ 2. WATER HEATER SERVICES ═══
  {
    id: 'water-heater-services',
    slug: 'water-heater-services',
    title: 'Water Heater Services',
    tagline: 'Hot Water That Never Runs Out',
    heroDescription: 'Whether your tank water heater is on its last legs or you\'re ready to upgrade to tankless, RO handles the full job — removal, installation, gas or electric hookup, and code-compliant venting. We install Bradford White, Rheem, Rinnai, and Navien units with honest sizing recommendations and no upselling.',
    heroImage: '/images/services/plumbing/subs/water-heater-hero.jpg',
    cardImage: '/images/services/plumbing/subs/water-heater-card.jpg',
    galleryImages: [
      '/images/services/plumbing/subs/water-heater-hero.jpg',
      '/images/services/plumbing/water-heater.jpg',
      '/images/services/plumbing/subs/plumber-wrench.jpg',
      '/images/services/plumbing/subs/copper-pipes.jpg',
      '/images/services/plumbing/subs/plumber-tools.jpg',
      '/images/services/plumbing/subs/pipe-fitting.jpg',
    ],
    overview: [
      {
        heading: 'Tank Water Heaters',
        content: 'Traditional tank heaters store 40–80 gallons of pre-heated water. They\'re reliable and they\'re the simplest swap on the list — same footprint, same water and fuel connections, and in most cases no venting or electrical changes at all. Standard tank efficiency is 0.60–0.65 EF (energy factor). Lifespan is 8–12 years with proper maintenance. The main drawback: when the tank empties during heavy use (multiple showers, laundry, dishwasher), you wait 30–60 minutes for recovery.',
      },
      {
        heading: 'Tankless Water Heaters',
        content: 'Tankless units heat water on demand — no tank, no standby heat loss, no running out. Efficiency ratings of 0.90–0.98 EF mean 24–34% energy savings over standard tanks. They last 20+ years with proper maintenance. Rinnai, Navien, and Rheem are the brands we install. The scope is driven by what surrounds the unit, not the unit itself: gas tankless needs a 3/4" gas line minimum, and if your existing line was sized for a tank it usually needs upsizing back toward the meter. It also needs its own venting — concentric or dual-pipe, cut through a wall or roof — because the old tank\'s flue almost never carries over. Where the unit lands and how far it sits from the meter sets the rest.',
      },
      {
        heading: 'Heat Pump Water Heaters',
        content: 'The efficiency leader. Heat pump (hybrid) water heaters use ambient air to heat water — 2–3x more efficient than standard electric tanks. Energy Factor ratings of 3.0–4.0 mean a dramatically smaller electric bill every month, and the units qualify for federal energy tax credits. The trade-offs are physical, and they\'re what set the install: the unit needs 700+ cubic feet of surrounding air space, a condensate drain it didn\'t need before, and it blows cold exhaust air — so a tight interior closet usually won\'t work while a garage or basement will. Relocating the heater to make that happen means extending water lines and running a new circuit. They work best in warm climates, and the Southeast gives them about as good a run as they get.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Water heating is the second-largest energy expense in most homes (14–18% of your utility bill). The long warm season across the Carolinas and north Georgia makes heat pump water heaters exceptionally efficient — the ambient warmth they pull out of the surrounding air is free and abundant here ten months of the year. Between energy savings and available tax credits, upgrading from a standard tank to a heat pump unit often pays for itself in 3–5 years.',
      },
    ],
    warningSigns: [
      { trigger: 'Your water heater is more than 10 years old', detail: 'Average tank lifespan is 8–12 years. After 10, failure risk increases significantly. Check the manufacture date on the rating plate — the first two digits of the serial number are often the year.' },
      { trigger: 'Rust-colored hot water', detail: 'Rusty hot water (but clear cold water) means the anode rod has failed and the tank itself is corroding. Once the tank starts rusting, replacement is the only permanent fix.' },
      { trigger: 'Rumbling, popping, or banging sounds', detail: 'Sediment buildup on the tank bottom hardens and traps water beneath it. The popping sound is trapped water boiling through the sediment layer. This reduces efficiency and accelerates tank failure.' },
      { trigger: 'Water pooling around the base', detail: 'Any water on the floor near the heater means either a leaking fitting (fixable) or a cracked tank (replacement needed). Check the T&P relief valve, supply connections, and the tank bottom.' },
      { trigger: 'Hot water doesn\'t last as long as it used to', detail: 'Sediment displaces water volume inside the tank. A 50-gallon tank with heavy sediment may only hold 30 gallons of usable hot water. Flushing helps if caught early; replacement if the buildup is severe.' },
      { trigger: 'Your energy bills have increased without explanation', detail: 'An inefficient water heater working harder to maintain temperature draws more energy. Sediment insulates the burner from the water, forcing longer run cycles.' },
    ],
    maintenanceTips: [
      { tip: 'Flush the tank annually', detail: 'Connect a garden hose to the drain valve at the bottom of the tank and flush until the water runs clear. This removes sediment that reduces efficiency and causes premature failure. Takes 15 minutes.' },
      { tip: 'Test the T&P relief valve annually', detail: 'Lift the lever on the temperature and pressure relief valve and let it snap back. You should hear water discharge into the drain line. If it doesn\'t operate freely, replace it — this is a critical safety device.' },
      { tip: 'Check the anode rod every 3 years', detail: 'The anode rod sacrifices itself to protect the tank from corrosion. When it\'s more than 50% consumed, replace it. The rod itself is a stocked part — what changes the job is headroom, because a low ceiling above the tank means either pulling the unit out or using a segmented rod. This single step can add 3–5 years to tank life.' },
      { tip: 'Set the temperature to 120°F', detail: 'Factory default is often 140°F. Dropping to 120°F reduces scalding risk, cuts energy use by 6–10%, and slows mineral buildup. You won\'t notice the difference in the shower.' },
      { tip: 'Descale tankless units annually', detail: 'Tankless heaters need annual vinegar flushing to remove mineral scale from the heat exchanger. Most units have service valves for this. Skip it and efficiency drops; skip it long enough and the exchanger fails.' },
    ],
    processSteps: [
      { num: '01', title: 'Assessment & Sizing', description: 'We evaluate your current setup, measure hot water demand (household size, fixtures, simultaneous usage), and recommend the right type and size. Oversizing wastes money; undersizing leaves you cold.' },
      { num: '02', title: 'Unit Selection', description: 'We walk you through options — tank, tankless, or heat pump — with honest comparisons of upfront cost, operating cost, and payback period. We carry Bradford White, Rheem, Rinnai, and Navien.' },
      { num: '03', title: 'Removal & Prep', description: 'We disconnect and remove the old unit (including disposal), verify gas/electric supply sizing, check venting requirements, and prepare the installation area. If gas line upgrades are needed, we handle that too.' },
      { num: '04', title: 'Installation', description: 'New unit is set, connected to supply and return lines, gas/electric hooked up, and venting installed or modified. Tankless units require specific venting (concentric or dual-pipe) and may need electrical for controls.' },
      { num: '05', title: 'Testing & Walkthrough', description: 'We fire up the unit, verify proper operation, check for leaks, measure output temperature, and walk you through the controls — temperature setting, vacation mode, and maintenance schedule.' },
    ],
    faq: [
      { q: 'Tank or tankless — which should I get?', a: 'If budget is the primary concern and you have 1–3 people in the household, a high-efficiency tank is fine. If you want endless hot water, lower energy bills, and plan to stay in the home 7+ years, tankless pays for itself through savings. For electric homes, a heat pump water heater is the best overall value in our climate.' },
      { q: 'How much will I save with a tankless water heater?', a: 'Tankless cuts water heating energy use 24–34% versus a standard tank, and water heating is 14–18% of a typical utility bill. Your actual savings track how you use hot water: a tank spends all day reheating water nobody used, so a household that empties it every morning saves the most, and a household of one or two saves the least. Across the 20-year life of a tankless unit the energy savings roughly offset the higher install scope. We\'d rather run that against your real usage than hand you an average.' },
      { q: 'Can you convert from electric to gas?', a: 'Yes, but it means running a gas line to the water heater location and adding venting the electric unit never needed. What drives that added scope: distance from your nearest existing gas supply, whether the run goes through open crawlspace or finished wall, whether the existing line and meter can carry the extra BTU load without upsizing, and where the flue can exit. We handle the full scope — gas line, venting, and installation.' },
      { q: 'What size water heater do I need?', a: 'Rule of thumb for tanks: 40 gallons for 1–2 people, 50 gallons for 3–4, 75–80 gallons for 5+. For tankless, we size by GPM (gallons per minute) — typically 8–10 GPM for whole-home coverage. We calculate your actual demand, not guesswork.' },
    ],
    costData: [
      { item: 'Tank Water Heater (40–50 gal)', cost: 'Straight swap unless the pan, expansion tank, or shutoff has to change', lifespan: '8–12 years' },
      { item: 'Tank Water Heater (75–80 gal)', cost: 'Bigger footprint — doorways, stairs, and closet clearance set the labor', lifespan: '8–12 years' },
      { item: 'Tankless Water Heater (installed)', cost: 'Gas line sizing and new venting, not the unit, set the scope', lifespan: '20+ years' },
      { item: 'Heat Pump Water Heater (installed)', cost: 'Needs air volume, a condensate drain, and often a new location', lifespan: '12–15 years' },
      { item: 'Anode Rod Replacement', cost: 'Headroom above the tank; a low ceiling means a segmented rod', lifespan: '3–5 years' },
    ],
    seoKeywords: ['water heater replacement Greenville SC', 'tankless water heater installation Easley SC', 'water heater repair Spartanburg SC', 'plumber water heater near me'],
  },

  // ═══ 3. DRAIN CLEANING & SEWER ═══
  {
    id: 'drain-cleaning-sewer',
    slug: 'drain-cleaning-sewer',
    title: 'Drain Cleaning & Sewer',
    tagline: 'Clogs Cleared. Sewer Lines Restored.',
    heroDescription: 'From a slow kitchen drain to a collapsed sewer main, RO handles the full spectrum of drain and sewer work. We use camera inspection to diagnose before we dig, hydro-jetting to clear what snaking can\'t, and trenchless technology to replace sewer lines without destroying your yard. No guesswork — just answers and solutions.',
    heroImage: '/images/services/plumbing/subs/drain-cleaning-hero.jpg',
    cardImage: '/images/services/plumbing/subs/drain-cleaning-card.jpg',
    galleryImages: [
      '/images/services/plumbing/subs/drain-cleaning-hero.jpg',
      '/images/services/plumbing/drain-work.jpg',
      '/images/services/plumbing/subs/plumber-under-sink.jpg',
      '/images/services/plumbing/subs/plumber-tools.jpg',
      '/images/services/plumbing/subs/pipe-fitting.jpg',
      '/images/services/plumbing/subs/plumber-wrench.jpg',
    ],
    overview: [
      {
        heading: 'Drain Clearing Methods',
        content: 'Snaking (drain auger) handles most household clogs — hair, grease, soap buildup. It\'s fast, it works from a single fixture or cleanout, and it\'s the right tool for one bad drain. Hydro-jetting uses high-pressure water (3,000–4,000 PSI) to scour the entire pipe interior, removing grease, scale, and tree root intrusion. It\'s the most thorough cleaning available and the only method that restores full pipe diameter — but it needs a usable cleanout to work from, and a line too deteriorated to take that pressure needs repair, not cleaning. Which one you need depends on whether the blockage is a one-time clog or the same clog coming back.',
      },
      {
        heading: 'Camera Inspection',
        content: 'A waterproof camera on a flexible cable is fed through your drain or sewer line, showing real-time video of the pipe interior. We see exactly what\'s causing the problem — roots, cracks, bellied sections, collapsed areas, or blockages. This eliminates guesswork and prevents unnecessary work — we price a sewer repair off what the camera shows, not off a guess about pipe age. Inspection is included with any sewer line repair we perform. On a standalone inspection, the variables are access (an existing cleanout versus cutting one in) and how long the run is from the house to the city tap.',
      },
      {
        heading: 'Sewer Line Repair & Replacement',
        content: 'Traditional sewer replacement means trenching your yard to access and replace the pipe. Trenchless methods (pipe bursting and pipe lining) replace or rehabilitate the line through small access points at each end — no trenching, no landscape destruction. Either way, the same four things set the scope: the length of the run from the house to the city tap, how deep the line sits, what sits on top of it — lawn, driveway, patio, mature trees — and whether the old pipe is intact enough to line or burst through. Trenchless runs higher per foot on the plumbing side and skips the landscape, driveway, and hardscape restoration that follows a trench, which is frequently the larger half of a traditional job. We recommend trenchless whenever the pipe condition allows it.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'The mature hardwood canopy across this region makes root intrusion the #1 cause of sewer line failure — the older streets in Greenville, Easley, Anderson, and Spartanburg, and the same shaded lots over both state lines. Clay pipes (common in homes built before 1970) are especially vulnerable — tree roots exploit the joints and grow inside the pipe. Orangeburg pipe (compressed wood fiber, used 1945–1972) is reaching end of life throughout the region and collapses under soil pressure. If your home is 40+ years old and on original sewer lines, a camera inspection is the smartest hour you can put into it.',
      },
    ],
    warningSigns: [
      { trigger: 'Multiple slow drains throughout the house', detail: 'A single slow drain is usually a local clog. Multiple slow drains simultaneously means the main sewer line is partially blocked — a problem that will get worse, not better.' },
      { trigger: 'Sewage smell inside or outside the home', detail: 'Sewer gas contains methane and hydrogen sulfide. A persistent sewage smell indicates a cracked or disconnected drain line, a dry trap, or a failing sewer main. Don\'t ignore it — it\'s a health hazard.' },
      { trigger: 'Gurgling sounds from drains or toilets', detail: 'Gurgling means air is being pulled through the water in your traps, which happens when a downstream blockage creates a vacuum. It\'s an early warning of a developing sewer obstruction.' },
      { trigger: 'Water backing up in the lowest fixtures', detail: 'When the sewer main is blocked, water backs up from the lowest point — typically a basement floor drain or first-floor shower. This is an emergency requiring immediate attention.' },
      { trigger: 'Wet spots or unusually green patches in the yard', detail: 'A leaking sewer line fertilizes the soil above it. If one section of your yard is greener than the rest or stays soggy without rain, the sewer line below may be cracked or separated.' },
      { trigger: 'Recurring clogs in the same drain', detail: 'A drain that clogs repeatedly in the same location has a structural problem — root intrusion, a bellied section trapping debris, or a partial collapse. Snaking is a temporary fix; the pipe needs repair.' },
    ],
    maintenanceTips: [
      { tip: 'Never pour grease down the drain', detail: 'Grease solidifies in pipes and builds up over time, eventually causing complete blockages. Pour cooking grease into a container and dispose of it in the trash.' },
      { tip: 'Use drain screens in showers and tubs', detail: 'Hair is the #1 cause of bathroom drain clogs. A hardware-store drain screen stops 90% of them before they ever reach the trap. Clean the screen weekly.' },
      { tip: 'Run hot water after using the kitchen sink', detail: 'Running hot water for 15–30 seconds after washing dishes helps flush grease and soap residue through the drain line before it solidifies.' },
      { tip: 'Schedule a camera inspection every 5 years', detail: 'For homes with mature trees and older sewer lines, a routine camera inspection catches root intrusion and pipe deterioration before they cause emergencies.' },
      { tip: 'Don\'t flush anything except toilet paper', detail: 'Wipes (even "flushable" ones), paper towels, feminine products, and cotton swabs don\'t break down. They catch on pipe joints and root intrusions, building blockages over time.' },
    ],
    processSteps: [
      { num: '01', title: 'Diagnosis', description: 'We start with the symptom — slow drain, backup, smell — and determine whether it\'s a local clog or a mainline issue. For sewer problems, we run a camera inspection to see exactly what\'s happening inside the pipe.' },
      { num: '02', title: 'Clearing', description: 'For clogs, we snake or hydro-jet depending on severity. Snaking breaks through the blockage; hydro-jetting scours the pipe clean. You see camera footage before and after so you know exactly what was done.' },
      { num: '03', title: 'Assessment', description: 'If the camera reveals structural damage (cracks, bellies, root intrusion, collapse), we assess the repair options: spot repair, trenchless lining, pipe bursting, or traditional replacement. You get a clear recommendation with costs.' },
      { num: '04', title: 'Repair or Replace', description: 'We execute the chosen repair method. Trenchless work requires only small access pits; traditional work involves careful excavation with attention to landscape, sprinklers, and hardscape that need restoration.' },
      { num: '05', title: 'Verification & Cleanup', description: 'Final camera inspection confirms the repair is complete and the line flows freely. Any excavation is backfilled and compacted. You receive camera footage for your records and insurance.' },
    ],
    faq: [
      { q: 'When is a sewer camera inspection worth running?', a: 'Any time the same drain backs up twice, before you close on a house built before 1980, and before you accept anyone\'s quote on a sewer line. We include it free with any sewer repair work, because we\'d rather price the repair off footage than off assumptions. On a standalone inspection the variables are access — whether there\'s an existing cleanout or we have to cut one in — and the length of the run. The footage becomes yours, which is useful for insurance claims, home sales, and future reference.' },
      { q: 'What is hydro-jetting and when is it needed?', a: 'Hydro-jetting blasts water at 3,000–4,000 PSI through your drain line, removing grease, scale, and roots that snaking can\'t fully clear. It\'s the right choice for recurring clogs, grease-heavy kitchen lines, and root-prone sewer lines. What moves the job: whether there\'s a usable cleanout to jet from, the length and diameter of the line, and whether the root load calls for a second pass with a cutting head. If the camera shows a pipe too far gone to take 4,000 PSI, we tell you before we start rather than after.' },
      { q: 'Can you replace my sewer line without digging up the yard?', a: 'In most cases, yes. Trenchless pipe bursting or pipe lining requires only small access points at each end of the run. The new pipe is pulled through the old one (bursting) or a resin liner is cured in place (lining). Both methods are faster, less destructive, and often comparable in cost to traditional trenching.' },
      { q: 'How do I know if I have Orangeburg pipe?', a: 'Orangeburg (bituminous fiber pipe) was used from 1945–1972. It\'s black, lightweight, and deforms under soil pressure. A camera inspection is the definitive way to identify it. If you have it, proactive replacement is recommended — Orangeburg doesn\'t repair well and failure is inevitable.' },
    ],
    costData: [
      { item: 'Drain Snaking', cost: 'One fixture or the main line, and whether a cleanout already exists', lifespan: 'Varies' },
      { item: 'Hydro-Jetting', cost: 'Line length and diameter, root load, and whether a second pass is needed', lifespan: '1–3 years' },
      { item: 'Camera Inspection', cost: 'Access point availability, and how far the run goes to the tap', lifespan: 'N/A' },
      { item: 'Trenchless Sewer Repair (per ft)', cost: 'Run length, pipe depth, and whether the old line can take a liner', lifespan: '50+ years' },
      { item: 'Traditional Sewer Replacement (per ft)', cost: 'Trench depth plus everything on top of it — lawn, drive, trees, patio', lifespan: '50+ years' },
    ],
    seoKeywords: ['drain cleaning Greenville SC', 'sewer line repair Easley SC', 'hydro jetting near me', 'sewer camera inspection Anderson SC'],
  },

  // ═══ 4. FIXTURE INSTALLATION ═══
  {
    id: 'fixture-installation',
    slug: 'fixture-installation',
    title: 'Fixture Installation',
    tagline: 'Faucets, Toilets, Sinks — Installed Right',
    heroDescription: 'A fixture install seems simple until the shutoff valve crumbles, the drain doesn\'t align, or the new faucet needs a different hole count. RO\'s plumbing crew handles fixture installations with the attention they deserve — proper connections, leak-free seals, and finishes that stay looking good. We install every major brand and handle the old fixture removal.',
    heroImage: '/images/services/plumbing/subs/fixture-install-hero.jpg',
    cardImage: '/images/services/plumbing/subs/fixture-install-card.jpg',
    galleryImages: [
      '/images/services/plumbing/subs/fixture-install-hero.jpg',
      '/images/services/plumbing/faucet-fixture.jpg',
      '/images/services/plumbing/subs/plumber-sink.jpg',
      '/images/services/plumbing/subs/plumber-under-sink.jpg',
      '/images/services/plumbing/subs/plumber-tools.jpg',
      '/images/services/plumbing/subs/plumber-wrench.jpg',
    ],
    overview: [
      {
        heading: 'What We Install',
        content: 'Kitchen and bathroom faucets (single-hole, widespread, wall-mount), toilets (standard, comfort-height, dual-flush, wall-hung), sinks (undermount, vessel, pedestal, utility), bathtubs, shower valves and trim, garbage disposals, ice maker lines, outdoor hose bibs, and laundry hookups. We install all major brands — Kohler, Moen, Delta, American Standard, TOTO, and more.',
      },
      {
        heading: 'Low-Flow & Water Savings',
        content: 'Modern WaterSense-certified fixtures use significantly less water without sacrificing performance. Low-flow toilets use 1.28 GPF (vs. 3.5–5 GPF in older models) — saving 13,000+ gallons per year for a family of four. Low-flow showerheads deliver 2.0 GPM (vs. 2.5+ GPM) while maintaining pressure through aerating technology. Upgrading every fixture in a home takes a visible bite out of the water bill, and the savings scale with how many people are using them.',
      },
      {
        heading: 'What Turns a Simple Swap Complicated',
        content: 'The fixture is rarely what decides the job. A faucet swap with a matching hole count and a working quarter-turn shutoff underneath is about an hour. The same swap becomes half a day when the shutoff crumbles in your hand, the supply lines are chrome-plated steel from 1972, or the new faucet wants one hole where the counter has three. Toilets run the same way — the wax ring is trivial, a rotted closet flange sitting in a soft subfloor is not. Sinks add drain alignment, since a new bowl at a different depth means recutting the tailpiece and trap. And anything behind the wall, a shower valve especially, means opening tile or drywall and closing it back up, which is often the largest single piece of the scope. We open the cabinet and look at the valves before we quote, not after.',
      },
      {
        heading: 'Repair vs. Replace',
        content: 'If a faucet is dripping, a cartridge or O-ring swap usually fixes it — a stocked part and a short visit. But once a fixture passes 15 years, replacement parts get scarce and the body itself may be corroding, and chasing a discontinued cartridge burns more billable time than the fixture is worth. Same with toilets — a running toilet usually needs nothing more than a flapper, but a cracked tank or bowl requires full replacement. We\'ll always recommend the repair if it makes sense; we\'ll tell you honestly when it doesn\'t.',
      },
    ],
    warningSigns: [
      { trigger: 'Persistent dripping after the handle is fully closed', detail: 'A dripping faucet wastes 3,000+ gallons per year. It usually means a worn cartridge, O-ring, or valve seat. Repair is often simple, but chronic dripping in an older fixture signals it\'s time to replace.' },
      { trigger: 'Toilet runs continuously or cycles on and off', detail: 'A running toilet can waste 200 gallons per day. The flapper, fill valve, or flush valve is failing. Quick repairs are usually possible, but toilets older than 20 years are often better replaced entirely.' },
      { trigger: 'Base of toilet is rocking or leaking', detail: 'A rocking toilet means the wax ring seal has failed or the flange is damaged. Ignoring it leads to water damage under the floor and potential subfloor rot. This needs attention now, not later.' },
      { trigger: 'Water stains in the cabinet below a sink', detail: 'Slow leaks at supply connections, drain fittings, or the faucet base cause hidden water damage. Check under your sinks monthly — catching a drip early prevents expensive cabinet and floor repairs.' },
      { trigger: 'Low flow from a specific fixture', detail: 'If one fixture has low flow while others are fine, the aerator may be clogged with sediment (easy fix) or the supply valve is partially closed or corroding (needs replacement).' },
      { trigger: 'Handles are hard to turn or feel gritty', detail: 'Internal corrosion or mineral buildup is destroying the valve mechanism. Forcing it risks breaking the valve and losing your shutoff capability. Replace the fixture before it fails completely.' },
    ],
    maintenanceTips: [
      { tip: 'Clean faucet aerators every 6 months', detail: 'Unscrew the aerator from the faucet tip and rinse out trapped sediment. Clogged aerators reduce flow and cause uneven spray patterns. Soak in vinegar overnight for heavy mineral buildup.' },
      { tip: 'Check under-sink connections quarterly', detail: 'A 30-second look under each sink catches slow leaks before they cause damage. Feel the supply hoses, drain connections, and garbage disposal for moisture.' },
      { tip: 'Replace toilet flappers every 3–5 years', detail: 'A flapper is a hardware-store part and the single most common cause of a running toilet. Drop food coloring in the tank — if it appears in the bowl without flushing, the flapper is leaking.' },
      { tip: 'Exercise shutoff valves annually', detail: 'Turn each sink and toilet shutoff valve closed and back open once a year. Valves that sit open for years can seize, and you discover this at the worst possible time — during a leak.' },
      { tip: 'Don\'t use chemical drain cleaners', detail: 'Chemical drain cleaners damage pipes (especially older ones) and are temporary fixes. They create hazardous conditions for plumbers who work on the drain later. Use a plunger or call us.' },
    ],
    processSteps: [
      { num: '01', title: 'Fixture Selection Help', description: 'Not sure what to buy? We help you choose the right fixture for your space, budget, and configuration. We verify hole counts, supply line compatibility, and drain alignment before you purchase.' },
      { num: '02', title: 'Old Fixture Removal', description: 'We carefully remove the existing fixture, inspect shutoff valves and supply lines for corrosion, and verify the drain connection is in good condition. Any issues are addressed before the new fixture goes in.' },
      { num: '03', title: 'Supply & Drain Prep', description: 'If shutoff valves are corroded or supply lines are old, we replace them now — not after the new fixture is installed. Drain connections are cleaned and prepped for proper sealing.' },
      { num: '04', title: 'Installation', description: 'New fixture is mounted, supply lines connected, drain sealed, and everything tightened to manufacturer specs. We use plumber\'s putty, Teflon tape, and proper gaskets — never silicone shortcuts that fail.' },
      { num: '05', title: 'Leak Test & Cleanup', description: 'We run water for several minutes, check every connection for leaks, verify proper drainage, and clean the work area. The old fixture is removed from your property unless you want to keep it.' },
    ],
    faq: [
      { q: 'Can I supply my own fixture for you to install?', a: 'Absolutely. Buy whatever brand and style you want — we\'ll install it. Just verify the configuration matches your existing setup (hole count, supply line size, drain location) or let us verify before you buy.' },
      { q: 'How long does a fixture install take?', a: 'A straightforward faucet or toilet swap takes 1–2 hours. Sink replacements take 2–3 hours. Shower valve replacements (behind-wall access) take 3–5 hours. We schedule enough time to do it right, including any surprises behind the wall.' },
      { q: 'Should I replace my shutoff valves while you\'re here?', a: 'If your shutoff valves are the old gate-valve type (round handles) and more than 15 years old, yes — swap them for quarter-turn ball valves while we\'re already there. Doing it with the fixture off and the water already down adds minutes; doing it later is a second visit and a second shutdown. Gate valves seize over time and won\'t fully close when you need them most.' },
      { q: 'Do you install ADA-compliant fixtures?', a: 'Yes. We install comfort-height toilets (17–19" seat height), ADA faucets with lever handles, and grab bars. We\'re familiar with ADA spacing and mounting requirements for both residential and commercial applications.' },
    ],
    costData: [
      { item: 'Faucet Installation', cost: 'Matching hole count, plus the state of the shutoffs and supply lines', lifespan: '15–20 years' },
      { item: 'Toilet Replacement', cost: 'Flange condition, rough-in distance, and whether the subfloor is sound', lifespan: '20–30 years' },
      { item: 'Sink Installation', cost: 'Countertop cutout, drain height, mount type — undermount is the slow one', lifespan: '20+ years' },
      { item: 'Shower Valve Replacement', cost: 'Access decides it: an open back wall, or cut and retile the front', lifespan: '15–20 years' },
      { item: 'Garbage Disposal Install', cost: 'Existing outlet and switch, drain height, whether a dishwasher ties in', lifespan: '10–12 years' },
    ],
    seoKeywords: ['fixture installation Greenville SC', 'toilet replacement plumber Easley SC', 'faucet install Pickens County SC', 'plumber fixture install near me'],
  },

  // ═══ 5. GAS LINE SERVICES ═══
  {
    id: 'gas-line-services',
    slug: 'gas-line-services',
    title: 'Gas Line Services',
    tagline: 'Safe. Tested. Code-Compliant.',
    heroDescription: 'Gas work requires zero tolerance for error. RO\'s licensed plumbers install, repair, and extend natural gas and propane lines for stoves, dryers, water heaters, fireplaces, generators, and outdoor grills. Every connection is pressure-tested, leak-checked, and inspected. We don\'t cut corners on the one system in your home where shortcuts can be fatal.',
    heroImage: '/images/services/plumbing/subs/gas-line-hero.jpg',
    cardImage: '/images/services/plumbing/subs/gas-line-card.jpg',
    galleryImages: [
      '/images/services/plumbing/subs/gas-line-hero.jpg',
      '/images/services/plumbing/subs/pipe-fitting.jpg',
      '/images/services/plumbing/subs/copper-pipes.jpg',
      '/images/services/plumbing/subs/plumber-wrench.jpg',
      '/images/services/plumbing/subs/plumber-tools.jpg',
      '/images/services/plumbing/subs/gas-line-card.jpg',
    ],
    overview: [
      {
        heading: 'What We Do',
        content: 'We install new gas lines, extend existing lines to new appliance locations, repair leaks, replace corroded sections, and hook up gas appliances. Common projects: running a gas line to a new stove (from electric conversion), adding an outdoor gas grill connection, hooking up a gas dryer, connecting a gas fireplace or fire pit, and running gas to a standby generator. All work is permitted and inspected.',
      },
      {
        heading: 'Materials & Methods',
        content: 'Residential gas lines use black iron pipe (the traditional standard), CSST (corrugated stainless steel tubing — flexible, faster to install), or in some cases copper. CSST has become the preferred method for interior runs due to faster installation and fewer joints. All connections are made with approved fittings, threaded joints use pipe compound (not Teflon tape on gas), and every line is pressure-tested before gas is turned on.',
      },
      {
        heading: 'Sizing, Permits & Inspection',
        content: 'Three things size a gas job. First, the run distance from the meter or existing supply to the appliance. Second, the total BTU load of everything downstream, which sets pipe diameter — undersize it and the appliance starves no matter how new it is. Third, what the line has to pass through: an open crawlspace or unfinished basement run is straightforward, while a run crossing finished walls, a floor system, or a slab means penetrations, fire-caulking, and patching. Every branch to an additional appliance adds another shutoff, another drip leg, and another joint to test. Then there\'s the paperwork, and it changes with where you live. In South Carolina, a permit is required for all new gas work, and the inspection it triggers is what allows gas to flow. We hold licenses in South Carolina, North Carolina, and Georgia, and each state — often each county inside it — runs its own permit and inspection process, so the filing path shifts even when the pipe work is identical. Whichever jurisdiction you\'re in, the permit fee is written into the quote. Schedule around the inspector, not just us — we pull the permit before we start and call for inspection as soon as the pressure test passes, but the appliance stays off until it clears.',
      },
      {
        heading: 'Safety First',
        content: 'Natural gas is odorized with mercaptan (rotten egg smell) specifically so leaks are detectable. But even small leaks in enclosed spaces create explosion risk. We pressure-test every installation at 1.5x operating pressure and hold the test for a minimum of 15 minutes. Every joint is soap-tested. No gas flows until we\'re certain the system is tight. Gas work is one area where "good enough" doesn\'t exist.',
      },
    ],
    warningSigns: [
      { trigger: 'Rotten egg or sulfur smell near gas appliances', detail: 'This is the mercaptan odorant added to natural gas. Even a faint smell means gas is escaping somewhere. Open windows, don\'t operate light switches, and call immediately. If the smell is strong, leave the house and call 911.' },
      { trigger: 'Hissing sound near a gas line or appliance', detail: 'A hissing sound indicates gas escaping under pressure. This is a serious leak requiring immediate attention. Don\'t try to find or fix it yourself.' },
      { trigger: 'Dead or dying vegetation in a line above a buried gas line', detail: 'Underground gas leaks displace oxygen in the soil, killing grass and plants above the leak path. If you see a strip of dead vegetation in your yard, it may follow a gas line route.' },
      { trigger: 'Pilot lights that won\'t stay lit', detail: 'A pilot that repeatedly goes out may indicate a faulty thermocouple (simple fix) or inadequate gas pressure in the line — which means the supply line may be undersized or partially blocked.' },
      { trigger: 'Yellow or orange burner flames instead of blue', detail: 'A properly burning gas flame is blue. Yellow or orange flames mean incomplete combustion — the gas-air mixture is wrong. This produces carbon monoxide and needs immediate adjustment.' },
      { trigger: 'Higher-than-expected gas bills', detail: 'A slow gas leak can increase your bill without producing an obvious smell. If your gas usage spikes without a change in habits, have the system pressure-tested.' },
    ],
    maintenanceTips: [
      { tip: 'Know where your gas shutoff is and how to use it', detail: 'The main gas shutoff is at the meter (requires a wrench) and individual shutoffs are at each appliance. In an emergency, shut off the individual appliance valve first. If you can\'t identify the source, shut off the main.' },
      { tip: 'Install carbon monoxide detectors on every level', detail: 'Gas appliances produce CO when combustion is incomplete. Detectors are your last line of defense against a silent killer. Test monthly, replace every 5–7 years.' },
      { tip: 'Check flexible gas connectors for corrosion', detail: 'The flexible connectors between the wall shutoff and your appliances can corrode, especially in humid areas like laundry rooms. Replace any connector showing discoloration or stiffness.' },
      { tip: 'Never use a gas appliance as a room heater', detail: 'Gas stoves and ovens are not designed for space heating. Using them this way produces dangerous levels of carbon monoxide and creates a fire hazard. Use proper HVAC or space heaters.' },
      { tip: 'Schedule a gas system check every 5 years', detail: 'A licensed plumber can pressure-test your entire gas system, check connections, verify venting, and identify developing issues before they become dangerous.' },
    ],
    processSteps: [
      { num: '01', title: 'Consultation & Planning', description: 'We evaluate where the gas line needs to go, measure the run distance, determine pipe sizing (based on total BTU load), and plan the routing to minimize wall penetrations and visible pipe.' },
      { num: '02', title: 'Permitting', description: 'We pull the gas permit from the local authority. This is non-negotiable — unpermitted gas work is dangerous, illegal, and voids your insurance. The permit fee is included in our pricing.' },
      { num: '03', title: 'Installation', description: 'The gas line is run from the existing supply (or meter) to the appliance location using black iron pipe or CSST. Branch lines, shutoff valves, and drip legs are installed per code. All joints are made with approved methods.' },
      { num: '04', title: 'Pressure Testing', description: 'We pressurize the new line to 1.5x operating pressure (typically 6 PSI for a 4 PSI system) and hold the test for a minimum of 15 minutes. Every joint is soap-tested for bubbles. Zero leaks is the only acceptable result.' },
      { num: '05', title: 'Inspection & Appliance Connection', description: 'The local inspector verifies our work meets code. Once passed, we connect the appliance, verify proper flame and operation, check venting, and walk you through the new shutoff valve location.' },
    ],
    faq: [
      { q: 'Do I need a permit for gas line work?', a: 'Yes — always. In South Carolina, code requires a gas permit for any new line, extension, or significant repair. We\'re licensed in South Carolina, North Carolina, and Georgia, and every jurisdiction we work in wants the same thing in some form — what changes is which office issues the permit and who shows up to inspect. Either way, the point is the same: an independent inspector puts eyes on the work before gas flows. We handle that process as part of every gas job, wherever the job is.' },
      { q: 'Can you convert my electric stove to gas?', a: 'Yes. We run a gas line from your nearest existing gas supply to the stove location, install a shutoff valve, and connect the new range. What drives that job is distance from the nearest existing gas supply, whether the run goes through open crawlspace or has to cross finished wall and floor, and whether your existing line and meter can carry the range\'s BTU load without upsizing. You\'ll also need a 120V outlet for the range igniter (most gas ranges still need electricity).' },
      { q: 'How do I know if I have a gas leak?', a: 'Smell (rotten eggs), sound (hissing), or visual signs (dead vegetation, bubbles in standing water). If you suspect a leak: don\'t flip light switches, don\'t use your phone inside, open windows, leave the house, and call us or 911 from outside.' },
      { q: 'Is CSST (flexible gas line) safe?', a: 'Yes — when properly installed and bonded. CSST must be bonded to the home\'s electrical grounding system per code to protect against lightning-induced damage. We install and bond all CSST per manufacturer specs and current NEC/NFP A codes.' },
    ],
    costData: [
      { item: 'Gas Line Run (20–30 ft)', cost: 'Distance, BTU load, and how many walls or floors it has to cross', lifespan: '30+ years' },
      { item: 'Gas Line Extension (50+ ft)', cost: 'Long runs need larger pipe, and every branch adds a shutoff', lifespan: '30+ years' },
      { item: 'Gas Appliance Hookup', cost: 'Connector length, shutoff condition, and whether venting has to change', lifespan: 'N/A' },
      { item: 'Gas Leak Repair', cost: 'Finding it is the work — buried line or wall cavity takes longest', lifespan: '20+ years' },
      { item: 'Gas Permit', cost: 'Set by the local authority; written into every gas quote we give', lifespan: 'N/A' },
    ],
    seoKeywords: ['gas line installation Greenville SC', 'gas plumber Easley SC', 'gas line repair near me', 'gas stove hookup Anderson SC'],
  },

  // ═══ 6. WATER FILTRATION & TREATMENT ═══
  {
    id: 'water-filtration',
    slug: 'water-filtration',
    title: 'Water Filtration & Treatment',
    tagline: 'Better Water From Every Tap',
    heroDescription: 'Hard water, chlorine taste, sediment, and mineral staining turn up in house after house around here — Greenville and Easley on municipal supply, well houses out in Pickens County and across both state lines. RO installs whole-house filtration systems, water softeners, reverse osmosis units, and well water treatment systems that solve the problem at the source — not one faucet at a time. Clean, soft, great-tasting water from every tap in your home.',
    heroImage: '/images/services/plumbing/subs/water-filtration-hero.jpg',
    cardImage: '/images/services/plumbing/subs/water-filtration-card.jpg',
    galleryImages: [
      '/images/services/plumbing/subs/water-filtration-hero.jpg',
      '/images/services/plumbing/subs/copper-pipes.jpg',
      '/images/services/plumbing/subs/plumber-wrench.jpg',
      '/images/services/plumbing/subs/pipe-fitting.jpg',
      '/images/services/plumbing/subs/plumber-tools.jpg',
      '/images/services/plumbing/subs/water-filtration-card.jpg',
    ],
    overview: [
      {
        heading: 'Whole-House Filtration',
        content: 'A whole-house system installs on the main water line after the meter, filtering every drop before it reaches any fixture. Carbon-based systems remove chlorine, chloramines, sediment, and VOCs. Multi-stage systems add sediment pre-filters and specialty media for iron, manganese, or sulfur. The install is set by where your main line is actually reachable — a garage or crawlspace tie-in is straightforward, a slab home with the main entering under finished floor is not — plus whether there\'s a drain close enough for backwash and how many stages your water test genuinely calls for. Filter changes: every 6–12 months depending on water quality and usage.',
      },
      {
        heading: 'Water Softeners',
        content: 'Water across these foothills runs moderately hard to very hard (7–15+ GPG), and it shifts from one system to the next — city water in Greenville reads differently than a well outside Pickens or a small system over in Rabun County. Hard water causes scale buildup in pipes and water heaters, white spots on fixtures, dry skin, and reduced soap effectiveness. Ion-exchange water softeners replace calcium and magnesium with sodium, eliminating scale and dramatically improving appliance efficiency. Sizing follows your hardness number and household size — undersize the unit and it regenerates constantly, burning salt and water to keep up. Installation needs a drain line for the regeneration cycle and an outlet for the control head, and that pair usually decides where the unit can physically go.',
      },
      {
        heading: 'Reverse Osmosis',
        content: 'RO systems push water through a semi-permeable membrane, removing 95–99% of dissolved solids, heavy metals, fluoride, and contaminants. Installed under the kitchen sink with a dedicated faucet, they deliver the cleanest drinking water possible. A point-of-use unit needs a hole in the counter for the dedicated faucet and a drain saddle under the sink — drilling a granite or solid-surface counter is the usual complication. Whole-house RO is a different animal: it needs a storage tank, a repressurization pump to put the pressure back, and floor space for both. Membrane replacement: every 2–3 years.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'The granite and limestone bedrock under this whole stretch of foothills — the Greenville and Easley side, up into western North Carolina, down into northeast Georgia — puts calcium, magnesium, and iron into the groundwater. Municipal water is safe but heavily chlorinated. Well water varies dramatically — some wells produce excellent water, others have iron, sulfur, manganese, or bacterial issues that require treatment. A water test tells you exactly what you\'re dealing with, and we size and design the system off those numbers. Guessing is how a house ends up with a softener that never touches the actual problem.',
      },
    ],
    warningSigns: [
      { trigger: 'White scale buildup on faucets and showerheads', detail: 'This is calcium carbonate from hard water. If you see it on fixtures, it\'s also building up inside your water heater, dishwasher, and pipes — reducing efficiency and lifespan.' },
      { trigger: 'Chlorine smell or taste in your tap water', detail: 'Municipal water uses chlorine for disinfection. While safe, it affects taste and smell. A whole-house carbon filter eliminates it at the point of entry.' },
      { trigger: 'Orange or brown staining in sinks, tubs, and toilets', detail: 'Iron in your water causes rust-colored staining. An iron filter or oxidizing system removes it before it reaches your fixtures. Common in well water but also occurs in older municipal systems.' },
      { trigger: 'Rotten egg smell from hot water', detail: 'Hydrogen sulfide gas (from sulfur bacteria or the water heater anode rod reacting with sulfates) causes the egg smell. Treatment depends on the source — water heater anode swap or a sulfur filter system.' },
      { trigger: 'Soap doesn\'t lather well, skin feels dry after showering', detail: 'Hard water inhibits soap\'s ability to lather and leaves mineral residue on skin and hair. A water softener eliminates this and dramatically reduces soap and shampoo usage.' },
      { trigger: 'Spots on dishes after the dishwasher cycle', detail: 'Hard water spots on glasses and dishes mean your water hardness exceeds what the dishwasher\'s rinse aid can handle. A water softener solves this permanently.' },
    ],
    maintenanceTips: [
      { tip: 'Check and replace sediment pre-filters every 3–6 months', detail: 'Pre-filters protect your main filtration system from clogging. A dirty pre-filter reduces water pressure and shortens the life of more expensive downstream filters.' },
      { tip: 'Keep your water softener salt level above the water line', detail: 'Check the brine tank monthly. When salt drops below the water level, the softener can\'t regenerate properly and hard water passes through. Use high-purity salt pellets, not rock salt.' },
      { tip: 'Test your water annually', detail: 'Water quality changes over time, especially well water. An annual test confirms your system is still sized correctly and catching what it\'s designed to catch.' },
      { tip: 'Replace RO membranes every 2–3 years', detail: 'RO membranes gradually lose rejection capacity. If your TDS (total dissolved solids) reading starts climbing, the membrane is due for replacement.' },
      { tip: 'Note your water pressure before and after filter changes', detail: 'A significant pressure drop after a filter is installed means the filter is doing its job. A significant drop between changes means you\'re waiting too long — change filters sooner.' },
    ],
    processSteps: [
      { num: '01', title: 'Water Testing', description: 'We test your water for hardness, pH, iron, manganese, TDS, chlorine, bacteria, and other parameters. Well water gets a comprehensive panel; municipal water focuses on hardness and taste factors. Results drive the system design.' },
      { num: '02', title: 'System Design', description: 'Based on test results, household size, and water usage, we design a treatment system. This may be a single component (softener only) or a multi-stage system (sediment filter + softener + carbon filter + RO for drinking).' },
      { num: '03', title: 'Installation', description: 'Systems install on the main water line after the meter (or after the pressure tank for well systems). We add bypass valves for maintenance, drain connections for backwash, and electrical for units with control heads.' },
      { num: '04', title: 'Programming & Calibration', description: 'Softener regeneration cycles are programmed based on your water hardness and household usage. Filter timers are set. RO systems are flushed and checked for proper rejection rates.' },
      { num: '05', title: 'Testing & Training', description: 'We retest the treated water to verify the system is performing as designed. You get a walkthrough of maintenance tasks — how to add salt, when to change filters, and how to read the control head.' },
    ],
    faq: [
      { q: 'Do I need a water softener around Greenville?', a: 'Most homes in this part of the foothills have moderately hard to hard water (7–15+ GPG), and the same holds on both sides of the North Carolina and Georgia lines. If you see white scale on fixtures, spots on dishes, or dry skin after showering, a softener will make a noticeable difference. A simple hardness test — we run ours free — gives you the answer in minutes, and the number it returns is what sizes the unit.' },
      { q: 'Is reverse osmosis water safe to drink?', a: 'Yes — it\'s the purest drinking water available. RO removes 95–99% of dissolved solids. Some people add a mineral remineralization stage for taste preference, but the water is perfectly safe without it.' },
      { q: 'How much salt does a water softener use?', a: 'A typical family of 4 goes through about one 40-lb bag a month. High-efficiency units use less, and an undersized softener uses far more because it has to regenerate more often to keep up with the same hardness. We program regeneration cycles to minimize salt and water usage while maintaining soft water 24/7.' },
      { q: 'Can you treat well water with iron and sulfur?', a: 'Absolutely. Iron filters (oxidizing media or air injection systems) remove iron and manganese. Sulfur is treated with aeration, chlorination, or catalytic carbon depending on the concentration. We test first, then design the right system.' },
    ],
    costData: [
      { item: 'Whole-House Carbon Filter', cost: 'Where the main line is reachable, and how close a backwash drain sits', lifespan: '5–10 years (media)' },
      { item: 'Water Softener (installed)', cost: 'Your hardness number and household size pick the unit; drain access places it', lifespan: '10–15 years' },
      { item: 'Reverse Osmosis (under-sink)', cost: 'Drilling the counter for the faucet, plus a drain saddle below', lifespan: '10–15 years' },
      { item: 'Iron/Manganese Filter', cost: 'Concentration and iron form pick the media — and whether aeration is required', lifespan: '5–10 years (media)' },
      { item: 'Water Test (comprehensive)', cost: 'Well panels run wider than municipal; bacteria adds lab turnaround', lifespan: 'Annual' },
    ],
    seoKeywords: ['water filtration Greenville SC', 'water softener installation Easley SC', 'well water treatment Pickens County SC', 'whole house water filter near me'],
  },

  // ═══ 7. BATHROOM & KITCHEN PLUMBING ═══
  {
    id: 'bathroom-kitchen-plumbing',
    slug: 'bathroom-kitchen-plumbing',
    title: 'Bathroom & Kitchen Plumbing',
    tagline: 'Renovation Plumbing Done Right the First Time',
    heroDescription: 'Renovating a bathroom or kitchen means moving drains, rerouting supply lines, and making new fixtures work in spaces that weren\'t designed for them. RO\'s plumbing crew handles the rough-in and finish plumbing for renovations — from relocating a shower drain to adding a kitchen island sink with proper venting. We coordinate with your GC or work as your GC.',
    heroImage: '/images/services/plumbing/subs/bathroom-plumbing-hero.jpg',
    cardImage: '/images/services/plumbing/subs/bathroom-plumbing-card.jpg',
    galleryImages: [
      '/images/services/plumbing/subs/bathroom-plumbing-hero.jpg',
      '/images/services/plumbing/subs/plumber-sink.jpg',
      '/images/services/plumbing/faucet-fixture.jpg',
      '/images/services/plumbing/subs/plumber-under-sink.jpg',
      '/images/services/plumbing/subs/plumber-tools.jpg',
      '/images/services/plumbing/subs/copper-pipes.jpg',
    ],
    overview: [
      {
        heading: 'Rough-In Plumbing',
        content: 'Rough-in is the behind-the-wall work done before drywall goes up: supply lines, drain lines, vent stacks, and valve placement. Proper rough-in determines whether your fixtures will work correctly for decades. We set drain heights, supply stub-outs, and vent connections precisely to manufacturer specs for the fixtures you\'ve selected — not generic "close enough" placement.',
      },
      {
        heading: 'Moving Drains & Supply Lines',
        content: 'Relocating a toilet, shower, or sink means moving the drain line — which involves cutting into the subfloor (or slab) and rerouting the drain with proper slope (1/4" per foot minimum). Supply lines are easier to move but still need proper sizing and support. Slab work — saw-cutting concrete, trenching, rerouting the drain, then repouring — is the single biggest swing in a renovation plumbing scope, and in a slab-on-grade home it\'s sometimes the only way to change a layout at all. The same fixture move in a raised-floor home is a fraction of the work, because we come at the drain from below and never touch the finished floor. Which house you have matters more here than how far the fixture moves.',
      },
      {
        heading: 'Common Renovation Projects',
        content: 'Bathroom: tub-to-shower conversions, adding a second bathroom, relocating fixtures for better layout, upgrading to a walk-in shower with linear drain. Kitchen: island sink installation (requires under-floor drain and island vent), adding a pot filler, converting from single-bowl to double-bowl sink, adding a second dishwasher line, and upgrading to a commercial-style faucet with higher flow requirements.',
      },
      {
        heading: 'Why It Matters',
        content: 'Plumbing is the one renovation trade that, if done wrong, causes the most damage. A poorly vented drain creates sewer gas issues and slow drainage. An undersized supply line starves fixtures of pressure. A drain with insufficient slope traps debris and clogs chronically. These problems don\'t show up on day one — they show up after the tile is laid and the walls are closed. Getting the rough-in right eliminates a decade of headaches.',
      },
    ],
    warningSigns: [
      { trigger: 'You\'re planning a renovation and haven\'t consulted a plumber yet', detail: 'Plumbing sets the constraints for fixture placement. If you design the layout without knowing where drains can go, you may face expensive surprises. Consult us before finalizing the design.' },
      { trigger: 'New fixtures drain slowly from day one', detail: 'If a newly installed fixture drains slowly, the drain slope is insufficient or the vent is missing/blocked. This is a rough-in problem that won\'t fix itself.' },
      { trigger: 'Sewer smell in a newly renovated bathroom', detail: 'A sewer smell after renovation means a missing trap, improper venting, or a dry trap (fixture not used regularly). All are fixable, but the cause needs to be identified correctly.' },
      { trigger: 'Water pressure drops when multiple fixtures run', detail: 'If running the kitchen sink kills the shower pressure, the supply lines are undersized for the number of fixtures. This is common in renovations that add fixtures without upgrading supply sizing.' },
      { trigger: 'Your contractor says "the plumber can figure it out later"', detail: 'Plumbing rough-in must happen before framing is complete. Leaving it for later means tearing into finished work. Bring us in during the design phase, not after drywall.' },
    ],
    maintenanceTips: [
      { tip: 'Run water in seldom-used fixtures monthly', detail: 'Floor drains, guest bathroom sinks, and basement fixtures have P-traps that can dry out, allowing sewer gas to enter. Run water for 30 seconds monthly to keep the trap seal intact.' },
      { tip: 'Know the location of your bathroom shutoff valves', detail: 'Each toilet and sink should have individual shutoff valves. Verify they work before you need them in an emergency.' },
      { tip: 'Caulk around tub and shower bases annually', detail: 'The caulk joint where the tub meets the tile or surround is a common water intrusion point. Inspect it annually and re-caulk when it cracks or separates — this prevents subfloor rot.' },
      { tip: 'Don\'t overtighten fixture connections', detail: 'Overtightening supply line nuts cracks the fitting. Hand-tight plus one-quarter turn with a wrench is sufficient for compression fittings.' },
      { tip: 'Clean garbage disposals with ice and citrus', detail: 'Run ice cubes through the disposal monthly to clean the grinding elements. Follow with lemon or orange peels for freshness. Never use bleach — it damages the rubber components.' },
    ],
    processSteps: [
      { num: '01', title: 'Design Coordination', description: 'We review your renovation plans, verify fixture selections, and identify plumbing constraints. If drain relocation is needed, we determine the approach (through floor joists, through slab, or reconfigured layout) and provide a scope-specific estimate.' },
      { num: '02', title: 'Rough-In', description: 'With walls open, we run new supply lines, set drain positions at correct heights and slopes, install vent connections, and place valve boxes. Everything is set precisely for your selected fixtures — not generic positions.' },
      { num: '03', title: 'Inspection', description: 'Rough-in plumbing is inspected before drywall goes up. The inspector verifies drain slopes, vent connections, supply sizing, and code compliance. This is the last chance to catch issues before they\'re buried behind walls.' },
      { num: '04', title: 'Finish Plumbing', description: 'After drywall, tile, and countertops are complete, we return to install fixtures: faucets, toilets, sinks, shower trim, tub fillers, disposals, and dishwasher connections. Everything is connected, sealed, and tested.' },
      { num: '05', title: 'Final Testing & Punch List', description: 'We run every fixture, check every drain, verify hot/cold are correct, and confirm proper pressure and flow. Any punch list items are addressed on the spot before we call the job complete.' },
    ],
    faq: [
      { q: 'Can you move a toilet to a different location in the bathroom?', a: 'Yes, but it requires relocating the drain line — which means accessing the subfloor or slab below. In a raised-floor home, this is straightforward. In a slab-on-grade home, it requires concrete cutting and new drain routing. We assess the specific situation and give you a clear cost before committing.' },
      { q: 'What drives the cost of rough-in plumbing for a bathroom?', a: 'Whether the fixtures stay put. Keeping the toilet, tub, and vanity where they are means tying into drains and vents that already exist and already work — that\'s the low end of any renovation. Moving one means new drain routing with 1/4" per foot of fall, a vent that reaches the stack, and floor or slab access to make it happen, and that\'s per fixture, not per bathroom. A brand-new bathroom in a space that never had one is the full scope: new drain, new vent, new supply, and a tie-in to the main stack. We walk the space and price off what\'s actually under the floor, not off square footage.' },
      { q: 'Do I need a plumber for a kitchen island sink?', a: 'Absolutely. An island sink requires a drain line run under the floor and a special venting method (island vent or air admittance valve) since you can\'t run a traditional vent through the ceiling above an island. This is not a DIY project.' },
      { q: 'Should I upgrade my plumbing during a renovation?', a: 'If the walls are open, yes — it\'s the one moment you aren\'t paying to open them. Replacing old supply lines, upgrading shutoff valves, and adding proper venting while the framing is exposed adds hours to a job already underway. Doing the same work after the tile is set means demolishing and rebuilding finished surfaces to reach the exact same pipe, and that demolition-and-repair half is usually larger than the plumbing half.' },
    ],
    costData: [
      { item: 'Bathroom Rough-In (same location)', cost: 'Tying into drains and vents that already exist — the short version', lifespan: '30+ years' },
      { item: 'Fixture Relocation (per fixture)', cost: 'Distance moved, fall available, and whether the vent has to be rerun', lifespan: '30+ years' },
      { item: 'Full Bathroom Addition (plumbing)', cost: 'New drain, vent, and supply, plus the tie-in to the main stack', lifespan: '30+ years' },
      { item: 'Kitchen Island Sink Install', cost: 'Under-floor drain routing, and which island vent method code allows', lifespan: '20+ years' },
      { item: 'Slab Concrete Cut & Drain Reroute', cost: 'Saw-cut length, trench depth, rebar in the way, repouring the floor', lifespan: '50+ years' },
    ],
    seoKeywords: ['bathroom plumbing renovation Greenville SC', 'kitchen plumbing Easley SC', 'rough-in plumber near me', 'bathroom remodel plumber Spartanburg SC'],
  },

  // ═══ 8. EMERGENCY PLUMBING ═══
  {
    id: 'emergency-plumbing',
    slug: 'emergency-plumbing',
    title: 'Emergency Plumbing',
    tagline: 'We Answer When It Matters Most',
    heroDescription: 'A burst pipe at 2 AM. A sewer backup flooding the basement. A water heater dumping 50 gallons across the floor. When plumbing fails catastrophically, response time determines whether you\'re dealing with a repair or a disaster. RO responds to plumbing emergencies fast — we stop the water, fix the cause, and help you navigate the cleanup.',
    heroImage: '/images/services/plumbing/subs/emergency-hero.jpg',
    cardImage: '/images/services/plumbing/subs/emergency-card.jpg',
    galleryImages: [
      '/images/services/plumbing/subs/emergency-hero.jpg',
      '/images/services/plumbing/subs/plumber-wrench.jpg',
      '/images/services/plumbing/subs/pipe-repair-hero.jpg',
      '/images/services/plumbing/subs/plumber-tools.jpg',
      '/images/services/plumbing/subs/drain-cleaning-hero.jpg',
      '/images/services/plumbing/subs/plumber-under-sink.jpg',
    ],
    overview: [
      {
        heading: 'What Qualifies as Emergency',
        content: 'Any plumbing failure causing active water damage, sewage exposure, or loss of essential water service. This includes: burst pipes, slab leaks, sewer backups, water heater failures, gas leaks (with plumbing involvement), frozen pipes that have burst, and main water line breaks. We prioritize these calls over scheduled work because minutes matter when water is flowing where it shouldn\'t be.',
      },
      {
        heading: 'What to Do Before We Arrive',
        content: 'Step 1: Shut off the water. Use the fixture shutoff if you know the source, or the main shutoff at the meter. Step 2: Turn off the water heater (gas: turn to "pilot"; electric: flip the breaker) to prevent damage from heating an empty tank. Step 3: Open faucets to drain remaining pressure. Step 4: Move valuables away from standing water. Step 5: Document damage with photos for insurance.',
      },
      {
        heading: 'What Changes on an After-Hours Call',
        content: 'After-hours work carries a dispatch premium over scheduled service — that covers the on-call plumber, the dispatcher, and a truck rolling out of Easley at 2 AM instead of 9 AM. The repair itself is priced the same as it would be on a Tuesday morning. What actually moves an emergency bill is what moves any plumbing bill: what failed and how hard it is to reach. A burst line in an open crawlspace is a short repair. The same failure inside a finished wall or under a slab has to be located first — pressure testing, acoustic listening, sometimes a camera — before anyone cuts anything. A water heater that has dumped its tank might be a straight same-day swap, or a swap plus a pan, a new shutoff, and a drain line the original install never had. And every hour the water keeps running grows the restoration side, which is almost always the bigger number. The premium for calling at 2 AM is small against what the water does by 6 AM.',
      },
      {
        heading: 'Water Damage Prevention',
        content: 'Every hour of standing water increases damage exponentially. Drywall absorbs water and grows mold within 24–48 hours. Hardwood floors cup and buckle within hours. Carpet and pad become unsalvageable quickly. Our goal is to stop the water source immediately, then repair the cause. We can also recommend water damage restoration specialists if the damage requires it — and we document everything for your insurance claim.',
      },
    ],
    warningSigns: [
      { trigger: 'Water spraying from a pipe, fitting, or appliance', detail: 'Active pressurized water leak. Shut off the nearest valve immediately. If you can\'t find the source, shut off the main water supply at the meter and call us.' },
      { trigger: 'Sewage backing up into bathtub, shower, or floor drain', detail: 'The main sewer line is blocked. Stop using all water in the house immediately — every flush and drain use adds to the backup. This is a health hazard requiring immediate professional response.' },
      { trigger: 'Water pooling on the floor near the water heater', detail: 'The tank may be leaking from the bottom (unrepairable) or from a fitting (repairable). Turn off the gas/electric supply to the heater and the cold water inlet valve on top of the tank.' },
      { trigger: 'Sudden loss of all water pressure', detail: 'Either the main shutoff was accidentally closed, a main line break occurred, or the utility has an issue. Check your shutoff valve first, then check with neighbors. If it\'s just your home, the main supply line may have failed.' },
      { trigger: 'Ceiling is bulging or dripping water', detail: 'A pipe above is leaking and water is pooling above the ceiling material. This can collapse suddenly. Puncture the bulge with a screwdriver (aim into a bucket) to relieve the weight and prevent ceiling collapse, then call us.' },
      { trigger: 'Gas smell combined with water leak', detail: 'If a plumbing failure has also damaged a gas line (not uncommon in older homes), evacuate immediately and call 911 first, then call us. Gas leaks take priority over water damage.' },
    ],
    maintenanceTips: [
      { tip: 'Know where every shutoff valve is in your home', detail: 'Main shutoff, water heater, toilets, sinks, washing machine, ice maker, outdoor hose bibs. Label them if needed. In an emergency, knowing which valve to turn saves thousands in damage.' },
      { tip: 'Install a water leak detection system', detail: 'Battery-powered smart detectors sit near water heaters, washing machines, and under sinks and alert your phone at the first sign of water — each one takes about a minute to place. Whole-house automatic shutoff systems go further and close the main valve themselves; they need a spot on the main line and power nearby, which is what decides whether one fits your setup.' },
      { tip: 'Disconnect outdoor hoses before freezing weather', detail: 'A connected hose traps water in the hose bib, which freezes and cracks the fitting or pipe behind the wall. This is one of the most common — and most preventable — calls we run every winter, and it climbs the further up into the foothills you go.' },
      { tip: 'Know your insurance coverage for water damage', detail: 'Most homeowner\'s policies cover sudden, accidental water damage (burst pipe) but not gradual damage (slow leak you ignored). Review your policy before you need it — especially the deductible and coverage limits.' },
      { tip: 'Keep our number saved in your phone', detail: 'When a pipe bursts at midnight, you don\'t want to be searching Google in a panic. Save our number now: (864) 304-0139.' },
    ],
    processSteps: [
      { num: '01', title: 'Emergency Call', description: 'Call us. Describe what\'s happening — where the water is coming from, how much, and whether you\'ve been able to shut it off. We\'ll talk you through immediate steps while we dispatch.' },
      { num: '02', title: 'Rapid Response', description: 'We arrive as quickly as possible with a fully stocked truck. First priority: stop the water. We locate and close the appropriate shutoff, then assess the damage scope.' },
      { num: '03', title: 'Diagnose & Repair', description: 'Once the water is stopped, we identify the failure point and make the repair — pipe patch, fitting replacement, water heater swap, or drain clearing. If the repair requires parts we don\'t carry, we make a temporary fix to restore service and return for the permanent repair.' },
      { num: '04', title: 'Restore Service', description: 'We verify the repair is solid, restore water service, and check all connected fixtures for proper operation. If additional work is needed (water heater replacement, re-pipe section), we schedule it at non-emergency rates.' },
      { num: '05', title: 'Document & Advise', description: 'We document the failure, the repair, and any visible water damage — photos and a written summary for your insurance claim. We recommend next steps for water damage mitigation and any preventive upgrades.' },
    ],
    faq: [
      { q: 'Do you charge extra for emergency calls?', a: 'Yes — after-hours dispatch carries a premium over our standard service call rate, and we tell you what it is on the phone before a truck rolls. The repair itself is priced the same as scheduled work. The premium covers the dispatcher, the on-call plumber, and rapid-response logistics. It\'s a fraction of the additional damage caused by waiting until morning.' },
      { q: 'How fast can you respond to an emergency?', a: 'Our goal is same-day response for all emergencies, with priority given to active water damage and sewage backups. Our trucks run out of the Easley and Greenville area, so how far out you sit factors into the ETA alongside current call volume — a call in Pickens County moves faster than one deep into the mountains or across the Georgia line. We\'ll give you an honest number when you call, not a promise we can\'t keep.' },
      { q: 'What should I do while waiting for you to arrive?', a: 'Shut off the water (main shutoff if you can\'t isolate the source). Turn off the water heater. Open faucets to drain remaining pressure. Move valuables away from standing water. Take photos of the damage for insurance. Mop up standing water if safe to do so.' },
      { q: 'Will my insurance cover this?', a: 'Most homeowner\'s policies cover sudden, accidental plumbing failures (burst pipes, water heater failures). They typically don\'t cover damage from gradual leaks or deferred maintenance. We document everything to support your claim. File with your insurer promptly — most require notice within 24–48 hours.' },
    ],
    costData: [
      { item: 'Emergency Dispatch Fee', cost: 'After-hours, weekend, or holiday — quoted on the phone before we roll', lifespan: 'N/A' },
      { item: 'Burst Pipe Repair', cost: 'Open crawlspace run versus finished wall, and how much drywall opens', lifespan: '20+ years' },
      { item: 'Emergency Sewer Clearing', cost: 'Cleanout access, how deep the blockage sits, camera pass afterward', lifespan: 'Varies' },
      { item: 'Same-Day Water Heater Replacement', cost: 'Unit availability, plus pan, shutoff, and drain the old install skipped', lifespan: '8–12 years' },
      { item: 'Slab Leak Detection & Repair', cost: 'Locating comes first — then reroute overhead or open the slab', lifespan: '20+ years' },
    ],
    seoKeywords: ['emergency plumber Greenville SC', '24 hour plumber Easley SC', 'burst pipe repair near me', 'emergency plumbing service Anderson SC'],
  },
];
