// ═══════════════════════════════════════════════════════════════
//  UNDERGROUND UTILITIES SUB-SERVICE DATA
//  Detail pages for /utilities/[sub], rendered by SubServicePage
//  (the same template behind the septic/roofing/electrical subs).
//
//  VOICE: written for a GC, developer, or building owner — real
//  commercial terminology, but every term unpacked in plain English
//  the first time it appears. Confident, specific, never jargon soup.
//
//  FACTS: figures here are published standards (OSHA, AWWA, NFPA,
//  SC811, SC DES) — code minimums, test durations, review clocks,
//  service lives. NO PRICING appears in public copy. Where the copy
//  once quoted dollars, it now names the cost DRIVERS instead: what
//  makes a job expensive, what owners forget to budget, and which
//  authority publishes the fee schedule RO builds into the number.
//  Estimating figures live on the admin/API side, never here.
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
      `${SUB}/waterline-bedded-pipe.jpg`,
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
        heading: 'What Drives the Cost',
        content:
          'Two separate buckets, and owners are routinely surprised by the second one. The contractor scope — excavation, shoring, sleeve, valve, testing, backfill, and restoration — is priced off the site, because depth, main material, traffic control, and pavement repair swing it further than tap size does. The second bucket is the water authority’s own fees, and those are the owner’s cost no matter who does the work: a tap fee that climbs with tap size, a meter fee, and a non-residential capacity fee that scales with meter size and on a large service can dwarf everything else about the connection. Greenville Water publishes its schedule, Easley Combined Utilities publishes its own, and so does every authority we work under across the line in North Carolina and Georgia. We pull the current numbers against your actual meter size and build them into the estimate rather than leaving you to discover them at permit time. The tap itself is roughly a two-hour operation once the pit is open; the full field sequence is typically one to three days. The schedule driver is paperwork, not digging — in South Carolina an SC811 ticket runs three to ten working days, North Carolina and Georgia run their own 811 centers on their own clocks, and the water authority’s review and inspection queue is measured in weeks in any of the three.',
      },
      {
        heading: 'Why It Matters Here',
        content:
          'Our crews run out of Easley, and everything within reach of that shop sits in the Piedmont — red clay that drains slowly and is prone to shrink and swell, the same from the Greenville suburbs out to the Georgia and North Carolina lines. A trench wall that stood up fine on a dry Tuesday can slough after Thursday’s rain, so shoring is a live safety decision on every tap pit, not a box to check. Closer to the Blue Ridge foothills, granite and gneiss bedrock sit near the surface, which turns a routine trench into hammer work. What changes most from job to job is who owns the main. Greenville Water, Easley Combined Utilities, Anderson Regional, Seneca Light & Water, and the small districts on either side of the state line each run their own application, approved-materials list, inspector, and fee schedule — and crossing into North Carolina or Georgia changes the permitting path, not just the letterhead. We are licensed in all three states, so the first move on any tap is establishing whose rulebook you are actually building to. Knowing that before design is worth more than any trick in the field.',
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
          'OSHA requires a protective system at five feet and deeper unless you are in stable rock, with a competent person inspecting daily. At twenty feet the system has to be engineered. This is the most-cited fatal hazard in underground work, and Piedmont clay changes behavior with the weather.',
      },
      {
        trigger: 'Old grey pipe with a fibrous, cement-like wall',
        detail:
          'That is likely asbestos-cement main, common in mid-century water systems all through this region. Tapping it, cutting it, and disposing of it are regulated activities with worker-protection requirements. It belongs on the schedule and the budget, not discovered at 2pm on a Friday.',
      },
    ],
    maintenanceTips: [
      {
        tip: 'Budget the utility fees separately from the contractor’s price',
        detail:
          'Capacity fees scale with meter size, and on a large non-residential service they can outweigh every other cost of the connection. They are yours regardless of who installs the tap. Get the authority’s written fee quote against your actual meter size before you set the project budget, not after.',
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
          'In South Carolina, SC811 requires notice no less than three and no more than ten working days before digging, and marks stay valid fifteen working days. North Carolina and Georgia run separate 811 centers with their own windows, so confirm the rules for the state the shovel is actually going in. Either way it is the authority’s review and inspection scheduling, not the excavation, that usually decides whether you hit your certificate of occupancy date.',
      },
    ],
    processSteps: [
      { num: '01', title: 'Application & Utility Coordination', description: 'Submit the tap application to the water authority, pay tap, capacity, and meter fees, and get size and location approved — taps over two inches usually mean the owner furnishes the tapping materials.' },
      { num: '02', title: 'Engineering & Permitting', description: 'Sealed plans where required, then SC DES construction permitting or the authority’s delegated review in South Carolina — the equivalent state review across the line in North Carolina or Georgia — plus encroachment and traffic control permits if the tap falls in a right-of-way.' },
      { num: '03', title: 'Locate & Pothole', description: 'An 811 ticket ahead of the dig — three to ten working days under SC811, whatever the neighboring state requires when the job is over there — verify the marks, then physically expose the main to confirm its real size, material, and depth before anyone orders a sleeve.' },
      { num: '04', title: 'Excavate & Shore', description: 'Open the tap pit and install a protective system at five feet and deeper — trench box, shoring, or sloping — with a competent person inspecting daily.' },
      { num: '05', title: 'Set the Tapping Sleeve', description: 'Clean the main, set the split sleeve without rotating it, use water-soluble lubricant only, and torque the bolts from the center outward to the manufacturer’s value.' },
      { num: '06', title: 'Test Before Cutting', description: 'Bolt on the tapping valve and pressure-test the sleeve assembly through its test port — before the drill ever touches the main. No leak is acceptable.' },
      { num: '07', title: 'Make the Tap', description: 'Mount the tapping machine, advance the cutter, take the coupon, confirm the retaining pilot has it, retract fully, and close the valve. The main stays in service throughout.' },
      { num: '08', title: 'Tie In, Backfill & Restore', description: 'Connect the branch with restrained joints or thrust blocking, set the valve box to grade, backfill in compacted lifts with tracer wire and marking tape, then restore pavement and landscaping to the authority’s standard.' },
    ],
    faq: [
      { q: 'Will anyone lose water while you make the tap?', a: 'No — that is the entire point of a hot tap. The main stays pressurized and in service the whole time. Water pressure is contained inside the tapping machine while the cut is made, and the valve is closed before the machine comes off.' },
      { q: 'Then why would anyone do a dry tap?', a: 'Because sometimes the main is already down. New mains not yet in service, a planned system overhaul, or a repair that is already isolating that segment are all cases where a dry tap is simpler, faster, and lets you inspect more thoroughly before the line goes into service.' },
      { q: 'How large a branch can you take off an existing main?', a: 'It depends on the method. Tapping directly into ductile iron is limited by pipe size — up to a 2-inch tap on 24-inch and larger pipe. A service saddle or clamp maxes out at a 2-inch outlet. Anything bigger needs a tapping sleeve and valve, and the AWWA standard covering fabricated steel and stainless sleeves runs from 4-inch through 48-inch pipe with outlets through 36 inches.' },
      { q: 'How long does the tap itself take?', a: 'The mount, test, and tap sequence is roughly two hours for a typical wet tap. Ductile iron cuts quickly; HDPE takes several times longer. The multi-day part is the excavation, restraint, backfill, and restoration around it.' },
      { q: 'Why can’t our general contractor just do it?', a: 'Two reasons. South Carolina licenses "Water and Sewer Lines" as a general contractor classification requiring technical and business exams plus two years of documented commercial experience in the past five, and North Carolina and Georgia each run their own classification and their own exams — we carry licensing in all three. And the water authority controls its own main — the connection happens on their terms, with their approved materials, their inspector, and often a short list of approved contractors.' },
      { q: 'What happens to the piece of pipe you cut out?', a: 'It is called the coupon, and a retaining pilot physically grips it so it cannot fall into the main. It comes out with the drill. If a crew cannot hand you the coupon at the end of the job, ask questions.' },
      { q: 'Do we need bacteriological testing or a boil-water notice afterward?', a: 'Not for the tap itself — the main was never opened to atmosphere or depressurized, which is the condition that drives an advisory. The new branch line you are connecting still gets flushed, disinfected, and lab-cleared for bacteria before it goes into service.' },
      { q: 'Our main is old asbestos-cement pipe. Does that change things?', a: 'Yes. AC main is common in mid-century systems throughout the Piedmont, on all three sides of the state lines. Non-destructive approaches like wet tapping are the preferred way to deal with it, but worker-protection requirements still apply and the debris is regulated waste. Expect it to show up on the schedule and the invoice — and be skeptical of anyone who does not mention it at all.' },
    ],
    costData: [
      { item: 'Utility tap fee, ¾" to 2" domestic', cost: 'Set by your water authority’s published schedule, not by us', lifespan: 'One-time fee' },
      { item: 'Utility tap fee, 4" to 12"', cost: 'Climbs with tap size; the large ones are often billed at actual cost', lifespan: 'One-time fee' },
      { item: 'Capacity fee, non-residential', cost: 'Scales hard with meter size — the line owners underestimate most', lifespan: 'One-time fee' },
      { item: 'Water meter, 5/8" through 2"', cost: 'Meter size alone; anything larger the authority quotes directly', lifespan: 'Utility replaces on their cycle' },
      { item: 'Installed wet tap — contractor scope', cost: 'Depth, main material, traffic control, restoration', lifespan: 'Built to last the life of the main' },
      { item: 'Plan review & inspection fees', cost: 'Length of the extension, plus a trip charge for every re-inspection', lifespan: 'One-time fee' },
    ],
    seoKeywords: [
      'water main tap Greenville SC',
      'wet tap contractor Easley SC',
      'hot tap water main Anderson SC',
      'tapping sleeve and valve installation Spartanburg SC',
      'commercial water tap Pickens County SC',
      'live water main tap no service interruption',
      'wet tap vs dry tap water main',
      'commercial water service connection South Carolina',
      'licensed water and sewer line contractor SC NC GA',
      'hot tap contractor western North Carolina',
      'commercial water tap northeast Georgia',
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
      `${SUB}/pvc-pipe-stock.jpg`,
      `${SUB}/waterline-crew-install.jpg`,
      `${IMG}/jr-ductile-iron-valve.jpg`,
      `${IMG}/jr-valve-trench.jpg`,
    ],
    overview: [
      {
        heading: 'What It Is',
        content:
          'Two materials dominate commercial water service. Ductile iron pipe is cast iron with its graphite chemistry changed so the pipe bends instead of shattering — heavy, extremely strong, and cement-lined inside. C900 PVC is engineered plastic pressure pipe built to an AWWA standard, lighter and less costly per foot, immune to rusting from the inside, and made in different wall thicknesses for different pressures. Either one gets buried the same careful way: compacted stone under the pipe, stone worked into the haunches at its sides, adequate cover over the top, and copper tracer wire plus colored warning tape so the next contractor can find it. Anywhere the pipe turns or dead-ends, pressure tries to shove it apart, so those points get restrained with a thrust block or a mechanical restraint gland.',
      },
      {
        heading: 'When You Need It',
        content:
          'New construction is the obvious one — every commercial building needs a domestic service and most need a fire line. Beyond that: an expansion or added stories that push fixture count and sprinkler demand past what the existing service can supply; a fire marshal requiring a private fire main or an added hydrant; a high-demand tenant like a restaurant, brewery, laundry, or car wash; a failing service line showing repeated leaks, rusty water, or poor pressure on upper floors; site development work needing main extensions and hydrant loops; or a DOT road-widening project forcing your private line to be relocated.',
      },
      {
        heading: 'Cost Drivers & Schedule',
        content:
          'Conditions drive this far more than pipe does. Diameter and pressure class matter, but depth, shoring, rock, restoration, and the number of fittings matter more — a straight run in open ground prices well per foot; a run with six bends, two tees, a hydrant, and a backflow vault does not. Ductile iron material runs several times what C900 does per foot and is heavy enough to change the crew and the equipment on site. A straightforward 200 to 400 foot commercial service and fire line in workable clay is commonly a one to two week operation. What surprises general contractors is the tail end: hydrostatic testing, a 24 to 48 hour chlorine hold, flushing, then two sets of bacteria samples pulled at least sixteen hours apart plus lab turnaround. That is four to seven days minimum from pipe-in-the-ground to cleared-for-service, it cannot be compressed, and a failed sample restarts it. Put it in the schedule at bid time.',
      },
      {
        heading: 'Why It Matters Here',
        content:
          'Piedmont clay is often corrosive to ductile iron. The AWWA soil evaluation scores resistivity, pH, redox, sulfides, and moisture, and ten points or more means the pipe should be polyethylene-encased. Get that wrong and you have turned a hundred-year pipe into a maintenance problem — ductile iron in highly corrosive soil breaks roughly six times as often as it does in benign soil. Clay also shrinks and swells, which matters because thrust blocks only work when they bear against undisturbed soil; on most jobs in this ground restrained mechanical joints are the more reliable answer. Add shallow granite near the foothills, which means rock hammering and makes proper bedding non-negotiable, and trenches that hold water because clay will not drain — which affects compaction and the honesty of a pressure test. None of that stops at a state line. The paperwork does: the approved-materials list, the acceptance test, and the inspector all change from one authority to the next, and change again once the job is in North Carolina or Georgia. We build to whichever list governs, because we hold the license in all three.',
      },
    ],
    warningSigns: [
      { trigger: 'Pipe laid straight on the trench bottom or on rock', detail: 'Bedding exists to give the pipe uniform support and bring it to grade. Without it you get point loading, and against Piedmont rock that is a crack waiting for the first pressure surge.' },
      { trigger: 'Backfill dumped over the pipe with no haunching', detail: 'The haunch zone — from the bottom of the pipe up to its centerline — provides the most resistance to deflection. Skipping it is completely invisible from the surface and shows up later as deflection, joint stress, and failure.' },
      { trigger: 'A bend, tee, or dead end with no restraint or thrust block', detail: 'Pressure pushes outward anywhere the direction or cross-section changes. An unrestrained fitting eventually separates — usually under the parking lot you just paved.' },
      { trigger: 'A thrust block poured against loose backfill', detail: 'Blocks have to bear on undisturbed earth. Where that is not achievable the backfill between block and undisturbed soil has to be compacted to at least 90% Standard Proctor. A block bearing on fluff is decoration.' },
      { trigger: 'No tracer wire or marking tape on a PVC line', detail: 'PVC is invisible to standard locating equipment. If the tracer wire is not installed, terminated, and continuity-tested, the next contractor on your site will find your water line with an excavator bucket.' },
      { trigger: 'A "passing" pressure test with no paperwork', detail: 'Acceptance is quantitative — metered makeup water compared against the allowable-leakage formula, not "it looked fine." On the fire side, no signed contractor’s material and test certificate means no acceptance.' },
      { trigger: 'Anyone offering to skip disinfection because the line is clean', detail: 'New mains get charged with chlorine, held, flushed, and lab-cleared for a reason. A failed bacteria sample discovered after backfill and paving is a genuinely expensive lesson.' },
    ],
    maintenanceTips: [
      { tip: 'Build the testing window into the schedule, not the punch list', detail: 'Hydrostatic test, then a 24 to 48 hour chlorine hold, then flushing, then two bacteria samples sixteen or more hours apart, then lab turnaround. It is a multi-day sequence that cannot be shortened, and general contractors routinely lose a week here.' },
      { tip: 'Test the soil before committing to ductile iron', detail: 'The AWWA soil corrosivity evaluation is a small line item next to replacing a corroded main. In Piedmont red clay it is the difference between pipe that outlives the building and pipe that becomes a recurring repair.' },
      { tip: 'Keep as-builts, tracer wire access points, and valve locations on file', detail: 'Record coordinates, depths, tracer wire termination boxes, and the tap location. The people who installed it will not be the people who have to find it in fifteen years.' },
      { tip: 'Put the fire main on an NFPA 25 calendar', detail: 'Annual obligations include a main drain flow test, waterflow alarm test, and hydrant servicing, with a flow test of underground mains on a five-year cycle. This is the building owner’s legal obligation, not the sprinkler contractor’s discretion.' },
      { tip: 'Keep backflow certification current', detail: 'Sprinkler and standpipe supplies have to be protected by an approved backflow assembly, and the water authority requires periodic certified testing. Let it lapse and you risk a shutoff notice on a fire line.' },
      { tip: 'Do not let anyone pave, build, or plant over the line or the vault', detail: 'Access is the difference between a four-hour repair and a three-day one. Mark the corridor on your site plan and hold tenants and landscapers to it.' },
      { tip: 'Watch for the symptoms before it becomes a break', detail: 'An unexplained rise in metered consumption, ground that stays soft or unusually green along the line, pressure loss on the top floor, or discolored water after a hydrant flow. Corrosion causes nearly half of U.S. water pipeline failures, and it announces itself first.' },
    ],
    processSteps: [
      { num: '01', title: 'Design & Material Selection', description: 'An engineer sizes domestic and fire lines for demand, fire flow, and available pressure, then specifies material and pressure class to match the authority’s approved-materials list.' },
      { num: '02', title: 'Permits, Approvals & Locates', description: 'State construction permit for whichever state the site is in, water authority plan review and fees, fire marshal review of the private fire main, right-of-way encroachment permits, and an 811 locate ticket.' },
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
      { item: 'C900 PVC water main, installed', cost: 'Diameter, depth, rock, and how much you have to put back', lifespan: '55 – 70 years (AWWA independent estimate)' },
      { item: 'Ductile iron water main, installed', cost: 'Material runs several times PVC per foot, and the weight changes the crew', lifespan: '100+ years in non-corrosive or properly encased soil' },
      { item: 'Trench excavation, 4–6 ft', cost: 'Depth, groundwater, and whether the bucket finds rock', lifespan: 'n/a' },
      { item: 'Fire hydrant, installed', cost: 'Distance off the main, valve and restraint, then restoration', lifespan: 'Decades with annual NFPA 25 servicing' },
      { item: 'Backflow prevention assembly, fire service', cost: 'Device size, whether it needs a vault, recurring certified testing', lifespan: 'Rebuild or replace on the authority’s testing cycle' },
      { item: 'Pressure test, disinfection & bacteriological clearance', cost: 'Costs schedule more than money — four to seven days, minimum', lifespan: 'Required before any new main goes into service' },
    ],
    seoKeywords: [
      'ductile iron water line installation Greenville SC',
      'C900 PVC water main contractor Easley SC',
      'private fire service main NFPA 24 South Carolina',
      'fire line installation Spartanburg SC',
      'commercial water service line Anderson SC',
      'underground fire main contractor Pickens County SC',
      'water main hydrostatic testing and disinfection SC',
      'AWWA C900 water line installation contractor',
      'fire hydrant installation tri-state SC NC GA',
      'commercial water line contractor western North Carolina',
      'fire main installation northeast Georgia',
      'backflow preventer fire line installation Greenville',
    ],
  },

  // ═══ 3. SANITARY SEWER INSTALLATION ═══
  {
    id: 'sanitary-sewer',
    slug: 'sanitary-sewer',
    title: 'Sanitary Sewer Installation',
    tagline: 'Gravity Mains, Laterals and Manholes — Graded Right the First Time',
    heroDescription:
      'A commercial sanitary sewer is three things working together: laterals running from each building, a gravity main collecting them, and manholes at every bend and junction so the line can be inspected, cleaned, and cameraed for the next fifty years. It all runs on gravity, which means every inch of fall matters. RO Unlimited builds to whichever sewer authority owns the line you tie into — ReWa around Greenville, OJRSA out in Oconee, the county and city systems over in North Carolina and Georgia — and to the state permit that goes with it. We test it, camera it, and hand you the closeout package.',
    heroImage: `${IMG}/jr-sewer-lateral.jpg`,
    cardImage: `${SUB}/pvc-pipe-stock.jpg`,
    galleryImages: [
      `${IMG}/jr-sewer-lateral.jpg`,
      `${SUB}/pvc-pipe-stock.jpg`,
      `${SUB}/sewer-structures-hdpe.jpg`,
      `${SUB}/waterline-trench-bedding.jpg`,
      `${SUB}/waterline-crew-install.jpg`,
      `${IMG}/jr-underslab-rough.jpg`,
    ],
    overview: [
      {
        heading: 'What It Is',
        content:
          'Everything that goes down a toilet, sink, floor drain, or grease trap leaves the building through a lateral, joins a gravity main — eight inches and up — and travels to the treatment plant without a single pump, purely on fall. Manholes are the round concrete access shafts placed at every bend, size change, grade change, and intersection, and they exist so crews can inspect and clean the line. Where the ground runs out of fall, you need a lift station: a wet well with pumps that lifts the wastewater and pushes it through a pressurized force main until gravity can take over again. Sanitary is never combined with storm drainage — during heavy rain a combined system overflows raw sewage into the creek, which is why new ones have not been permitted in generations.',
      },
      {
        heading: 'When You Need It',
        content:
          'New buildings and new pads are obvious. The one that catches owners out is a change of use: a retail shell becoming a restaurant, or a warehouse becoming manufacturing, triggers a fresh capacity calculation and impact fee even when the pipe is already in the ground. The single biggest budget surprise on rolling foothills ground — and that is most of what we work — is elevation. If the lowest fixture on your site cannot drain by gravity down to the tie-in manhole’s invert, you need a lift station, and a lift station is not a line item you absorb quietly. It brings pumps, a wet well, a control panel, standby power, a force main, and a permanent operating obligation with it. After that it comes down to whose rules you are under, and they are not interchangeable. OJRSA out in Oconee County, for instance, requires service lines larger than four inches to connect at a manhole rather than tap the pipe, and multi-family over four units to take a minimum eight-inch service. ReWa has its own list, and so does every authority across the North Carolina and Georgia lines. Read the right one before you draw the profile.',
      },
      {
        heading: 'What It Takes',
        content:
          'Depth and rock decide almost everything on a gravity sewer. Eight-inch PVC in open ground at normal depth is your baseline number; go deeper than twelve feet, hit rock, or work under existing pavement and the per-foot figure multiplies, because rock is priced by the cubic yard and it is the most expensive dirt on any site. Manholes price by depth — a standard four-foot structure under ten feet is routine work, while a deep one brings shoring, dewatering, and a crane with it. A duplex submersible lift station with generator, controls, and site work is a project inside your project, not an accessory to one. Budget the authority’s fees separately, because every one of them prices capacity its own way. OJRSA, in Oconee County, assesses by equivalent residential unit — 300 gallons per day each — or by the gallon for other uses; ReWa and the Greenville-area systems publish their own schedules, and so does every county we work in across the state lines. We pull the current numbers for your jurisdiction and build them into the estimate rather than leaving them as a surprise. On schedule: design and permitting is eight to twenty weeks, installation of a 400 to 800 foot run is one to three weeks in normal soil and three to six with rock, and then closeout takes another two to five. One constraint catches nearly every general contractor — the mandrel deflection test cannot be run until backfill has been in place at least thirty days.',
      },
      {
        heading: 'Why It Matters Here',
        content:
          'Everything we work sits on Piedmont geology — granite and gneiss under weathered saprolite and red clay whose thickness changes dramatically over short distances, and that is as true in Toccoa or Hendersonville as it is behind our shop in Easley. Rock depth is rarely predictable from a few borings, and a gravity sewer needing 0.40% fall cannot simply route around rock it finds sixty feet into a five-hundred-foot run without losing grade. Red clay compounds it: trench walls look stable dry and turn to soup after rain, and clay backfill placed wet consolidates later and pulls the pipe down into a belly. The rules laid over that geology are local, specific, and enforced to the letter. OJRSA is a fair example of how specific: an inspector notified no less than 48 hours before a connection, in-line hammer taps banned outright, manhole taps core-drilled and sealed with a rubber boot and rubberized plaster, mortar and cement explicitly not allowed. ReWa around Greenville has its own version of that list, and the authorities we build under in North Carolina and Georgia have theirs. A contractor who has not read the right one loses a day and a connection.',
      },
    ],
    warningSigns: [
      { trigger: 'A wet spot, sinkhole, or lush green stripe over the sewer line', detail: 'That is the pipe leaking out — which means the same open joint lets groundwater and soil in when the water table rises. The soil washing into the pipe leaves a void that eventually collapses whatever is paved above it.' },
      { trigger: 'Backups that only happen during or right after heavy rain', detail: 'A sanitary system should not care about rain. If it does, you have inflow and infiltration — a cracked lateral, a failed manhole seal, or a roof drain illegally tied into the sanitary system. It is a compliance exposure and it consumes treatment capacity you are paying for.' },
      { trigger: 'A manhole lid sitting below the pavement, rocking under traffic, or holding water', detail: 'The frame-to-chimney seal is the most common infiltration entry point on a commercial site, and a ponded lid with vent holes is a direct stormwater intake straight into your sanitary system.' },
      { trigger: 'Repeat clogs in the same spot, or standing water mid-run on a camera report', detail: 'That is a belly — a sag from settlement or bad bedding. It never clears itself. Solids drop out in the low spot and re-clog on a schedule, and the fix is excavation and re-laying, not jetting.' },
      { trigger: 'Roots in the camera footage', detail: 'Roots enter at joints and defects and then act as a strainer for grease and wipes. Recurring root intrusion is telling you the joint is already open, not that you have a tree problem.' },
      { trigger: 'A lift station running noticeably more than it used to', detail: 'Stations are sized to run no more than about ten hours a day normally. One running well past that is either taking on infiltration or has a failing pump — and it is now one power outage away from a sanitary sewer overflow.' },
    ],
    maintenanceTips: [
      { tip: 'Get the sealed record drawings and keep them', detail: 'They show invert elevations, manhole locations, and lateral positions. Without them every future repair starts with an expensive scavenger hunt across your own parking lot.' },
      { tip: 'Camera the private sewer every three to five years', detail: 'Standard CCTV inspection is priced by the foot and is trivial next to a collapsed line under a loading dock. Ask for NASSCO PACP coding so defects are graded on a standard scale you can actually trend over time.' },
      { tip: 'Service the grease interceptor on a written schedule and keep the manifests', detail: 'Grease is the number one cause of commercial lateral blockages, and the authority runs a formal program with sizing requirements and inspections. A failed grease inspection can hold up a certificate of occupancy.' },
      { tip: 'Test the lift station’s backup power under load quarterly', detail: 'A wet well with no power during a summer thunderstorm outage is a sanitary sewer overflow with your name on it. Knowing the generator starts is not the same as knowing it carries the pumps.' },
      { tip: 'Protect the easement and keep manholes accessible', detail: 'Do not let landscaping, dumpster enclosures, fences, or trailer parking end up over a manhole. If a previous owner paved over one, get it raised and marked now rather than during an emergency at 2am.' },
      { tip: 'Settle capacity before you sign the tenant', detail: 'Impact fees are assessed at the rate in effect when the capacity application completes. A restaurant going into a former retail bay gets assessed on the new use, not the old one, and that charge lands on whoever signed without asking.' },
    ],
    processSteps: [
      { num: '01', title: 'Verify Capacity & Tie-In', description: 'Confirm the receiving main has allocation, pull the capacity and impact fee determination, and locate the tie-in invert — that elevation decides whether the site works on gravity or needs a lift station.' },
      { num: '02', title: 'Engineer & Permit the Profile', description: 'A professional engineer lays out slopes, manhole locations, and depths; plans are signed and sealed for the SC DES construction permit — or the North Carolina or Georgia equivalent — plus the sewer authority’s own approval.' },
      { num: '03', title: 'Locate, Protect & Lay Out', description: '811 tickets through the center that covers the site, private locates, easement staking, and confirmation of the ten-foot horizontal separation from any potable water main.' },
      { num: '04', title: 'Open Trench With Protection In Place', description: 'Trench box, shoring, or benching chosen by the competent person before anyone enters, with spoil kept back from the edge — required at five feet and engineered past twenty.' },
      { num: '05', title: 'Set Bedding to Grade', description: 'Crushed stone bedding placed and struck to laser or GPS grade, with bell holes dug so the barrel of the pipe carries the load rather than the bell.' },
      { num: '06', title: 'Lay Pipe Upstream to Downstream', description: 'Bell upgrade, each gasketed joint lubricated and homed, verified with a feeler gauge, holding uniform slope between manholes. Pipe gets laid in dry trench only.' },
      { num: '07', title: 'Haunch, Backfill & Compact', description: 'Work stone under the haunches, then backfill in six-inch layers thoroughly tamped to at least eighteen inches of cover before heavier compaction goes over the top.' },
      { num: '08', title: 'Test, Camera & Close Out', description: 'Low-pressure air test, manhole vacuum test, mandrel deflection test after thirty days, CCTV video, then sealed record drawings and the authority’s closeout package.' },
    ],
    faq: [
      { q: 'What slope does my sewer actually need?', a: 'Two answers, and knowing both is the point. South Carolina’s regulation is velocity-based — gravity sewers are designed for a mean velocity of not less than 2 feet per second flowing full. Your sewer authority then publishes the minimum slopes that deliver it, and that table is what you are held to. In OJRSA territory an 8-inch main needs 0.40 feet of fall per 100 feet, a 12-inch needs 0.22, and a 24-inch needs 0.08. In South Carolina, then, the state sets the velocity and your authority sets the slope. North Carolina and Georgia structure their own minimums differently, so settle which state rulebook governs before you commit to a profile.' },
      { q: 'Can a sewer have too much fall?', a: 'Yes, and it causes real problems. Run it too steep and the liquid outruns the solids, leaving deposits in the flatter reaches downstream. Steep ground is normal in the foothills, so this comes up constantly. In OJRSA territory the authority requires provisions against scour where velocities exceed 10 feet per second, wants slopes held to 10% or less where possible, and requires concrete anchors designed by a South Carolina licensed structural engineer on anything over 20%.' },
      { q: 'SDR-35 or SDR-26 — what do those numbers mean?', a: 'SDR is the Standard Dimension Ratio: outside diameter divided by wall thickness, so a lower number means a thicker wall. SDR-26 walls are roughly 30% thicker than SDR-35. Worth correcting a myth you will find online — the "46 psi" and "115 psi" figures attached to these are pipe stiffness values, not pressure ratings. Gravity sewer pipe is not pressure-rated at all. SDR-35 is the default for normal cover; SDR-26 gets specified for deeper cover or heavier surcharge loads.' },
      { q: 'When do you have to use ductile iron instead of PVC?', a: 'In OJRSA territory, gravity mains are PVC unless cover exceeds fifteen feet, at which point ductile iron is required. Ductile iron also shows up at stream and structure crossings, inside casings, and under heavy structural loading. It comes with a trade-off: corrosion mitigation is required in corrosive soils or near buried power and gas, which can mean polyethylene wrap, zinc coating, cathodic protection, or simply going back to PVC.' },
      { q: 'How deep does it go, and how far apart are manholes?', a: 'Minimum three feet of cover unless otherwise justified and approved. Manholes go at every line end, every change in grade, size, or alignment, and every intersection — and no further apart than 400 feet for pipe 15 inches and smaller, or 500 feet for 18 through 30 inch. Minimum manhole inside diameter is 48 inches, with larger required for deep or drop manholes.' },
      { q: 'What tests do we have to pass before it is accepted?', a: 'Four. A low-pressure air test — for 8-inch pipe the minimum hold is 3 minutes 47 seconds per 100 feet, and a drop of more than half a psi is a failure. A vacuum test on the manholes. A mandrel deflection test limited to 5% of the pipe’s original vertical diameter, run without mechanical pulling devices, after backfill has sat at least thirty days. And a CCTV video, submitted as part of closeout.' },
      { q: 'Why does the thirty-day wait matter to my schedule?', a: 'Because it is not negotiable and it sits at the end. The mandrel test proves the pipe has not deflected under its backfill, which means the backfill has to have had time to do its worst. Plan for it at bid time and it costs you nothing; discover it during closeout and it delays your certificate of occupancy.' },
      { q: 'At what depth is shoring legally required?', a: 'Five feet, unless the excavation is entirely in stable rock. Between five and twenty feet a competent person selects the protective system; past twenty feet it has to be designed by a registered professional engineer. A competent person is legally defined as someone who can identify hazards and has authority to order workers out. This is not paperwork — seventeen workers died in trench collapses in 2025.' },
    ],
    costData: [
      { item: '8" PVC gravity main, normal depth, open ground', cost: 'This is the baseline — everything below only adds to it', lifespan: '100+ years design life for PVC' },
      { item: 'Same, deep, rock, or under pavement', cost: 'Rock is billed by the cubic yard and it multiplies the run', lifespan: 'Depth does not shorten pipe life' },
      { item: 'Standard 4 ft precast manhole, under 10 ft deep', cost: 'Depth, ring count, and the traffic rating on the casting', lifespan: '50 – 75 years typical' },
      { item: 'Deep manhole, 12 – 20 ft', cost: 'Shoring, dewatering, and a crane instead of an excavator', lifespan: '50 – 75 years typical' },
      { item: 'Duplex submersible lift station w/ generator', cost: 'Pumps, wet well, panel, standby power, force main — a project in itself', lifespan: 'Pumps 10 – 15 yrs; wet well 50+ yrs' },
      { item: 'Sewer impact fee — set by your sewer authority', cost: 'OJRSA, for one, assesses per equivalent residential unit — 300 gallons per day each', lifespan: 'One-time, set at capacity application' },
    ],
    seoKeywords: [
      'commercial sanitary sewer installation Greenville SC',
      'gravity sewer main installation Easley SC',
      'sewer lateral tie-in Pickens County SC',
      'sewer lift station installation Anderson SC',
      'sanitary sewer contractor Spartanburg SC',
      'ReWa and OJRSA sewer connection contractor',
      'commercial sewer tap and manhole installation South Carolina',
      'sewer main extension permitting SCDES',
      'sewer air test and mandrel testing contractor SC',
      'site utility contractor sanitary sewer SC NC GA',
      'commercial sewer contractor western North Carolina',
      'gravity sewer installation northeast Georgia',
    ],
  },

  // ═══ 4. STORM DRAINAGE SYSTEMS ═══
  {
    id: 'storm-drainage',
    slug: 'storm-drainage',
    title: 'Storm Drainage Systems',
    tagline: 'Catch It, Carry It, Slow It Down — and Pass Inspection',
    heroDescription:
      'Storm drainage collects rain off your roofs and pavement and moves it somewhere controlled before it can pond, undermine your asphalt, or run onto a neighbor. Catch basins and curb inlets swallow it, buried pipe carries it, and a detention pond holds the surge and releases it slowly so the creek downstream sees no more flow after your project than before it. RO Unlimited installs the whole package — structures, pipe, ponds, outfalls, and the erosion control that keeps you compliant while it is being built.',
    heroImage: `${IMG}/px-37627673.jpg`,
    // Card uses the same wide trench shot that sits second in the gallery
    cardImage: `${IMG}/px-37627672.jpg`,
    galleryImages: [
      `${IMG}/px-37627673.jpg`,
      `${IMG}/px-37627672.jpg`,
      `${SUB}/storm-hdpe-outfall.jpg`,
      `${SUB}/storm-clogged-inlet.jpg`,
      `${SUB}/storm-catch-basin-grate.jpg`,
      `${SUB}/sewer-structures-hdpe.jpg`,
    ],
    overview: [
      {
        heading: 'What It Is',
        content:
          'The system starts at the surface with catch basins, curb inlets, and yard drains, runs through buried pipe, passes through junction boxes where lines meet, and discharges through a headwall or flared end section — a concrete collar that stops the pipe end eroding out — into a ditch, a stream, or a pond. The pond is the part most owners misunderstand. A detention pond is not there to hold water permanently; it is normally dry, fills during a storm, and bleeds down through a restricted outlet over hours so your peak discharge never exceeds what the site produced before you built on it. A retention pond keeps a permanent pool and treats water quality as well. Storm is entirely separate from sanitary, always.',
      },
      {
        heading: 'When You Need It',
        content:
          'Any new impervious area — building footprint, parking, drive aisles, loading. More pavement means more runoff arriving faster, so the site needs both conveyance and peak-flow control. In South Carolina, disturb an acre or more and you are into the construction general permit and a SWPPP; disturb more than two acres and your plan needs agency approval and certification by a registered engineer, landscape architect, or Tier B surveyor; disturb ten acres or more draining to one outlet and a sediment basin is required during construction. North Carolina and Georgia have their own erosion and sedimentation programs with their own thresholds and their own certifications — the one-acre federal trigger is the only part that travels unchanged, so we settle which program applies before design starts. Beyond new work: redevelopment that adds pavement, and existing failures — chronic ponding, undermined curb, or a detention pond that no longer draws down.',
      },
      {
        heading: 'Budget & Timeline',
        content:
          'Pipe is the smallest surprise here. Twelve to twenty-four inch HDPE dual-wall at normal depth is the workhorse; reinforced concrete pipe runs materially more per foot and gets specified where loads, burial depth, or an agency spec demand it. Structures are the line that grows on you — every catch basin and curb inlet is a precast box, a frame, and a traffic-rated top, and the count comes off the inlet capacity math, not off the pipe layout. Headwalls and flared end sections are the small line that keeps an outfall from eroding out from under itself. What actually decides the budget is where you put the storage: surface detention is by a wide margin the least costly storage per cubic foot you can build, while underground chamber systems run multiples of it, which is why they only pencil when the land they free up is worth more than the difference. On schedule: permitting is three to eight weeks, storm pipe and structures three to eight weeks overlapping with mass grading, and pond work another two to five. One seasonal warning — you cannot terminate permit coverage until vegetation is established, so you do not want to be seeding in late July.',
      },
      {
        heading: 'Why It Matters Here',
        content:
          'Rainfall along the Blue Ridge escarpment is genuinely severe and it arrives fast. At Seneca the 25-year, 24-hour storm is 6.74 inches and the 100-year is 8.81, with a 10-year one-hour burst of 2.31 inches — and the numbers run in that neighborhood the whole way along the foothills, from northeast Georgia through the Greenville area and up into western North Carolina. A single summer cell will exceed the capture rate of an undersized inlet immediately, which is why grate count and grate type matter as much as pipe diameter. Red clay does not infiltrate — these are hydrologic group C and D soils, so runoff coefficients are high before you pave anything, and infiltration-based practices frequently do not work here without engineered media. Then there is the rulebook, which is where plans actually get rejected. South Carolina requires controlling the 2- and 10-year events, but Greenville County — right in our back yard — makes the 25-year the critical storm across most of the county, with the 50-year in the Gilder Creek watershed and the 100-year inside Mauldin. North Carolina and Georgia run their own stormwater programs with their own design storms, and their counties layer local overlays on top the same way. Designing to a state floor and assuming it clears local review is a rejected plan waiting to happen in any of the three.',
      },
    ],
    warningSigns: [
      { trigger: 'A depression or soft spot in pavement near an inlet or over a pipe run', detail: 'This is the classic pre-collapse signature. Water escaping a separated joint pulls soil into the pipe and forms a void that grows quietly for months. By the time the surface dips, the void underneath is already large.' },
      { trigger: 'Water still standing 24 to 48 hours after a storm', detail: 'A working detention pond draws down. Standing water means a clogged outlet orifice, a silted-in low flow channel, or a failed underdrain — and a pond that has not drained has no storage left for the next storm.' },
      { trigger: 'Cracked or tilting structure tops, a grate that rocks, or a curb inlet pulling away', detail: 'The structure is settling, which means the pipe connections into it are being pulled apart. You are watching joint separation happen from the surface.' },
      { trigger: 'Erosion at the outfall — a scour hole or undercut rip rap', detail: 'Discharge velocity is exceeding what the receiving channel can take. South Carolina rule requires velocities be reduced to nonerosive or to the pre-disturbance condition, and the neighboring states write the same idea their own way — so this is a compliance problem as well as a maintenance one.' },
      { trigger: 'Sediment leaving the site or mud tracked onto the road', detail: 'This is the violation an inspector writes first. South Carolina allows a stop work order posted on site, and civil penalties are assessed with each day counted as a separate violation.' },
      { trigger: 'A detention pond that has been landscaped, filled at the edges, or used for overflow parking', detail: 'Post-construction ponds are permanent permitted features with maintenance obligations attached to the property. Losing volume without approval puts the parcel out of compliance and puts a downstream flooding claim on your insurance.' },
    ],
    maintenanceTips: [
      { tip: 'Clean catch basin sumps at least annually and after major storms', detail: 'The sump traps sediment until it fills, then it stops trapping and starts passing debris into the pipe. Routine on a schedule, an emergency call when it is not.' },
      { tip: 'Inspect the detention pond twice a year and after every big event', detail: 'Check the orifice for obstruction, the emergency spillway for erosion, the embankment for burrowing animals and woody growth, and the forebay for sediment depth. Keep the records — they are your defense in an audit.' },
      { tip: 'Never regrade, fill, or fence the pond, and keep growth out of the spillway', detail: 'Access paths should not cross an emergency spillway unless it was designed for it, and spillways belong on undisturbed soil. A well-meaning landscaper can quietly void a pond’s design capacity.' },
      { tip: 'Camera the storm system before buying, before repaving, and every five to ten years', detail: 'Video finds root intrusion, joint separation, and collapse before they surface. Repaving over a failing storm line is money set on fire.' },
      { tip: 'Protect your positive drainage when you re-stripe or re-pave', detail: 'A mill-and-overlay can flatten the very cross-slope that made the lot drain. Note the real conflict — pavement wants about 2% to avoid birdbaths, but ADA caps accessible stalls and access aisles at 2.08% in every direction. Accessible spaces have almost no slope budget, so they need to be laid out where the fall already works.' },
      { tip: 'Keep the O&M plan and as-builts with the deed file', detail: 'When the site changes hands or the municipality audits post-construction practices, the owner who can produce the design volume, outlet detail, and inspection history closes the file in an afternoon. The one who cannot pays an engineer to reconstruct it.' },
    ],
    processSteps: [
      { num: '01', title: 'Establish the Outfall & Existing Condition', description: 'Determine where water can legally leave the site and what it did before you touched it — that is the number every downstream calculation gets compared against.' },
      { num: '02', title: 'Model & Size the System', description: 'Hydrology by a volume-based hydrograph method on a 24-hour storm distribution; the simpler rational method is only allowed for individual culverts on small drainage areas, not for a network.' },
      { num: '03', title: 'Permit It', description: 'SWPPP, notice of intent for construction general permit coverage, and local land-disturbance approval — with engineer certification on anything over two acres in South Carolina, and whatever the corresponding state program requires when the site is in North Carolina or Georgia.' },
      { num: '04', title: 'Install Erosion Control First', description: 'Silt fence, construction entrance, diversions, and sediment basin go in and get inspected before the first blade of dirt moves.' },
      { num: '05', title: 'Rough Grade to Positive Drainage', description: 'Every square foot has to fall somewhere on purpose. Flat is not neutral — flat is a puddle and eventually a pothole.' },
      { num: '06', title: 'Set Structures & Lay Pipe', description: 'Structures to design rim and invert, pipe laid upgrade between them on bedding struck to grade, joints gasketed, haunching compacted, and inlet protection on every structure the moment its top is set.' },
      { num: '07', title: 'Build the Pond & Outlet Control', description: 'Detention or retention facility with its multi-stage riser, anti-seep collars, forebay, and an emergency spillway sized to pass the 100-year event with a foot of freeboard below the top of dam.' },
      { num: '08', title: 'Stabilize, Verify & Hand Over', description: 'Permanent seeding, rip rap at outfalls, camera the pipe, as-built the structures and pond volumes, and deliver the maintenance plan the owner is held to for the life of the site.' },
    ],
    faq: [
      { q: 'Detention or retention — what is the difference?', a: 'A detention pond is normally dry. It fills during a storm and drains down through a restricted outlet over hours so your peak discharge never exceeds the pre-development rate. A retention pond holds a permanent pool and provides water quality treatment as well as storage. Municipalities require peak control because dozens of developments each doubling their peak discharge is exactly what floods the neighborhood downstream.' },
      { q: 'Can we put the detention underground and keep the land?', a: 'Yes, and on tight infill sites it is often the only option — but it is the expensive one. Surface detention is the least costly storage per cubic foot you can build; underground chamber systems run several times that installed. They also carry a permanent maintenance obligation, including periodic cleanout of the isolator row. Chamber systems are cited at 50 to 75 year lifespans. The question to settle first is whether the land you get back is worth more than the difference — on a tight infill site it usually is, and on a site with room to spare it almost never is.' },
      { q: 'HDPE, concrete, or PVC — what should we specify?', a: 'HDPE dual-wall is the default for most commercial site storm: corrosion-proof, light, fast to install, and smooth enough inside to carry more and silt less. Reinforced concrete pipe gets specified where loads and burial depths are extreme, under roadway where the agency mandates it, and at deep crossings. PVC shows up on smaller runs where a watertight gasketed joint matters more than diameter. Honestly, all three last decades when installed correctly — the dominant variable is not the material, it is the bedding and haunching.' },
      { q: 'When do we need a stormwater permit in South Carolina?', a: 'At one acre of land disturbance, or less if your project is part of a larger common plan of development. That means construction general permit coverage plus a SWPPP. The plan requirements tier separately: two acres or less gets a simplified plan needing neither agency approval nor engineer certification; over two acres requires an approved plan certified by a registered engineer, landscape architect, or Tier B surveyor. Those tiers are South Carolina’s. The one-acre federal trigger holds across the line, but North Carolina and Georgia administer their own plan and certification requirements, so we confirm the governing program before anyone draws a pond.' },
      { q: 'What water quality treatment are we actually required to provide?', a: 'These are the South Carolina numbers, and they are the ones most of our work is held to. Sediment control during construction has to achieve 80% removal of suspended solids. For permanent facilities, a water quality pond with a permanent pool must store and release the first half inch of runoff over 24 hours; one without a permanent pool must release the first full inch over 24 hours; and permanent infiltration practices must accept at minimum the first inch of runoff from all impervious areas.' },
      { q: 'What happens if we disturb land without permit coverage?', a: 'The implementing agency posts a stop work order at the site and can refuse to issue further building or grading permits until it is remedied. Civil penalties apply on top of that, and each day of violation counts separately, so the exposure compounds while you argue about it. That is the South Carolina side, and the neighboring states enforce their own programs the same way; federal Clean Water Act penalties sit on top of any of them and are substantially higher.' },
      { q: 'Why does bad storm work destroy pavement?', a: 'Because of the sequence. Poor bedding lets the pipe settle, joints separate, and water escapes into the surrounding soil — then flowing water carries soil particles back into the pipe, forming a void underground. The void grows quietly. Meanwhile, wherever capture points clog, water ponds and saturates the base, which weakens the subgrade and produces rutting, potholes, and eventually sudden collapse. Cracking pavement and wet areas that never dry are late-stage symptoms of a problem that started in the trench.' },
      { q: 'How much slope does a parking lot need?', a: 'About 2% cross slope for asphalt is the practical minimum, because below that you cannot reliably build it without forming birdbaths. The hard constraint is ADA — accessible spaces and their access aisles cap at 2.08% in all directions. Those two numbers leave essentially no margin, which is why accessible stall placement is a drainage decision as much as a striping one.' },
    ],
    costData: [
      { item: '12" – 24" HDPE dual-wall storm pipe, installed', cost: 'Depth, bedding, and how many structures the run ties into', lifespan: '50 – 100+ years' },
      { item: '18" – 30" reinforced concrete pipe, installed', cost: 'Runs multiples of HDPE per foot; specified when the loads demand it', lifespan: 'Documented up to 100 years' },
      { item: 'Catch basin or curb inlet, precast, traffic-rated top', cost: 'Structure depth, casting rating, and the count your grate math demands', lifespan: 'Structure 40 – 75 yrs; castings shorter' },
      { item: 'Headwall or flared end section', cost: 'Pipe size, and whether the channel needs rip rap behind it', lifespan: '50+ years' },
      { item: 'Surface detention pond (earthwork + riser)', cost: 'Earthwork volume and haul — the least costly storage you can build', lifespan: 'Indefinite with maintenance; sediment cleanout on a cycle' },
      { item: 'Underground detention chamber system', cost: 'Multiples of surface storage; buys land back, adds permanent maintenance', lifespan: '50 – 75 years' },
    ],
    seoKeywords: [
      'commercial storm drainage installation Greenville SC',
      'storm drain contractor Easley SC',
      'detention pond construction Pickens County SC',
      'catch basin and curb inlet installation Greenville SC',
      'site drainage contractor Anderson SC',
      'underground stormwater detention South Carolina',
      'SWPPP erosion control contractor SC NC GA',
      'parking lot drainage repair Spartanburg SC',
      'storm pipe replacement sinkhole repair commercial SC',
      'commercial site drainage contractor western North Carolina',
      'detention pond contractor northeast Georgia',
      'NPDES construction general permit stormwater contractor South Carolina',
    ],
  },

  // ═══ 5. COMMERCIAL / TIER 2 SEPTIC ═══
  // Tier 2 scope is quoted from S.C. Code Regs. § 61-56.101. Tier 3 exists
  // (Standard 610 specialized designs) — never call Tier 2 the "highest level."
  {
    id: 'commercial-septic',
    slug: 'commercial-septic',
    title: 'Tier 2 Commercial Septic Systems',
    tagline: 'The License Level South Carolina Requires for Commercial Work',
    heroDescription:
      'A commercial septic system does the same job as a house system, but it is sized from the building’s actual daily water use rather than a bedroom count — and past 1,500 gallons a day, South Carolina requires a licensed professional engineer to design it. RO Unlimited holds a South Carolina Tier 2 onsite wastewater license, which is the level that state requires for commercial systems, large systems, pump systems, grease traps, and repairs. A Tier 1 installer cannot legally touch any of it. We are licensed across the tri-state, so when the parcel sits over in North Carolina or Georgia we run it through that state’s onsite program instead.',
    heroImage: `${IMG}/jr-septic-tank-set.jpg`,
    cardImage: `${SUB}/septic-soil-evaluation.jpg`,
    galleryImages: [
      `${IMG}/jr-septic-tank-set.jpg`,
      `${SUB}/septic-soil-evaluation.jpg`,
      `${SUB}/waterline-trench-bedding.jpg`,
      `${SUB}/pvc-pipe-stock.jpg`,
      `${IMG}/jr-sewer-lateral.jpg`,
      `${SUB}/waterline-crew-install.jpg`,
    ],
    overview: [
      {
        heading: 'What It Is',
        content:
          'A watertight tank holds solids while liquid soaks into the soil, where microbes finish the treatment. That much is the same as a house. What changes on a commercial site is the sizing basis and the hardware. Design flow comes off an occupancy table — 40 gallons per seat per day for a full-service restaurant, 15 per employee per shift for an office, 100 per hotel room — not off bedrooms. South Carolina draws a hard line at 1,500 gallons per day: below it is a small system, above it is a large system that a South Carolina licensed professional engineer must design. Commercial systems also add parts a house never needs — a grease trap ahead of the tank for any kitchen, duplex pumps, pressure-dosed distribution — because commercial waste is stronger and arrives in sharper peaks.',
      },
      {
        heading: 'When You Need It',
        content:
          'A lot of the ground we work never gets sewer — rural Pickens, Oconee, and Anderson, the outer edges of Greenville County, and most of the mountain and farm country over the lines in North Carolina and Georgia — so any new build out there starts here. The trigger that catches owners out is change of use: South Carolina regulation requires a new permit to construct before any alteration that increases flow or changes the character of the wastewater. A retail bay at 15 gallons per employee becoming a restaurant at 40 gallons per seat can multiply the design flow tenfold and push the project over the engineering threshold overnight. Also worth knowing before you plan anything — South Carolina prohibits new septic permits, and even repairs, where a sewer treatment facility is "accessible for connection." The county or municipality decides what counts as accessible, and if connecting would require annexation or an easement across someone else’s land, it is not considered accessible.',
      },
      {
        heading: 'Planning It Out',
        content:
          'We quote commercial systems from the soil report, not from a price list, and we would treat anyone who does otherwise with suspicion — the soil dictates the size of the field, and the field dominates the cost. Design flow sets the tank and the pumps. Soil acceptance rate sets the trench footage, and on Piedmont red clay that footage is the entire conversation. In South Carolina the state fees are published and firm: a site evaluation fee, a treatment facility construction permit fee, a pump station permit fee, and an annual fee to operate a land application permit. Those are yours regardless of who installs the system, and we carry the current schedule into the estimate. On schedule, a straightforward commercial system on decent soil is a one to three month permitting exercise. A large system using low pressure pipe or drip distribution is a six to nine month exercise before you break ground, because the land application permit carries a 180-day statutory review clock that runs first. Once issued, a South Carolina onsite permit is good for five years. North Carolina and Georgia permit onsite systems through their own state and county health programs, with their own fees and their own clocks, so the first thing we pin down is which state the parcel is in — the design changes with it.',
      },
      {
        heading: 'Why It Matters Here',
        content:
          'Three facts change everything about this work on our home ground, and two of them are South Carolina law specifically. First, South Carolina requires backhoe pits above the Fall Line that separates the Piedmont from the Coastal Plain — Pickens, Greenville, Oconee, and Anderson all sit above it, so every site evaluation up here needs an excavator on site, unlike the Lowcountry. Second, South Carolina does not use percolation tests at all; the word does not appear in the regulation. Sizing is done on soil morphology by certified staff or a licensed soil classifier. Out-of-state developers routinely arrive asking for a perc test — and North Carolina and Georgia do evaluate and permit onsite systems their own way, which is exactly why the answer depends on which side of the line your parcel sits. Third, the geology does not care about state lines. Red clay is expensive everywhere in the Piedmont: sand accepts 0.9 to 1.0 gallons per square foot per day, while clay accepts 0.1 to 0.4. A 600-gallon-per-day office needs about 200 feet of trench on sand and roughly 1,000 feet on our clay — five times the field, plus a 50% reserve area on top. South Carolina even publishes a system standard written specifically for expansive Piedmont clay, using the weathered saprolite below it.',
      },
    ],
    warningSigns: [
      { trigger: 'Standing water, spongy ground, or a bright green stripe over the drainfield', detail: 'That stripe is effluent surfacing and fertilizing the grass from below. Discharging effluent to the ground surface is a violation, and on a commercial property it is a public health exposure with customers walking across it.' },
      { trigger: 'A high-water alarm at the pump panel, even one that silences itself', detail: 'South Carolina requires that alarm wired ahead of the pump’s overload protection precisely so it still works when the pump does not. Intermittent alarms mean a failing float, a stuck check valve, or a pump near the end of its life — and you have about one pump-tank volume of storage before it backs up inside the building.' },
      { trigger: 'Any change of use, added seating, or new kitchen', detail: 'A permit is required before the alteration, not after. Adding a kitchen to a space permitted as retail can multiply design flow tenfold and put you over the threshold where an engineer must design the system.' },
      { trigger: 'Trucks, trailers, or dumpsters parking on the drainfield', detail: 'State rule prohibits the system under a driveway or parking area. One loaded delivery truck can crush distribution pipe and destroy soil structure in a strip that never recovers — and the fix is rebuilding that section, not patching it.' },
      { trigger: 'Building-wide slow drains or odor, especially after rain', detail: 'Building-wide rather than one fixture points at the system, not the plumbing. A correlation with weather suggests a seasonal high water table eating your vertical separation, or roof and surface water being routed onto the field.' },
      { trigger: 'A grease trap nobody can remember pumping', detail: 'Once grease and solids reach about a quarter of the liquid depth the trap has stopped separating. Grease then moves into the tank and out into the trenches, where it coats the soil surface and cannot be flushed back out.' },
    ],
    maintenanceTips: [
      { tip: 'Watch your water bill against your permitted design flow', detail: 'Your permit was issued for a specific gallons-per-day number. A sustained climb toward it means hydraulic overload is coming before any symptom shows — and twelve consecutive months of water data is exactly what the state lets you use to justify a revised flow if you expand.' },
      { tip: 'Put the tank and grease trap on a contract, not on memory', detail: 'Let the first year’s measured intervals set the schedule rather than guessing. Keep every ticket — inspectors commonly want a year of records, and it is your evidence during a sale or a health inspection.' },
      { tip: 'Physically protect the drainfield and the reserve area', detail: 'Bollards, wheel stops, signage. The undisturbed space between trenches does not count toward your 50% reserve — and if you pave the reserve area, you have no repair option the day the primary field fails.' },
      { tip: 'Route all surface and roof water away from the system', detail: 'The regulation requires the system area be protected from surface and roof drainage with swales and positive grading. Every gallon of stormwater reaching the trenches is a gallon your clay cannot spend on wastewater.' },
      { tip: 'Service the mechanical parts and track run time', detail: 'Pull and inspect the pump annually, verify the floats, test the alarm, and flush low pressure pipe laterals yearly. Rising run time at constant flow is the earliest possible warning of a failing pump or a clogging field — months before anything surfaces.' },
      { tip: 'Control what goes down the drain, and retrain after staff turnover', detail: 'No garbage grinders on a grease-trap system — they are prohibited outright in South Carolina. No wipes, including the ones sold as flushable. No fryer oil and no mop-bucket grease. Staff turnover, not ignorance, is why these rules get broken.' },
    ],
    processSteps: [
      { num: '01', title: 'Establish the Real Design Flow', description: 'Pull the number from the state occupancy table by seat, room, employee, or student count — everything downstream is sized off this one figure.' },
      { num: '02', title: 'Soil Evaluation', description: 'Certified staff or a licensed professional soil classifier evaluates the soil — and in South Carolina, above the Fall Line, that means backhoe pits rather than hand borings.' },
      { num: '03', title: 'Determine the Regulatory Track', description: 'Under 1,500 gallons per day on a standard design, over 1,500 requiring a sealed engineered design, or advanced treatment that also needs a land application permit with its 180-day clock.' },
      { num: '04', title: 'Design & Stamp', description: 'Size the field from the soil’s acceptance rate, the tank and grease trap from the state formulas, the pumps from the flow, and lay out the reserve area.' },
      { num: '05', title: 'Submit & Permit', description: 'Pay the site evaluation fee, file through state ePermitting, and build the statutory review clocks into the construction schedule rather than discovering them.' },
      { num: '06', title: 'Install Exactly to the Permit', description: 'Watertight tanks, solid Schedule 40 connections, seven feet of undisturbed earth between trenches, trench bottoms level within two inches, force mains encased under any drive or parking.' },
      { num: '07', title: 'Final Inspection', description: 'The state inspects — or the engineer inspects their own design where one was required — and as-built documentation is due within two business days of completion.' },
      { num: '08', title: 'Approval to Operate', description: 'Receive approval to operate, and start the maintenance file on day one rather than after the first backup.' },
    ],
    faq: [
      { q: 'What exactly does a Tier 2 license cover?', a: 'Tier 1, 2, and 3 are South Carolina classifications, and that regulation is specific. A Tier 1 installer may install gravity-fed residential systems only, and is not authorized to conduct repairs on existing systems at all. Tier 2 covers everything Tier 1 does plus pumps, grease traps, curtain drains, elevated and mounded systems, and all commercial, large, and community onsite wastewater systems — plus repairs. Tier 3 exists above that for specialized engineered designs, so we do not claim to be the top tier. Tier 2 is simply the level South Carolina requires for commercial work. North Carolina and Georgia do not use the tier system at all — they license onsite installers their own way, and we hold credentials in both.' },
      { q: 'What makes a system "commercial" versus "large"?', a: 'They are two different things and people mix them up. Commercial is about use — anything other than a private dwelling, intended for commerce. Large is about flow: anything over 1,500 gallons per day. A small church is commercial but not large. An apartment complex is large but not commercial. Above 1,500 gallons per day, a South Carolina licensed engineer must design it regardless of which label applies.' },
      { q: 'Why a soil scientist instead of a perc test?', a: 'Because South Carolina does not use percolation tests — the word does not appear anywhere in the onsite wastewater regulation. The state sizes systems on soil morphology: texture, structure, depth to a restrictive horizon, and depth to the seasonal water table. Only certified staff or a licensed professional soil classifier may perform the evaluation, and above the Fall Line it requires backhoe pits. That is the South Carolina procedure — if your site is over in North Carolina or Georgia, their programs govern and the evaluation looks different.' },
      { q: 'How big does my drainfield need to be?', a: 'Design flow divided by the soil acceptance rate divided by trench width. The catch is that the acceptance rate is set by your worst soil layer from the surface down to a foot below the trench bottom. Across the Piedmont that layer is usually clay at 0.1 to 0.4 gallons per square foot per day against 0.9 to 1.0 for sand — often five times the field. Then add a 50% reserve area, and note that the required undisturbed space between trenches does not count toward it.' },
      { q: 'I am opening a restaurant. What is different?', a: 'Almost everything. Design flow is 40 gallons per seat per day for full-service dining, so a hundred seats is a 4,000 gallon-per-day system and automatically over the engineering threshold. You need an exterior grease trap of at least 1,000 gallons, and two separate plumbing stub-outs — restrooms running straight to the septic tank, kitchen routed through the grease trap first. Garbage grinders are prohibited. And restaurant waste runs roughly ten times the organic strength of household waste, so sizing on hydraulics alone will fail.' },
      { q: 'The tank is fine — why did the drainfield fail?', a: 'Different jobs, different failure modes. The tank settles solids; the field absorbs liquid. Fields fail from a thickening biomat, accelerated by fine solids and grease escaping the tank, plus compaction from traffic, root intrusion, hydraulic overload, or a rising water table. A tank can look perfect while the field is finished.' },
      { q: 'Sewer runs past my property. Can I still install septic?', a: 'Generally no. South Carolina prohibits new septic permits — and even repairs or replacement of failing systems — where a treatment facility is accessible for connection. But your county or municipality decides what counts as accessible, and if connecting would require annexation or an easement across adjacent property, it is not considered accessible. That distinction is worth confirming before you buy the land.' },
      { q: 'Is it still DHEC I am dealing with?', a: 'No. As of July 1, 2024, South Carolina split DHEC in two, and environmental permitting including onsite wastewater moved to SCDES, the Department of Environmental Services. Worth knowing that the retail food establishment program moved at the same time to the Department of Agriculture — so a new restaurant now deals with Agriculture for the food permit and SCDES for the septic and grease trap.' },
    ],
    costData: [
      { item: 'Soil evaluation & report (backhoe pits, SC above the Fall Line)', cost: 'State site evaluation fee, plus the soil classifier’s time on site', lifespan: 'Supports a permit valid 5 years' },
      { item: 'State permits — commercial', cost: 'A published schedule: construction, pump station, annual land application', lifespan: 'Annual where applicable' },
      { item: 'Commercial system, engineered for Piedmont clay', cost: 'Soil acceptance rate — clay can need five times the field sand does', lifespan: 'Tank 30 – 40 yrs; drainfield varies widely with load and care' },
      { item: 'Concrete tanks & grease traps', cost: 'Sized by formula; large capacities mean tanks in series', lifespan: '30 – 40+ years if watertight' },
      { item: 'Pump station (duplex required at 1,500 gpd and above)', cost: 'Duplex pumps, control panel, alarm, and its own state permit', lifespan: 'Effluent pumps roughly 7 – 15 yrs; floats and panel shorter' },
      { item: 'Ongoing operation & maintenance', cost: 'Pumping interval, plus the annual fee where land application applies', lifespan: 'Perpetual — it is a permit condition, not optional' },
    ],
    seoKeywords: [
      'commercial septic system Greenville SC',
      'commercial septic system installation Easley SC',
      'large capacity septic system South Carolina',
      'Tier 2 licensed septic installer SC',
      'septic system design flow 1500 gpd South Carolina engineer',
      'low pressure pipe LPP septic system Anderson SC',
      'septic system red clay soil Greenville County',
      'soil evaluation and septic permit SCDES South Carolina',
      'commercial septic contractor Pickens County SC',
      'commercial septic installer western North Carolina',
      'commercial septic system northeast Georgia',
      'commercial drainfield repair Oconee County SC',
    ],
  },

  // ═══ 6. COMMERCIAL GREASE INTERCEPTORS ═══
  {
    id: 'grease-interceptors',
    slug: 'grease-interceptors',
    title: 'Commercial Grease Traps & Interceptors',
    tagline: 'Sized, Set, Plumbed and Inspection-Ready',
    heroDescription:
      'Fats, oils, and grease float. A grease interceptor is a tank that slows kitchen wastewater down enough for grease to rise and food solids to sink, so only the clean middle layer continues to the sewer or septic system. Get it undersized, badly plumbed, or unmaintained and you get blocked laterals, a failed inspection, and a certificate of occupancy that will not issue. RO Unlimited sizes them to the reviewing authority’s method, sets them, and hands you a system that passes.',
    heroImage: `${IMG}/jr-grease-interceptor.jpg`,
    cardImage: `${SUB}/grease-commercial-kitchen.jpg`,
    galleryImages: [
      `${IMG}/jr-grease-interceptor.jpg`,
      `${SUB}/grease-commercial-kitchen.jpg`,
      `${SUB}/grease-fog-source.jpg`,
      `${IMG}/jr-underslab-rough.jpg`,
      `${SUB}/pvc-pipe-stock.jpg`,
      `${SUB}/sewer-structures-hdpe.jpg`,
    ],
    overview: [
      {
        heading: 'What It Is',
        content:
          'Two different pieces of equipment get called the same thing. The small stainless or plastic box under a sink is properly a hydromechanical interceptor — a grease trap — and it is rated in gallons per minute of flow. The large in-ground concrete tank outside, typically 1,000 to 3,000 gallons, is a gravity grease interceptor, rated in gallons of capacity. South Carolina is blunt about which one a commercial kitchen on septic needs: an interior unit may not be used in place of a properly sized exterior grease trap. Grease matters because it is the single most common cause of sewer blockages — the EPA has put it at 47% of reported blockages — which is why nearly every sewer authority runs a formal program with sizing rules, inspections, and penalties.',
      },
      {
        heading: 'When You Need It',
        content:
          'Any new food service facility — the plumbing code lists restaurants, hotel kitchens, hospitals, school kitchens, bars, factory cafeterias, and clubs. Any kitchen fit-out or menu change that adds fryers or a dishwasher, because that changes the sizing basis. Any existing facility that has had a grease-caused malfunction, at which point South Carolina requires immediate compliance as though it were a brand new facility. And on septic, any food service facility served by an onsite system, full stop. Which rulebook applies depends on where your waste goes and which state you are in: on sewer it is your local pretreatment authority, and on septic it is that state’s onsite wastewater regulation — South Carolina’s is considerably more prescriptive than most people expect.',
      },
      {
        heading: 'Sizing, Budget & Lead Time',
        content:
          'Tank size sets the floor, and tank size comes out of whichever sizing method your authority accepts — so settle that before anyone prices a tank. From there the spread is driven by whether the lids have to be traffic-rated, excavation depth and whether you find rock, the run from the kitchen to the tank, whether a sample manhole is required, and whether the parking lot has to be cut and put back. An under-sink hydromechanical trap is a fixture-level purchase. An exterior in-ground interceptor is a site job with a crane on it, and those are not the same order of magnitude. Plan review with the sewer authority is typically two to six weeks; the install itself is usually one to three days of site work once the tank is on site. The critical path is almost always the precast lead time, so order early — a tank sitting in a yard three counties away has held up more certificates of occupancy than any inspector ever has.',
      },
      {
        heading: 'Why It Matters Here',
        content:
          'Every authority around here runs a real program with real paperwork, and no two of them are the same. ReWa, the regional authority for the Greenville area we work out of, requires a submittal review form with flow calculations and enrollment in a FOG register where you upload your maintenance manifests — free, but mandatory. OJRSA, covering Seneca, Walhalla, and Westminster out in Oconee, publishes standard details for grease traps, interceptors, and oil-water separators along with a sizing workbook and a sewer use regulation. Cross into North Carolina or Georgia and you are under a different pretreatment ordinance that may size the tank a different way entirely — which is why nobody should price a tank before the governing authority is settled. Restaurants on septic get hit twice: they need both a grease trap and a commercial septic system, and South Carolina prohibits mound systems for facilities requiring grease traps, which closes off the usual workaround on poor soils. One more South Carolina wrinkle worth knowing: since July 2024 the retail food permit comes from the Department of Agriculture, while the septic and grease side sits with SCDES.',
      },
    ],
    warningSigns: [
      { trigger: 'Grease turning up downstream — in the lateral, the septic tank, or a slow floor drain', detail: 'The interceptor has stopped separating. Usually a full unit, a broken baffle, or a tee that has been knocked off. By the time you see it downstream, grease is already coating pipe or drainfield soil where it cannot be flushed out.' },
      { trigger: 'Grease and solids past about a quarter of the liquid depth', detail: 'This is the industry 25% rule. Past that point incoming flow short-circuits the baffles and pushes grease straight through as if the unit were not there. Most restaurants reach it in one to three months, not annually.' },
      { trigger: 'A non-traffic-rated lid where vehicles can reach it', detail: 'An H-20 rating means a 16,000 pound wheel load with a safety factor applied on top. A standard lid on a delivery route is a collapse waiting to happen — a genuine life-safety issue, not a maintenance item.' },
      { trigger: 'Anyone selling enzymes or emulsifiers as a substitute for pumping', detail: 'The plumbing code prohibits discharging emulsifiers, chemicals, or enzymes to a grease interceptor. They do not remove grease — they liquefy it so it passes through your interceptor and congeals in the public sewer, which is precisely what the ordinance exists to prevent.' },
      { trigger: 'A garbage disposal plumbed into the kitchen line', detail: 'The code is explicit that a food waste disposer shall not discharge to a grease interceptor, and South Carolina’s septic rule agrees. Solids overwhelm the unit and destroy the retention time it depends on.' },
      { trigger: 'No sample port, no risers to grade, or a unit nobody can open', detail: 'If an inspector cannot sample or inspect it, you are in violation regardless of how well it actually works. South Carolina requires grease traps be directly accessible from the surface with a minimum eighteen-inch access opening.' },
    ],
    maintenanceTips: [
      { tip: 'Measure rather than guess for the first year', detail: 'Have your hauler record grease and solids depth at every visit. Once you know how fast you reach 25%, set the contract interval from real data — which is also exactly what an inspector wants to see.' },
      { tip: 'Keep manifests, and upload them where required', detail: 'Some authorities require maintenance documents uploaded to their register. Keep at least a year of tickets on site regardless — that log is your defense in an inspection and your evidence in a sale.' },
      { tip: 'Dry-wipe pans and scrape plates before anything hits the sink', detail: 'Everything kept out of the drain is grease you do not pay to haul. Collect fryer oil separately for rendering — never down the drain and never into the mop sink.' },
      { tip: 'Train staff, then retrain after turnover', detail: 'Post a one-page rule sheet at the dish pit and in every janitor’s closet. Staff turnover is the actual reason these rules get broken, not ignorance.' },
      { tip: 'Do not hot-flush the interceptor to clean it', detail: 'Hot water and detergent melt the grease and carry it downstream. The interceptor looks better and the sewer gets worse — and it is a common violation.' },
      { tip: 'Inspect baffles, tees, and lid gaskets at every pump-out', detail: 'Ask the hauler to photograph the inside while it is empty. Concrete interceptors also corrode over time from hydrogen sulfide, and catching a deteriorating baffle early is a repair — missing it is a tank replacement.' },
    ],
    processSteps: [
      { num: '01', title: 'Confirm Which Authority Governs', description: 'The local sewer and pretreatment authority if you are on sewer; that state’s onsite wastewater regulation if you are on septic — and it matters which of the three states the job is in, because they size differently.' },
      { num: '02', title: 'Size the Unit', description: 'Using the method that authority accepts — the plumbing code’s 30-minute retention rule, a meals-per-peak-hour formula, fixture unit tables, or the state formula for systems on septic.' },
      { num: '03', title: 'Submit for Plan Review', description: 'Forms, flow calculations, and a site map showing the connection point — and enrollment in the authority’s FOG register where one exists.' },
      { num: '04', title: 'Separate the Plumbing at Rough-In', description: 'Kitchen waste routed to the interceptor, restrooms bypassing it straight to the sewer or septic tank, and no food waste grinder anywhere upstream.' },
      { num: '05', title: 'Excavate & Set the Tank', description: 'On proper bedding, dead level, with traffic-rated lids anywhere a vehicle can reach — decided during design, because retrofitting after paving is far more expensive.' },
      { num: '06', title: 'Install Internals & Access', description: 'Inlet and outlet tees or baffles, flow control, risers brought to grade, and the sample port where the authority requires one.' },
      { num: '07', title: 'Inspect Before Backfill', description: 'Pass inspection with everything visible, then backfill and restore the surface. An inspector cannot approve what has already been buried.' },
      { num: '08', title: 'Start the Maintenance Log Day One', description: 'Measure the first pump-out interval rather than guessing it, then lock it into a service contract before the first blockage rather than after.' },
    ],
    faq: [
      { q: 'What is the actual difference between a grease trap and an interceptor?', a: 'Size, location, and how they are rated. A trap is small, indoor, usually under a sink, and rated in gallons per minute of flow. An interceptor is large, outdoors, in the ground, typically 1,000 gallons and up, and rated in gallons of capacity. In South Carolina, if you are on a septic system, the code is explicit that an interior unit cannot substitute for a properly sized exterior one.' },
      { q: 'How is mine sized?', a: 'It depends on the authority and the state, which is exactly why you confirm the method before buying a tank. Four are in common use: the plumbing code’s 30-minute retention rule, a meals-per-peak-hour formula, drainage fixture unit tables, and on septic in South Carolina a formula based on daily flow with a loading factor and retention factor. Different methods give different answers for the same kitchen.' },
      { q: 'What is the 30-minute retention rule?', a: 'It is in the plumbing code South Carolina adopted. The required capacity of a gravity grease interceptor is the peak drain flow into it in gallons per minute multiplied by a retention time of thirty minutes. So a kitchen with 50 gallons per minute of peak flow needs a 1,500 gallon interceptor.' },
      { q: 'How often does it have to be pumped?', a: 'Most ordinances use the 25% rule — pump when combined grease and solids reach a quarter of the liquid depth. In practice most restaurants land on a 30, 60, or 90 day cycle. Worth knowing that the 25% threshold comes from local ordinances and industry guidance rather than a federal regulation, so what actually binds you is your own permit or ordinance.' },
      { q: 'Will enzymes or bacteria let me pump less often?', a: 'No, and selling them as a substitute is generally a violation. The code prohibits discharging emulsifiers, chemicals, or enzymes to a grease interceptor, allowing only certain microbial systems that meet a specific standard. Emulsifiers move the problem into the public sewer rather than solving it.' },
      { q: 'Does my lid have to be traffic rated?', a: 'If any vehicle can reach it, yes. H-20 is the rating for a two-axle truck — a 32,000 pound axle, 16,000 pounds per wheel — with a safety factor applied for testing. Decide during design where delivery trucks actually drive, because retrofitting a traffic-rated lid after the lot is paved costs far more than specifying it up front.' },
      { q: 'What does an inspector actually check?', a: 'Whether the unit is the approved size and type; that inlet and outlet tees or baffles are intact; that the sample port is present and reachable; that lids and risers come to grade, seal, and carry the right rating; grease and solids depth against the 25% threshold; your maintenance manifests; that no garbage disposal or restroom waste is plumbed into it; and that no prohibited additives are in use.' },
      { q: 'We are on septic, not sewer. Do we still need one?', a: 'Yes, and South Carolina’s requirements are specific. Minimum 1,000 gallons net liquid capacity, sized by state formula, dual-chambered or in series above 1,500 gallons per day. Two separate plumbing stub-outs — restrooms straight to the septic tank, kitchen through the grease trap first. Directly accessible from the surface with an eighteen-inch minimum access opening, and an extended outlet tee terminating six to twelve inches above the tank bottom.' },
    ],
    costData: [
      { item: 'Under-sink hydromechanical trap (20 – 50 gpm)', cost: 'Flow rating, and whether it fits the cabinet it has to live in', lifespan: '5 – 15 years, shorter if neglected' },
      { item: '1,000 gal precast exterior interceptor (tank supply)', cost: 'Precast pricing plus freight — the lead time bites harder', lifespan: '30 – 40+ years; hydrogen sulfide corrosion is the limiter' },
      { item: '1,500 gal precast exterior interceptor (tank supply)', cost: 'Steps up with capacity; dual chambers or tanks in series', lifespan: '30 – 40+ years' },
      { item: 'Exterior in-ground installation, all-in', cost: 'Depth, rock, run from the kitchen, and pavement restoration', lifespan: '—' },
      { item: 'Traffic-rated (H-20) lids and risers', cost: 'A premium up front; a demolition bill if retrofitted later', lifespan: 'Lids 20 – 30 yrs; gaskets sooner' },
      { item: 'Pump-out service', cost: 'Tank size and how fast your kitchen fills it', lifespan: 'Recurring — set the interval from measurement' },
    ],
    seoKeywords: [
      'commercial grease trap installation Greenville SC',
      'grease interceptor installation Easley SC',
      'restaurant grease trap Pickens County SC',
      '1000 gallon grease interceptor install Anderson SC',
      'grease interceptor sizing South Carolina',
      'ReWa grease interceptor requirements Greenville',
      'OJRSA grease trap standard detail Oconee County',
      'FOG compliance restaurant SC NC GA',
      'restaurant grease interceptor western North Carolina',
      'exterior grease interceptor vs indoor grease trap',
      'traffic rated grease interceptor lid H-20',
      'commercial kitchen grease trap replacement Greenville SC',
    ],
  },

];

export function getUtilitySubService(slug: string): UtilitySubService | undefined {
  return UTILITY_SUB_SERVICES.find((s) => s.slug === slug);
}
