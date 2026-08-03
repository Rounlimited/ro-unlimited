// ═══════════════════════════════════════════════════════════════
//  UNDERGROUND UTILITIES SUB-SERVICE DATA
//  Detail pages for /utilities/[sub], rendered by SubServicePage
//  (the same template behind the septic/roofing/electrical subs).
//
//  VOICE: written for a GC, developer, or building owner — real
//  commercial terminology, but every term unpacked in plain English
//  the first time it appears. Confident, specific, never jargon soup.
//
//  FACTS: figures here are either published standards (OSHA, AWWA,
//  NFPA, SC811, SC DES) or clearly framed as typical ranges. Utility
//  fees cite Greenville Water's published schedule. Where an all-in
//  installed price could not be verified from a public source, the
//  copy says "quoted per job" rather than inventing a number.
// ═══════════════════════════════════════════════════════════════

import type { SubService } from './sub-service-types';
export type UtilitySubService = SubService;

const IMG = '/images/utilities';
const SUB = '/images/utilities/subs';

export const UTILITY_SUB_SERVICES: UtilitySubService[] = [

  // ═══ 1. WATER MAIN TAPS & HOT TAPS ═══
  {
    id: 'water-main-taps',
    slug: 'water-main-taps',
    title: 'Water Main Taps & Hot Taps',
    tagline: 'Connecting to a Live Main Without Shutting Anybody Off',
    heroDescription:
      'A water main tap is the connection where your building’s water branches off the public main in the street. It can be made with the main shut down — a dry tap — or while the main is still full and under pressure, which is called a wet tap or hot tap. RO Unlimited self-performs both, so an occupied building, a shopping center, or a plant next door never loses water while you get your service.',
    heroImage: `${IMG}/jr-hot-tap.jpg`,
    cardImage: `${IMG}/jr-tapping-sleeve.jpg`,
    galleryImages: [
      `${IMG}/jr-hot-tap.jpg`,
      `${IMG}/jr-tapping-sleeve.jpg`,
      `${IMG}/jr-ductile-iron-valve.jpg`,
      `${IMG}/jr-valve-trench.jpg`,
      `${SUB}/waterline-joining-pipe.jpg`,
      `${SUB}/waterline-crew-install.jpg`,
    ],
    overview: [
      {
        heading: 'What It Is',
        content:
          'A hot tap connects a new line to a water main that is still pressurized and in service. A split steel collar called a tapping sleeve is bolted around the outside of the live main. A tapping valve bolts to that sleeve, and a tapping machine mounts to the valve and drills through the pipe wall while every drop of pressure stays contained inside the machine. The disc of pipe cut out — the coupon — is held by a retaining pilot so it can never drop into the main and travel downstream. When the drill retracts, the valve closes and you are left with a permanent, valved connection. Nobody on that line ever lost water.',
      },
      {
        heading: 'When You Need It',
        content:
          'Every ground-up commercial building needs at least one tap, and most need two — one for domestic water and a separate, larger one for the fire sprinkler system. You also need one when a tenant’s use changes and the existing service can no longer supply it: a restaurant, brewery, laundry, car wash, or medical suite going into a shell built for retail. A hot tap specifically is what you want any time the customers on that main cannot go without water — a hospital, school, apartment community, food plant, or occupied shopping center — because taking a public main out of service is not a decision a contractor gets to make on his own, and a depressurized main can trigger a precautionary boil-water advisory for everyone on it.',
      },
      {
        heading: 'Cost & Timeline',
        content:
          'Two separate buckets, and owners are often surprised by the second one. The contractor scope — excavation, shoring, sleeve, valve, testing, backfill, and restoration — is quoted per job, because depth, main material, traffic control, and pavement repair drive it more than tap size does. The utility’s own fees are published and are the owner’s cost no matter who does the work: Greenville Water lists tap fees from $900 for a ¾-inch up to $4,000 for a 12-inch, meter fees from $350 to $1,600 for 5/8-inch through 2-inch, and non-residential capacity fees that run from $2,780 into six figures depending on meter size. The tap itself is roughly a two-hour operation once the pit is open; the full field sequence is typically one to three days. The schedule driver is paperwork, not digging — SC811 locates take three to ten working days, and the water authority’s review and inspection queue is measured in weeks.',
      },
      {
        heading: 'Why It Matters Here',
        content:
          'The Upstate sits in the Piedmont, which means red clay that is slow-draining and prone to shrink and swell. A trench wall that stood up fine on a dry Tuesday can slough after Thursday’s rain, so shoring is a live safety decision on every tap pit, not a box to check. Closer to the Blue Ridge foothills — the Seneca, Walhalla, and Salem corridor especially — granite and gneiss bedrock sit near the surface, which turns a routine trench into hammer work. And the Upstate is not one water system: Greenville Water, Seneca Light & Water, Oconee, Anderson Regional, and the smaller districts each run their own application, approved-materials list, inspector, and fee schedule. Knowing which one you are dealing with before design is worth more than any trick in the field.',
      },
    ],
    warningSigns: [
      {
        trigger: 'Somebody proposes to "just shut the main down"',
        detail:
          'Depressurizing a public main is the water authority’s call, not the contractor’s. It affects every customer on that segment and can trigger a precautionary boil-water advisory. If nobody on the job can tell you who notified the authority and when, stop the work.',
      },
      {
        trigger: 'No pressure test on the sleeve before the pipe is cut',
        detail:
          'The sleeve and valve assembly gets tested through a test port before the drill ever touches the main. Testing after the coupon is out is too late — you have already opened a live main into an unproven joint. If there is no test pump or gauge on site, nothing is being tested.',
      },
      {
        trigger: 'The sleeve was rotated or walked into position on the pipe',
        detail:
          'Sleeve manufacturers are explicit that rotating a mounted sleeve pulls the gasket out of its groove and ruins it. The leak that creates does not show up that day — it shows up months later, under new pavement.',
      },
      {
        trigger: 'Bolts run up with an impact wrench and no torque wrench',
        detail:
          'Tapping sleeve bolts are torqued to a specified value in a specified sequence, from the center outward, alternating sides. Improper torque produces a leaking assembly or damages the pipe wall, and improper blocking under the sleeve makes correct torque impossible in the first place.',
      },
      {
        trigger: 'Petroleum grease on the gasket',
        detail:
          'Only water-soluble lubricant belongs on a sleeve gasket. Oil-based lubricants leave a film that interferes with the seal. It is a small tube of the wrong product and a trench you get to dig twice.',
      },
      {
        trigger: 'Crew in a trench over five feet deep with no box or shoring',
        detail:
          'OSHA requires a protective system at five feet and deeper unless you are in stable rock, with a competent person inspecting daily. At twenty feet the system has to be engineered. This is the most-cited fatal hazard in underground work, and Upstate clay changes behavior with the weather.',
      },
      {
        trigger: 'Old grey pipe with a fibrous, cement-like wall',
        detail:
          'That is likely asbestos-cement main, common in mid-century Upstate infrastructure. Tapping it, cutting it, and disposing of it are regulated activities with worker-protection requirements. It belongs on the schedule and the budget, not discovered at 2pm on a Friday.',
      },
    ],
    maintenanceTips: [
      {
        tip: 'Budget the utility fees separately from the contractor’s price',
        detail:
          'Capacity fees alone run from $2,780 to well over $100,000 for non-residential meters on Greenville Water’s published schedule, and they are yours regardless of who installs the tap. Get the authority’s written fee quote before you set the project budget, not after.',
      },
      {
        tip: 'Size the tap for the building you will have in ten years',
        detail:
          'Upsizing later means a second tap, a second set of fees, and a second cut in the street. Note that taps three inches and larger generally require you to submit anticipated use and flow before the authority will even quote the work.',
      },
      {
        tip: 'Pothole the main during design, not during construction',
        detail:
          'Utility records are approximations. Physically exposing the main to confirm its true size, material, and depth avoids the classic scene of a crew arriving with a sleeve for a 10-inch ductile main and finding an 8-inch asbestos-cement pipe.',
      },
      {
        tip: 'Put the tap somewhere you can get back to it',
        detail:
          'Do not let the tap and valve end up under a future loading dock, dumpster pad, or drive-through lane. Record the as-built location and valve box position in your facility file the day it gets covered up.',
      },
      {
        tip: 'Keep domestic and fire service paperwork separate',
        detail:
          'They carry different fees, different backflow requirements, different inspectors, and often different reviewers. Combining them into one submittal is one of the most common reasons a package comes back rejected.',
      },
      {
        tip: 'Start locates and the utility application earlier than feels necessary',
        detail:
          'SC811 requires notice no less than three and no more than ten working days before digging, and marks stay valid fifteen working days. The authority’s review and inspection scheduling, not the excavation, is usually what decides whether you hit your certificate of occupancy date.',
      },
    ],
    processSteps: [
      { num: '01', title: 'Application & Utility Coordination', description: 'Submit the tap application to the water authority, pay tap, capacity, and meter fees, and get size and location approved — taps over two inches usually mean the owner furnishes the tapping materials.' },
      { num: '02', title: 'Engineering & Permitting', description: 'Sealed plans where required, SC DES construction permitting or the authority’s delegated review, plus encroachment and traffic control permits if the tap falls in a right-of-way.' },
      { num: '03', title: 'Locate & Pothole', description: 'SC811 ticket three to ten working days ahead, verify the marks, then physically expose the main to confirm its real size, material, and depth before anyone orders a sleeve.' },
      { num: '04', title: 'Excavate & Shore', description: 'Open the tap pit and install a protective system at five feet and deeper — trench box, shoring, or sloping — with a competent person inspecting daily.' },
      { num: '05', title: 'Set the Tapping Sleeve', description: 'Clean the main, set the split sleeve without rotating it, use water-soluble lubricant only, and torque the bolts from the center outward to the manufacturer’s value.' },
      { num: '06', title: 'Test Before Cutting', description: 'Bolt on the tapping valve and pressure-test the sleeve assembly through its test port — before the drill ever touches the main. No leak is acceptable.' },
      { num: '07', title: 'Make the Tap', description: 'Mount the tapping machine, advance the cutter, take the coupon, confirm the retaining pilot has it, retract fully, and close the valve. The main stays in service throughout.' },
      { num: '08', title: 'Tie In, Backfill & Restore', description: 'Connect the branch with restrained joints or thrust blocking, set the valve box to grade, backfill in compacted lifts with tracer wire and marking tape, then restore pavement and landscaping to the authority’s standard.' },
    ],
    faq: [
      { q: 'Will anyone lose water while you make the tap?', a: 'No — that is the entire point of a hot tap. The main stays pressurized and in service the whole time. Water pressure is contained inside the tapping machine while the cut is made, and the valve is closed before the machine comes off.' },
      { q: 'Then why would anyone do a dry tap?', a: 'Because sometimes the main is already down. New mains not yet in service, a planned system overhaul, or a repair that is already isolating that segment are all cases where a dry tap is simpler, cheaper, and lets you inspect more thoroughly before the line goes into service.' },
      { q: 'How large a branch can you take off an existing main?', a: 'It depends on the method. Tapping directly into ductile iron is limited by pipe size — up to a 2-inch tap on 24-inch and larger pipe. A service saddle or clamp maxes out at a 2-inch outlet. Anything bigger needs a tapping sleeve and valve, and the AWWA standard covering fabricated steel and stainless sleeves runs from 4-inch through 48-inch pipe with outlets through 36 inches.' },
      { q: 'How long does the tap itself take?', a: 'The mount, test, and tap sequence is roughly two hours for a typical wet tap. Ductile iron cuts quickly; HDPE takes several times longer. The multi-day part is the excavation, restraint, backfill, and restoration around it.' },
      { q: 'Why can’t our general contractor just do it?', a: 'Two reasons. South Carolina licenses "Water and Sewer Lines" as a general contractor classification requiring technical and business exams plus two years of documented commercial experience in the past five. And the water authority controls its own main — the connection happens on their terms, with their approved materials, their inspector, and often a short list of approved contractors.' },
      { q: 'What happens to the piece of pipe you cut out?', a: 'It is called the coupon, and a retaining pilot physically grips it so it cannot fall into the main. It comes out with the drill. If a crew cannot hand you the coupon at the end of the job, ask questions.' },
      { q: 'Do we need bacteriological testing or a boil-water notice afterward?', a: 'Not for the tap itself — the main was never opened to atmosphere or depressurized, which is the condition that drives an advisory. The new branch line you are connecting still gets flushed, disinfected, and lab-cleared for bacteria before it goes into service.' },
      { q: 'Our main is old asbestos-cement pipe. Does that change things?', a: 'Yes. AC main is common in mid-century Upstate systems. Non-destructive approaches like wet tapping are the preferred way to deal with it, but worker-protection requirements still apply and the debris is regulated waste. Expect it to show up on the schedule and the invoice — and be skeptical of anyone who does not mention it at all.' },
    ],
    costData: [
      { item: 'Utility tap fee, ¾" to 2" domestic', cost: '$900 – $2,800 (Greenville Water published schedule)', lifespan: 'One-time fee' },
      { item: 'Utility tap fee, 4" to 12"', cost: '$2,000 – $4,000+ (4" and larger often priced at cost)', lifespan: 'One-time fee' },
      { item: 'Capacity fee, non-residential', cost: '$2,780 – $138,000+ by meter size', lifespan: 'One-time fee' },
      { item: 'Water meter, 5/8" through 2"', cost: '$350 – $1,600 (larger sizes quoted)', lifespan: 'Utility replaces on their cycle' },
      { item: 'Installed wet tap — contractor scope', cost: 'Quoted per job — depth, main material, traffic control and restoration drive it', lifespan: 'Built to last the life of the main' },
      { item: 'Plan review & inspection fees', cost: 'Extension review ~$4.00/LF; commercial plan review ~$800; re-inspection trips billed separately', lifespan: 'One-time fee' },
    ],
    seoKeywords: [
      'water main tap Greenville SC',
      'wet tap contractor Upstate South Carolina',
      'hot tap water main Seneca SC',
      'tapping sleeve and valve installation Oconee County',
      'commercial water tap Anderson SC',
      'live water main tap no service interruption',
      'wet tap vs dry tap water main',
      'commercial water service connection South Carolina',
      'licensed water and sewer line contractor Upstate SC',
      'fire line tap commercial building SC',
    ],
  },

  // ═══ 2. DUCTILE IRON & C900 WATER LINES ═══
  {
    id: 'water-lines',
    slug: 'water-lines',
    title: 'Ductile Iron & C900 Water Lines',
    tagline: 'Domestic Service and Fire Mains, Bedded and Tested to Spec',
    heroDescription:
      'Once the tap is made, you still need pipe from the main to the building — usually two lines. A domestic service feeds restrooms, kitchens, and equipment. A private fire service main feeds the sprinkler system and any on-site hydrants, and it answers to the fire code rather than the water authority. RO Unlimited installs both in ductile iron and C900 PVC, bedded, restrained, pressure-tested, disinfected, and cleared for service.',
    heroImage: `${SUB}/waterline-bedded-pipe.jpg`,
    cardImage: `${IMG}/jr-ductile-iron-valve.jpg`,
    galleryImages: [
      `${SUB}/waterline-bedded-pipe.jpg`,
      `${SUB}/waterline-trench-bedding.jpg`,
      `${SUB}/waterline-joining-pipe.jpg`,
      `${SUB}/waterline-crew-install.jpg`,
      `${IMG}/jr-ductile-iron-valve.jpg`,
      `${IMG}/jr-valve-trench.jpg`,
    ],
    overview: [
      {
        heading: 'What It Is',
        content:
          'Two materials dominate commercial water service. Ductile iron pipe is cast iron with its graphite chemistry changed so the pipe bends instead of shattering — heavy, extremely strong, and cement-lined inside. C900 PVC is engineered plastic pressure pipe built to an AWWA standard, lighter and cheaper, immune to rusting from the inside, and made in different wall thicknesses for different pressures. Either one gets buried the same careful way: compacted stone under the pipe, stone worked into the haunches at its sides, adequate cover over the top, and copper tracer wire plus colored warning tape so the next contractor can find it. Anywhere the pipe turns or dead-ends, pressure tries to shove it apart, so those points get restrained with a thrust block or a mechanical restraint gland.',
      },
      {
        heading: 'When You Need It',
        content:
          'New construction is the obvious one — every commercial building needs a domestic service and most need a fire line. Beyond that: an expansion or added stories that push fixture count and sprinkler demand past what the existing service can supply; a fire marshal requiring a private fire main or an added hydrant; a high-demand tenant like a restaurant, brewery, laundry, or car wash; a failing service line showing repeated leaks, rusty water, or poor pressure on upper floors; site development work needing main extensions and hydrant loops; or a DOT road-widening project forcing your private line to be relocated.',
      },
      {
        heading: 'Cost & Timeline',
        content:
          'Installed cost is quoted per job and driven far more by conditions than by pipe. Diameter and pressure class matter, but depth, shoring, rock, restoration, and the number of fittings matter more — a straight run is inexpensive per foot; a run with six bends, two tees, a hydrant, and a backflow vault is not. Ductile iron material costs several times what C900 does per foot and is heavy enough to change the crew and equipment. A straightforward 200 to 400 foot commercial service and fire line in workable clay is commonly a one to two week operation. What surprises general contractors is the tail end: hydrostatic testing, a 24 to 48 hour chlorine hold, flushing, then two sets of bacteria samples pulled at least sixteen hours apart plus lab turnaround. That is four to seven days minimum from pipe-in-the-ground to cleared-for-service, it cannot be compressed, and a failed sample restarts it.',
      },
      {
        heading: 'Why It Matters Here',
        content:
          'Piedmont clay is often corrosive to ductile iron. The AWWA soil evaluation scores resistivity, pH, redox, sulfides, and moisture, and ten points or more means the pipe should be polyethylene-encased. Get that wrong and you have turned a hundred-year pipe into a maintenance problem — ductile iron in highly corrosive soil breaks roughly six times as often as it does in benign soil. Clay also shrinks and swells, which matters because thrust blocks only work when they bear against undisturbed soil; on many Upstate jobs restrained mechanical joints are the more reliable answer. Add shallow granite near the foothills, which means rock hammering and makes proper bedding non-negotiable, and trenches that hold water because clay will not drain — which affects compaction and the honesty of a pressure test.',
      },
    ],
    warningSigns: [
      { trigger: 'Pipe laid straight on the trench bottom or on rock', detail: 'Bedding exists to give the pipe uniform support and bring it to grade. Without it you get point loading, and against Upstate rock that is a crack waiting for the first pressure surge.' },
      { trigger: 'Backfill dumped over the pipe with no haunching', detail: 'The haunch zone — from the bottom of the pipe up to its centerline — provides the most resistance to deflection. Skipping it is completely invisible from the surface and shows up later as deflection, joint stress, and failure.' },
      { trigger: 'A bend, tee, or dead end with no restraint or thrust block', detail: 'Pressure pushes outward anywhere the direction or cross-section changes. An unrestrained fitting eventually separates — usually under the parking lot you just paved.' },
      { trigger: 'A thrust block poured against loose backfill', detail: 'Blocks have to bear on undisturbed earth. Where that is not achievable the backfill between block and undisturbed soil has to be compacted to at least 90% Standard Proctor. A block bearing on fluff is decoration.' },
      { trigger: 'No tracer wire or marking tape on a PVC line', detail: 'PVC is invisible to standard locating equipment. If the tracer wire is not installed, terminated, and continuity-tested, the next contractor on your site will find your water line with an excavator bucket.' },
      { trigger: 'A "passing" pressure test with no paperwork', detail: 'Acceptance is quantitative — metered makeup water compared against the allowable-leakage formula, not "it looked fine." On the fire side, no signed contractor’s material and test certificate means no acceptance.' },
      { trigger: 'Anyone offering to skip disinfection because the line is clean', detail: 'New mains get charged with chlorine, held, flushed, and lab-cleared for a reason. A failed bacteria sample discovered after backfill and paving is a genuinely expensive lesson.' },
    ],
    maintenanceTips: [
      { tip: 'Build the testing window into the schedule, not the punch list', detail: 'Hydrostatic test, then a 24 to 48 hour chlorine hold, then flushing, then two bacteria samples sixteen or more hours apart, then lab turnaround. It is a multi-day sequence that cannot be shortened, and general contractors routinely lose a week here.' },
      { tip: 'Test the soil before committing to ductile iron', detail: 'The AWWA soil corrosivity evaluation is inexpensive next to replacing a corroded main. In Upstate clay it is the difference between pipe that outlives the building and pipe that becomes a recurring repair.' },
      { tip: 'Keep as-builts, tracer wire access points, and valve locations on file', detail: 'Record coordinates, depths, tracer wire termination boxes, and the tap location. The people who installed it will not be the people who have to find it in fifteen years.' },
      { tip: 'Put the fire main on an NFPA 25 calendar', detail: 'Annual obligations include a main drain flow test, waterflow alarm test, and hydrant servicing, with a flow test of underground mains on a five-year cycle. This is the building owner’s legal obligation, not the sprinkler contractor’s discretion.' },
      { tip: 'Keep backflow certification current', detail: 'Sprinkler and standpipe supplies have to be protected by an approved backflow assembly, and the water authority requires periodic certified testing. Let it lapse and you risk a shutoff notice on a fire line.' },
      { tip: 'Do not let anyone pave, build, or plant over the line or the vault', detail: 'Access is the difference between a four-hour repair and a three-day one. Mark the corridor on your site plan and hold tenants and landscapers to it.' },
      { tip: 'Watch for the symptoms before it becomes a break', detail: 'An unexplained rise in metered consumption, ground that stays soft or unusually green along the line, pressure loss on the top floor, or discolored water after a hydrant flow. Corrosion causes nearly half of U.S. water pipeline failures, and it announces itself first.' },
    ],
    processSteps: [
      { num: '01', title: 'Design & Material Selection', description: 'An engineer sizes domestic and fire lines for demand, fire flow, and available pressure, then specifies material and pressure class to match the authority’s approved-materials list.' },
      { num: '02', title: 'Permits, Approvals & Locates', description: 'State construction permit, water authority plan review and fees, fire marshal review of the private fire main, right-of-way encroachment permits, and an SC811 ticket.' },
      { num: '03', title: 'Trench, Shore & Dewater', description: 'Excavate to line and grade with a protective system at five feet and deeper, hammer rock where the foothills demand it, and keep the trench dry enough to build a proper bed in clay.' },
      { num: '04', title: 'Bed & Lay Pipe', description: 'Place compacted granular bedding to bring the pipe to grade with uniform support, assemble joints per the manufacturer, and polyethylene-encase ductile iron where the soil test calls for it.' },
      { num: '05', title: 'Haunch & Backfill', description: 'Work granular material into the haunch zone from the pipe bottom to the springline — where the pipe gets most of its strength — then backfill in compacted lifts.' },
      { num: '06', title: 'Restrain, Trace & Mark', description: 'Restrain every bend, tee, dead end, and valve with restrained joints or thrust blocks bearing on undisturbed soil, then lay tracer wire on the pipe and detectable marking tape above it.' },
      { num: '07', title: 'Pressure Test', description: 'Hydrostatic test with metered makeup water compared against the allowable-leakage formula. Private fire mains test at 200 psi, or 50 psi over working pressure, held two hours.' },
      { num: '08', title: 'Disinfect, Clear & Turn Over', description: 'Charge with chlorine, hold, flush and dechlorinate, then pull two bacteria samples at least sixteen hours apart for lab clearance. Fire side gets an AHJ-witnessed test and a signed certificate, then as-builts.' },
    ],
    faq: [
      { q: 'Ductile iron or C900 PVC — which is better?', a: 'Usually the water authority’s approved-materials list decides, and on the fire side the pipe has to be listed and approved for fire protection service. Where you genuinely have a choice: ductile iron is chosen for strength, surge resistance, and easy locating. C900 is chosen for lower cost, immunity to internal corrosion, and a smooth bore. Be aware that most published material comparisons come from either the iron or the PVC trade association — both are selling something.' },
      { q: 'What do DR14, DR18, and DR25 mean?', a: 'Dimension Ratio — the pipe’s outside diameter divided by its wall thickness. A lower number means a thicker wall and a higher pressure rating: DR25 is rated 165 psi, DR18 is 235 psi, and DR14 is 305 psi. Worth knowing that AWWA re-rated these; the same pipe used to carry different numbers, and the surge allowance that used to be built in is now the designer’s responsibility.' },
      { q: 'Why does every bend need a thrust block or restraint?', a: 'Because pressurized water pushes outward wherever the flow changes direction or the pipe changes size, and the joints alone often cannot resist it. A thrust block transfers that force into undisturbed soil. A restrained joint system balances it using the friction of a restrained length of pipe against the surrounding soil. Skip it and the system separates at the joint.' },
      { q: 'Why is our fire line inspected differently than the domestic line?', a: 'Different standard, different authority, different test. The domestic line answers to the water authority. The private fire service main answers to the fire code official under NFPA 24, which requires listed pipe, a 200 psi two-hour hydrostatic test held within five psi, and flushing at ten feet per second or system demand to clear construction debris before service. Then NFPA 25 governs it for the life of the building.' },
      { q: 'How deep does the pipe go?', a: 'Fire mains have a code floor of not less than two and a half feet of cover, or one foot below the frost line, whichever is deeper. Most water authorities specify more — three feet of minimum cover is a common utility standard. Your authority’s spec governs, and here the driver is mechanical protection and future grading more than frost.' },
      { q: 'How long will it last?', a: 'Honestly, that depends on soil and installation more than on brand. Ductile iron in non-corrosive soil, or properly encased in corrosive soil, is cited at over a hundred years — unprotected in aggressive soil it is a fraction of that. AWWA’s own independent study puts PVC at 55 to 70 years, while the PVC industry claims longer. The honest version: both materials outlive most buildings when they are bedded, restrained, and installed correctly.' },
      { q: 'What actually makes water lines fail?', a: 'Corrosion is the single biggest cause of U.S. water pipeline failures. After that come joint and fitting failures — and notably those are most likely on pipe twenty years old or younger, which is a signal about installation quality rather than age — plus poor bedding, ground movement, dig-ins, and water hammer. Most of that list is workmanship and design, not material.' },
      { q: 'Can you work around our operating business?', a: 'Yes, and that is usually the plan. Combined with a hot tap on the existing main, most commercial water line work can be staged so the occupied part of the building never loses service. The interruption, when one is unavoidable, gets scheduled and communicated in advance rather than discovered.' },
    ],
    costData: [
      { item: 'C900 PVC water main, installed', cost: 'Quoted per job — diameter, depth, rock and restoration drive it', lifespan: '55 – 70 years (AWWA independent estimate)' },
      { item: 'Ductile iron water main, installed', cost: 'Quoted per job — material runs several times PVC per foot', lifespan: '100+ years in non-corrosive or properly encased soil' },
      { item: 'Trench excavation, 4–6 ft', cost: 'Typically $10 – $20 per linear foot; rock adds substantially', lifespan: 'n/a' },
      { item: 'Fire hydrant, installed', cost: 'Commonly $3,900 – $9,100 installed; more with long runs or restoration', lifespan: 'Decades with annual NFPA 25 servicing' },
      { item: 'Backflow prevention assembly, fire service', cost: 'Device plus vault; authority inspection fees run a few hundred dollars per device', lifespan: 'Rebuild or replace on the authority’s testing cycle' },
      { item: 'Pressure test, disinfection & bacteriological clearance', cost: 'Included in our scope — budget 4 to 7 days of schedule, not just dollars', lifespan: 'Required before any new main goes into service' },
    ],
    seoKeywords: [
      'ductile iron water line installation Upstate SC',
      'C900 PVC water main contractor Greenville SC',
      'private fire service main NFPA 24 South Carolina',
      'fire line installation Seneca SC',
      'commercial water service line Anderson SC',
      'underground fire main contractor Oconee County SC',
      'water main hydrostatic testing and disinfection SC',
      'AWWA C900 water line installation contractor',
      'fire hydrant installation Upstate South Carolina',
      'backflow preventer fire line installation Greenville',
    ],
  },

];

export function getUtilitySubService(slug: string): UtilitySubService | undefined {
  return UTILITY_SUB_SERVICES.find((s) => s.slug === slug);
}
