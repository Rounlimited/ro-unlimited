// ═══════════════════════════════════════════════════════════════
//  ROOFING SUB-SERVICE DATA
//  8 detailed sub-service pages for /services/roofing/[sub]
// ═══════════════════════════════════════════════════════════════

import type { SubService } from './sub-service-types';
export type RoofingSubService = SubService;
export type { OverviewBlock, WarningSign, MaintenanceTip, ProcessStep, CostRow } from './sub-service-types';

export const ROOFING_SUB_SERVICES: RoofingSubService[] = [
  // ═══ 1. SHINGLE ROOFING ═══
  {
    id: 'shingle-roofing',
    slug: 'shingle-roofing',
    title: 'Shingle Roofing',
    tagline: 'Proven Protection Engineered for Carolina Weather',
    heroDescription: 'From basic 3-tab to premium designer styles that replicate natural slate and cedar shake, we install shingle systems built to handle Upstate South Carolina\'s heat, humidity, and storm seasons. With over 25 years of local experience, we know which products perform and which ones just look good in a brochure.',
    heroImage: '/images/services/roofing/subs/shingle-hero.jpg',
    cardImage: '/images/services/roofing/subs/shingle-card.jpg',
    galleryImages: [
      '/images/services/roofing/subs/shingle-hero.jpg',
      '/images/services/roofing/subs/shingle-nailgun.jpg',
      '/images/services/roofing/subs/shingle-install-kneeling.jpg',
      '/images/services/roofing/subs/shingle-bundles-deck.jpg',
      '/images/services/roofing/subs/crew-brick-house.jpg',
      '/images/services/roofing/subs/roofer-roof-edge.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Asphalt shingle roofing uses fiberglass mat coated with asphalt and mineral granules to create a weather-resistant barrier for your home. There are three distinct tiers: 3-tab shingles are a single flat layer with uniform cutouts. Architectural (dimensional) shingles bond two or more layers for a thicker, textured profile that mimics wood or slate. Designer shingles are the premium tier — significantly heavier with multi-layer construction that closely replicates natural slate, cedar shake, or other high-end materials.',
      },
      {
        heading: 'Materials & Performance',
        content: 'All modern asphalt shingles start with a fiberglass base mat coated in asphalt and topped with ceramic-coated mineral granules that protect against UV radiation. Architectural shingles are now the industry standard, offering wind ratings of 110–130 mph compared to 3-tab\'s 60–70 mph. For Upstate SC, where severe thunderstorms regularly produce 50–80 mph gusts, that difference matters. Impact-resistant (Class 4) shingles are increasingly popular here, tested to withstand hail strikes and sometimes qualifying homeowners for insurance discounts.',
      },
      {
        heading: 'What Drives the Number',
        content: 'Three things set the price on a shingle job: the tier you pick, how much roof there is, and what we find once the old roof is off. Material tier is the obvious one — 3-tab is thin single-layer stock lasting 15–20 years, architectural is bonded multi-layer at 25–30, designer is heavy multi-layer product at 30–40 that costs more to buy and takes longer to carry up and lay out. Past material, pitch decides everything: anything steeper than about 8:12 stops being walkable, which means staging, roof jacks, and slower work on every stage. Layer count is the surprise — a second layer roughly doubles tear-off labor and dumpster volume, and you often don\'t know it\'s there until we lift a corner. Then decking. We carry a sheet allowance in the estimate and bill only what we actually replace once the deck is open. The honest comparison between tiers is cost per year of service, not the number on day one: 3-tab\'s low sticker means three roofs in the span architectural needs two.',
      },
      {
        heading: 'Why It Matters Here',
        content: 'Choosing the right shingle tier isn\'t just about appearance — it\'s about matching your roofing investment to your home\'s needs, your budget timeline, and our local weather patterns. Our humidity and heat can shorten lifespans by several years if ventilation and installation quality are lacking. A quality architectural shingle installation with proper ventilation is the sweet spot for most Upstate homeowners.',
      },
    ],
    warningSigns: [
      { trigger: 'Granules accumulating in gutters or at downspout discharge', detail: 'Some granule loss is normal on a new roof, but persistent shedding on an older roof means UV protection is failing.' },
      { trigger: 'Shingles curling at the edges or buckling in the center', detail: 'This indicates moisture damage or failed adhesive and creates gaps where water penetrates.' },
      { trigger: 'Bald or dark patches visible from the ground', detail: 'Exposed asphalt means granules are gone and that section is rapidly deteriorating from UV and heat exposure.' },
      { trigger: 'Cracked or broken shingles', detail: 'Thermal cycling — our hot days and cooler nights — makes aging shingles brittle. Cracked shingles are an open invitation for leaks.' },
      { trigger: 'Missing shingles after a storm', detail: 'Even one missing shingle exposes underlayment and decking to water damage.' },
      { trigger: 'Black streaks or green moss growth', detail: 'Algae and moss thrive in our humidity. While algae is mostly cosmetic, moss roots can lift shingles and trap moisture underneath.' },
      { trigger: 'Daylight visible through the roof deck from the attic', detail: 'This means structural gaps exist and water is almost certainly finding its way in.' },
      { trigger: 'Sagging areas on the roof surface', detail: 'The decking underneath has been compromised by moisture. Structural repair is needed immediately.' },
    ],
    maintenanceTips: [
      { tip: 'Inspect from the ground twice a year', detail: 'Spring and fall, use binoculars. Look for missing, cracked, or curling shingles and note changes.' },
      { tip: 'Keep gutters clean', detail: 'Clogged gutters cause water to back up under shingles along the eave — one of the most common causes of shingle roof damage in our area.' },
      { tip: 'Trim tree branches back 3+ feet from the roof', detail: 'Overhanging limbs drop debris, scrape shingles in wind, and provide pathways for moss growth.' },
      { tip: 'Address moss and algae promptly', detail: 'Use zinc or copper strips along the ridge, or have us apply a professional treatment. Never pressure-wash shingles — it strips granules.' },
      { tip: 'Check attic ventilation and insulation', detail: 'Trapped heat and moisture from below destroy shingles from the inside out, especially in our hot summers.' },
      { tip: 'Visual check after every significant storm', detail: 'Upstate SC gets hail and high winds regularly. Catching damage early keeps the insurance claim straightforward and keeps the repair to shingles instead of decking.' },
    ],
    processSteps: [
      { num: '01', title: 'Consultation & Inspection', description: 'We inspect your current roof, measure the area, assess decking condition from the attic, check ventilation, and discuss your goals and budget. You get a detailed written estimate with material options.' },
      { num: '02', title: 'Material Selection', description: 'We walk you through shingle tier options (3-tab, architectural, designer), colors, and manufacturer warranties. We make honest recommendations based on your home\'s needs and what performs in this climate.' },
      { num: '03', title: 'Tear-Off & Deck Prep', description: 'We strip the old roof down to the deck, inspect and replace damaged decking or rotten wood, and install ice-and-water shield in vulnerable areas — valleys, eaves, and around penetrations.' },
      { num: '04', title: 'Installation', description: 'Drip edge, underlayment, starter strip, shingles, ridge cap, and all flashing installed to manufacturer specs. Proper nailing patterns and placement are non-negotiable — this is where shortcuts cause failures.' },
      { num: '05', title: 'Inspection & Cleanup', description: 'We inspect every detail, run magnetic sweepers for nails, haul away all debris, and walk you through the completed work. You receive warranty documentation for both materials and labor.' },
    ],
    faq: [
      { q: 'What type of asphalt shingle do you recommend for Upstate SC?', a: 'For most homeowners, we recommend architectural shingles with a Class 4 impact rating. They handle our wind, hail, and UV exposure far better than 3-tab, and the 25–30 year lifespan makes them the best cost-per-year investment. We work primarily with GAF, Owens Corning, and CertainTeed.' },
      { q: 'How does humidity affect my shingle roof?', a: 'Upstate SC\'s humidity promotes algae and moss growth, accelerates granule loss, and can trap moisture under shingles if ventilation is inadequate. Algae-resistant shingles with copper granules and proper attic ventilation are critical here. We\'ve seen roofs fail 5–7 years early due to poor ventilation.' },
      { q: 'Are 3-tab shingles still worth installing?', a: 'Honestly, we rarely recommend them anymore. The per-square-foot savings is real but small, and what you give up for it is wind rating, lifespan, and curb appeal. Labor, tear-off, and disposal cost the same either way, so the discount only applies to a fraction of the job. Spread across the years you actually own the roof, 3-tab ends up costing more. If the upfront number is the constraint, we\'d rather talk financing on architectural.' },
      { q: 'How long does a shingle roof installation take?', a: 'A standard residential tear-off and replacement typically takes 1–3 days depending on roof size, complexity, and weather. We don\'t cut corners on cleanup — you shouldn\'t find a single nail in your yard when we\'re done.' },
      { q: 'Will my insurance cover storm damage to my shingle roof?', a: 'In most cases, yes. Homeowner\'s insurance typically covers sudden, accidental damage from hail, wind, and fallen trees. It does not cover normal wear or neglected maintenance. We work with all major carriers and can perform a damage assessment to support your claim.' },
    ],
    costData: [
      { item: '3-Tab Shingles', cost: 'Thin stock, so tear-off and labor dominate the number', lifespan: '15–20 years' },
      { item: 'Architectural Shingles', cost: 'Valleys, hips, and dormers drive the waste factor', lifespan: '25–30 years' },
      { item: 'Designer Shingles', cost: 'Heavy multi-layer product; slower to carry, load, and lay', lifespan: '30–40 years' },
    ],
    seoKeywords: ['shingle roofing Greenville SC', 'asphalt shingle installation', 'architectural shingles Upstate SC', 'roof shingle replacement near me'],
  },

  // ═══ 2. METAL ROOFING ═══
  {
    id: 'metal-roofing',
    slug: 'metal-roofing',
    title: 'Metal Roofing',
    tagline: 'A Roof That Outlasts the Mortgage — And Then Some',
    heroDescription: 'With lifespans of 40–70 years, wind ratings up to 140 mph, and energy efficiency that can cut cooling costs by up to 25%, metal roofing is a long-term investment that pays dividends every month. We install standing seam, corrugated, and metal shingle systems engineered to handle our summers, our storms, and our humidity.',
    heroImage: '/images/services/roofing/subs/metal-hero.jpg',
    cardImage: '/images/services/roofing/subs/metal-card.jpg',
    galleryImages: [
      '/images/services/roofing/subs/metal-hero.jpg',
      '/images/services/roofing/subs/metal-panels-closeup.jpg',
      '/images/services/roofing/subs/metal-panel-fasteners.jpg',
      '/images/services/roofing/subs/metal-roof-crew.jpg',
      '/images/services/roofing/subs/crew-house-wide.jpg',
      '/images/services/roofing/subs/house-scaffolding.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Metal roofing for residential applications comes in three primary styles. Standing seam uses long vertical panels with raised interlocking seams that conceal all fasteners — creating a sleek, modern look and the best weather protection. Corrugated metal uses ribbed panels with exposed fasteners — the simplest profile to fabricate and the fastest to install, which is why it sits at the entry point of the metal category. Metal shingles are designed to look like traditional shingles, slate, or shake while delivering metal\'s performance benefits.',
      },
      {
        heading: 'Materials & Performance',
        content: 'Most residential metal roofing in our area is steel (galvanized or Galvalume-coated) or aluminum. Steel prices below aluminum per square and carries more strength; aluminum is lighter, naturally corrosion-resistant, and priced above steel — worth the step up in our humid climate. Standing seam roofs withstand winds up to 140 mph and shed rain and debris efficiently. Metal reflects solar radiant heat rather than absorbing it — Energy Star-rated metal roofs can reduce cooling costs by 10–25%.',
      },
      {
        heading: 'Where the Money Goes',
        content: 'Metal prices off three things: profile, metal and gauge, and how cut-up your roofline is. Corrugated is the least involved — exposed fasteners, wide panels, fast coverage, 20–50 years of service. Standing seam sits at the top of the range because the panels get roll-formed to length on site, every clip and seam is mechanically locked, and every valley, hip, ridge, and pipe penetration gets flashing bent to fit; that labor is what buys the 40–70 year life and the hidden-fastener system. Metal shingles land between the two — 30–50 years, but installed piece by piece, so they price on labor hours more than material. Aluminum costs more per square than steel, and heavier gauge costs more than lighter. Complexity is the multiplier most owners miss: a simple gable runs panels straight from eave to ridge, while a roof full of dormers, hips, and valleys turns into a sheet-metal fabrication job. Plan on 2–5 days for a standard home — longer for standing seam, since fabrication precision can\'t be rushed. When a quality standing seam roof may be the last roof the house ever needs, the math often favors metal.',
      },
      {
        heading: 'Why It Makes Sense Here',
        content: 'Upstate South Carolina throws everything at a roof: UV bombardment, humidity, hail, high winds, and heavy rain. Metal handles all of it. No granule loss, no moss growth, no rotting. The reflective properties directly combat our biggest climate challenge — sustained summer heat. We\'ve been installing metal roofing here for over two decades and have seen firsthand how it outperforms.',
      },
    ],
    warningSigns: [
      { trigger: 'Rust spots, especially around fasteners and panel overlaps', detail: 'These are moisture traps where corrosion starts. Small patches caught early can be treated; advanced rust may require panel replacement.' },
      { trigger: 'Loose or lifted panels that shift or rattle in wind', detail: 'Fasteners have failed or clips have disengaged, and wind-driven rain is getting underneath.' },
      { trigger: 'Visible fastener deterioration on exposed-fastener systems', detail: 'Rubber washers degrade over time (typically 15–20 years). Once they fail, every screw hole becomes a leak point.' },
      { trigger: 'Condensation or water stains on attic-side surfaces', detail: 'Metal roofing is more susceptible to condensation than asphalt. Inadequate underlayment or ventilation causes moisture buildup.' },
      { trigger: 'Dents or creases from hail or debris impact', detail: 'While metal is impact-resistant, severe hail can dent panels and compromise protective coatings, exposing bare metal to corrosion.' },
      { trigger: 'Sealant deterioration at seams or penetrations', detail: 'Sealant has a shorter lifespan than the metal itself and needs periodic replacement to maintain watertight integrity.' },
      { trigger: 'Discoloration, chalking, or fading of the finish', detail: 'While mostly cosmetic, this can indicate the protective coating is wearing, leaving the metal more vulnerable.' },
    ],
    maintenanceTips: [
      { tip: 'Inspect twice a year and after major storms', detail: 'Look for loose panels, fastener issues, sealant cracks, and debris accumulation. Binoculars from the ground work for most of this.' },
      { tip: 'Keep debris off the roof', detail: 'Leaves, pine needles, and branches trap moisture against the metal, accelerating corrosion — especially in our humid climate.' },
      { tip: 'Clean gutters regularly', detail: 'Metal roofs shed water efficiently, which means high-volume flow through your gutter system. Clogged gutters cause backup and edge damage.' },
      { tip: 'Plan fastener inspection every 15–20 years', detail: 'On exposed-fastener systems, the rubber washers degrade long before the panels do. Budget schedule for a full re-fastening pass, not a leak call — every screw on the roof comes out and goes back with a fresh washer, so it prices by fastener count and roof size.' },
      { tip: 'Touch up scratches or coating damage promptly', detail: 'Bare metal exposed to our humidity will corrode quickly. Manufacturer-matched touch-up paint is inexpensive insurance.' },
      { tip: 'Ensure balanced attic ventilation', detail: 'Condensation is metal roofing\'s biggest hidden threat. Warm moist air meeting the cold underside of metal panels creates moisture you won\'t see until it\'s serious.' },
    ],
    processSteps: [
      { num: '01', title: 'Consultation & Measurement', description: 'We assess your current roof structure, measure precisely, evaluate attic ventilation, and discuss style and material options. Metal requires careful planning for thermal expansion, so accurate measurement is critical.' },
      { num: '02', title: 'Material Selection & Fabrication', description: 'Standing seam panels are often custom-fabricated on-site using a portable roll-forming machine. We help you choose material type (steel, aluminum), gauge, finish color, and profile style.' },
      { num: '03', title: 'Tear-Off & Deck Prep', description: 'We remove existing roofing, inspect and repair decking, install high-temperature underlayment designed for metal applications, and ensure proper ventilation.' },
      { num: '04', title: 'Installation', description: 'Panels installed with clips or fasteners allowing for thermal expansion. All flashing, trim, ridge caps, and transitions fabricated and sealed. Standing seam panels are mechanically locked for maximum wind resistance.' },
      { num: '05', title: 'Final Inspection & Documentation', description: 'We verify every seam, fastener, and flashing detail, ensure proper drainage, and provide warranty documentation. Most metal roofing carries a 30–50 year manufacturer warranty.' },
    ],
    faq: [
      { q: 'Is metal roofing louder than shingles during rain?', a: 'With proper installation over solid sheathing and underlayment, a metal roof is no louder than asphalt shingles. The old perception comes from agricultural buildings installed directly on open framing with no insulation beneath.' },
      { q: 'Does metal roofing attract lightning?', a: 'No. Lightning strikes the highest point in an area regardless of material. Metal is actually one of the safest materials in a lightning event because it\'s non-combustible — it won\'t catch fire like wood shake can.' },
      { q: 'Which metal roofing style do you recommend?', a: 'For most residential applications in Upstate SC, we recommend standing seam. The hidden-fastener system eliminates the biggest maintenance concern, the wind rating handles our worst storms, and the energy savings are substantial.' },
      { q: 'How long does metal roof installation take?', a: 'Typically 2–5 days for a standard home, depending on roof size, complexity, and whether we\'re doing a tear-off or overlay. Standing seam takes longer than corrugated due to fabrication precision.' },
      { q: 'Will a metal roof interfere with cell signal or Wi-Fi?', a: 'No. Your signals originate from inside and outside your home through windows, walls, and other openings. Metal roofing does not create a meaningful barrier to wireless signals.' },
    ],
    costData: [
      { item: 'Corrugated Metal', cost: 'Wide panels cover fast; exposed fasteners keep labor down', lifespan: '20–50 years' },
      { item: 'Standing Seam (Steel/Aluminum)', cost: 'On-site roll-forming, clip labor, custom flashing at every transition', lifespan: '40–70 years' },
      { item: 'Metal Shingles', cost: 'Installed piece by piece — roof complexity multiplies the hours', lifespan: '30–50 years' },
    ],
    seoKeywords: ['metal roofing Greenville SC', 'standing seam roof installation', 'metal roof contractor Upstate SC', 'steel roofing near me'],
  },

  // ═══ 3. FLAT / LOW-SLOPE ROOFING ═══
  {
    id: 'flat-roofing',
    slug: 'flat-roofing',
    title: 'Flat & Low-Slope Roofing',
    tagline: 'Flat Roof Expertise That Keeps Water Moving Out',
    heroDescription: 'Flat and low-slope roofs demand specialized knowledge that most residential roofers don\'t have. With over 25 years installing TPO, EPDM, modified bitumen, and built-up systems, we understand the unique challenges these roofs face — from ponding water and UV degradation to membrane fatigue from extreme temperature swings.',
    heroImage: '/images/services/roofing/subs/flat-hero.jpg',
    cardImage: '/images/services/roofing/subs/flat-card.jpg',
    galleryImages: [
      '/images/services/roofing/subs/flat-hero.jpg',
      '/images/services/roofing/subs/flat-roof-insulation.jpg',
      '/images/services/roofing/subs/commercial-roofs-aerial.jpg',
      '/images/services/roofing/subs/metal-roof-crew.jpg',
      '/images/services/roofing/subs/metal-panels-closeup.jpg',
      '/images/services/roofing/subs/house-scaffolding.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Flat and low-slope roofing (any pitch below 2:12) requires completely different materials and techniques than sloped residential roofing. The four primary systems are: TPO (Thermoplastic Polyolefin), a single-ply white membrane heat-welded at the seams; EPDM (synthetic rubber membrane); modified bitumen, combining traditional asphalt with modern polymer technology; and built-up roofing (BUR), the oldest method using alternating layers of bitumen and reinforcing fabric.',
      },
      {
        heading: 'Materials & Performance',
        content: 'TPO has become the most popular choice due to its heat-welded seams that create a watertight bond stronger than the membrane itself, and a white surface that reflects heat instead of holding it. EPDM is prized for flexibility — it handles thermal expansion exceptionally well, critical when roof surface temperatures swing 100+ degrees between summer days and winter nights. Modified bitumen offers excellent waterproofing with multiple-layer redundancy.',
      },
      {
        heading: 'Budgeting a Flat Roof',
        content: 'Flat roofs price by the square foot of deck, but the deck is the easy part — the number is really set by everything sticking up through it. Every curb, drain, scupper, vent stack, skylight, and HVAC unit needs flashed detail work, and detail work is hand labor that doesn\'t scale with area. Insulation is the other big lever: if the existing roof has no slope built in, tapered insulation has to be laid out and stacked to move water to the drains, which adds both material and design time. Then there\'s what\'s under the membrane. Saturated insulation or soft decking found at tear-off changes the scope, which is why we moisture-test before we quote instead of after. Across the four systems, EPDM sits at the low end, TPO and modified bitumen in the middle, and built-up at the top because it\'s multiple layers applied one at a time. Lifespans track the material: EPDM 25–30 years, TPO 20–30, modified bitumen 20–25, BUR 20–30. TPO\'s white reflective surface runs 50–60 degrees cooler than dark alternatives at peak summer, and that temperature difference is what you\'re actually buying in membrane life.',
      },
      {
        heading: 'The Upstate SC Factor',
        content: 'Our combination of high UV exposure, extreme heat, humidity, and heavy storm rainfall makes flat roof material selection and installation quality especially critical. Ponding water — any water still sitting 48 hours after rain — is the number one enemy of flat roofs, and our heavy downpours test drainage systems hard. Proper slope-to-drain design and fully sealed seams aren\'t optional here — they\'re survival requirements.',
      },
    ],
    warningSigns: [
      { trigger: 'Water ponding 48+ hours after rain', detail: 'Indicates drainage problems that will degrade any membrane material over time, potentially leading to structural issues from added weight.' },
      { trigger: 'Blistering or bubbling on the membrane', detail: 'Trapped moisture or air between layers will eventually crack open and create leak points.' },
      { trigger: 'Visible seam separation or lifting', detail: 'Seams are the most vulnerable part of any flat roof. Separated seams allow direct water infiltration.' },
      { trigger: 'Soft or spongy areas when walking on the roof', detail: 'The decking or insulation below is saturated with water, and structural damage is likely progressing.' },
      { trigger: 'Interior water stains below the flat roof', detail: 'By the time water shows inside, the leak has usually been active for a while and damage may be extensive.' },
      { trigger: 'Cracking or alligatoring on the surface', detail: 'UV degradation and thermal cycling cause surface cracking that looks like alligator skin, compromising the waterproof barrier.' },
      { trigger: 'Vegetation growing on the roof surface', detail: 'Organic growth holds moisture against the membrane and roots can penetrate seams and flashing.' },
    ],
    maintenanceTips: [
      { tip: 'Inspect quarterly and after every major storm', detail: 'Flat roofs need more frequent inspection than sloped roofs because they don\'t shed water and debris as naturally.' },
      { tip: 'Keep drains, scuppers, and gutters completely clear', detail: 'A single blocked drain can create thousands of pounds of ponding water. Fall leaves and spring pollen create constant clogging risk.' },
      { tip: 'Remove debris promptly', detail: 'Branches, leaves, and dirt trap moisture and accelerate membrane degradation — especially in our humidity where things stay wet longer.' },
      { tip: 'Re-seal all penetrations every 3–5 years', detail: 'Sealant degrades faster than the membrane itself. Penetration flashing is the most common leak source on flat roofs.' },
      { tip: 'Don\'t allow unauthorized foot traffic', detail: 'Tools, equipment, and heavy foot traffic can puncture membranes. Designate walkway pads for HVAC access routes.' },
      { tip: 'Professional membrane inspection every 2–3 years', detail: 'Some issues require trained eyes and sometimes infrared scanning to detect before they become visible problems.' },
    ],
    processSteps: [
      { num: '01', title: 'Assessment & Design', description: 'We evaluate the existing structure, measure precisely, assess drainage pathways, and test for subsurface moisture. We design the new system including slope, drainage placement, and penetration details.' },
      { num: '02', title: 'Tear-Off or Preparation', description: 'We remove the existing membrane if warranted, repair or replace damaged decking, and install new insulation with tapered sections to ensure proper drainage slope.' },
      { num: '03', title: 'Membrane Installation', description: 'The selected membrane is installed to manufacturer specs. TPO seams are heat-welded. EPDM is adhered and seamed with specialized adhesive. Modified bitumen is torch-applied or self-adhered.' },
      { num: '04', title: 'Flashing & Detail Work', description: 'All penetrations, edges, transitions, and drainage components are carefully flashed and sealed. This detail work determines whether the roof performs flawlessly or develops leaks.' },
      { num: '05', title: 'Inspection, Testing & Documentation', description: 'We perform flood testing or infrared scanning to verify watertight integrity, document the installation, and provide manufacturer warranty registration alongside our workmanship guarantee.' },
    ],
    faq: [
      { q: 'Which flat roof system do you recommend for this area?', a: 'For most commercial and mixed-use applications, we lean toward TPO. Heat-welded seams are virtually leak-proof, the reflective surface fights our summer heat, and the lifespan holds up against anything else in the category. For residential flat sections, modified bitumen often fits best.' },
      { q: 'Can a flat roof handle heavy SC rainstorms?', a: 'Absolutely, when properly designed. The key is adequate slope-to-drain (minimum 1/4 inch per foot), properly sized drains, and fully sealed seams. We design drainage paths that handle our worst downpours, not just average rainfall.' },
      { q: 'Is a flat roof more likely to leak?', a: 'A properly installed and maintained flat roof is extremely reliable. The "leak-prone" reputation comes from poor installation, inadequate drainage, and deferred maintenance — not from the materials themselves.' },
      { q: 'Can you install over an existing flat roof?', a: 'In some cases, yes. If the existing roof has only one layer, the decking is sound, and the insulation is dry, an overlay can save significant cost. We always recommend thorough inspection first, including moisture testing.' },
    ],
    costData: [
      { item: 'EPDM', cost: 'Rolls out fast on open deck; seam count adds up', lifespan: '25–30 years' },
      { item: 'TPO', cost: 'Every seam is heat-welded; penetrations and curbs are hand work', lifespan: '20–30 years' },
      { item: 'Modified Bitumen', cost: 'Layer count, plus torch-applied versus self-adhered', lifespan: '20–25 years' },
      { item: 'Built-Up (BUR)', cost: 'Layers built up on site — the heaviest labor load of the four', lifespan: '20–30 years' },
    ],
    seoKeywords: ['flat roof repair Greenville SC', 'TPO roofing contractor', 'commercial flat roof Upstate SC', 'EPDM roof installation'],
  },

  // ═══ 4. ROOF REPAIR ═══
  {
    id: 'roof-repair',
    slug: 'roof-repair',
    title: 'Roof Repair',
    tagline: 'Fast, Honest Repairs That Stop Damage in Its Tracks',
    heroDescription: 'When your roof is leaking or a storm just ripped through your neighborhood, you need a contractor who answers the phone, shows up fast, and fixes it right — not one who uses your emergency to sell you a roof you don\'t need. We provide straightforward repair services and we\'ll tell you the truth about whether you need a repair or a replacement.',
    heroImage: '/images/services/roofing/subs/repair-hero.jpg',
    cardImage: '/images/services/roofing/subs/repair-card.jpg',
    galleryImages: [
      '/images/services/roofing/subs/repair-hero.jpg',
      '/images/services/roofing/subs/chimney-flashing-slate.jpg',
      '/images/services/roofing/subs/chimney-roll-roofing.jpg',
      '/images/services/roofing/subs/shingle-install-kneeling.jpg',
      '/images/services/roofing/subs/roofer-roof-edge.jpg',
      '/images/services/roofing/subs/tile-edge-gutter.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Roof repair covers a wide range of services aimed at restoring your roof\'s protective function without full replacement. Leak repair targets specific points of water infiltration — often around flashing, in valleys, or where shingles have been compromised. Storm damage repair addresses the aftermath of hail, wind, and fallen debris. Flashing repair focuses on the metal components that seal transitions at chimneys, skylights, walls, and vents — the most common source of roof leaks.',
      },
      {
        heading: 'Common Repair Scenarios in Our Area',
        content: 'Upstate South Carolina\'s weather creates predictable repair needs. Spring and summer thunderstorms bring hail that bruises shingles and cracks flashing sealant. High winds lift and tear shingles, especially on roofs over 15 years old. We see the same failure points year after year — chimney flashing, pipe boot failures, valley deterioration, and wind-damaged ridge caps.',
      },
      {
        heading: 'How We Price a Repair',
        content: 'A repair comes down to three questions: how hard is the spot to reach, how much has to come apart to get at the actual cause, and what we find once it does. A handful of blown shingles on a walkable 6:12 is a short visit. The same shingles on a 12:12 with a tight side yard means staging and a second man before anyone touches a shingle. Flashing scales the same way — resealing a step flashing joint is small work, while rebuilding chimney counterflashing means cutting a fresh reglet into the masonry and bending new metal. Leak repairs are the least predictable of the bunch, because the entry point is usually feet away from the stain on your ceiling, and the real number depends on how much decking and insulation went soft before you called. Storm work covers the widest range, from a few ridge caps to an entire slope, and it changes again if it\'s an insurance job with an adjuster\'s scope to match. Emergency calls carry a premium — you\'re paying for a crew pulled off another job the same day, plus tarping labor that gets stripped back off later. You get the number before we start, and you get told plainly when a repair is money spent on a roof that\'s already done.',
      },
      {
        heading: 'Repair vs. Replace',
        content: 'This is the most important conversation we have with homeowners. Our rule of thumb: if repair costs exceed 30% of replacement cost, if the roof is within 5 years of its expected lifespan, if leaks occur in multiple unrelated locations, or if decking is compromised — replacement is the smarter investment. We\'ll never push replacement when a repair genuinely solves the problem.',
      },
    ],
    warningSigns: [
      { trigger: 'Water stains on your ceiling or walls', detail: 'The leak source is often not directly above the stain — water travels along rafters and sheathing. Professional investigation is needed.' },
      { trigger: 'Shingles in your yard after a storm', detail: 'Visible evidence that your roof has been compromised and exposed areas need immediate protection.' },
      { trigger: 'Flashing pulling away from chimneys, walls, or skylights', detail: 'Even a small gap in flashing allows water behind the surface, where it causes hidden damage.' },
      { trigger: 'Dripping in the attic during or after rain', detail: 'Direct evidence of an active leak that will worsen with every rain event.' },
      { trigger: 'Damaged or cracked pipe boots', detail: 'The rubber seals around plumbing vents are the single most common leak source we encounter. They have a shorter lifespan than the roof itself.' },
      { trigger: 'Dented or cracked shingles after hail', detail: 'Hail damage may not leak immediately but compromises the granule layer, leading to accelerated deterioration.' },
      { trigger: 'Higher-than-normal energy bills', detail: 'Can indicate compromised insulation from an undetected leak allowing moisture into the attic.' },
    ],
    maintenanceTips: [
      { tip: 'Don\'t ignore small problems', detail: 'A flashing repair caught today is a one-trip job on the roof. The same leak next month is drywall, insulation, and paint on top of the flashing — and in our humidity that escalation takes weeks, not years.' },
      { tip: 'Ground-level inspection after every significant storm', detail: 'Walk around your home, look up at the roofline, check gutters for debris, look for shingles on the ground. Snap photos for documentation.' },
      { tip: 'Check your attic after heavy rains', detail: 'Look for daylight, water stains, damp insulation, or active dripping. Catch leaks at the source before they reach your living space.' },
      { tip: 'Know your roof\'s age and material', detail: 'This helps us and your insurance company assess whether repair or replacement is appropriate when damage occurs.' },
      { tip: 'Keep a roofing contractor\'s number saved', detail: 'Emergency response time matters. Having a trusted contractor prevents panicked decisions with unfamiliar companies when disaster strikes.' },
    ],
    processSteps: [
      { num: '01', title: 'Emergency Response', description: 'For active leaks or major damage, we deploy immediately with tarps, sealant, and temporary patching to stop water infiltration and prevent further interior damage.' },
      { num: '02', title: 'Inspection & Diagnosis', description: 'We identify the root cause, not just the symptom. This includes exterior inspection, attic-side investigation, and sometimes water testing to trace leak paths. Everything documented with photos.' },
      { num: '03', title: 'Repair Plan & Estimate', description: 'Clear explanation of what we found, what needs to be done, what it costs, and whether repair is the right call or the roof warrants a broader conversation about replacement.' },
      { num: '04', title: 'Permanent Repair', description: 'We execute using quality materials matching your existing roof. Shingle repairs use matching products. Flashing fabricated from appropriate-gauge metal. All sealants rated for our climate.' },
      { num: '05', title: 'Verification & Follow-Up', description: 'We verify the repair resolved the issue, clean up completely, and provide documentation. For insurance claims, all necessary paperwork. We check back after the next significant rain.' },
    ],
    faq: [
      { q: 'How quickly can you respond to an emergency?', a: 'For active leaks and storm emergencies in the Upstate SC area, we aim for same-day response. Emergency service includes temporary tarping and patching, followed by a permanent repair plan once conditions allow.' },
      { q: 'Should I file an insurance claim for roof damage?', a: 'If the damage is from a covered event (hail, wind, fallen tree), yes. File promptly — most policies have time limits. We provide detailed damage assessments with photo documentation that adjusters need.' },
      { q: 'Can I repair just part of my roof?', a: 'Often, yes. If damage is localized and the rest of the roof is in good condition, targeted repair is absolutely appropriate. We\'ll give you an honest assessment.' },
      { q: 'Why does the leak seem worse sometimes?', a: 'Wind direction matters. Many leaks only manifest when rain is driven from a specific direction, which is why professional assessment is important — the entry point may only be visible under certain conditions.' },
    ],
    costData: [
      { item: 'Minor Repairs (shingles, sealant)', cost: 'Access and pitch matter more than the shingle count', lifespan: 'Extends roof life' },
      { item: 'Flashing Repair', cost: 'Reseal an existing joint, or cut new metal into masonry', lifespan: '10–15+ years' },
      { item: 'Leak Repair', cost: 'How far the water traveled before you saw the stain', lifespan: 'Varies by cause' },
      { item: 'Storm Damage Repair', cost: 'Slopes affected, decking condition, whether a carrier is involved', lifespan: 'Varies by extent' },
    ],
    seoKeywords: ['roof repair Greenville SC', 'emergency roof repair near me', 'storm damage roof repair Upstate SC', 'roof leak fix'],
  },

  // ═══ 5. ROOF REPLACEMENT ═══
  {
    id: 'roof-replacement',
    slug: 'roof-replacement',
    title: 'Roof Replacement',
    tagline: 'When Repair Won\'t Cut It, We Replace It Right',
    heroDescription: 'A roof replacement is one of the largest investments you\'ll make in your home, and it deserves a contractor who gets it right the first time. Whether your roof has reached end of life, sustained unrepairable storm damage, or is costing more in repairs than it\'s worth, we provide full tear-off and overlay replacement backed by 25+ years of experience.',
    heroImage: '/images/services/roofing/subs/replacement-hero.jpg',
    cardImage: '/images/services/roofing/subs/replacement-card.jpg',
    galleryImages: [
      '/images/services/roofing/subs/replacement-hero.jpg',
      '/images/services/roofing/subs/shingle-bundles-deck.jpg',
      '/images/services/roofing/subs/crew-house-wide.jpg',
      '/images/services/roofing/subs/shingle-nailgun.jpg',
      '/images/services/roofing/subs/crew-brick-house.jpg',
      '/images/services/roofing/subs/house-scaffolding.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Roof replacement means removing your existing roofing system and installing a completely new one. There are two approaches: a full tear-off (stripping to the deck, inspecting structure, and building new from bottom up) and an overlay (installing new material directly over existing). Full tear-off is the gold standard and what we recommend in the vast majority of cases.',
      },
      {
        heading: 'Tear-Off vs. Overlay',
        content: 'A full tear-off prices off square footage, pitch, how many layers are coming off, and how cut-up the roofline is — every valley, hip, dormer, chimney, and pipe penetration is hand work that area alone doesn\'t capture. An overlay comes in meaningfully lower because there\'s no tear-off labor and no dumpster. It also lasts roughly half as long: new shingles conform to the old surface\'s imperfections, and the heat trapped between the two layers cooks the new one from below. More importantly, an overlay means nobody ever looks at your decking — you\'re roofing over an unknown. Building code caps you at two layers, so an overlay also spends the one shot you get; the next roof is a full tear-off regardless, and it\'ll be a tear-off of two layers instead of one.',
      },
      {
        heading: 'When to Replace vs. Repair',
        content: 'Clear indicators it\'s time: the roof is within 5 years of expected lifespan end, leaks in multiple unrelated locations, repair costs exceed 30% of replacement cost, widespread granule loss (30%+ of surface), extensive curling or cracking, compromised decking, or you\'re selling and the roof hurts the price. If your roof is mid-life and damage is localized, repair is usually the right call.',
      },
      {
        heading: 'What Sets Your Number — and Your Schedule',
        content: 'Ask a roofer to price a replacement sight-unseen and you\'ll get a guess. Here\'s what actually decides it: total square footage and pitch, since a steep roof needs staging and slows every stage; the number of layers coming off; roof complexity; access and staging — whether a dump trailer can sit under the eave or every bundle gets carried; the material tier you choose; and decking condition once we\'re down to bare deck. We carry a stated sheet allowance in every estimate and bill only the sheets we actually swap, so rotten sheathing is a known variable instead of a surprise. On timing, a standard tear-off and replace is a 1–3 day job, 3–5 for larger or complex roofs. We stage it so the deck is never open overnight and we don\'t strip a slope we can\'t dry in the same day. Summer heat is the real scheduling constraint here — asphalt softens and scuffs underfoot on a 95-degree afternoon, so we start at first light and shut down the hot side of the roof early. Below roughly 40 degrees the self-sealing strips won\'t bond on their own and every tab has to be hand-sealed, which is why winter work gets planned around a warm stretch. Insurance jobs run on the carrier\'s clock, not ours: adjuster visit, then an approved scope, then a supplement if what we uncover on the deck exceeds it — build that into your expectations. A new roof is consistently ranked among the highest-return home improvements and removes the number one objection buyers raise.',
      },
    ],
    warningSigns: [
      { trigger: 'Your roof is 20+ years old', detail: 'Even without visible leaks, a roof nearing end of life is living on borrowed time, especially after our storm seasons.' },
      { trigger: 'Widespread granule loss creating bald patches', detail: 'When more than 30% of the surface has significant granule loss, repair is no longer practical.' },
      { trigger: 'Multiple active leaks in different areas', detail: 'This indicates systemic failure, not isolated damage.' },
      { trigger: 'Shingles curling, buckling, or cracking across large sections', detail: 'Widespread deterioration means the entire system is failing, not just individual shingles.' },
      { trigger: 'Sagging sections of the roof', detail: 'Structural compromise from long-term moisture damage requires tear-off to access and repair the framing.' },
      { trigger: 'Neighbors getting new roofs', detail: 'Homes built around the same time experience similar aging. If homes around you are being replaced, yours is likely at the same point.' },
      { trigger: 'Energy bills climbing without explanation', detail: 'A failing roof compromises insulation performance, and your HVAC works harder to compensate.' },
    ],
    maintenanceTips: [
      { tip: 'Establish a maintenance routine immediately after replacement', detail: 'Twice-yearly visual inspections, gutter cleaning, and tree trimming protect your investment from day one.' },
      { tip: 'Register your manufacturer warranty promptly', detail: 'Most manufacturers require registration within a set timeframe. We handle this, but verify it\'s done.' },
      { tip: 'Keep all documentation', detail: 'Store your contract, warranty cards, material specs, and before/after photos. You\'ll need these for insurance, home sale, or warranty claims.' },
      { tip: 'Professional inspection at year 5 and every 3–5 years after', detail: 'Catching minor issues early extends lifespan and keeps warranties intact.' },
      { tip: 'Don\'t let anyone walk on your new roof unnecessarily', detail: 'Satellite installers, painters, and Christmas light contractors can damage shingles. Insist on proper roofing shoes.' },
      { tip: 'Address new penetrations properly', detail: 'If you add a vent, satellite dish, or antenna, ensure proper flashing is installed. Poorly sealed penetrations are the fastest way to compromise a new roof.' },
    ],
    processSteps: [
      { num: '01', title: 'Pre-Replacement Inspection', description: 'Comprehensive inspection including attic-side assessment, precise measurements, ventilation evaluation, and structural concern identification. Detailed scope of work and estimate with material options.' },
      { num: '02', title: 'Material Selection & Scheduling', description: 'We help you select the right material, order it, schedule the project, coordinate dumpster delivery, and provide a clear timeline with expectations for every phase.' },
      { num: '03', title: 'Tear-Off', description: 'Systematic removal of all existing material down to the deck. Every section of decking inspected — damaged or rotted sheathing replaced with new OSB or plywood. This is the step overlays skip, and it\'s the most important quality checkpoint.' },
      { num: '04', title: 'System Installation', description: 'Drip edge, ice-and-water shield in all critical areas, synthetic underlayment, starter strip, field shingles, hip and ridge caps, and all flashing — every component installed per manufacturer specs.' },
      { num: '05', title: 'Cleanup & Handoff', description: 'Magnetic nail sweepers across your entire property, all debris hauled away, detailed final inspection. You walk the property with us, receive warranty documentation, and get our direct line.' },
    ],
    faq: [
      { q: 'What drives the price of a full roof replacement?', a: 'Square footage first, then pitch — steep roofs need staging and slow every stage of the work. After that: how many layers are coming off, how cut-up the roof is (valleys, hips, dormers, chimneys, and pipe penetrations are all hand work), access for the dumpster and material drop, the shingle tier you pick, and decking condition once we\'re at bare deck. We measure the roof, look at it from the attic side, and count the layers before we quote — and every estimate carries a stated sheet allowance so bad sheathing is a known variable, not a mid-job surprise. You get it line-itemed.' },
      { q: 'Should I choose overlay or full tear-off?', a: 'We recommend tear-off in nearly every situation. An overlay saves real money upfront but lasts roughly half as long, hides whatever your decking is doing, and voids many manufacturer warranties. The only scenario where an overlay makes sense is a confirmed-sound single-layer roof on a tight timeline or a tight budget — and you should go in knowing you\'re buying half a roof life.' },
      { q: 'How long does replacement take?', a: 'Most standard replacements take 1–3 days. Larger or complex roofs may take 3–5 days. We never rush to beat rain — we protect exposed areas and resume when conditions are right.' },
      { q: 'Does a new roof increase my home\'s value?', a: 'Significantly, and it\'s consistently ranked among the highest-return home improvements. The practical version: a roof at end of life is the first thing a buyer\'s inspector writes up and the biggest thing they negotiate against you. A documented replacement with transferable warranty paperwork takes that off the table entirely.' },
      { q: 'Can I stay in my home during replacement?', a: 'Yes. It\'s exterior work and while it is noisy, you can remain safely. We protect your landscaping, cover your driveway, and leave your property cleaner than we found it.' },
    ],
    costData: [
      { item: 'Full Tear-Off (Architectural Shingles)', cost: 'Square footage, pitch, layer count, and the deck underneath', lifespan: '25–30 years' },
      { item: 'Overlay', cost: 'No tear-off, no dumpster — and no look at the decking', lifespan: '12–18 years' },
      { item: 'Metal Roof Replacement', cost: 'Panel fabrication and flashing detail at every transition', lifespan: '40–70 years' },
    ],
    seoKeywords: ['roof replacement Greenville SC', 'new roof cost Upstate SC', 'roof tear-off near me', 'roof replacement contractor'],
  },

  // ═══ 6. ROOF INSPECTIONS ═══
  {
    id: 'roof-inspections',
    slug: 'roof-inspections',
    title: 'Roof Inspections',
    tagline: 'Know Exactly What\'s Up There Before It Comes Down',
    heroDescription: 'The most expensive roof problems are the ones you don\'t know about until they\'ve caused serious damage. Our professional inspections give you a clear, documented picture of your roof\'s condition — whether you\'re maintaining your home, buying a new one, or assessing storm damage for an insurance claim.',
    heroImage: '/images/services/roofing/subs/inspection-hero.jpg',
    cardImage: '/images/services/roofing/subs/inspection-card.jpg',
    galleryImages: [
      '/images/services/roofing/subs/inspection-hero.jpg',
      '/images/services/roofing/subs/chimney-flashing-slate.jpg',
      '/images/services/roofing/subs/tile-edge-gutter.jpg',
      '/images/services/roofing/subs/commercial-roofs-aerial.jpg',
      '/images/services/roofing/subs/roofer-roof-edge.jpg',
      '/images/services/roofing/subs/shingle-install-kneeling.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'A professional roof inspection is a systematic evaluation of your entire roofing system — material condition, flashing, penetrations, drainage, ventilation, structural integrity, and attic-side indicators. There are three main types: annual/routine inspections that catch developing problems early, pre-purchase inspections that protect buyers from costly surprises, and storm damage assessments for insurance claims.',
      },
      {
        heading: 'What We Inspect',
        content: 'We evaluate far more than just shingles. Roofing surface material wear and damage, all flashing at chimneys, walls, skylights, and vents, pipe boots and penetration seals, gutters and drainage flow, fascia and soffit condition, attic ventilation balance, attic-side decking for stains, rot, or daylight, and insulation condition. For storm assessments, we document every hail impact, wind damage, and debris impact with photographs.',
      },
      {
        heading: 'What Sets the Fee — and What It Saves',
        content: 'A standard inspection prices off roof size, pitch, and how much of it we can safely walk — a walkable ranch takes a fraction of the time a steep, cut-up two-story does. Add-ons move the number: drone work when pitch or fragile material rules out walking, and infrared scanning when we need to find moisture trapped inside decking or under a membrane that looks fine from the surface. Storm damage assessments for an insurance claim we usually provide at no charge, because if a claim is coming, we want the documentation done right from the first visit. Set any of that against what an inspection heads off — a leak quietly rotting decking and framing, buying a house that needs a full roof the month you close, or missing your carrier\'s filing window entirely. Plan on 45–90 minutes on site and a written report with photos.',
      },
      {
        heading: 'Why Frequency Matters',
        content: 'We recommend inspections twice yearly (spring and fall) and after any significant storm. Our storm season runs roughly April through September. A spring inspection catches winter damage; a fall inspection catches storm season damage. This rhythm catches problems at the earliest and least expensive stage.',
      },
    ],
    warningSigns: [
      { trigger: 'Your roof is 15+ years old and never professionally inspected', detail: 'You likely have developing issues that aren\'t visible from the ground.' },
      { trigger: 'Buying a home and the general inspector\'s roof check was superficial', detail: 'General inspectors are not roofing specialists. A dedicated inspection can save you tens of thousands.' },
      { trigger: 'A major storm hit, even if your roof looks fine from the ground', detail: 'Hail damage is often invisible from ground level. Wind damage to flashing and sealant can\'t be seen without getting on the roof.' },
      { trigger: 'Granules accumulating in gutters', detail: 'Warrants inspection to determine whether it\'s normal new-roof shedding, localized damage, or end-of-life deterioration.' },
      { trigger: 'Neighbors are filing insurance claims after a storm', detail: 'If homes around you sustained damage, yours almost certainly did too, even if symptoms haven\'t appeared yet.' },
      { trigger: 'You\'re planning to sell your home', detail: 'A pre-listing inspection lets you address issues proactively rather than negotiating under pressure when the buyer\'s inspector flags them.' },
    ],
    maintenanceTips: [
      { tip: 'Schedule routine inspections spring and fall', detail: 'Make it a habit like changing HVAC filters. Consistent inspections are the single most effective way to extend your roof\'s lifespan.' },
      { tip: 'Get inspected within 2 weeks of any hail or 50+ mph wind', detail: 'Insurance claim timelines are real. Delayed documentation weakens your claim.' },
      { tip: 'Keep a file of all inspection reports', detail: 'History helps track condition over time and is invaluable for insurance claims, warranty requests, and home sale documentation.' },
      { tip: 'Act on findings promptly', detail: 'A cracked pipe boot flagged in April is a one-trip fix. Left through storm season, the same boot is decking, wet insulation, and ceiling drywall.' },
      { tip: 'Pair inspections with gutter cleaning', detail: 'We\'re already up there, and clean gutters protect your roof edge, fascia, and foundation. One trip, two problems handled.' },
    ],
    processSteps: [
      { num: '01', title: 'Scheduling & Prep', description: 'We coordinate timing, review your specific concerns (active leak, recent storm, pre-purchase), and prepare for the inspection type needed.' },
      { num: '02', title: 'Exterior Roof Inspection', description: 'Systematic evaluation of the entire roof surface — material condition, every flashing detail, sealants, pipe boots, ridge caps, valleys, and eave edges.' },
      { num: '03', title: 'Interior/Attic Inspection', description: 'Examination of the roof deck underside for stains, rot, daylight, or moisture. Ventilation components, insulation condition, and signs of pest intrusion or mold.' },
      { num: '04', title: 'Drainage & Perimeter Assessment', description: 'Inspection of gutters, downspouts, drainage flow, fascia, soffit, and roof-to-wall transitions from ground level.' },
      { num: '05', title: 'Report & Consultation', description: 'Detailed written report with photographs, condition ratings, and prioritized recommendations. We explain findings, answer questions, and help you plan next steps.' },
    ],
    faq: [
      { q: 'What determines what an inspection costs?', a: 'Roof size, pitch, and access — a walkable ranch is quick; a steep, cut-up two-story is not. Every standard inspection includes full exterior and attic-side evaluation with a written report and photographs. Drone or infrared work is quoted on top, only when the roof actually calls for it. Storm damage assessments for an insurance claim are often provided at no charge.' },
      { q: 'How long does an inspection take?', a: '45–90 minutes for a standard residential roof. We don\'t rush it — includes time on the roof, in the attic, ground-level drainage assessment, and a conversation about findings.' },
      { q: 'Will you walk on my roof?', a: 'When safe, yes. Walking provides information that visual-only or drone-only inspections cannot, including soft spots and flashing seal testing. For steep or fragile roofs, we use ladders and drone technology.' },
      { q: 'Can you inspect a roof I\'m thinking of buying?', a: 'Absolutely, and we push for it. A pre-purchase inspection runs above a routine one because we document harder — you may be negotiating with that report, so it has to hold up. General home inspectors are generalists; most of them look at a roof from a ladder at the eave. We\'ve pulled buyers back from houses that needed a full replacement the month they closed, and that report is the strongest leverage you\'ll have at the table.' },
    ],
    costData: [
      { item: 'Standard Inspection', cost: 'Roof size, pitch, and how much of it is walkable', lifespan: 'N/A' },
      { item: 'Pre-Purchase Inspection', cost: 'Documented deeper — you may negotiate with the report', lifespan: 'N/A' },
      { item: 'Drone Inspection', cost: 'For pitch or fragile material that rules out walking it', lifespan: 'N/A' },
      { item: 'Infrared Inspection', cost: 'Scan time plus equipment; finds moisture the eye can\'t', lifespan: 'N/A' },
    ],
    seoKeywords: ['roof inspection Greenville SC', 'roof inspection cost', 'pre-purchase roof inspection Upstate SC', 'storm damage assessment'],
  },

  // ═══ 7. GUTTER SYSTEMS ═══
  {
    id: 'gutter-systems',
    slug: 'gutter-systems',
    title: 'Gutter Systems',
    tagline: 'Directing Every Drop Away from Your Foundation',
    heroDescription: 'Your gutters are your roof\'s exit strategy for water — and in Upstate South Carolina, where we average 50+ inches of rainfall per year, a properly functioning gutter system is not optional. We install seamless aluminum gutters, gutter guard systems, and complete drainage solutions designed to handle the volume our storms deliver.',
    heroImage: '/images/services/roofing/subs/gutter-hero.jpg',
    cardImage: '/images/services/roofing/subs/gutter-card.jpg',
    galleryImages: [
      '/images/services/roofing/subs/gutter-hero.jpg',
      '/images/services/roofing/subs/copper-gutter-rain.jpg',
      '/images/services/roofing/subs/tile-edge-gutter.jpg',
      '/images/services/roofing/subs/gutter-card.jpg',
      '/images/services/roofing/subs/crew-house-wide.jpg',
      '/images/services/roofing/subs/house-scaffolding.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'A complete gutter system includes gutters (horizontal channels along your roof\'s edge), downspouts (vertical pipes carrying water to ground), and drainage components (splash blocks, underground extensions, or French drains). Seamless gutters are fabricated on-site from a continuous roll of aluminum, custom-cut to exact lengths — eliminating the most common leak points of sectional gutters.',
      },
      {
        heading: 'Why Seamless Matters',
        content: 'Every joint in a sectional gutter is a potential leak point. Sealant degrades, sections shift, joints separate — especially with the thermal expansion we experience. Seamless gutters eliminate this entirely. They\'re custom-formed on-site to match your home\'s exact measurements, available in a wide range of colors and profiles. 5-inch K-style is standard residential; 6-inch for large roof areas or steep pitches.',
      },
      {
        heading: 'Gutter Guards',
        content: 'Gutter guards dramatically reduce the need for gutter cleaning. Micro-mesh guards are the most effective, blocking even pine needles and shingle granules. Surface-tension guards work well for leaves but can struggle with fine debris. In our area, where pine needles, oak leaves, and pollen are constant challenges, gutter guards are a particularly worthwhile investment with 93%+ homeowner satisfaction.',
      },
      {
        heading: 'What Sizes the Job',
        content: 'Gutters price by the linear foot of roofline, so the first thing we measure is how much edge your house actually has — and a home with a lot of roof planes carries far more edge than its square footage suggests. From there: gutter size (6-inch runs cost more per foot than 5-inch and need bigger downspouts to match), material (aluminum is the standard; copper is a different category entirely), the number of downspouts and where they can legally land, and story height, since a second-story run means ladder staging and a second set of hands on every section. Guards add a per-foot cost on top of the gutter itself and vary by type — micro-mesh sits above surface-tension. Underground drainage extensions get priced separately, because that\'s trenching work, not gutter work. Install is typically a one-day job once fabrication starts, since the runs are formed on site. Weigh the whole system against what failing gutters actually cost you: foundation movement in our clay soils, eroded beds, rotted fascia, and standing water in a crawlspace.',
      },
    ],
    warningSigns: [
      { trigger: 'Water overflowing or cascading over gutter edges', detail: 'Gutters are clogged, undersized, or improperly pitched.' },
      { trigger: 'Gutters pulling away from fascia or sagging', detail: 'The weight of debris and standing water has exceeded fastener capacity, or the fascia has rotted.' },
      { trigger: 'Water pooling near your foundation after rain', detail: 'Drainage isn\'t directing water far enough away. Foundation damage is a real risk.' },
      { trigger: 'Staining on siding below the gutter line', detail: 'Water is leaking at joints or overflowing in those locations.' },
      { trigger: 'Plants growing in your gutters', detail: 'Enough organic matter has accumulated to support plant life — water flow is completely blocked.' },
      { trigger: 'Erosion channels below downspout locations', detail: 'Downspout discharge needs splash blocks or underground extensions to dissipate flow.' },
      { trigger: 'Peeling paint or rot on fascia boards', detail: 'Water is sitting behind or overflowing from gutters, damaging the wood underneath.' },
      { trigger: 'Pest activity around your gutters', detail: 'Clogged gutters provide nesting material, standing water for mosquitoes, and habitat for pests.' },
    ],
    maintenanceTips: [
      { tip: 'Clean gutters at least twice a year', detail: 'Late fall after leaves drop and spring after pollen season. In heavily wooded areas, quarterly cleaning may be necessary.' },
      { tip: 'Inspect pitch and fasteners annually', detail: 'Gutters should slope toward downspouts at approximately 1/4 inch per 10 feet. Re-secure loose brackets before they cause sagging.' },
      { tip: 'Flush downspouts with a garden hose', detail: 'Clogs often form at the elbow. Flushing confirms water flows freely all the way to the ground.' },
      { tip: 'Ensure downspouts discharge 4–6 feet from foundation', detail: 'Add extensions or underground drainage. In our clay-heavy Upstate SC soils, poor drainage causes foundation movement.' },
      { tip: 'Check for rust or corrosion', detail: 'Steel or galvanized gutters develop rust spots that become holes. Aluminum doesn\'t rust but can corrode at contact points with dissimilar metals.' },
      { tip: 'Consider gutter guards', detail: 'The investment pays for itself within 3–5 years in eliminated cleaning costs and prevented damage. Modern micro-mesh systems have extremely high satisfaction.' },
    ],
    processSteps: [
      { num: '01', title: 'Assessment & Measurement', description: 'We evaluate your current situation, measure every run of roofline, assess drainage patterns, calculate required capacity based on roof area and local rainfall data, and plan downspout placement.' },
      { num: '02', title: 'Material & Color Selection', description: 'Choose gutter profile (K-style or half-round), size (5" or 6"), material (aluminum, copper), color matched to your trim, and gutter guard type if desired.' },
      { num: '03', title: 'On-Site Fabrication', description: 'Our portable roll-forming machine creates seamless runs on-site, cut to exact lengths. Precise fit, clean appearance, and no mid-run joints.' },
      { num: '04', title: 'Installation', description: 'Gutters installed with proper pitch using hidden hangers, all downspouts connected, gutter guards installed if selected, and water flow verified through the entire system.' },
      { num: '05', title: 'Drainage Verification & Cleanup', description: 'We test with water to confirm proper flow, verify downspout discharge directs water away from the foundation, clean up all scraps, and walk you through maintenance recommendations.' },
    ],
    faq: [
      { q: 'Why seamless gutters instead of sectional?', a: 'Every seam is a future leak. Joint sealant degrades within 5–10 years, and temperature swings open gaps. Seamless gutters are formed from a continuous piece — the only joints are at corners and downspouts. They look cleaner, perform better, and last longer.' },
      { q: 'What size gutters do I need?', a: 'Most Upstate SC homes need 5-inch K-style with 2x3-inch downspouts. Large roof areas, steep pitches, or multi-plane runoff may need 6-inch with 3x4-inch downspouts. We calculate requirements based on your roof area and rainfall intensity.' },
      { q: 'Are gutter guards worth the investment?', a: 'For most Upstate SC homeowners, absolutely. Pine trees, hardwoods, and pollen create constant clogging. Quality micro-mesh guards reduce cleaning from 2–4 times per year to once every 2–3 years. Typical payback is 3–5 years.' },
      { q: 'How long do seamless gutters last?', a: 'Aluminum seamless gutters last 20–30 years with proper maintenance. The typical failure point isn\'t the channel — it\'s the fascia behind it. Proper installation pitch and regular maintenance are what make gutters last.' },
      { q: 'Do you handle gutter repair too?', a: 'Yes — we repair leaking joints, re-pitch sagging sections, replace damaged runs, reattach loose gutters, and extend downspouts. If your system is fundamentally sound, we\'ll repair rather than selling you a replacement.' },
    ],
    costData: [
      { item: 'Seamless Aluminum Gutters', cost: 'Linear feet of roofline, gutter size, and story height', lifespan: '20–30 years' },
      { item: 'Gutter Guards (Micro-Mesh)', cost: 'Priced per foot on top of the run; mesh type matters', lifespan: '10–20 years' },
      { item: 'Downspouts', cost: 'Count, drop height, and where the water has to end up', lifespan: '20–30 years' },
      { item: 'Complete System (typical home)', cost: 'Roof planes, downspout count, and any underground drainage', lifespan: '20–30 years' },
    ],
    seoKeywords: ['seamless gutters Greenville SC', 'gutter installation Upstate SC', 'gutter guards near me', 'gutter repair contractor'],
  },

  // ═══ 8. ROOF VENTILATION ═══
  {
    id: 'roof-ventilation',
    slug: 'roof-ventilation',
    title: 'Roof Ventilation',
    tagline: 'The Hidden System That Makes Everything Else Last',
    heroDescription: 'Roof ventilation is the most overlooked component in a roofing system — and in our heat and humidity, it might be the most important. Proper attic ventilation reduces cooling costs by up to 30%, prevents moisture damage that destroys roofs from the inside out, and can extend your roof\'s lifespan by years.',
    heroImage: '/images/services/roofing/subs/ventilation-hero.jpg',
    cardImage: '/images/services/roofing/subs/ventilation-card.jpg',
    galleryImages: [
      '/images/services/roofing/subs/ventilation-hero.jpg',
      '/images/services/roofing/subs/ventilation-card.jpg',
      '/images/services/roofing/subs/shingle-bundles-deck.jpg',
      '/images/services/roofing/subs/metal-panel-fasteners.jpg',
      '/images/services/roofing/subs/chimney-roll-roofing.jpg',
      '/images/services/roofing/subs/commercial-roofs-aerial.jpg',
    ],
    overview: [
      {
        heading: 'What It Is',
        content: 'Roof ventilation is a balanced system of intake vents (typically soffit vents along the eaves) and exhaust vents (ridge vents at the peak, box vents, or powered attic fans) that creates continuous airflow through your attic. Cooler outside air enters through soffit vents, flows upward across the underside of the roof deck as it warms, and exits through exhaust vents at the highest point — removing both heat and moisture.',
      },
      {
        heading: 'Why It Matters So Much Here',
        content: 'An unventilated Upstate SC attic can reach 150–160 degrees in summer, literally cooking your roof from the inside. That trapped heat degrades shingle adhesives, underlayment, and decking while radiating into your living space. Balanced ventilation reduces attic temperatures by 20–30 degrees and cuts cooling costs by up to 30%. In our humid climate, moisture is equally destructive — condensation on the cold underside of the roof deck causes mold, wood rot, and metal corrosion.',
      },
      {
        heading: 'Types of Ventilation',
        content: 'Ridge vents run along the entire peak providing the most uniform exhaust when paired with continuous soffit vents. Box vents are individual exhaust points near the ridge. Powered attic fans actively pull air through the attic. The key is balance: intake area (soffit vents) should equal or slightly exceed exhaust area. Building code requires a minimum of 1 square foot of net free ventilation per 150 square feet of attic floor.',
      },
      {
        heading: 'What the Work Actually Involves',
        content: 'Ridge vent prices by the linear foot of ridge, and it takes a fraction of the labor during a re-roof because the ridge is already open — retrofit it later and you\'re paying to cut the slot, install the vent, and rebuild the cap as a standalone job. Soffit vents price by count and by what\'s in the way: continuous vented soffit on open eaves goes fast, while cutting individual vents into boxed-in aluminum soffit and then setting a baffle at every rafter bay from inside the attic is slow, hot work — and August attic work is a half-day-at-a-time proposition here. A complete balanced system is both halves plus those baffles, and the baffles are the piece cut-rate crews skip, which is why half the "ventilated" attics we open aren\'t moving any air. Powered fans add an electrical run on top. Weigh all of it against a roof that fails a decade early, mold remediation in the attic, and an HVAC system fighting a 150-degree ceiling all summer. Every single premature roof failure we\'ve diagnosed in 25 years has had a ventilation component.',
      },
    ],
    warningSigns: [
      { trigger: 'Upstairs rooms noticeably hotter than downstairs in summer', detail: 'Trapped attic heat is radiating into your living space because it has no way to escape.' },
      { trigger: 'Energy bills increased without explanation', detail: 'Your HVAC is fighting trapped attic heat, working harder and costing more to maintain comfortable temperatures.' },
      { trigger: 'Moisture, condensation, or frost on attic surfaces', detail: 'Water on the underside of the roof deck, on rafters, or on nails means moisture is condensing because ventilation isn\'t moving it out.' },
      { trigger: 'Musty odors upstairs or when HVAC runs', detail: 'Mold and mildew growing in the attic due to trapped moisture, distributed through your ductwork.' },
      { trigger: 'Rusted nails, connectors, or HVAC components in the attic', detail: 'Moisture from inadequate ventilation corrodes metal — both a structural and health concern.' },
      { trigger: 'Wavy, warped, or sagging roof decking', detail: 'Prolonged moisture exposure causes plywood and OSB to delaminate and lose structural integrity.' },
      { trigger: 'Peeling exterior paint on gable ends or near soffit', detail: 'Moisture escaping from an improperly ventilated attic pushes through walls and causes paint failure.' },
    ],
    maintenanceTips: [
      { tip: 'Verify soffit vents aren\'t blocked', detail: 'Insulation, debris, or paint often covers soffit vents. Check from inside the attic that daylight is visible at the eaves and insulation baffles are in place.' },
      { tip: 'Inspect attic ventilation during your twice-yearly roof check', detail: 'Look for moisture signs, verify exhaust vents are clear, and feel for airflow at intake and exhaust points.' },
      { tip: 'Never mix ventilation types on the same roof plane', detail: 'Combining ridge vents with box vents or powered fans on the same slope short-circuits airflow — the lower vent becomes an intake, defeating the purpose.' },
      { tip: 'Ensure exhaust fans vent outside, not into the attic', detail: 'Bathroom and kitchen fans pumping warm, wet air into the attic is one of the most common moisture sources we find.' },
      { tip: 'Maintain ventilation pathways when adding insulation', detail: 'Blown-in insulation is notorious for blocking soffit vents. Install proper baffles before adding insulation to maintain the air channel.' },
      { tip: 'Get a ventilation assessment with any roofing work', detail: 'It\'s the most cost-effective time to upgrade since the roof is already being worked on. We include assessment in every roofing project.' },
    ],
    processSteps: [
      { num: '01', title: 'Ventilation Assessment', description: 'We calculate attic square footage, measure existing intake and exhaust capacity, check for blocked vents, inspect for moisture damage, and identify ventilation short-circuits. Compared against code and manufacturer specs.' },
      { num: '02', title: 'System Design', description: 'Based on assessment, we design a balanced plan — typically continuous ridge vent paired with continuous soffit vents. For complex roofs, we may incorporate box vents or powered solutions. Exact vent specs calculated for the 1:150 or 1:300 ratio.' },
      { num: '03', title: 'Installation', description: 'Ridge vents: slot cut along the ridge, vent installed, capped with ridge shingles. Soffit vents: openings cut in soffit panels. Insulation baffles installed at every rafter bay to maintain the air channel. All work to code.' },
      { num: '04', title: 'Verification', description: 'Balanced airflow confirmed — all intake and exhaust vents functioning, baffles properly placed, no existing conditions undermining the new system.' },
      { num: '05', title: 'Homeowner Education', description: 'We walk you through what was installed, explain how the system works, and point out what to watch for during routine inspections. Proper ventilation only works if it stays unobstructed.' },
    ],
    faq: [
      { q: 'How do I know if my attic ventilation is adequate?', a: 'On a sunny summer day, go into your attic. If it\'s more than 10–15 degrees above ambient outside temperature, ventilation is likely insufficient. Other indicators: visible moisture, musty odors, noticeably hotter upstairs. We can perform a professional assessment calculating your exact requirements.' },
      { q: 'Can you have too much attic ventilation?', a: 'In practice, extremely rare and much less dangerous than too little. The real risk is imbalanced ventilation — too much exhaust without adequate intake creates negative pressure that pulls conditioned air from your living space. Balance is key: 50/50 or 60/40 in favor of intake.' },
      { q: 'Are powered attic fans worth it?', a: 'For most homes with a properly designed passive system, powered fans aren\'t necessary and can disrupt natural convection. However, for homes with hip roofs or complex designs that prevent adequate passive ventilation, a solar-powered fan can be effective.' },
      { q: 'Does adding ventilation void my roof warranty?', a: 'No — most manufacturers require adequate ventilation as a warranty condition. GAF, Owens Corning, and CertainTeed all specify minimum requirements. If your ventilation doesn\'t meet their standards, your warranty claim could be denied.' },
      { q: 'Should I address ventilation even if my roof seems fine?', a: 'Yes. Ventilation problems cause damage long before symptoms are obvious. By the time you see moisture stains or feel excessive heat, damage has been progressing for months or years. Proactive assessment is one of the best investments in your roof\'s longevity.' },
    ],
    costData: [
      { item: 'Ridge Vent System', cost: 'Ridge length, and whether the cap is already open', lifespan: 'Life of roof' },
      { item: 'Soffit Vents', cost: 'Vent count plus a baffle at every rafter bay', lifespan: 'Life of roof' },
      { item: 'Box Vents (each)', cost: 'Straight cut-in; attic square footage sets how many', lifespan: 'Life of roof' },
      { item: 'Powered Attic Fan', cost: 'Unit type, plus running power up to it', lifespan: '10–15 years' },
      { item: 'Complete Balanced System', cost: 'Intake and exhaust together; attic size sets the ratio', lifespan: 'Life of roof' },
    ],
    seoKeywords: ['roof ventilation Greenville SC', 'attic ventilation installation', 'ridge vent contractor Upstate SC', 'attic fan installation'],
  },
];
