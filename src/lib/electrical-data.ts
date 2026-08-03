// ═══════════════════════════════════════════════════════════════
//  ELECTRICAL SUB-SERVICE DATA
//  8 detailed sub-service pages for /services/electrical/[sub]
// ═══════════════════════════════════════════════════════════════

import type { SubService } from './sub-service-types';
export type ElectricalSubService = SubService;

export const ELECTRICAL_SUB_SERVICES: ElectricalSubService[] = [

  // ═══ 1. PANEL UPGRADES ═══
  {
    id: 'panel-upgrades',
    slug: 'panel-upgrades',
    title: 'Panel Upgrades',
    tagline: 'The Foundation of Every Modern Electrical System',
    heroDescription: 'Your electrical panel is the heart of your home\'s power system. If it can\'t keep up with modern demands — EV chargers, heat pumps, smart appliances — everything downstream suffers. RO\'s licensed electricians handle upgrades from 100A to 200A and beyond, with full permitting, inspection, and code compliance.',
    heroImage: '/images/services/electrical/subs/panel-upgrades-hero.jpg',
    cardImage: '/images/services/electrical/subs/panel-upgrades-card.jpg',
    galleryImages: [
      '/images/services/electrical/subs/panel-upgrades-hero.jpg',
      '/images/services/electrical/subs/electrician-switchboard.jpg',
      '/images/services/electrical/subs/panel-color-wiring.jpg',
      '/images/services/electrical/subs/electrician-working-panel.jpg',
      '/images/services/electrical/panel-closeup.jpg',
      '/images/services/electrical/electrician-panel.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'An electrical panel upgrade replaces your home\'s main breaker panel — the metal box where all your circuits originate — with a higher-capacity unit. Most older homes have 100-amp panels, which were adequate when homes had fewer appliances. Modern homes with central AC, EV chargers, hot tubs, and electric ranges need 200 amps or more. The upgrade involves replacing the panel, breakers, and often the service entrance cable from the utility meter.',
      },
      {
        heading: 'When You Need It',
        content: 'The most common triggers: you\'re adding an EV charger (requires a dedicated 40-60A circuit), installing a heat pump or tankless water heater, renovating with additional circuits, or your current panel is a Federal Pacific or Zinsco brand (both recalled for fire risk). If your breakers trip frequently, your lights flicker when appliances cycle, or you still have a fuse box, an upgrade isn\'t optional — it\'s overdue.',
      },
      {
        heading: 'What Drives the Number',
        content: 'The panel itself is the small part. What moves a panel job is how far past a straight swap it goes: a 200A service needs a service entrance cable, meter base, and mast rated for 200A, and if yours are undersized they all get rebuilt in the same visit. Circuit count matters too — every circuit you land in a new panel has to meet current AFCI and GFCI rules, so a 30-circuit house buys more breakers than a 16-circuit one. Going to 400A is not a bigger version of the same job; it is two 200A panels and a heavier utility feed. Timing is the predictable part: most upgrades finish in one day, your power is off 4–8 hours during the swap, and the utility disconnect has to be scheduled ahead — that lead time, not our labor, is usually what sets your install date. Permit and final inspection are on every one we do. We price from your actual panel and load calculation, after the cover comes off.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'South Carolina summers push HVAC systems hard, and more homeowners are adding EV chargers, pool pumps, and workshop circuits. A 100A panel can\'t safely handle these loads simultaneously. Beyond capacity, older panels may not meet current NEC code requirements for arc-fault (AFCI) and ground-fault (GFCI) protection — both of which are enforced during any permitted electrical work in SC.',
      },
    ],
    warningSigns: [
      { trigger: 'Breakers tripping frequently on the same circuit', detail: 'A breaker that trips repeatedly is telling you the circuit is overloaded or the breaker itself is failing. This is the most common sign your panel can\'t handle your home\'s electrical load.' },
      { trigger: 'Flickering or dimming lights when appliances turn on', detail: 'When your AC, dryer, or microwave pulls power and your lights dip, the panel is being pushed to its limits. Voltage drops across an overtaxed panel affect every circuit.' },
      { trigger: 'Warm or hot panel cover', detail: 'Heat on the panel enclosure means connections inside are loose or corroding, creating resistance and heat. This is a fire hazard requiring immediate attention.' },
      { trigger: 'Burning smell near the panel', detail: 'Melting wire insulation or overheated connections. Shut off the main breaker and call immediately — this is an emergency.' },
      { trigger: 'You still have a fuse box', detail: 'Fuse boxes haven\'t been installed since the 1960s. They lack modern safety features and can\'t be expanded for new circuits. Insurance companies increasingly refuse to cover homes with fuse boxes.' },
      { trigger: 'Panel is Federal Pacific or Zinsco brand', detail: 'Both brands have documented failure rates where breakers don\'t trip during overloads. The Consumer Product Safety Commission linked Federal Pacific panels to thousands of fires. Replacement is strongly recommended regardless of symptoms.' },
      { trigger: 'Corrosion or rust visible on the panel', detail: 'Moisture has entered the enclosure. Corroded bus bars and connections create hot spots and unreliable breaker operation.' },
      { trigger: 'You\'re planning to add an EV charger, hot tub, or major appliance', detail: 'A Level 2 EV charger alone needs 40–60 amps. If your panel is already near capacity, adding large loads without upgrading risks chronic overloading.' },
    ],
    maintenanceTips: [
      { tip: 'Test your breakers annually', detail: 'Flip each breaker off and back on once a year. Breakers that are stuck or difficult to toggle may be failing. AFCI and GFCI breakers have a test button — press it monthly.' },
      { tip: 'Keep the area around your panel clear', detail: 'NEC requires 36 inches of clear space in front of your panel for safe access during emergencies. Don\'t store anything against or near it.' },
      { tip: 'Watch for signs of moisture', detail: 'Outdoor panels and basement panels are vulnerable to condensation. Check for rust, green corrosion on copper, or water stains inside the cover.' },
      { tip: 'Label every circuit accurately', detail: 'A properly labeled panel lets you (or an electrician) quickly isolate circuits during emergencies or repairs. Mislabeled panels waste time and create safety risks.' },
      { tip: 'Schedule a professional inspection every 5 years', detail: 'A licensed electrician can check torque on connections, inspect for heat damage, verify grounding, and confirm your panel meets current code — things you can\'t see from outside.' },
    ],
    processSteps: [
      { num: '01', title: 'Assessment & Load Calculation', description: 'We evaluate your current panel, calculate your home\'s total electrical load (existing + planned additions), and determine the right amperage. You get a written estimate with full scope.' },
      { num: '02', title: 'Permit & Utility Coordination', description: 'We pull the electrical permit and coordinate with your utility company for the service disconnect. No shortcuts — permitted work protects your home\'s value and insurance coverage.' },
      { num: '03', title: 'Panel Swap', description: 'We disconnect power, remove the old panel, install the new panel with properly sized breakers, and reconnect all circuits. Service entrance cable is replaced if undersized.' },
      { num: '04', title: 'Testing & Labeling', description: 'Every circuit is tested for proper voltage, grounding, and breaker function. We label every circuit clearly and verify AFCI/GFCI protection where code requires it.' },
      { num: '05', title: 'Inspection & Energize', description: 'The local inspector verifies our work meets NEC code. Once passed, power is restored and we walk you through your new panel — what each breaker controls, how to test safety features, and when to call us.' },
    ],
    faq: [
      { q: 'How long will my power be off during a panel upgrade?', a: 'Typically 4–8 hours. We schedule the utility disconnect early in the morning so power is restored by afternoon. For critical needs (medical equipment, home office), we can coordinate timing or provide temporary power.' },
      { q: 'Do I need a 400-amp panel?', a: 'Most homes do fine with 200 amps, even with an EV charger and modern appliances. 400-amp service (two 200A panels) is for large homes with multiple EV chargers, workshops, pools, and heavy HVAC systems. We\'ll calculate your actual load before recommending — we don\'t upsell.' },
      { q: 'Will a panel upgrade fix my flickering lights?', a: 'If the flickering is caused by an overtaxed panel, yes. But flickering can also come from loose connections, faulty breakers, or utility-side issues. We diagnose the root cause before recommending an upgrade.' },
      { q: 'Does my insurance require a panel upgrade?', a: 'Many insurers in SC are flagging homes with Federal Pacific, Zinsco, and fuse-box panels. Some deny coverage or raise premiums. A 200A upgrade with modern breakers typically satisfies any insurer and can reduce your premium.' },
      { q: 'Can I upgrade my panel myself?', a: 'No. Panel work requires a licensed electrician, an electrical permit, and a final inspection in South Carolina. DIY panel work is illegal for homeowners, dangerous, and will void your insurance if something goes wrong.' },
    ],
    costData: [
      { item: '100A to 200A Upgrade', cost: 'Target amperage, circuit count, whether the service entrance gets replaced', lifespan: '25–40 years' },
      { item: 'New Service Entrance Cable', cost: 'Run length from meter to panel; condition of the mast and weatherhead', lifespan: '30+ years' },
      { item: '200A to 400A Upgrade', cost: 'Two panels, a heavier utility feed, longer disconnect scheduling', lifespan: '25–40 years' },
      { item: 'Federal Pacific / Zinsco Replacement', cost: 'Circuit count, plus whether old branch wire is long enough to reland', lifespan: '25–40 years' },
      { item: 'Sub-Panel Addition', cost: 'Distance from the main panel, feeder size, open walls or finished', lifespan: '25–40 years' },
    ],
    seoKeywords: ['electrical panel upgrade Greenville SC', 'panel upgrade 200 amp', 'electrical panel replacement Upstate SC', 'breaker box upgrade near me'],
  },

  // ═══ 2. WHOLE-HOUSE REWIRING ═══
  {
    id: 'whole-house-rewiring',
    slug: 'whole-house-rewiring',
    title: 'Whole-House Rewiring',
    tagline: 'Old Wiring Out. Modern Safety In.',
    heroDescription: 'Homes with knob-and-tube or aluminum wiring are ticking clocks. Aluminum wiring makes a home 55 times more likely to develop fire-hazard conditions. RO\'s licensed electricians replace outdated wiring with modern copper systems — bringing your home up to code, satisfying insurance requirements, and eliminating hidden dangers behind your walls.',
    heroImage: '/images/services/electrical/subs/rewiring-hero.jpg',
    cardImage: '/images/services/electrical/subs/rewiring-card.jpg',
    galleryImages: [
      '/images/services/electrical/subs/rewiring-exposed.jpg',
      '/images/services/electrical/rewiring-work.jpg',
      '/images/services/electrical/subs/electrician-working-panel.jpg',
      '/images/services/electrical/subs/electrician-outlet-work.jpg',
      '/images/services/electrical/outlet-installation.jpg',
      '/images/services/electrical/subs/panel-color-wiring.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Whole-house rewiring replaces all the electrical wiring hidden inside your walls, attic, and crawlspace. This includes the branch circuit wires running from your panel to every outlet, switch, and fixture in the home. Modern rewiring uses NM-B (Romex) copper cable rated for current loads, with dedicated circuits for high-draw appliances and AFCI/GFCI protection where code requires it.',
      },
      {
        heading: 'When It\'s Necessary',
        content: 'Three scenarios demand rewiring: (1) Your home has knob-and-tube wiring (pre-1940s) — no ground wire, degraded fabric insulation, and no capacity for modern loads. (2) Your home has aluminum branch wiring (1965–1973) — aluminum expands and contracts more than copper, loosening connections and creating hot spots. Homes with aluminum wiring are 55 times more likely to develop fire hazard conditions. (3) Major renovation of any older home — once you open walls, code requires updated wiring.',
      },
      {
        heading: 'Scope, Access & Schedule',
        content: 'A rewire is scoped off access, not square footage alone. A house with a walkable attic and a full crawlspace lets us fish most runs without opening walls. A two-story on a slab with finished ceilings means cutting, patching, and painting — and wall repair is a real line item on a rewire, not a rounding error. Circuit count drives it too: every new circuit lands under current AFCI and GFCI rules, and each high-draw appliance gets its own home run. Plaster and lath, balloon framing, blown-in insulation, and knob-and-tube spliced inside walls with no junction boxes all slow the pull down, and you don\'t know which of those you have until we open the first bay. Plan on 3–7 days for the wiring itself, plus drywall and paint time behind it — we sequence our in-house drywall team so the two phases don\'t sit waiting on each other. The rough-in inspection has to pass before anything gets closed up, so that inspector visit sits in the middle of your schedule, not at the end.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'South Carolina\'s heat and humidity accelerate insulation degradation in older wiring. Many pre-1975 homes in the Upstate still have original wiring that\'s 50+ years old. Beyond safety, insurance companies are increasingly refusing to write policies on homes with knob-and-tube or aluminum wiring. A rewire protects your family, satisfies insurers, and dramatically increases your home\'s value.',
      },
    ],
    warningSigns: [
      { trigger: 'Your home was built before 1975 and has never been rewired', detail: 'Wiring from this era is approaching or past its intended lifespan. Even if it "works," degraded insulation and outdated gauge wire create hidden risks.' },
      { trigger: 'Outlets are warm to the touch', detail: 'Warm outlets indicate high resistance at connections — a hallmark of aluminum wiring oxidation or loose connections behind the wall.' },
      { trigger: 'Burning smell from outlets or switches with no visible cause', detail: 'Insulation is likely melting or connections are arcing behind the wall. This requires immediate investigation.' },
      { trigger: 'Two-prong outlets throughout the home', detail: 'Two-prong outlets mean no ground wire — the home predates grounding requirements. This isn\'t just inconvenient; it\'s a shock hazard with any fault.' },
      { trigger: 'Insurance company flagged or denied coverage', detail: 'If your insurer has raised rates or denied coverage due to wiring type, a rewire is the only permanent solution. We provide documentation for your insurer.' },
      { trigger: 'Discolored or scorched outlet covers', detail: 'Browning or scorch marks on outlet plates indicate arcing or excessive heat. Remove the cover plate and look for melted plastic or blackened wires — then call us.' },
      { trigger: 'Rodent activity in the attic or crawlspace', detail: 'Rodents chewing through wire insulation is a leading cause of electrical fires. If you\'ve had pest issues, an electrical inspection should follow the exterminator.' },
    ],
    maintenanceTips: [
      { tip: 'After a rewire, label your new panel completely', detail: 'Modern rewiring includes a new panel. Make sure every circuit is labeled — it makes future troubleshooting and additions much faster.' },
      { tip: 'Test GFCI and AFCI outlets monthly', detail: 'Press the test button, confirm the outlet trips, then reset. These devices protect against shock and arc faults — but only if they\'re working.' },
      { tip: 'Don\'t overload circuits with power strips', detail: 'Even with modern wiring, daisy-chaining power strips can overload a circuit. If you need more outlets, have us add dedicated circuits.' },
      { tip: 'Watch for signs of pest damage', detail: 'Even new wiring can be damaged by rodents. If you see pest activity near the attic or crawlspace, inspect wiring runs for chew marks.' },
      { tip: 'Schedule an inspection before selling', detail: 'A pre-sale electrical inspection documents the age and condition of your wiring — a major selling point if you\'ve rewired and a potential deal-breaker if you haven\'t.' },
    ],
    processSteps: [
      { num: '01', title: 'Whole-Home Assessment', description: 'We inspect every accessible wiring run — panel, attic, crawlspace, and accessible junction boxes. We identify wiring type, age, condition, and map the existing circuit layout.' },
      { num: '02', title: 'Plan & Permit', description: 'We design the new circuit layout with dedicated circuits for high-draw appliances, proper AFCI/GFCI protection, and capacity for future additions. Permits are pulled and utility coordination begins.' },
      { num: '03', title: 'Wiring Installation', description: 'New copper wiring is pulled through walls, attic, and crawlspace — using existing pathways where possible to minimize wall openings. Old wiring is disconnected and removed where accessible.' },
      { num: '04', title: 'Panel Connection & Testing', description: 'All new circuits terminate at the upgraded panel. Every circuit is tested for continuity, proper grounding, and correct voltage. AFCI and GFCI protection is verified.' },
      { num: '05', title: 'Wall Repair & Inspection', description: 'Any wall openings are patched and finished by our drywall team. The final electrical inspection verifies code compliance. You receive documentation of the entire rewire for insurance and resale.' },
    ],
    faq: [
      { q: 'Can you rewire without tearing out all my walls?', a: 'In most cases, yes. We use existing pathways — attic, crawlspace, and interior wall cavities — to run new wire with minimal wall openings. Strategic access points are cut, wires are fished through, and patches are made. Homes with accessible attics and crawlspaces require very few wall cuts.' },
      { q: 'Is aluminum wiring really that dangerous?', a: 'The Consumer Product Safety Commission found that homes with aluminum wiring are 55 times more likely to have fire-hazard conditions at outlets. The problem is the connections — aluminum oxidizes, expands, and loosens over time, creating heat at every junction. "COPALUM" crimps can extend the life of aluminum wiring, but full replacement with copper is the only permanent fix.' },
      { q: 'How long does a whole-house rewire take?', a: 'For a typical 3-bedroom home: 3–5 days for the wiring, plus 1–3 days for wall repairs. We can phase the work so you have power to critical areas each evening. Larger or more complex homes may take 7–10 days total.' },
      { q: 'Will a rewire increase my home\'s value?', a: 'Absolutely. A documented whole-house rewire with modern copper, AFCI/GFCI protection, and an upgraded panel is a significant selling point. It eliminates a common deal-breaker on home inspections and satisfies every insurance company.' },
    ],
    costData: [
      { item: 'Whole-House Rewire (1,500 sq ft)', cost: 'Attic and crawlspace access, circuit count, wall repair behind it', lifespan: '40–50+ years' },
      { item: 'Whole-House Rewire (2,500 sq ft)', cost: 'Second story, longer runs, more finished ceiling to open and close', lifespan: '40–50+ years' },
      { item: 'Wall Repair & Restoration', cost: 'How many bays we had to open, plus texture and paint match', lifespan: 'N/A' },
      { item: 'Knob-and-Tube Replacement', cost: 'Splices buried in walls, no ground path, plaster and lath everywhere', lifespan: '40–50+ years' },
    ],
    seoKeywords: ['whole house rewiring Greenville SC', 'aluminum wiring replacement', 'knob and tube replacement Upstate SC', 'house rewire cost near me'],
  },

  // ═══ 3. GENERATOR INSTALLATION ═══
  {
    id: 'generator-installation',
    slug: 'generator-installation',
    title: 'Generator Installation',
    tagline: 'Your Power Stays On When the Grid Goes Down',
    heroDescription: 'When severe weather knocks out power across the Upstate, a standby generator kicks in automatically — within seconds. RO installs whole-house generators from Generac, Kohler, and Briggs & Stratton, complete with automatic transfer switches, concrete pads, and full electrical integration. No extension cords, no manual startup, no worry.',
    heroImage: '/images/services/electrical/subs/generator-hero.jpg',
    cardImage: '/images/services/electrical/subs/generator-card.jpg',
    galleryImages: [
      '/images/services/electrical/subs/home-generator.jpg',
      '/images/services/electrical/subs/generator-hero.jpg',
      '/images/services/electrical/subs/electrician-switchboard.jpg',
      '/images/services/electrical/switchboard-closeup.jpg',
      '/images/services/electrical/subs/panel-color-wiring.jpg',
      '/images/services/electrical/electrician-fusebox.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'A standby generator is a permanently installed, fuel-powered unit (natural gas or propane) that sits outside your home and connects directly to your electrical panel through an automatic transfer switch (ATS). When utility power drops, the ATS detects the outage, signals the generator to start, and transfers your home\'s electrical load to generator power — typically within 10–30 seconds. When utility power returns, the process reverses automatically.',
      },
      {
        heading: 'Sizing Your Generator',
        content: 'Generators are sized by kilowatts (kW). A 7–10 kW unit covers essential circuits: refrigerator, sump pump, some lights, and a few outlets. A 14–20 kW unit powers most of your home, including central AC. A 22–26 kW+ unit handles the entire home, including electric range and multiple HVAC zones. We perform a full load calculation to recommend the right size — oversizing wastes fuel and money, undersizing leaves you exposed.',
      },
      {
        heading: 'Sizing, Fuel & Schedule',
        content: 'The generator is only part of the job. Sizing sets the floor, and the load calculation picks the size — a unit that carries essential circuits is a different machine than one that carries the whole house with central AC running. After that it is site work and fuel: how far the pad sits from your gas meter or propane tank, whether the gas line has to be upsized to feed the unit at full load (undersized pipe is the single most common reason a generator starts and then stumbles), how far the transfer switch has to run back to your panel, and whether that switch is a whole-home ATS or a smaller essential-circuits switch. Premium brands ask more for quieter enclosures and heavier build — that is a real difference when the pad has to sit near a bedroom window. Schedule: 1–2 days for the set and electrical hookup once the pad has cured, plus a day if gas line work is needed, plus lead time up front for the pad pour, the permits, and the gas inspection. Propane setups add tank placement and the first fill.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'The Upstate sees severe thunderstorms, ice storms, and hurricane remnants that regularly cause multi-day outages. A standby generator isn\'t a luxury — it protects your sump pump from flooding, keeps your fridge and freezer running, maintains HVAC for vulnerable family members, and lets you work from home when the grid is down. For homes with medical equipment, it\'s essential.',
      },
    ],
    warningSigns: [
      { trigger: 'You\'ve experienced multiple power outages lasting more than 4 hours', detail: 'If outages are recurring in your area, the question isn\'t whether you need a generator — it\'s how much another outage will cost you in spoiled food, hotel stays, and lost productivity.' },
      { trigger: 'You have a sump pump protecting a finished basement', detail: 'A power outage during heavy rain means your sump pump stops, and the rain doesn\'t. A flooded finished basement is torn-out drywall, ruined flooring, and mold remediation — a far bigger job than the generator that would have prevented it.' },
      { trigger: 'Someone in your home depends on medical equipment', detail: 'CPAP machines, oxygen concentrators, powered wheelchairs, and medication refrigeration all require uninterrupted power. A standby generator provides it automatically.' },
      { trigger: 'You work from home and can\'t afford downtime', detail: 'Lost work hours during outages add up quickly. A generator keeps your internet, computer, and lights running without interruption.' },
      { trigger: 'Your existing portable generator is a hassle', detail: 'Dragging a portable generator outside, running extension cords, and manually managing which devices get power is inconvenient and limited. A standby unit handles everything automatically.' },
      { trigger: 'You keep a full freezer or a second refrigerator', detail: 'A stocked chest freezer is weeks of groceries. A 24-hour outage without backup means all of it goes in the trash — and it happens again with the next storm, and the one after that.' },
    ],
    maintenanceTips: [
      { tip: 'Run the generator\'s weekly exercise cycle', detail: 'Most standby generators have a scheduled weekly self-test that runs the unit for 10–15 minutes. Make sure this is enabled and listen for it — if it stops running, there\'s a problem.' },
      { tip: 'Check oil and coolant levels quarterly', detail: 'Air-cooled units (most residential) need oil level checks. Liquid-cooled units (larger models) also need coolant. Your owner\'s manual specifies the schedule.' },
      { tip: 'Keep the area around the unit clear', detail: 'Maintain 3 feet of clearance on all sides for airflow and access. Keep bushes trimmed, leaves cleared, and snow removed from the exhaust and air intake.' },
      { tip: 'Schedule annual professional maintenance', detail: 'A technician checks spark plugs, air filter, battery condition, fuel system, transfer switch operation, and load-bank tests the unit. This is the single best thing you can do for longevity.' },
      { tip: 'Test the automatic transfer switch annually', detail: 'The ATS is the brain of the system. An annual test verifies it detects outages correctly and switches loads smoothly. We test this during routine maintenance visits.' },
    ],
    processSteps: [
      { num: '01', title: 'Load Calculation & Sizing', description: 'We calculate your home\'s electrical load and determine the right generator size based on what you need powered during an outage. You get a clear recommendation — not an upsell.' },
      { num: '02', title: 'Site Planning & Permits', description: 'We select the optimal location (setback requirements, noise considerations, fuel access), pour a concrete pad, and pull electrical and gas permits.' },
      { num: '03', title: 'Gas Line & Pad Work', description: 'A gas line is run from your meter or propane tank to the generator location. The concrete pad is poured and cured. For propane setups, we coordinate tank placement and filling.' },
      { num: '04', title: 'Electrical Integration', description: 'The generator is placed, the automatic transfer switch is installed at your panel, and all wiring connections are made. We program the ATS and set the weekly exercise schedule.' },
      { num: '05', title: 'Testing & Walkthrough', description: 'We simulate a power outage to verify automatic startup, load transfer, and automatic return when power is restored. You get a full walkthrough of operation, maintenance schedules, and warranty documentation.' },
    ],
    faq: [
      { q: 'How quickly does a standby generator start?', a: 'Within 10–30 seconds of detecting a power outage. The automatic transfer switch monitors utility power continuously. When it detects a loss, it signals the generator to start and transfers your home\'s load. The entire process is hands-free.' },
      { q: 'Generac or Kohler — which do you recommend?', a: 'Both are good machines. Generac dominates the residential market here, which means parts and service techs are easy to find across the Upstate — that matters in the week after an ice storm when every generator in the county wants attention. Kohler builds a quieter, heavier unit; if the pad has to sit near a bedroom window or close to a property line, that is worth paying for. For most homes the Guardian series in the 16–22 kW range carries the load. We pick from your load calculation and your site plan, not from the brochure.' },
      { q: 'Can a generator power my entire home including AC?', a: 'Yes — with the right size. A 22 kW generator can power most homes including central AC. Larger homes with multiple HVAC zones, electric ranges, and EV chargers may need 26 kW+. We size it to your actual load, not guesswork.' },
      { q: 'How loud is a standby generator?', a: 'Modern standby generators run at 60–70 decibels at 23 feet — similar to a normal conversation or a dishwasher. Kohler units tend to be slightly quieter. They\'re significantly quieter than any portable generator.' },
      { q: 'What fuel should I use — natural gas or propane?', a: 'If you have a natural gas line, use it — unlimited fuel supply, no tank to refill. If natural gas isn\'t available, propane is the standard alternative. Both work equally well. We size the propane tank based on your generator\'s fuel consumption and how long you want to run between refills.' },
    ],
    costData: [
      { item: 'Generac Guardian 16 kW (installed)', cost: 'What the load calc returns, gas line distance, transfer switch type', lifespan: '15–25 years' },
      { item: 'Generac Guardian 22 kW (installed)', cost: 'Whole-home ATS instead of essential circuits; heavier gas feed', lifespan: '15–25 years' },
      { item: 'Kohler 20 kW (installed)', cost: 'Quieter enclosure and heavier build; same site variables apply', lifespan: '15–25 years' },
      { item: 'Gas Line Extension', cost: 'Distance from the meter and pipe size needed at full load', lifespan: '50+ years' },
      { item: 'Concrete Pad', cost: 'Pad footprint, site grading, and truck access for the pour', lifespan: '50+ years' },
    ],
    seoKeywords: ['generator installation Greenville SC', 'whole house generator Upstate SC', 'Generac installer near me', 'standby generator installation cost'],
  },

  // ═══ 4. EV CHARGER INSTALLATION ═══
  {
    id: 'ev-charger-installation',
    slug: 'ev-charger-installation',
    title: 'EV Charger Installation',
    tagline: 'Charge at Home. Wake Up Full Every Morning.',
    heroDescription: 'A Level 2 home charger delivers 25–50 miles of range per hour — a full overnight charge while you sleep. RO installs Tesla Wall Connectors, ChargePoint, JuiceBox, and universal NEMA 14-50 outlets with dedicated 240V circuits, panel capacity verification, and full code compliance. Stop paying for public charging.',
    heroImage: '/images/services/electrical/subs/ev-charger-hero.jpg',
    cardImage: '/images/services/electrical/subs/ev-charger-card.jpg',
    galleryImages: [
      '/images/services/electrical/subs/ev-charger-hero.jpg',
      '/images/services/electrical/subs/ev-charger-wall.jpg',
      '/images/services/electrical/subs/ev-charger-closeup.jpg',
      '/images/services/electrical/subs/ev-plugged-in.jpg',
      '/images/services/electrical/subs/ev-charger-card.jpg',
      '/images/services/electrical/subs/electrician-working-panel.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'A Level 2 EV charger runs on a dedicated 240-volt circuit (like a dryer outlet) and delivers significantly faster charging than the standard Level 1 (120V) cord that comes with your vehicle. Most Level 2 chargers provide 25–50 miles of range per hour, meaning a full charge in 6–10 hours overnight. Installation involves running a dedicated circuit from your panel to the charger location, typically in your garage or on an exterior wall near your parking spot.',
      },
      {
        heading: 'Charger Options',
        content: 'The Tesla Wall Connector is the cleanest option for Tesla owners — up to 48 amps with Wi-Fi and app control. The ChargePoint Home Flex works with any EV and lets you set amperage anywhere from 16 to 50, which matters when your panel can\'t give up a full 60-amp circuit and you need the charger to match what the load calculation allows. The JuiceBox Pro 40 sits in the middle with scheduling and smart features. If you already own the portable EVSE that came with the car and just need somewhere to plug it in, a NEMA 14-50 outlet on its own dedicated circuit is the least hardware for the most range. On most of these jobs the hardware is the smaller half of the bill — the circuit is the bigger half.',
      },
      {
        heading: 'What Drives the Install',
        content: 'The circuit is the job. The biggest single variable is the distance from your panel to where the car actually parks — a charger on the garage wall backing up to the panel is an afternoon; a charger at the far end of a detached garage means conduit, likely a trench, and sometimes a sub-panel. After that: whether your panel has a free two-pole slot and the spare capacity a load calculation says you need for a 40–60 amp circuit, whether the run goes through open garage framing or gets fished through finished walls, and whether it goes outdoors and needs weatherproof conduit, fittings, and a rated disconnect. If the load calc says the service is already full, a panel upgrade comes first and brings utility disconnect scheduling with it — that is the surprise that moves an EV job from one day to two visits. Permit and inspection apply. A 30% federal tax credit covers EV charger installation at your primary residence, hardware and labor both, and we hand you the documentation for it.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Public chargers in the Upstate are still sparse and slow next to charging in your own garage. A Level 2 charger means you stop planning your day around finding a working plug. SC electricity rates sit below the national average, so your cost per mile drops hard against gasoline, and if your utility offers overnight time-of-use rates you can push nearly all of your charging into the lowest-rate hours of the night — a smart charger schedules that for you and you never think about it again. The federal tax credit covers a share of the install on top of that.',
      },
    ],
    warningSigns: [
      { trigger: 'You\'re charging on a standard 120V outlet (Level 1)', detail: 'Level 1 charging delivers only 3–5 miles of range per hour. If you drive more than 30 miles daily, you\'re running a deficit that a Level 2 charger eliminates overnight.' },
      { trigger: 'Your charger trips the breaker when other appliances run', detail: 'If you rigged a 240V outlet without a dedicated circuit, other loads on that circuit cause overloads. A properly installed charger needs its own dedicated breaker.' },
      { trigger: 'You\'re using an extension cord to reach your charging spot', detail: 'Extension cords are a fire risk for EV charging — they weren\'t designed for sustained high-amperage draw. A hardwired charger eliminates this hazard.' },
      { trigger: 'You\'re charging at public stations most weeks', detail: 'Public charging runs roughly three to four times the per-kWh rate of home electricity, and you pay for the drive there and the wait on top. On normal daily mileage, a Level 2 setup at home pays itself back on fuel alone inside the first year or two.' },
      { trigger: 'You\'re considering buying an EV but worried about charging', detail: 'Home charging infrastructure should be installed before or right when you get the vehicle. We can assess your panel and install the charger before delivery day.' },
      { trigger: 'Your garage panel is maxed out', detail: 'If your panel can\'t accommodate a 40–60 amp circuit, a panel upgrade or smart load management device may be needed before the charger can go in.' },
    ],
    maintenanceTips: [
      { tip: 'Keep the charging connector clean and dry', detail: 'Wipe the connector with a dry cloth periodically. Inspect for debris, bent pins, or corrosion. Store the connector in its holster when not in use.' },
      { tip: 'Check the cable for damage regularly', detail: 'Look for cuts, kinks, or exposed wiring. Cables run over by garage doors or dragged across rough surfaces degrade over time.' },
      { tip: 'Update charger firmware when available', detail: 'Smart chargers (Tesla, ChargePoint, JuiceBox) receive firmware updates that improve performance and fix bugs. Check the app periodically.' },
      { tip: 'Verify the dedicated breaker isn\'t tripping', detail: 'Occasional trips during charging indicate a wiring or breaker issue — not normal. Call for a check if it happens more than once.' },
      { tip: 'Consider time-of-use scheduling', detail: 'If your utility offers lower overnight rates, program your charger to start after peak hours. Most smart chargers support scheduling through their app.' },
    ],
    processSteps: [
      { num: '01', title: 'Panel & Site Assessment', description: 'We verify your panel has capacity for a 40–60 amp dedicated circuit, determine the optimal charger location, and measure the wire run distance. If a panel upgrade is needed, we scope that too.' },
      { num: '02', title: 'Charger Selection', description: 'Based on your vehicle, driving habits, and budget, we recommend the right charger. We install any brand — Tesla, ChargePoint, JuiceBox, Grizzl-E, or a simple NEMA outlet.' },
      { num: '03', title: 'Circuit Installation', description: 'We install a dedicated 240V circuit from your panel to the charger location. This includes properly sized wire, conduit (where required), and a dedicated breaker sized to the charger\'s specifications.' },
      { num: '04', title: 'Charger Mounting & Connection', description: 'The charger is mounted (wall or pedestal), hardwired to the dedicated circuit, and configured. We handle the Wi-Fi setup, app pairing, and any scheduling preferences.' },
      { num: '05', title: 'Testing & Walkthrough', description: 'We test the full charge cycle with your vehicle, verify amperage draw, and confirm the app is showing correct data. You get a walkthrough of charger features, scheduling, and your tax credit documentation.' },
    ],
    faq: [
      { q: 'Do I need to upgrade my panel to install an EV charger?', a: 'Not always. A 200-amp panel can typically accommodate a Level 2 charger. If your panel is 100 amps or heavily loaded, an upgrade may be needed. We check this during the initial assessment — no surprises.' },
      { q: 'What\'s the federal tax credit for EV charger installation?', a: 'The federal tax credit covers 30% of the total installation cost (hardware + labor) for EV charging equipment installed at your primary residence. This applies to the charger and all installation work.' },
      { q: 'Can I install a charger outdoors?', a: 'Yes. Most Level 2 chargers are rated for outdoor installation (NEMA 3R or higher). We use weatherproof conduit and connections. Outdoor installs are common when the parking spot is on a driveway or carport rather than a garage.' },
      { q: 'What actually determines what my EV charger install runs?', a: 'Three things, in that order. First, the distance from your panel to the charger — every foot is wire, conduit, and time, and a detached garage or a driveway spot can mean trenching. Second, whether your panel has both a free two-pole slot and the capacity a load calculation says you need for a 40–60 amp circuit; if it doesn\'t, a panel upgrade or a load-management device comes first. Third, what the run passes through: open garage framing is quick, fished finished walls are slow, and outdoors adds weatherproof fittings and a rated disconnect. We measure the run and read the panel before we put a number on it. Guessing at those three is how people end up with a change order halfway through.' },
      { q: 'Tesla Wall Connector or ChargePoint — which should I get?', a: 'If you drive a Tesla, the Wall Connector is the cleanest integration — 48 amps, Tesla app control, and the least hardware hanging on the wall. If you have mixed EVs in the household or think you might switch brands, the ChargePoint Home Flex is the safer bet: it works with every EV and lets you dial the amperage down to match whatever circuit your panel can actually support. On most jobs the difference between the two units is small next to the difference between a 10-foot run and a 60-foot run.' },
    ],
    costData: [
      { item: 'Tesla Wall Connector (installed)', cost: 'Wire run length, free panel capacity, garage wall or outdoors', lifespan: '10–15+ years' },
      { item: 'ChargePoint Home Flex (installed)', cost: 'Same circuit variables, plus the amperage your panel can support', lifespan: '10–15+ years' },
      { item: 'NEMA 14-50 Outlet (installed)', cost: 'Short run through open framing keeps this one simple', lifespan: '20+ years' },
      { item: 'Panel Upgrade (if needed)', cost: 'Triggered by the load calc; adds utility disconnect scheduling', lifespan: '25–40 years' },
    ],
    seoKeywords: ['EV charger installation Greenville SC', 'Tesla Wall Connector installer', 'Level 2 charger installation Upstate SC', 'home EV charging setup near me'],
  },

  // ═══ 5. SOLAR & BATTERY STORAGE ═══
  {
    id: 'solar-battery-storage',
    slug: 'solar-battery-storage',
    title: 'Solar & Battery Storage',
    tagline: 'Generate Your Own Power. Store It. Own It.',
    heroDescription: 'Solar panels cut your electric bill. Battery storage keeps your power on when the grid fails. Together, they\'re the most significant upgrade you can make to your home\'s energy independence. RO installs complete solar-plus-storage systems — Tesla Powerwall, Enphase, and Generac PWRcell — with licensed electrical integration from panel to rooftop.',
    heroImage: '/images/services/electrical/subs/solar-battery-hero.jpg',
    cardImage: '/images/services/electrical/subs/solar-battery-card.jpg',
    galleryImages: [
      '/images/services/electrical/subs/solar-panels-roof.jpg',
      '/images/services/electrical/subs/solar-installation-closeup.jpg',
      '/images/services/electrical/subs/solar-worker-roof.jpg',
      '/images/services/electrical/subs/solar-battery-hero.jpg',
      '/images/services/electrical/subs/solar-battery-card.jpg',
      '/images/services/electrical/subs/electrician-switchboard.jpg',
    ],
    overview: [
      {
        heading: 'Solar Basics',
        content: 'Residential solar panels convert sunlight into electricity that powers your home in real-time and feeds excess back to the grid for credit (net metering). A typical 7–10 kW system covers most of an average home\'s electricity needs. Panels are mounted on your roof or ground-mounted in your yard, connected through an inverter that converts DC power to usable AC. Modern panels are warrantied for 25 years with an expected lifespan of 30+.',
      },
      {
        heading: 'Battery Storage',
        content: 'A home battery stores excess solar energy (or off-peak grid power) and releases it when you need it — at night, during peak rate hours, or during power outages. The Tesla Powerwall 3 is the market leader: 13.5 kWh capacity, 11.5 kW continuous output, 97.5% efficiency, and a built-in solar inverter. Alternatives include the Enphase IQ 5P (modular, 15-year warranty) and Generac PWRcell 2 (best generator integration). One battery typically covers 8–12 hours of essential loads during an outage.',
      },
      {
        heading: 'Payback & What Moves It',
        content: 'System size sets the base, and size comes off twelve months of your actual bills — not a rule of thumb per square foot. From there the roof drives it: pitch, orientation, how many separate roof planes the array has to be split across, shading from trees you are not going to cut down, and whether the decking and shingles have enough life left to carry a 25-year array. Putting panels on a roof with five years in it means paying to pull them and reset them later, so roof age is a scheduling decision as much as a cost one. On the electrical side: distance from the array to the panel, and whether your main panel can take the backfeed breaker or needs a line-side tap. Adding a battery brings its own inverter, transfer gear, and a decision about which circuits stay live in an outage. Payback in SC generally lands in the 7–10 year range against a 25-year panel warranty — the years after payback are the return. Schedule is mostly paperwork: permits, HOA approval where it applies, and the utility interconnection application, then the meter swap and Permission to Operate. The utility side routinely takes longer than the installation does.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'South Carolina gets 210+ sunny days per year — ideal solar conditions. Duke Energy and Dominion offer net metering, crediting you for excess power sent to the grid. The combination of strong sun, reasonable electricity rates, and available incentives makes solar-plus-storage one of the best long-term investments for Upstate homeowners. Add in the backup power benefit during our storm season, and the value goes beyond just savings.',
      },
    ],
    warningSigns: [
      { trigger: 'Your electric bill runs high every month, summer and winter both', detail: 'Consistently high usage is the clearest signal that solar pencils out, because the array is sized against what you actually consume. A properly sized system can eliminate 70–100% of your electric bill.' },
      { trigger: 'You\'ve experienced multiple power outages in the past year', detail: 'Solar alone doesn\'t help during outages (grid-tied systems shut off for safety). But solar + battery storage gives you independent backup power — automatically.' },
      { trigger: 'Your roof is 5–15 years old and in good condition', detail: 'The ideal time to add solar is when your roof has 15–20 years of life remaining. Installing solar on a roof that needs replacement soon means you\'ll pay to remove and reinstall panels.' },
      { trigger: 'You\'re planning to stay in your home for 7+ years', detail: 'Solar payback periods average 7–10 years. If you plan to stay long-term, the return is substantial. Even if you sell, an owned, paid-off system is documented value on the listing — studies consistently show a resale premium over comparable homes without one. A leased system is a different conversation; it transfers to the buyer and not every buyer wants it.' },
      { trigger: 'You want energy independence from the utility', detail: 'A solar-plus-storage system with enough capacity can operate independently of the grid during outages. For some homeowners, reducing dependence on the utility is reason enough.' },
      { trigger: 'Your utility rates keep increasing', detail: 'Electricity rates in SC have risen 15–25% over the past decade. Solar locks in your cost of electricity at installation — immune to future rate hikes for the life of the system.' },
    ],
    maintenanceTips: [
      { tip: 'Keep panels clear of debris and shade', detail: 'Leaves, pollen, and bird droppings reduce output. Most panels self-clean in rain, but a yearly rinse with a garden hose helps. Trim tree growth that creates new shade.' },
      { tip: 'Monitor production through your inverter app', detail: 'All modern systems include monitoring apps. A sudden drop in production indicates a panel issue, inverter fault, or shading problem. Catching it early prevents lost savings.' },
      { tip: 'Check battery state of health annually', detail: 'Batteries degrade slowly over time. Your app shows state of health — expect 90%+ capacity at year 5 and 70%+ at year 10 (warranty minimum). If it drops faster, contact us.' },
      { tip: 'Have the system inspected every 3–5 years', detail: 'A professional inspection checks mounting hardware, wiring connections, inverter performance, and battery condition. Catching loose connections or degrading components early prevents failures.' },
      { tip: 'Don\'t pressure wash your panels', detail: 'High-pressure water can crack glass or damage seals. A garden hose from the ground is all you need. Never walk on panels — they support their own weight, not yours.' },
    ],
    processSteps: [
      { num: '01', title: 'Energy Audit & System Design', description: 'We analyze your electricity usage (12 months of bills), assess your roof orientation and condition, measure available sun exposure, and design a system sized to your actual consumption. No cookie-cutter templates.' },
      { num: '02', title: 'Permitting & Utility Application', description: 'We handle all permits, HOA approvals (if applicable), and the utility interconnection application. This paperwork is the most time-consuming part — we do it so you don\'t have to.' },
      { num: '03', title: 'Roof Mounting & Panel Installation', description: 'Racking is installed on your roof with engineered attachment points. Panels are mounted, wired in series/parallel strings, and routed to the inverter location. All penetrations are sealed and flashed to prevent leaks.' },
      { num: '04', title: 'Battery & Inverter Integration', description: 'The battery and inverter (or hybrid inverter like Powerwall 3\'s built-in) are installed and connected to your electrical panel. Backup circuits are configured — you choose which loads stay on during outages.' },
      { num: '05', title: 'Inspection & Activation', description: 'Final electrical inspection, utility meter swap (for net metering), and Permission to Operate (PTO) from your utility. We activate monitoring, walk you through the app, and explain your production and backup capabilities.' },
    ],
    faq: [
      { q: 'Do solar panels work during power outages?', a: 'Standard grid-tied solar systems shut off during outages for safety (to protect line workers). However, if you have a battery storage system (Tesla Powerwall, Enphase, etc.), your solar panels charge the battery and power your home independently during outages. This is the primary reason to pair solar with storage.' },
      { q: 'What drives what a Tesla Powerwall install comes to?', a: 'Your existing electrical setup, mostly. A newer home with a 200A panel, wall space near it, and a short conduit run is the straightforward version. Older homes push higher: a panel that has to be upgraded first, a backup subpanel built so critical circuits can be separated from the rest, longer runs, or an outdoor location that needs a rated enclosure and shade — heat is what shortens a battery\'s life, so where it hangs is an engineering decision, not a preference. How much of the house you want carried through an outage matters too: backing up the whole panel is different gear than backing up the fridge, the well pump, and the internet. One thing works in your favor — the Powerwall 3 has a solar inverter built in, so on a new solar-plus-battery job you aren\'t buying a separate one.' },
      { q: 'What happens to excess solar power I generate?', a: 'Under net metering, excess power is sent to the grid and credited to your account. You draw from those credits at night or on cloudy days. With battery storage, excess power charges your battery first, then exports to the grid. The combination maximizes both self-consumption and backup capability.' },
      { q: 'How long do solar panels actually last?', a: 'Modern solar panels are warrantied for 25 years at 80–85% of original output. Real-world lifespan is 30–35 years. Degradation is about 0.5% per year — at year 25, your panels are still producing 87%+ of their original output. The inverter is the part that doesn\'t go the distance: plan on replacing it once around year 12–15 as a scheduled mid-life item, not a failure. A string inverter is one unit on a wall and a short swap. Microinverters sit under each panel, so replacing one means getting back on the roof — worth knowing before you choose between them.' },
      { q: 'Are there still tax incentives for solar in 2026?', a: 'The federal residential solar tax credit (Section 25D) at 30% ended December 31, 2025 for customer-owned systems. However, third-party owned systems (leases and PPAs) can still access commercial credits and pass savings to homeowners. SC state incentives and net metering remain available. We help you navigate the current incentive landscape for the best deal.' },
    ],
    costData: [
      { item: 'Solar System (7–10 kW)', cost: 'Array size off your bills, roof planes, shading, panel backfeed capacity', lifespan: '25–35 years' },
      { item: 'Tesla Powerwall 3 (installed)', cost: 'Panel capacity, backup subpanel build, how many circuits stay live', lifespan: '15–20 years' },
      { item: 'Enphase IQ Battery 5P (2 units)', cost: 'Modular — scales with how many hours of storage you want', lifespan: '15+ years' },
      { item: 'Generac PWRcell 2 (installed)', cost: 'Battery module count and whether it ties into a standby generator', lifespan: '10–15 years' },
      { item: 'Inverter Replacement (mid-life)', cost: 'One string unit on a wall, or microinverters needing roof access', lifespan: '12–15 years' },
    ],
    seoKeywords: ['solar panel installation Greenville SC', 'Tesla Powerwall installer Upstate SC', 'home battery storage near me', 'solar and battery installation cost SC'],
  },

  // ═══ 6. SMART HOME & AUTOMATION ═══
  {
    id: 'smart-home-automation',
    slug: 'smart-home-automation',
    title: 'Smart Home & Automation',
    tagline: 'Control Every Circuit From Your Phone',
    heroDescription: 'Smart electrical panels, whole-home energy monitoring, and automation systems that let you control, schedule, and optimize every circuit in your home from a single app. RO installs SPAN Panels, Lutron systems, energy monitors, and smart wiring infrastructure — the backbone that makes everything else work together.',
    heroImage: '/images/services/electrical/subs/smart-home-hero.jpg',
    cardImage: '/images/services/electrical/subs/smart-home-card.jpg',
    galleryImages: [
      '/images/services/electrical/subs/smart-home-tablet.jpg',
      '/images/services/electrical/subs/smart-home-living.jpg',
      '/images/services/electrical/subs/smart-home-hero.jpg',
      '/images/services/electrical/subs/modern-lighting-interior.jpg',
      '/images/services/electrical/subs/panel-color-wiring.jpg',
      '/images/services/electrical/subs/electrician-working-panel.jpg',
    ],
    overview: [
      {
        heading: 'Smart Electrical Panels',
        content: 'The SPAN Panel replaces your traditional breaker panel with a 32-circuit smart panel that lets you control and monitor every circuit from your phone. See real-time energy usage per circuit, set schedules, prioritize circuits during battery backup, and receive alerts. Understand what it is, though: it is a full panel swap, so it carries everything a panel upgrade carries — utility disconnect scheduling, permit, inspection, and a day with your power off — on top of the hardware. That is why it sits at the top of this list. The Lumin Smart Panel is the retrofit path: smart modules clamp onto specific circuits alongside your existing panel, so you get load management on the circuits that matter without pulling the panel out of the wall. If your panel needs replacing anyway, SPAN is doing two jobs at once. If your panel is newer, the retrofit usually makes more sense.',
      },
      {
        heading: 'Energy Monitoring',
        content: 'Even without a smart panel, whole-home energy monitors give you circuit-level visibility into where your power goes. The Emporia Vue uses CT clamps — current-sensing rings that snap around individual circuit wires — so it reads each circuit directly. More clamps means more precision and more time working inside a live panel to place them. The Sense Energy Monitor takes the other approach: two sensors on your main feeders plus machine learning that identifies devices by their electrical signature. Faster install, looser picture. Both feed phone apps with real-time and historical usage, both are small jobs next to anything else on this page, and most homeowners find 10–15% savings from nothing more than seeing where the waste is.',
      },
      {
        heading: 'Automation & Control',
        content: 'Lutron Caseta makes existing lights and fans smart without special bulbs — reliable wireless that keeps working when your internet is down, and it scales one switch at a time, so you can start with the three switches you actually touch every day and grow from there. The one thing to check first is whether your switch boxes have a neutral wire; older homes often ran switch loops without one, and that decides which models will work. For larger homes, Control4 gives you professional-grade automation of lighting, shades, HVAC, security, and audio on one platform — scoped by room count and how many subsystems you tie together. Underneath all of it sits smart wiring infrastructure: Cat6 runs, a low-voltage panel, dedicated circuits for hubs. That is the part that decides whether the system is still reliable in year eight, and it is far less work to install while walls are open than after.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'South Carolina\'s hot summers drive high HVAC costs. Smart energy management — automated schedules, circuit-level monitoring, and load-shedding during peak hours — can cut energy bills by 15–20%. When paired with solar and battery storage, a smart panel like SPAN optimizes how your home generates, stores, and uses power. It\'s also a major resale value driver — 79% of home buyers actively seek smart home features.',
      },
    ],
    warningSigns: [
      { trigger: 'Your electricity bill is high but you don\'t know why', detail: 'Without circuit-level monitoring, you\'re guessing at what\'s consuming the most power. A smart panel or energy monitor reveals the exact culprits.' },
      { trigger: 'You have solar/battery but no visibility into energy flow', detail: 'Without a smart panel, you can\'t see how your solar, battery, and grid power are interacting in real-time. You\'re flying blind on the most expensive system in your home.' },
      { trigger: 'You\'re doing a renovation and opening walls anyway', detail: 'The right time to run smart wiring infrastructure — Cat6, low-voltage panel, dedicated automation circuits — is while the walls are already open. Retrofitting later means opening them a second time, patching, and painting, and that labor multiplies fast.' },
      { trigger: 'You own multiple smart devices that don\'t work together', detail: 'Random smart plugs, bulbs, and switches from different brands create a fragmented system. A unified platform (Lutron, Control4, or SPAN) brings everything under one app.' },
      { trigger: 'You want to manage your home remotely', detail: 'Whether you\'re traveling or at work, smart panels and automation let you monitor energy usage, turn circuits on/off, and receive alerts about unusual consumption — all from your phone.' },
      { trigger: 'Power outages leave you unable to prioritize what stays on', detail: 'A smart panel with battery backup lets you automatically shed non-essential loads (pool pump, water heater) to extend battery life for critical circuits (fridge, internet, medical equipment).' },
    ],
    maintenanceTips: [
      { tip: 'Keep your smart panel firmware updated', detail: 'SPAN and Lumin release regular firmware updates with new features and bug fixes. Enable auto-updates or check quarterly.' },
      { tip: 'Review energy usage reports monthly', detail: 'Most smart panels and monitors generate monthly summaries. Look for unexpected spikes or circuits that are drawing more than expected — it often reveals malfunctioning appliances.' },
      { tip: 'Test your Wi-Fi coverage at the panel location', detail: 'Smart panels need stable Wi-Fi. If your panel is in a garage or basement with weak signal, a mesh Wi-Fi node or dedicated access point nearby ensures reliable app connectivity.' },
      { tip: 'Verify automation schedules seasonally', detail: 'Lighting and HVAC schedules set for summer don\'t make sense in winter. Review and update automation schedules at each season change.' },
      { tip: 'Replace Lutron/smart switch batteries on schedule', detail: 'Pico remotes and some smart switches use coin-cell batteries (3–5 year life). When response becomes sluggish, replace the battery before it dies completely.' },
    ],
    processSteps: [
      { num: '01', title: 'Needs Assessment', description: 'We discuss your goals — energy monitoring, automation, backup optimization, or all three. We evaluate your existing panel, wiring infrastructure, and Wi-Fi coverage to determine what\'s needed.' },
      { num: '02', title: 'System Design', description: 'We design the solution: SPAN Panel vs. Lumin retrofit, energy monitor selection, automation platform choice, and any supporting infrastructure (Cat6 runs, dedicated circuits, Wi-Fi improvements).' },
      { num: '03', title: 'Infrastructure Work', description: 'If needed, we run Cat6 cable, install low-voltage panels, add dedicated circuits for automation hubs, and improve Wi-Fi coverage at critical locations. This is the foundation everything else relies on.' },
      { num: '04', title: 'Panel & Device Installation', description: 'Smart panel swap (if applicable), energy monitor sensor installation, smart switches/dimmers, and hub setup. Everything is configured, paired, and tested on your network.' },
      { num: '05', title: 'Programming & Training', description: 'We program schedules, automations, and backup priorities. You get a hands-on walkthrough of every app, every automation, and how to adjust settings yourself. No "call us to change a setting" dependency.' },
    ],
    faq: [
      { q: 'What\'s the difference between SPAN Panel and Lumin?', a: 'SPAN replaces your entire breaker panel — every circuit is smart and controllable. Lumin retrofits onto your existing panel, adding smart modules to specific circuits. SPAN does more and asks more of the job: it is a full panel swap, which means a utility disconnect, a permit, an inspection, and a day without power. Lumin bolts on beside what you already have — no disconnect, no dark house. If you need a panel upgrade anyway, SPAN is the obvious choice, because you are doing the panel work once instead of twice. If your panel is newer and you just want smart control of a handful of circuits, Lumin is the right tool for that and there is no reason to tear out a good panel.' },
      { q: 'Do I need a smart panel if I don\'t have solar?', a: 'Absolutely. A smart panel provides energy monitoring, circuit scheduling, and load management regardless of whether you have solar. Many homeowners start with a smart panel for visibility, then add solar and battery later — the smart panel makes the entire ecosystem work better.' },
      { q: 'Will smart home upgrades increase my home value?', a: 'Yes. Studies show smart home features increase resale value by up to 5%, and 79% of buyers actively seek homes with smart technology. A SPAN Panel, in particular, is a visible, premium feature that signals a modern, well-maintained electrical system.' },
      { q: 'Can Lutron work with my existing light bulbs?', a: 'Yes — that\'s Lutron\'s key advantage. Lutron Caseta smart dimmers and switches control your existing lights (any bulb type). You don\'t need to replace every bulb with a "smart bulb." The intelligence lives in the switch, not the bulb — one device per room instead of one per socket, and the system keeps working when a bulb burns out.' },
    ],
    costData: [
      { item: 'SPAN Smart Panel (installed)', cost: 'Full panel swap — utility disconnect, permit, inspection, circuit count', lifespan: '20+ years' },
      { item: 'Lumin Smart Panel (installed)', cost: 'Retrofit; scales with how many circuits you want managed', lifespan: '15+ years' },
      { item: 'Emporia Vue Energy Monitor', cost: 'Number of CT clamps and time working inside a live panel', lifespan: '5–10 years' },
      { item: 'Lutron Caseta Starter Kit', cost: 'Grows per switch; depends on a neutral wire in the box', lifespan: '10+ years' },
      { item: 'Control4 Whole-Home System', cost: 'Room count, subsystems tied in, whether the wiring already exists', lifespan: '10–15 years' },
    ],
    seoKeywords: ['smart home electrician Greenville SC', 'SPAN Panel installer', 'home automation wiring Upstate SC', 'smart electrical panel near me'],
  },

  // ═══ 7. LIGHTING DESIGN ═══
  {
    id: 'lighting-design',
    slug: 'lighting-design',
    title: 'Lighting Design',
    tagline: 'The Right Light Changes Everything',
    heroDescription: 'From LED retrofits that cut energy use 75% to landscape lighting that transforms your property after dark — RO\'s electricians handle every aspect of residential and light commercial lighting. Design, installation, smart controls, and low-voltage exterior systems. We wire it, aim it, and make it work with your automation.',
    heroImage: '/images/services/electrical/subs/lighting-hero.jpg',
    cardImage: '/images/services/electrical/subs/lighting-card.jpg',
    galleryImages: [
      '/images/services/electrical/subs/landscape-lighting-path.jpg',
      '/images/services/electrical/subs/exterior-lighting-home.jpg',
      '/images/services/electrical/subs/modern-lighting-interior.jpg',
      '/images/services/electrical/lighting-installation.jpg',
      '/images/services/electrical/subs/smart-home-living.jpg',
      '/images/services/electrical/subs/lighting-hero.jpg',
    ],
    overview: [
      {
        heading: 'Interior Lighting',
        content: 'Interior lighting design goes beyond swapping bulbs. We plan layouts with layers — ambient (general room lighting), task (kitchen counters, reading areas), and accent (artwork, architectural features). Recessed LED downlights are the modern standard for ambient light, offering clean aesthetics and 25,000–50,000 hour lifespans. Under-cabinet LED strips, pendant fixtures, and cove lighting create depth and character that overhead-only lighting can\'t match.',
      },
      {
        heading: 'Landscape & Exterior',
        content: 'Low-voltage (12V) LED landscape lighting transforms your property after dark. Uplighting trees and architectural features, path lights for walkways, step lights for safety, wall wash for texture, and security floodlights for peace of mind. Low-voltage systems are safe (no shock risk), energy-efficient, and easy to expand. We design with warm white (2700K–3000K) for inviting ambiance and position fixtures to avoid light pollution and glare.',
      },
      {
        heading: 'Smart Lighting Controls',
        content: 'Lutron Caseta dimmers and switches make any existing fixture smart — controllable from your phone, voice assistants, or scheduled automatically. Scene control lets you set "Movie Night," "Dinner," or "Wake Up" lighting with one tap. Motion sensors in closets, garages, and hallways eliminate switches entirely. For whole-home integration, Lutron pairs with Control4, Apple HomeKit, and all major platforms.',
      },
      {
        heading: 'LED Retrofits',
        content: 'Replacing incandescent and CFL fixtures with LED equivalents cuts lighting energy by 75–80%. LEDs last 25,000–50,000 hours (vs. 1,000 hours for incandescent), produce less heat (reducing AC load), and offer better color quality than ever before. A whole-house LED retrofit typically pays for itself in 12–18 months through energy savings alone. We handle fixture selection, dimmer compatibility, and color temperature matching throughout your home.',
      },
    ],
    warningSigns: [
      { trigger: 'You\'re still running incandescent or halogen bulbs', detail: 'These consume 4–5x more energy than LED equivalents and generate significant heat. Replacing them is the single fastest return on any electrical investment.' },
      { trigger: 'Rooms feel dim or unevenly lit', detail: 'Poor lighting layout — too few fixtures, wrong placement, or single-point overhead lighting — makes spaces feel smaller and less functional. A lighting redesign solves this.' },
      { trigger: 'Your exterior has no lighting after dark', detail: 'Unlit walkways, stairs, and entries are trip hazards and security vulnerabilities. Landscape lighting is also the one electrical upgrade your neighbors can see — it changes how the house reads from the street after dark, which matters if you ever list it.' },
      { trigger: 'You can\'t dim your lights', detail: 'Non-dimmable fixtures limit ambiance and waste energy. Modern LED fixtures and smart dimmers give you full control from 0–100%.' },
      { trigger: 'Flickering when using dimmer switches', detail: 'Old dimmers weren\'t designed for LED loads. LED-compatible dimmers (like Lutron) eliminate flickering and provide smooth, silent dimming.' },
      { trigger: 'High lighting energy costs on your bill', detail: 'If lighting represents more than 15% of your electric bill, LED retrofits and smart scheduling will make a significant dent. Most homes see 30–40% lighting cost reduction.' },
    ],
    maintenanceTips: [
      { tip: 'Clean fixtures and lenses annually', detail: 'Dust, bugs, and grime reduce light output. Clean recessed cans, landscape fixture lenses, and exterior sconces once a year for full brightness.' },
      { tip: 'Replace landscape transformer if output drops', detail: 'Low-voltage transformers last 10–15 years. If your landscape lights are noticeably dimmer, the transformer may be degrading. We can test output voltage on-site.' },
      { tip: 'Check landscape wire connections after winter', detail: 'Frost heave and ground movement can loosen buried wire connections. A spring check prevents intermittent failures during summer entertaining season.' },
      { tip: 'Update dimmer switches when changing bulb types', detail: 'Switching from incandescent to LED on an old dimmer causes flickering. Always pair LED fixtures with LED-rated dimmers for reliable performance.' },
      { tip: 'Adjust landscape lighting aim seasonally', detail: 'Tree growth, new plantings, and seasonal changes shift the ideal aim of uplights and spotlights. A quick seasonal adjustment keeps your design looking intentional.' },
    ],
    processSteps: [
      { num: '01', title: 'Design Consultation', description: 'We walk your property (interior and exterior) and discuss your vision — what you want highlighted, how you use each space, and your budget. We present a lighting plan with fixture locations, types, and control options.' },
      { num: '02', title: 'Fixture & Control Selection', description: 'We source fixtures matched to your design — recessed, pendant, landscape, or architectural. Dimmer and smart control selections are made. We spec everything before starting work.' },
      { num: '03', title: 'Wiring & Infrastructure', description: 'New circuits are run where needed, low-voltage transformers are placed for exterior work, and smart switch wiring is installed. All wiring is concealed — no visible conduit or exposed cable.' },
      { num: '04', title: 'Fixture Installation & Aiming', description: 'All fixtures are mounted, connected, and precisely aimed. Landscape lights are positioned after dark for optimal effect — we don\'t guess at aim during daylight.' },
      { num: '05', title: 'Programming & Final Walk', description: 'Smart controls are programmed with scenes, schedules, and automation rules. We walk the property at night to verify every light does exactly what the design intended. Adjustments are made on the spot.' },
    ],
    faq: [
      { q: 'What drives the size of a landscape lighting quote?', a: 'Fixture count first — every uplight, path light, and step light is a fixture, a mount, and a waterproof splice. Then run length and how hard the digging is: burying wire across open lawn is quick, trenching under a driveway or through an established root bed is not. Transformer size follows fixture count, and a large property may need more than one, each fed from its own exterior circuit. The other real fork is fixture material. We install commercial-grade brass and copper that will still be aimed where we put it in ten years, not the plastic box-store kits that go milky and fail in two seasons — that choice moves the number more than anything except count. We walk the property before quoting, usually at dusk, because the design decides the count and the count decides the number.' },
      { q: 'Is LED retrofit worth it if my bulbs still work?', a: 'Yes — don\'t wait for bulbs to burn out. The savings start the day they go in and repeat every billing cycle, and a full-house retrofit typically pays for itself inside a year or two on energy alone. There\'s a second return people forget: you stop dragging a ladder out every time a can light quits, because LEDs run 25,000–50,000 hours instead of 1,000. The old bulbs are burning money while you wait on them.' },
      { q: 'What color temperature should I use?', a: 'For most residential applications: 2700K (warm white) for living areas and bedrooms, 3000K for kitchens and bathrooms, and 3500K–4000K for garages and workshops. Exterior landscape lighting looks best at 2700K–3000K. We never use 5000K+ (daylight) in residential — it feels harsh and institutional.' },
      { q: 'Can you add recessed lights to my existing ceiling?', a: 'Yes. We use "remodel" or "retrofit" recessed cans that install into existing ceilings without opening up the entire surface. Access from above (attic) makes it even easier. We can add recessed lighting to virtually any room without major construction.' },
    ],
    costData: [
      { item: 'Whole-House LED Retrofit', cost: 'Fixture count, ceiling height, and old dimmers that need replacing', lifespan: '15–25 years' },
      { item: 'Recessed Lighting (per room)', cost: 'Attic access above, joist layout, and how much ceiling gets patched', lifespan: '20+ years' },
      { item: 'Landscape Lighting System', cost: 'Fixture count, wire run, trenching difficulty, transformer size', lifespan: '15–20 years' },
      { item: 'Lutron Smart Dimmer (per switch)', cost: 'Whether the box has a neutral; LED-rated models to stop flicker', lifespan: '10+ years' },
      { item: 'Under-Cabinet LED Strip', cost: 'Run length, where power comes from, and hiding the driver', lifespan: '15+ years' },
    ],
    seoKeywords: ['lighting design Greenville SC', 'landscape lighting installation Upstate SC', 'LED retrofit electrician near me', 'outdoor lighting installer SC'],
  },

  // ═══ 8. SURGE PROTECTION & SAFETY ═══
  {
    id: 'surge-protection-safety',
    slug: 'surge-protection-safety',
    title: 'Surge Protection & Safety',
    tagline: 'Protect Everything Plugged Into Your Home',
    heroDescription: 'A single lightning strike delivers up to 300 million volts. Your home experiences 20+ smaller power surges every day from appliance cycling alone. RO installs whole-house surge protectors, GFCI/AFCI protection, smoke and CO detectors, and performs comprehensive electrical safety inspections. Protection you can\'t see — until you need it.',
    heroImage: '/images/services/electrical/subs/surge-protection-hero.jpg',
    cardImage: '/images/services/electrical/subs/surge-protection-card.jpg',
    galleryImages: [
      '/images/services/electrical/subs/surge-protector-strip.jpg',
      '/images/services/electrical/subs/electrician-outlet-work.jpg',
      '/images/services/electrical/subs/electrician-switchboard.jpg',
      '/images/services/electrical/subs/panel-color-wiring.jpg',
      '/images/services/electrical/outlet-installation.jpg',
      '/images/services/electrical/socket-repair.jpg',
    ],
    overview: [
      {
        heading: 'Whole-House Surge Protection',
        content: 'A whole-house surge protector installs at your main electrical panel and absorbs voltage spikes before they reach your devices. A Type 2 device — the standard residential option — stops both external surges (lightning, utility switching) and internal ones (AC compressor cycling, motor startup), and those internal spikes are the ones quietly shortening the life of your electronics day after day. The install is short and the variables are few: whether your panel has a free two-pole breaker slot or the device has to go in a box beside the enclosure, and whether your grounding and bonding are actually intact, because a surge protector is only as good as its path to ground. It is the smallest device in the panel standing in front of the most equipment in the house.',
      },
      {
        heading: 'GFCI & AFCI Protection',
        content: 'GFCI (Ground-Fault Circuit Interrupter) outlets detect current leaking to ground — the kind that happens when electricity flows through you. Required by code near water: bathrooms, kitchens, garages, exteriors, laundry rooms. AFCI (Arc-Fault Circuit Interrupter) breakers detect dangerous arcing in wires — the sparking that causes electrical fires. Current NEC code requires AFCI protection in virtually every living space. Both are small devices with outsized consequences — and worth knowing before you plan any electrical work: once you touch a circuit under permit, code brings them along whether you budgeted for them or not. That is the single most common surprise on an otherwise simple job.',
      },
      {
        heading: 'Smoke & CO Detection',
        content: 'Interconnected hardwired smoke detectors (when one triggers, all alarm) are code-required in all bedrooms and hallways. Carbon monoxide detectors are required on every level of a home with gas appliances, fireplaces, or attached garages. We install combination smoke/CO units with 10-year sealed batteries and hardwired interconnection — the highest level of life-safety detection available for residential homes.',
      },
      {
        heading: 'Electrical Safety Inspections',
        content: 'A comprehensive electrical inspection checks your panel condition, wiring type and age, grounding system, GFCI/AFCI protection, smoke detector placement, outlet and switch condition, and code compliance. Recommended every 3–5 years for general maintenance, immediately when buying or selling a home, and before any major renovation. It runs a couple of hours on site and ends in a written report. Scope moves with home size, how many panels and subpanels there are, and how much of the wiring is actually reachable — a full crawlspace and a walkable attic tell us a great deal more than a slab with finished ceilings. It is also the one item on this page that reliably tells you which of the others you actually need.',
      },
    ],
    warningSigns: [
      { trigger: 'You\'ve had electronics fail after a storm', detail: 'Even nearby lightning can send surges through your wiring. If you\'ve lost a TV, router, or appliance after a storm, your home lacks surge protection at the panel level.' },
      { trigger: 'Your GFCI outlets don\'t trip when you press "Test"', detail: 'A GFCI that doesn\'t trip on its test button is no longer providing shock protection. It needs immediate replacement — this is a safety-critical device.' },
      { trigger: 'You have no GFCI outlets in bathrooms or the kitchen', detail: 'Homes built before the 1970s–1990s (depending on the area) may lack GFCI protection entirely. This is one of the most important safety upgrades for older homes.' },
      { trigger: 'Your smoke detectors are more than 10 years old', detail: 'Smoke detectors have a 10-year lifespan regardless of battery condition. The sensor degrades over time and becomes less responsive. Check the manufacture date on the back.' },
      { trigger: 'You hear your breakers buzzing or clicking', detail: 'Audible noise from breakers indicates arcing, loose connections, or failing components. This is a fire hazard — have it inspected immediately.' },
      { trigger: 'Tingling sensation when touching appliances or switches', detail: 'Any electrical tingling means current is flowing where it shouldn\'t. This is a ground fault that GFCI protection would catch. Stop using the fixture and call immediately.' },
      { trigger: 'You\'ve never had an electrical inspection', detail: 'If your home is more than 20 years old and has never been inspected, hidden issues — degraded wiring, failed grounding, non-functional safety devices — may be present.' },
    ],
    maintenanceTips: [
      { tip: 'Test GFCI outlets monthly', detail: 'Press the test button, confirm the outlet loses power, then press reset. Do this in every bathroom, kitchen, garage, and exterior outlet. Takes 30 seconds per outlet.' },
      { tip: 'Test smoke and CO detectors monthly', detail: 'Press the test button on each detector. If the alarm doesn\'t sound loudly, replace the unit immediately. Replace all detectors every 10 years regardless of function.' },
      { tip: 'Check your surge protector indicator light', detail: 'Whole-house surge protectors have LED indicators showing they\'re active. If the light is off, the device may have absorbed a large surge and needs replacement. Check it quarterly.' },
      { tip: 'Replace GFCI outlets that trip intermittently', detail: 'A GFCI that trips without an obvious cause is either detecting a real (small) fault or failing internally. Either way it is a device swap, not a wiring job, and replacing it ends the guessing.' },
      { tip: 'Keep your grounding system intact', detail: 'Don\'t remove or modify ground rods, grounding wire, or bonding connections. Your entire safety system — surge protectors, GFCI, breakers — depends on a solid ground path.' },
      { tip: 'Schedule an inspection every 3–5 years', detail: 'A professional checks what you can\'t see: torque on panel connections, grounding resistance, wire insulation condition, and code compliance. Finding a loose lug on a scheduled visit beats finding it by smell.' },
    ],
    processSteps: [
      { num: '01', title: 'Safety Assessment', description: 'We inspect your panel, grounding, GFCI/AFCI coverage, smoke/CO detectors, and overall wiring condition. You receive a detailed report with findings and prioritized recommendations.' },
      { num: '02', title: 'Surge Protector Installation', description: 'A whole-house Type 2 surge protector is installed directly at your main panel. For homes with sensitive equipment (home offices, media rooms), we add Type 3 point-of-use devices at critical locations.' },
      { num: '03', title: 'GFCI & AFCI Upgrades', description: 'We install GFCI outlets at every code-required location and AFCI breakers for living-space circuits. Older homes typically need 4–8 GFCI outlets and several AFCI breakers to meet current code.' },
      { num: '04', title: 'Smoke & CO Detector Install', description: 'Hardwired, interconnected smoke/CO combination detectors are installed in every bedroom, hallway, and level of the home. All units are tested for interconnection — when one triggers, every detector in the home sounds.' },
      { num: '05', title: 'Documentation & Walkthrough', description: 'You receive a complete inspection report, warranty documentation for installed devices, and a walkthrough of testing procedures. We show you where every safety device is and how to test it yourself.' },
    ],
    faq: [
      { q: 'Is a whole-house surge protector worth it?', a: 'It is the smallest protective device we install and it stands in front of the most equipment — HVAC control boards, heat pump inverters, well pump controls, the panel-mounted electronics in modern ranges and washers, plus every computer and smart device in the house. Control boards are the ones that hurt, because a surge takes out a board and the repair is a service call plus a part you wait a week for. The install is short: a two-pole breaker slot at the main panel, or a box beside it if the panel is full. What we check first is the grounding and bonding — the device only works if it has a solid path to ground. It pays for itself the first time it absorbs a real spike.' },
      { q: 'Do power strips provide the same protection?', a: 'No. Power strips (Type 3) protect individual devices at the outlet. A whole-house surge protector (Type 2) stops surges at the panel before they reach any circuit. Best practice is layered protection: Type 2 at the panel plus Type 3 at sensitive devices. One without the other leaves gaps.' },
      { q: 'How often do I need to replace a whole-house surge protector?', a: 'Every 5–10 years under normal conditions. Large surges degrade the internal components faster. Most units have an LED indicator that shows remaining protection. If the light goes out, the device has done its job and needs replacement.' },
      { q: 'Do I need AFCI breakers if my home is older?', a: 'AFCI breakers aren\'t retroactively required, but they\'re strongly recommended — especially in older homes where wiring connections are more likely to develop arc faults. Any new circuit or panel work triggers the requirement. We recommend adding them proactively for fire safety.' },
      { q: 'What\'s included in an electrical safety inspection?', a: 'We check: panel condition and brand safety, wiring type and visible condition, grounding system integrity, GFCI presence and function, AFCI protection, smoke/CO detector placement and age, outlet and switch condition, visible junction boxes, and code compliance. You receive a written report with photos and prioritized recommendations.' },
    ],
    costData: [
      { item: 'Whole-House Surge Protector (Type 2)', cost: 'Free breaker slot or a box beside the panel; grounding must be sound', lifespan: '5–10 years' },
      { item: 'GFCI Outlet (installed)', cost: 'How many locations, and whether the old boxes are deep enough', lifespan: '10–15 years' },
      { item: 'AFCI Breaker (installed)', cost: 'Breaker type your panel accepts; shared neutrals cause nuisance trips', lifespan: '15–25 years' },
      { item: 'Smoke/CO Combo Detector (installed)', cost: 'Existing interconnect wiring, or new wire pulled to each location', lifespan: '10 years' },
      { item: 'Full Electrical Safety Inspection', cost: 'Home size, number of panels, how much wiring is reachable', lifespan: 'Every 3–5 years' },
    ],
    seoKeywords: ['whole house surge protector Greenville SC', 'electrical safety inspection Upstate SC', 'GFCI outlet installation near me', 'smoke detector installation electrician SC'],
  },
];
