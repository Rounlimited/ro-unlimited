// ═══════════════════════════════════════════════════════════════
//  TOWN-AND-SERVICE LANDING PAGES  (/areas and /areas/<town>/<service>)
//
//  This file is the whole section. Add an entry to AREA_PAGES (and the town
//  to AREA_TOWNS if it is new) and the page is built, linked from the hub,
//  cross-linked from its sibling towns and listed in the sitemap.
//
//  RULES FOR THE COPY (owner + Google):
//  - Every local fact (utility, permit office, threshold, date) was checked
//    on the agency's own website in November 2026. Re-check before editing;
//    do not add a fact you have not read on a primary source.
//  - RO is a service-area business: "serving <town>", never "located in".
//  - No invented RO projects, clients, numbers or guarantees. The only job
//    named is the Spartanburg two-story commercial renovation.
//  - South Carolina and Georgia only. No prices. No labor or schedule
//    promises (see the copy rules in the repo handover).
//  - Each page must stand on its own facts: never copy a paragraph to
//    another town and swap the name.
// ═══════════════════════════════════════════════════════════════

export type AreaKind = 'commercial' | 'grading' | 'utilities' | 'commercial-site';

export interface AreaAuthority {
  /** What they control: "Water", "Building permit" … */
  role: string;
  name: string;
  note: string;
  /** The agency's own page, where the fact was checked. */
  url?: string;
}

export interface AreaImage { src: string; alt: string; caption: string }

export interface AreaPage {
  town: string;            // URL segment: greenville-sc
  service: string;         // URL segment: commercial-contractor
  kind: AreaKind;
  place: string;           // "Greenville, SC"
  placeShort: string;      // "Greenville"
  cities: { name: string; state: string }[];   // Service.areaServed
  h1: string;              // full H1 text (service + town)
  h1Lead: string;          // first line of the H1
  h1Place: string;         // second (gold) line of the H1
  metaTitle: string;       // without the brand; brand is appended (70 max total)
  metaDescription: string; // 160 max
  intro: string;
  heroImage: string;
  heroAlt: string;
  guideTitle: string;
  guideAccent: string;
  sections: { heading: string; body: string[] }[];
  authorities: AreaAuthority[];
  gallery: AreaImage[];
  faq: { q: string; a: string }[];
  ctaLine: string;
}

/* ─── Service kinds ───────────────────────────────────────── */

type Division = { href: string; label: string; blurb: string };
const DIV_COMMERCIAL: Division = { href: '/commercial', label: 'Commercial Construction', blurb: 'Ground-up buildings, shells, build-outs and renovations: how the division works and what it builds.' };
const DIV_GRADING: Division = { href: '/grading', label: 'Site Development & Grading', blurb: 'Clearing, mass grading, pads, stormwater and erosion control under our own grading license.' };
const DIV_UTILITIES: Division = { href: '/utilities', label: 'Underground Utilities', blurb: 'Water main taps, water lines, sanitary sewer, storm drainage and grease interceptors.' };

export const AREA_KINDS: Record<AreaKind, {
  short: string;
  slug: string;
  theme: 'gold' | 'utility';
  divisions: Division[];
  serviceTypes: string[];
  licenseCodes: string[];
  licenseTitle: string;
  licenseIntro: string;
}> = {
  commercial: {
    short: 'Commercial Construction',
    slug: 'commercial-contractor',
    theme: 'gold',
    divisions: [DIV_COMMERCIAL],
    serviceTypes: ['Commercial general contracting', 'Ground-up commercial construction', 'Commercial renovation and build-out'],
    licenseCodes: ['BD4', 'CT4', 'MS4', 'GD4', 'PB4', 'EL4', 'AC4'],
    licenseTitle: 'The licenses behind the permit',
    licenseIntro: 'Building, concrete, masonry and grading on the general contractor license, with plumbing, electrical and HVAC on the mechanical license. One license holder accountable for the permits and the finished building.',
  },
  grading: {
    short: 'Site Work & Grading',
    slug: 'site-work-grading',
    theme: 'gold',
    divisions: [DIV_GRADING],
    serviceTypes: ['Site work', 'Land grading', 'Clearing and mass excavation', 'Erosion and sediment control', 'Building pad preparation'],
    licenseCodes: ['GD4', 'HY4', 'CT4', 'WL4'],
    licenseTitle: 'Licensed from raw land to pad',
    licenseIntro: 'Grading, roads and parking, concrete, and the water and sewer lines that go in before the pad is finished, all under our own South Carolina license classifications.',
  },
  utilities: {
    short: 'Underground Utilities',
    slug: 'underground-utilities',
    theme: 'utility',
    divisions: [DIV_UTILITIES],
    serviceTypes: ['Underground utility construction', 'Water line installation', 'Water main taps', 'Sanitary sewer installation', 'Storm drainage'],
    licenseCodes: ['WL4', 'GD4', 'BT4', 'CT4'],
    licenseTitle: 'Licensed for the underground',
    licenseIntro: 'Water and sewer lines is its own South Carolina license classification. RO holds it, along with grading, boring and concrete, so the trench, the pipe and the restoration are under one license holder.',
  },
  'commercial-site': {
    short: 'Commercial Construction & Site Work',
    slug: 'commercial-construction-site-work',
    theme: 'gold',
    divisions: [DIV_COMMERCIAL, DIV_GRADING],
    serviceTypes: ['Commercial general contracting', 'Ground-up commercial construction', 'Site work', 'Land grading'],
    licenseCodes: ['BD4', 'GD4', 'CT4', 'WL4'],
    licenseTitle: 'Licensed on both sides of the river',
    licenseIntro: 'RO holds a Georgia general contractor license, furnished with any bid or prequalification package, alongside the South Carolina classifications below.',
  },
};

/* ─── Photos (real RO job photos; alt text says what is in the frame,
       never where it was taken) ─────────────────────────────── */

const IMG = {
  metalBuilding: { src: '/images/areas/ro-metal-building-graded-pad.jpg', alt: 'Grey metal commercial building with doors framed in, standing on a freshly graded red clay pad', caption: 'Metal building shell on a graded red clay pad.' },
  steelFrame: { src: '/images/areas/ro-steel-frame-erection.jpg', alt: 'Red iron steel frame of a commercial building going up, with an excavator and service truck beside the slab', caption: 'Steel frame going up on the finished slab.' },
  siteWork: { src: '/images/areas/ro-site-work-red-clay-steel-frame.jpg', alt: 'Commercial job site with a red clay stockpile, an excavator and the steel frame of a building at the edge of a stone access drive', caption: 'Site work and steel on the same job: stockpile, access drive and frame.' },
  interior: { src: '/images/areas/ro-interior-buildout-plans.jpg', alt: 'Commercial interior build-out with finished drywall, ceiling grid going in and the floor plans open on a tablet', caption: 'Interior build-out: drywall finished, ceiling grid in progress.' },
  rooftop: { src: '/images/areas/ro-rooftop-hvac-units.jpg', alt: 'Rooftop HVAC units on a white membrane roof with yellow gas piping run across pipe supports', caption: 'Rooftop units set and gas piped on a new membrane roof.' },
  scissorLift: { src: '/images/areas/ro-steel-building-scissor-lift.jpg', alt: 'Scissor lift inside a steel building frame with insulated wall panels on and the roof purlins still open to the sky', caption: 'Wall insulation on, roof purlins next.' },
  slab: { src: '/images/areas/ro-slab-under-steel-frame.jpg', alt: 'Wide concrete slab under an open steel roof frame, with insulated wall panels around the perimeter', caption: 'Slab poured and frame standing, ready for roofing.' },
  hotTap: { src: '/images/utilities/jr-hot-tap.jpg', alt: 'Hot tap machine bolted to a gate valve and tapping sleeve on a live water main inside a shored trench', caption: 'Hot tap on a live main, inside a trench box.' },
  valveTrench: { src: '/images/utilities/jr-valve-trench.jpg', alt: 'New gate valve and restrained couplings installed on a water main at the bottom of a red clay trench', caption: 'Gate valve cut into a water main.' },
  sewerLateral: { src: '/images/utilities/jr-sewer-lateral.jpg', alt: 'White PVC sewer lateral with a wye and cleanout riser laid in a red clay trench', caption: 'Sewer lateral, wye and cleanout in red clay.' },
  ductileValve: { src: '/images/utilities/jr-ductile-iron-valve.jpg', alt: 'Large red gate valve joined to a ductile iron water main with a blue restrained coupling in an open excavation', caption: 'Gate valve on a ductile iron main.' },
  tappingSleeve: { src: '/images/utilities/jr-tapping-sleeve.jpg', alt: 'Stainless steel tapping sleeve and blue tapping valve bolted onto a water main in a wet excavation', caption: 'Stainless tapping sleeve and valve on the main.' },
} satisfies Record<string, AreaImage>;

/* ─── Towns (hub page cards) ──────────────────────────────── */

export const AREA_TOWNS: { slug: string; name: string; county: string; blurb: string }[] = [
  { slug: 'greenville-sc', name: 'Greenville, SC', county: 'Greenville County', blurb: 'Greenville Water for the tap, ReWa and a collection agency for the sewer, and a different permit office depending on which side of the city limit the parcel sits.' },
  { slug: 'spartanburg-sc', name: 'Spartanburg, SC', county: 'Spartanburg County', blurb: 'Spartanburg Water runs both water and sewer under one name, and the county asks for a land disturbance permit at 5,000 square feet, long before the one-acre state line.' },
  { slug: 'anderson-sc', name: 'Anderson, SC', county: 'Anderson County', blurb: 'More I-85 frontage than any other Upstate county, water that reaches the site through whichever member district of the regional water system covers the parcel, and a grading permit that is separate from the stormwater permit.' },
  { slug: 'greer-sc', name: 'Greer, SC', county: 'Greenville & Spartanburg Counties', blurb: 'One city across two counties, with Greer CPW supplying power, gas, water and sewer, and the inland port and the I-85 corridor on its doorstep.' },
  { slug: 'easley-sc', name: 'Easley, SC', county: 'Pickens County', blurb: 'Easley Combined Utilities supplies power, water and sewer, and its sewer policy ties new service to annexation into the city, which shapes a project before design starts.' },
  { slug: 'northeast-georgia', name: 'Northeast Georgia', county: 'Toccoa · Lavonia · Hartwell', blurb: 'Georgia runs land disturbance through local issuing authorities and its own state permits. One page covers Stephens, Franklin and Hart counties.' },
];

/* ─── Pages ───────────────────────────────────────────────── */

export const AREA_PAGES: AreaPage[] = [
  /* ══════════ GREENVILLE ══════════ */
  {
    town: 'greenville-sc', service: 'commercial-contractor', kind: 'commercial',
    place: 'Greenville, SC', placeShort: 'Greenville',
    cities: [{ name: 'Greenville', state: 'South Carolina' }],
    h1: 'Commercial General Contractor Serving Greenville, SC',
    h1Lead: 'Commercial General Contractor', h1Place: 'Serving Greenville, SC',
    metaTitle: 'Commercial General Contractor in Greenville, SC',
    metaDescription: 'Licensed commercial general contractor serving Greenville, SC. Ground-up buildings, shells and build-outs, from the site plan permit to the final inspection.',
    intro: `RO Unlimited is a licensed general contractor serving Greenville and Greenville County: ground-up commercial buildings, metal and steel shells, tenant build-outs and renovations. We hold 13 South Carolina license classifications, so the site, the utilities and the building can sit with one contractor.`,
    heroImage: IMG.metalBuilding.src, heroAlt: IMG.metalBuilding.alt,
    guideTitle: 'Building in', guideAccent: 'Greenville',
    sections: [
      {
        heading: 'Inside the city: the site plan permit comes first',
        body: [
          `The City of Greenville does not start with the building permit. All development or redevelopment of any structure or parcel in the city requires a Site Plan Permit before any other building or construction permit is issued. The rules it is reviewed against are in the Greenville Development Code, which took effect on July 15, 2023.`,
          `The same date brought in a rule that catches small jobs: a project that adds 100 square feet or more of impervious area is subject to additional stormwater regulation. A parking expansion or a new dumpster pad can trigger it. We check the impervious numbers before a layout is fixed.`,
        ],
      },
      {
        heading: 'Outside the city: Greenville County Building Safety',
        body: [
          `A Greenville mailing address does not mean a city permit. Much of what people call Greenville is unincorporated county. There the permit comes from Greenville County Building Safety, every application goes through the county's eTRAKiT portal, and its Plan Review section reviews the plans for all commercial projects.`,
          `The two offices have different submittal steps and different reviewers. We confirm the jurisdiction from the parcel record on day one, because a set of drawings prepared for the wrong office loses weeks.`,
        ],
      },
      {
        heading: 'Water and sewer are two separate conversations',
        body: [
          `Water is Greenville Water. Sewer is split in two: a local collection agency owns the pipe in the street, and ReWa (Renewable Water Resources) carries and treats the flow. In the city the collection agency is the city itself, which requires a sewer capacity request from every new development and redevelopment. In much of the county it is MetroConnects.`,
          `For the owner this shows up as fees and lead time. ReWa charges a one-time new account fee for system capacity, based on the size of the installed water meter, so the meter your engineer specifies is also a cost decision.`,
        ],
      },
      {
        heading: 'Codes and corridors',
        body: [
          `Both the city and the county enforce the 2021 building codes, in effect since January 1, 2023. South Carolina has set January 1, 2027 for the 2024 codes. A building permitted after that date is designed to the newer edition, which is worth deciding with your architect now.`,
          `On Woodruff Road, the South Carolina Department of Transportation is planning a congestion relief project that includes a new parallel route from Verdae Boulevard to Smith Hines Road, with construction tentatively starting in 2027. If your site is on that corridor, driveway access and construction traffic should be planned around it.`,
        ],
      },
    ],
    authorities: [
      { role: 'Building permit, city', name: 'City of Greenville Building & Permit Center', note: 'Site Plan Permit required before any other building or construction permit in the city.', url: 'https://www.greenvillesc.gov/building-permit-center' },
      { role: 'Building permit, county', name: 'Greenville County Building Safety', note: 'All permits submitted through eTRAKiT; Plan Review reviews all commercial plans.', url: 'https://www.greenvillecounty.org/BuildingSafety/Default.aspx' },
      { role: 'Water', name: 'Greenville Water', note: 'Makes all taps and connections to its mains and inspects all new water main installations.', url: 'https://www.greenvillewater.com/engineering/services-inspections-and-approvals' },
      { role: 'Sewer treatment', name: 'ReWa (Renewable Water Resources)', note: 'Conveys and treats wastewater; one-time new account fee based on water meter size.', url: 'https://rewaonline.org/rates-fees-and-charges/new-account-fees' },
      { role: 'Sewer collection', name: 'City of Greenville Sanitary Sewer Bureau or MetroConnects', note: 'The collection agency depends on the address. The city requires a sewer capacity request for all new development and redevelopment.', url: 'https://www.greenvillesc.gov/wastewater-management' },
    ],
    gallery: [IMG.metalBuilding, IMG.steelFrame, IMG.interior],
    faq: [
      { q: 'Does my Greenville project need a city permit or a county permit?', a: `It depends on whether the parcel is inside the city limits, not on the mailing address. Inside the city, the Building & Permit Center requires a Site Plan Permit before any other permit. In unincorporated Greenville County, permits go through Greenville County Building Safety on the eTRAKiT portal.` },
      { q: 'Who provides water and sewer for a commercial building in Greenville?', a: `Greenville Water supplies water and makes every tap on its mains. Sewer is collected by a local agency, the City of Greenville inside the city or MetroConnects in much of the county, and treated by ReWa, which charges a one-time new account fee based on the water meter size.` },
      { q: 'What building code does Greenville enforce?', a: `The 2021 building codes, enforced since January 1, 2023. South Carolina has set January 1, 2027 as the effective date for the 2024 codes.` },
      { q: 'Is RO Unlimited based in Greenville?', a: `RO Unlimited is a service-area contractor with no storefront. We serve Greenville and the rest of Upstate South Carolina, plus Northeast Georgia, and meet owners on site or at their office. Call (864) 304-0139.` },
    ],
    ctaLine: `Send the drawings or the parcel address. We will tell you whether it is a city or county permit, who holds the water and sewer, and what the building will take.`,
  },
  {
    town: 'greenville-sc', service: 'site-work-grading', kind: 'grading',
    place: 'Greenville, SC', placeShort: 'Greenville',
    cities: [{ name: 'Greenville', state: 'South Carolina' }],
    h1: 'Site Work and Grading Contractor Serving Greenville, SC',
    h1Lead: 'Site Work and Grading Contractor', h1Place: 'Serving Greenville, SC',
    metaTitle: 'Site Work & Grading Contractor in Greenville, SC',
    metaDescription: 'Site work and grading in Greenville, SC under our own grading license: clearing, pads, storm drainage and city and county land disturbance permits.',
    intro: `Clearing, mass grading, building pads, storm drainage and erosion control for commercial sites in Greenville and Greenville County, under RO Unlimited's own South Carolina grading license. Here the permit sequence depends on which side of the city limit the dirt is on.`,
    heroImage: IMG.siteWork.src, heroAlt: IMG.siteWork.alt,
    guideTitle: 'Moving Dirt in', guideAccent: 'Greenville',
    sections: [
      {
        heading: 'Greenville County: three tiers of land disturbance',
        body: [
          `In the unincorporated county, the Land Development Division issues land disturbance permits under the county's Storm Water Management Ordinance. Its permit guide sorts commercial work into tiers. More than 5,000 square feet but less than an acre may qualify for a simplified permit. One acre or more needs a full engineered permit.`,
          `There is a third trigger that has nothing to do with area: a project that increases the peak runoff rate by more than one cubic foot per second also needs the engineered permit. A small, steep, heavily paved site can cross that line well under an acre.`,
        ],
      },
      {
        heading: 'City of Greenville: three permits in order',
        body: [
          `Inside the city the sequence is fixed. The Site Plan Permit comes first. Then the Engineering Division issues a Stormwater Permit. Only after that can a Grading or Land Disturbance Permit be purchased.`,
          `If the site has a letter of coverage from the state, the city requires a pre-construction conference before it will issue the land disturbance permit. Moving equipment in ahead of that meeting risks a stop-work order, so we schedule mobilization from the conference date, not from the contract date.`,
        ],
      },
      {
        heading: 'Redevelopment sites carry a retrofit',
        body: [
          `Much of the site work near Greenville is on ground that has been built on before: an old parking lot, a closed retail pad, a mill parcel. The county's permit guide says a redevelopment that disturbs more than 5,000 square feet must retrofit the site to meet water quality standards.`,
          `That can mean adding treatment that the old site never had, in space the new layout was counting on. It belongs in the first budget, alongside demolition and unsuitable fill. State coverage, where it applies, comes from SCDES (formerly DHEC) under Construction General Permit SCR100000, which took effect on March 30, 2026.`,
        ],
      },
      {
        heading: 'What the ground is made of',
        body: [
          `The USDA describes the Cecil series, the signature soil of the Piedmont uplands, as very deep and well drained, with a red clay subsoil that formed in place from weathered igneous and metamorphic rock, and saprolite below it. Slopes run up to 25 percent.`,
          `On a Greenville site that shows up as cut and fill. Lots are rarely flat, so pads are built by cutting the high side and filling the low side, and the fill has to be placed in lifts and tested. Bare red clay on a slope also sheds water fast, which is why the sediment basin and silt fence go in before the mass grading does.`,
        ],
      },
    ],
    authorities: [
      { role: 'Land disturbance, county', name: 'Greenville County Land Development Division', note: 'Land disturbance permits under the Storm Water Management Ordinance; reviews engineering plans before a grading permit is issued.', url: 'https://www.greenvillecounty.org/LandDevelopment/' },
      { role: 'Land disturbance, city', name: 'City of Greenville Engineering Division', note: 'Stormwater Permit, then Grading / Land Disturbance Permit, after the Site Plan Permit.', url: 'https://www.greenvillesc.gov/land-disturbance-permit' },
      { role: 'State stormwater permit', name: 'SCDES Bureau of Water', note: 'Construction General Permit SCR100000 at one acre or more. Notice of Intent filed in ePermitting.', url: 'https://des.sc.gov/programs/bureau-water/stormwater/stormwater-construction-activities' },
      { role: 'Soil data', name: 'USDA NRCS, Cecil series', note: 'Very deep, well drained Piedmont upland soil: red clay subsoil over saprolite.', url: 'https://soilseries.sc.egov.usda.gov/OSD_Docs/C/CECIL.html' },
    ],
    gallery: [IMG.siteWork, IMG.metalBuilding, IMG.slab],
    faq: [
      { q: 'When do I need a land disturbance permit in Greenville County?', a: `The county's permit guide says commercial land disturbance of more than 5,000 square feet but less than one acre may be eligible for a simplified permit. One acre or more, or an increase of more than one cubic foot per second in peak runoff, requires an engineered permit from the Land Development Division.` },
      { q: 'What order do site permits come in for the City of Greenville?', a: `Site Plan Permit first, then a Stormwater Permit from the Engineering Division, then the Grading or Land Disturbance Permit. The city states a grading permit may be purchased only after the Stormwater Permit is issued.` },
      { q: 'Does regrading an existing parking lot in Greenville need stormwater treatment?', a: `It can. In Greenville County, a redevelopment that disturbs more than 5,000 square feet must retrofit the site to meet water quality standards. In the city, adding 100 square feet or more of impervious area brings additional regulation.` },
      { q: 'Can RO do the grading and the building on the same Greenville site?', a: `Yes. RO Unlimited holds both the grading and the building classifications on its South Carolina general contractor license, along with water and sewer lines and concrete, so the site package and the building can be one contract.` },
    ],
    ctaLine: `Send the civil set, the survey or just the parcel number for your Greenville site. We will tell you which permits it needs, in what order, and what the dirt work involves.`,
  },
  {
    town: 'greenville-sc', service: 'underground-utilities', kind: 'utilities',
    place: 'Greenville, SC', placeShort: 'Greenville',
    cities: [{ name: 'Greenville', state: 'South Carolina' }],
    h1: 'Underground Utility Contractor Serving Greenville, SC',
    h1Lead: 'Underground Utility Contractor', h1Place: 'Serving Greenville, SC',
    metaTitle: 'Underground Utility Contractor in Greenville, SC',
    metaDescription: 'Licensed underground utility contractor serving Greenville, SC: water lines, sewer and storm drainage built for Greenville Water, ReWa and MetroConnects.',
    intro: `Water lines, sanitary sewer, storm drainage and service connections for commercial sites and developments in Greenville and Greenville County. RO Unlimited is licensed in South Carolina for water and sewer lines. In Greenville that means building for three different owners of the pipe.`,
    heroImage: IMG.hotTap.src, heroAlt: IMG.hotTap.alt,
    guideTitle: 'Pipe in the Ground in', guideAccent: 'Greenville',
    sections: [
      {
        heading: 'Greenville Water makes its own taps',
        body: [
          `Greenville Water serves more than 750,000 residents across Greenville County and parts of Anderson, Pickens and Laurens counties, drawing from Table Rock Reservoir, North Saluda Reservoir and Lake Keowee.`,
          `One rule sets it apart from many utilities: Greenville Water taps or makes the connections to all of its water mains itself. The contractor's part is the excavation, shoring and access so its crew can do the tap, then everything downstream of it. Scheduling that crew is a critical-path item, and we request it as soon as the permit is in hand.`,
        ],
      },
      {
        heading: 'How a water main extension is approved',
        body: [
          `A new main goes through Greenville Water's New Development Project Review, run by Development Services in its Engineering Department. Your engineer submits the package, Development Services reviews and redlines it, and the SCDES construction permit application follows.`,
          `In the field, a pre-construction walkthrough must be requested at least 72 hours before construction begins. Greenville Water inspects all new water main installations and coordinates the pressure testing and sampling. Closeout requires as-built drawings, a coordinate-correct AutoCAD file and a deed exhibit before SCDES issues final approval to operate.`,
        ],
      },
      {
        heading: 'Sewer: who collects and who treats',
        body: [
          `Sewer in Greenville has two layers. ReWa conveys and treats, with nine water resource recovery facilities. The pipe your building connects to belongs to a collection agency: the City of Greenville's Sanitary Sewer Bureau, which runs about 327 miles of collection system, or MetroConnects, the Metropolitan Sewer Subdistrict, in much of the county.`,
          `MetroConnects permits all new sewer construction that will be dedicated to it, and says plainly that any tap or connection to its lines or manholes without a permit is an illegal tap. The city reviews sewer main extension plans itself under the state's Delegated Review Program.`,
        ],
      },
      {
        heading: 'ReWa capacity is a two-step approval',
        body: [
          `Before new flow is accepted, ReWa runs a two-step process: a Preliminary Capacity Request, then Capacity Approval. A fee is due with each complete plan submittal before its engineers review it.`,
          `The second step cannot be filed on your own. It needs a letter from the collection agency endorsing the project and agreeing to own and operate the new sewer, plus the signed SCDES construction permit application. When it is approved, ReWa issues a flow acceptance letter. A missing letter from one agency holds up the other, so we track both as one item.`,
        ],
      },
    ],
    authorities: [
      { role: 'Water', name: 'Greenville Water, Development Services', note: 'New Development Project Review for main extensions; makes all taps; 72-hour notice for the pre-construction walkthrough.', url: 'https://www.greenvillewater.com/engineering/services-inspections-and-approvals' },
      { role: 'Sewer treatment', name: 'ReWa (Renewable Water Resources)', note: 'Two-step capacity process ending in a flow acceptance letter.', url: 'https://rewaonline.org/services/development' },
      { role: 'Sewer collection, county', name: 'MetroConnects (Metropolitan Sewer Subdistrict)', note: 'Permits all new sewer to be dedicated to it. A tap without a permit is an illegal tap.', url: 'https://metroconnects.org/resources/apply-for-a-sewer-permit-2/' },
      { role: 'Sewer collection, city', name: 'City of Greenville Sanitary Sewer Bureau', note: 'About 327 miles of collection system. Sewer capacity request required for new development and redevelopment.', url: 'https://www.greenvillesc.gov/wastewater-management' },
      { role: 'State permit', name: 'SCDES (formerly DHEC)', note: 'Construction permit for water and sewer extensions, and final approval to operate.', url: 'https://des.sc.gov/' },
    ],
    gallery: [IMG.hotTap, IMG.tappingSleeve, IMG.sewerLateral],
    faq: [
      { q: 'Can a contractor tap a Greenville Water main?', a: `No. Greenville Water states that it taps or makes connections to all of its water mains. Typically the contractor performs the excavation so the utility's crew can make the tap, then installs the line from there.` },
      { q: 'Who do I apply to for a sewer connection in Greenville?', a: `Two agencies. The collection agency for your address, the City of Greenville or MetroConnects, permits the connection to its pipe, and ReWa approves the capacity through its two-step process and issues a flow acceptance letter.` },
      { q: 'How much notice does Greenville Water need before construction?', a: `Its new development process calls for a pre-construction walkthrough to be requested a minimum of 72 hours before construction begins. Greenville Water then inspects the installation and coordinates pressure testing and sampling.` },
      { q: 'Is RO licensed for water and sewer line work in South Carolina?', a: `Yes. Water and sewer lines is one of the 13 South Carolina license classifications RO Unlimited holds. The license numbers and the state lookup link are on our licenses page.` },
    ],
    ctaLine: `Send the utility sheets or the address of your Greenville site. We will tell you who owns the water and the sewer in front of it and what each will require.`,
  },

  /* ══════════ GREER ══════════ */
  {
    town: 'greer-sc', service: 'commercial-contractor', kind: 'commercial',
    place: 'Greer, SC', placeShort: 'Greer',
    cities: [{ name: 'Greer', state: 'South Carolina' }],
    h1: 'Commercial General Contractor Serving Greer, SC',
    h1Lead: 'Commercial General Contractor', h1Place: 'Serving Greer, SC',
    metaTitle: 'Commercial General Contractor in Greer, SC',
    metaDescription: 'Licensed commercial general contractor serving Greer, SC: ground-up buildings and build-outs, with City of Greer permits and Greer CPW utility review handled.',
    intro: `RO Unlimited is a licensed general contractor serving Greer: ground-up commercial buildings, shells, build-outs and the site and utility work under them. Greer is one city in two counties with one utility for nearly everything, and a commercial project here goes through two separate reviews.`,
    heroImage: IMG.scissorLift.src, heroAlt: IMG.scissorLift.alt,
    guideTitle: 'Building in', guideAccent: 'Greer',
    sections: [
      {
        heading: 'One city, two counties, one permit office',
        body: [
          `The City of Greer sits in both Greenville and Spartanburg counties. For a building inside the city limits, that does not change who issues the permit: it is the city's Planning & Development Department, which brings planning, permitting, plan review and inspections together.`,
          `Commercial plan review is handled through the city's eTRAKiT portal, and the architect uploads one full set of stamped drawings as a single document. The city is explicit that a permit is required before any work begins and that obtaining it is the contractor's responsibility. Zoning follows the city's Unified Development Ordinance.`,
        ],
      },
      {
        heading: 'Greer CPW is a second review, not a formality',
        body: [
          `The Greer Commission of Public Works supplies electric, natural gas, water and wastewater service. It has been the city's utility since 1914, with natural gas added in 1957.`,
          `Every commercial development project requires a Greer CPW Utility Review submission, and CPW states that this process is separate from the City of Greer's own project meetings. CPW has up to 30 days to complete its plan review. A project that goes to the city and forgets CPW finds out a month late, so we submit to both at the same time.`,
        ],
      },
      {
        heading: 'What CPW expects from the builder',
        body: [
          `CPW's Developer's Guide puts specific work on the project. The developer constructs all water and wastewater lines and services, and is responsible for all on-site excavation for commercial and three-phase electric service. Grease traps or interceptors are required for projects with kitchens and for automotive operations.`,
          `Before work starts there is a 72-hour work notice and a mandatory on-site pre-construction meeting. At the end, new water and sewer facilities carry a security equal to 15 percent of their cost, and the developer is liable for repairs for two years from acceptance. Service does not begin until SCDES issues the final permit to operate.`,
        ],
      },
      {
        heading: 'Why Greer keeps building',
        body: [
          `Inland Port Greer, off I-85 at Exit 58, opened in 2013 and gives the Upstate an overnight Norfolk Southern rail link to the Port of Charleston, 212 miles away. The South Carolina Ports Authority completed a $55 million expansion of it in 2025. BMW's plant, on Highway 101 South in Greer, employs more than 11,000 people, and Greenville-Spartanburg International Airport has a Greer address too.`,
          `The city estimates its population at about 55,000, with projected growth of five percent a year. Downtown, the Greer Station district covers roughly twelve blocks of retail, dining and professional offices. That mix produces both kinds of commercial work: new buildings near the interstate and build-outs in older ones.`,
        ],
      },
    ],
    authorities: [
      { role: 'Building permit', name: 'City of Greer Planning & Development Department', note: 'Commercial plan review through eTRAKiT. Permit required before any work begins.', url: 'https://www.cityofgreersc.gov/page/planning-development' },
      { role: 'Power, gas, water, sewer', name: 'Greer Commission of Public Works (Greer CPW)', note: 'Utility Review required for all commercial development projects; up to 30 days for plan review.', url: 'https://www.greercpw.com/customer-service/new-construction/' },
      { role: 'Stormwater and grading', name: 'City of Greer Engineering, Stormwater Division', note: 'Reviews all development plans for stormwater compliance and inspects new site, road and drainage construction.', url: 'https://www.cityofgreersc.gov/page/engineering' },
      { role: 'Sewer treatment', name: 'ReWa (Renewable Water Resources)', note: 'Greer CPW is one of the collection partners that send flow to ReWa.', url: 'https://rewaonline.org/about-us/contact/our-sub-district-partners' },
    ],
    gallery: [IMG.scissorLift, IMG.slab, IMG.rooftop],
    faq: [
      { q: 'Is a Greer building permit issued by Greenville County or Spartanburg County?', a: `Neither, if the site is inside the city limits. The City of Greer lies in both counties, and its own Planning & Development Department issues building permits and reviews commercial plans through the eTRAKiT portal. Sites outside the city limits go to the county they are in.` },
      { q: 'What is the Greer CPW Utility Review?', a: `It is Greer CPW's own plan review for water, sewer, electric and gas. It is required for all commercial development projects, it is separate from the city's review, and CPW allows itself up to 30 days to complete it.` },
      { q: 'Does a restaurant in Greer need a grease trap?', a: `Yes. Greer CPW's Developer's Guide requires grease traps or interceptors for projects with kitchens, and for automotive operations as well. RO installs grease interceptors as part of its underground utility work.` },
      { q: 'Who does the trenching for commercial power in Greer?', a: `The project does. Greer CPW's guide makes the developer responsible for all on-site excavation for three-phase and commercial electric service. On an RO job that excavation is part of the site package.` },
    ],
    ctaLine: `Send the plans or the address. We will line up the City of Greer permit and the Greer CPW review side by side and tell you what the building will take.`,
  },

  /* ══════════ SPARTANBURG ══════════ */
  {
    town: 'spartanburg-sc', service: 'commercial-contractor', kind: 'commercial',
    place: 'Spartanburg, SC', placeShort: 'Spartanburg',
    cities: [{ name: 'Spartanburg', state: 'South Carolina' }],
    h1: 'Commercial General Contractor Serving Spartanburg, SC',
    h1Lead: 'Commercial General Contractor', h1Place: 'Serving Spartanburg, SC',
    metaTitle: 'Commercial General Contractor in Spartanburg, SC',
    metaDescription: 'Licensed commercial general contractor serving Spartanburg, SC: ground-up buildings, renovations and build-outs, permitted through the city or the county.',
    intro: `RO Unlimited is a licensed general contractor serving Spartanburg and Spartanburg County: ground-up commercial buildings, shells, build-outs and full renovations of buildings that are already standing. We have renovated a two-story commercial building here from the roof down, and we know which office your permit goes through.`,
    heroImage: IMG.interior.src, heroAlt: IMG.interior.alt,
    guideTitle: 'Building in', guideAccent: 'Spartanburg',
    sections: [
      {
        heading: 'City permit or county permit',
        body: [
          `Inside the city limits, the Building Inspections and Permits Department inspects all new construction, and the city is plain about scope: any work on non-residential property needs a commercial building permit. Commercial plan reviews are submitted electronically, and anything that changes the outside of the building also goes through Planning for site plan review.`,
          `Outside the city, Spartanburg County's Building Codes Department takes over. Its online portal lets a project be submitted to Planning, Engineering and Building Codes at the same time, so the three reviews can run side by side.`,
        ],
      },
      {
        heading: 'Two zoning ordinances in one county',
        body: [
          `Spartanburg County does not run on a single zoning code. The Performance Zoning Ordinance applies in the Southwest Planning Area, and the Unified Land Management Ordinance applies in the rest of the county. The performance zoning map took effect on January 1, 2020.`,
          `For an owner that means the first question on a county parcel is not "what is it zoned" but "which ordinance is it under". Setbacks, buffers and what the use has to prove are answered differently in each. We settle that with the county before a building footprint is drawn, not after.`,
        ],
      },
      {
        heading: 'Renovating a building that is already here',
        body: [
          `A good share of commercial work in Spartanburg is not new ground. It is an older building that has to be brought up to what a tenant, a lender and an inspector expect today. RO carried out a full renovation of a two-story commercial building in Spartanburg: new roof, new flooring, plumbing including added bathrooms, HVAC and electrical.`,
          `That kind of job is where one license holder matters. The plumbing, electrical and HVAC permits sit under our mechanical license and the building permit under our general contractor license, so the inspector is dealing with one contractor from rough-in to final.`,
        ],
      },
      {
        heading: 'The code your plans are reviewed against',
        body: [
          `The city enforces the 2021 International Codes and the 2020 National Electrical Code, which have applied statewide since January 1, 2023. South Carolina has set January 1, 2027 as the date the 2024 codes take effect.`,
          `If your project will be permitted around the turn of that year, the edition it is designed to is a decision, not a detail. It should be agreed with your architect and the building official at the start. Growth is not slowing while that happens: OneSpartanburg reported $3.5 billion in announced capital investment across 20 projects in the county in 2025.`,
        ],
      },
    ],
    authorities: [
      { role: 'Building permit, city', name: 'City of Spartanburg Building Inspections and Permits', note: 'Commercial building permit for any work on non-residential property in the city. Plans are reviewed electronically.', url: 'https://www.cityofspartanburg.org/245/Commercial-Building' },
      { role: 'Building permit, county', name: 'Spartanburg County Building Codes', note: 'Permits outside the city, through the county self-service portal, alongside Planning and Engineering.', url: 'https://www.spartanburgcounty.gov/173/Building-Codes' },
      { role: 'Zoning', name: 'Spartanburg County Planning (PZO and ULMO)', note: 'Performance Zoning Ordinance in the Southwest Planning Area; Unified Land Management Ordinance elsewhere.', url: 'https://www.spartanburgcounty.gov/760/Zoning-ULMO-and-PZO' },
      { role: 'Water and sewer', name: 'Spartanburg Water', note: 'Water system and sanitary sewer district under one name. Commercial customers need an approved testable backflow assembly.', url: 'https://www.spartanburgwater.org/commercial-industrial' },
      { role: 'Building code', name: 'SC Building Codes Council', note: '2021 South Carolina Building Codes in effect; 2024 codes effective January 1, 2027.', url: 'https://llr.sc.gov/bcc/' },
    ],
    gallery: [IMG.interior, IMG.rooftop, IMG.steelFrame],
    faq: [
      { q: 'Do I need a permit to renovate a commercial building in Spartanburg?', a: `Inside the city, yes. The City of Spartanburg states that any work done on non-residential property requires a commercial building permit, and exterior changes also go to Planning for site plan review. Outside the city the permit comes from Spartanburg County Building Codes. RO pulls the building, plumbing, electrical and HVAC permits under its own licenses.` },
      { q: 'Has RO Unlimited done commercial work in Spartanburg?', a: `Yes. RO completed a full renovation of a two-story commercial building in Spartanburg, covering the roof, flooring, plumbing with added bathrooms, HVAC and electrical. We serve Spartanburg as part of our Upstate South Carolina service area.` },
      { q: 'Which zoning rules apply to my Spartanburg County site?', a: `It depends on where the parcel is. The county operates the Performance Zoning Ordinance in its Southwest Planning Area and the Unified Land Management Ordinance in the remainder of the county. Parcels inside the City of Spartanburg follow the city's own zoning. We confirm which applies before design starts.` },
      { q: 'Will my Spartanburg project fall under the 2021 or the 2024 building code?', a: `Projects permitted today are reviewed under the 2021 South Carolina Building Codes and the 2020 National Electrical Code. The state has set January 1, 2027 for the 2024 codes, so a project permitted after that date should be designed to them.` },
    ],
    ctaLine: `Send the drawings, or just the address and what you want the building to do. We will tell you which Spartanburg office it goes through and what it will take to build.`,
  },
  {
    town: 'spartanburg-sc', service: 'site-work-grading', kind: 'grading',
    place: 'Spartanburg, SC', placeShort: 'Spartanburg',
    cities: [{ name: 'Spartanburg', state: 'South Carolina' }],
    h1: 'Site Work and Grading Contractor Serving Spartanburg, SC',
    h1Lead: 'Site Work and Grading Contractor', h1Place: 'Serving Spartanburg, SC',
    metaTitle: 'Site Work & Grading Contractor in Spartanburg, SC',
    metaDescription: 'Site work and grading in Spartanburg, SC under our own grading license: clearing, pads, erosion control and the county land disturbance permit at 5,000 sq ft.',
    intro: `Clearing, mass grading, building pads, erosion control and storm drainage for commercial sites in Spartanburg and Spartanburg County, under RO Unlimited's own South Carolina grading license. In this county the permit question starts at 5,000 square feet of disturbed ground, not at an acre.`,
    heroImage: IMG.metalBuilding.src, heroAlt: IMG.metalBuilding.alt,
    guideTitle: 'Moving Dirt in', guideAccent: 'Spartanburg County',
    sections: [
      {
        heading: 'The 5,000 square foot rule',
        body: [
          `Most people know the state number: one acre of disturbance and you need stormwater permit coverage. Spartanburg County sets its own line far lower. Land disturbing activity of 5,000 square feet or more requires a Land Disturbance Permit application and a stormwater pollution prevention plan, reviewed by the county Engineering Division.`,
          `A site between 5,000 square feet and one acre gets the county's "Less Than 1 Acre" permit. At one acre and up, or on a lot that is part of a larger common plan of development, state NPDES coverage is required as well. A small commercial pad that would be exempt in other places is a permitted job here.`,
        ],
      },
      {
        heading: 'Which office reviews your plan',
        body: [
          `The county reviews land disturbance in the unincorporated area and in Lyman, Wellford, Duncan, Inman and Cowpens, which adopted the county's stormwater ordinance in 2025. Projects in other municipalities go to that municipality.`,
          `Inside the City of Spartanburg, the Stormwater Division under Public Works requires the operator of a construction site to submit a stormwater pollution prevention plan and have it approved before any land is disturbed. Getting the jurisdiction wrong costs a review cycle, so we confirm it from the parcel, not from the mailing address.`,
        ],
      },
      {
        heading: 'The state permit behind the local one',
        body: [
          `State coverage comes from the South Carolina Department of Environmental Services (SCDES, formerly DHEC) under Construction General Permit SCR100000. The current permit was issued on February 27, 2026, took effect on March 30, 2026 and runs to March 29, 2031.`,
          `The Notice of Intent is filed through the SCDES ePermitting system. Where the site sits inside a regulated stormwater system such as Spartanburg County's, the Notice of Intent needs that local program's written approval, and the full plan is reviewed locally instead of by the state. Local approval comes first; it is not a formality after the fact.`,
        ],
      },
      {
        heading: 'Red clay over saprolite',
        body: [
          `The soils that cover much of the Piedmont here are of the Cecil and Pacolet type. The USDA describes both the same way: very deep, well drained, a red clay subsoil, and beneath it saprolite, the soft weathered remains of the parent rock. Pacolet soils sit on the steeper ground, with slopes commonly between 15 and 25 percent.`,
          `For grading, that clay is workable and compacts well when its moisture is right, and turns to grease when it is not, so the schedule follows the weather. A series description is a regional average, not your site. Hard rock and wet pockets turn up where the map says they should not, which is why we price a pad from the geotechnical borings whenever they exist.`,
        ],
      },
    ],
    authorities: [
      { role: 'Land disturbance, county', name: 'Spartanburg County Engineering Division', note: 'Land Disturbance Permit and stormwater plan at 5,000 square feet or more, in the unincorporated county and five partner towns.', url: 'https://www.spartanburgcounty.gov/984/Engineering-and-Flood-Plains' },
      { role: 'Land disturbance, city', name: 'City of Spartanburg Stormwater Division', note: 'Stormwater pollution prevention plan must be approved before land is disturbed inside the city.', url: 'https://www.cityofspartanburg.org/DocumentCenter/View/108' },
      { role: 'State stormwater permit', name: 'SCDES Bureau of Water', note: 'Construction General Permit SCR100000 for one acre or more, or smaller sites in a larger common plan. Notice of Intent through ePermitting.', url: 'https://des.sc.gov/programs/bureau-water/stormwater/stormwater-construction-activities' },
      { role: 'Soil data', name: 'USDA NRCS soil series descriptions', note: 'Cecil and Pacolet series: red clay subsoil over saprolite on Piedmont uplands.', url: 'https://soilseries.sc.egov.usda.gov/OSD_Docs/C/CECIL.html' },
    ],
    gallery: [IMG.metalBuilding, IMG.siteWork, IMG.sewerLateral],
    faq: [
      { q: 'Do I need a land disturbance permit for less than an acre in Spartanburg County?', a: `Usually, yes. Spartanburg County requires a Land Disturbance Permit application and a stormwater pollution prevention plan for land disturbing activity of 5,000 square feet or more. Sites between 5,000 square feet and one acre receive the county's Less Than 1 Acre permit.` },
      { q: 'Who reviews a grading plan in Duncan, Lyman or Wellford?', a: `Spartanburg County's Engineering Division. The county reviews land disturbance for the unincorporated area and for Lyman, Wellford, Duncan, Inman and Cowpens. Other municipalities, including the City of Spartanburg, review their own.` },
      { q: 'Is there rock under Spartanburg sites?', a: `The common Piedmont soils here, Cecil and Pacolet, are described by the USDA as very deep, with red clay over saprolite and bedrock generally more than five feet down. That is a regional description, not a guarantee for one parcel. We rely on geotechnical borings where they exist and say so plainly in the proposal where they do not.` },
      { q: 'Does RO hold its own grading license?', a: `Yes. Grading is one of the 13 South Carolina license classifications RO Unlimited holds, along with highway, concrete, and water and sewer lines. License numbers are published on our licenses page.` },
    ],
    ctaLine: `Send the civil set or the survey for your Spartanburg site. We will tell you which permit it needs, who reviews it and what the dirt work involves.`,
  },
  {
    town: 'spartanburg-sc', service: 'underground-utilities', kind: 'utilities',
    place: 'Spartanburg, SC', placeShort: 'Spartanburg',
    cities: [{ name: 'Spartanburg', state: 'South Carolina' }],
    h1: 'Underground Utility Contractor Serving Spartanburg, SC',
    h1Lead: 'Underground Utility Contractor', h1Place: 'Serving Spartanburg, SC',
    metaTitle: 'Underground Utility Contractor in Spartanburg, SC',
    metaDescription: 'Licensed underground utility contractor serving Spartanburg, SC: water lines, taps, sanitary sewer and storm drainage built to Spartanburg Water requirements.',
    intro: `Water lines, main taps, sanitary sewer and storm drainage for commercial sites and developments in Spartanburg and Spartanburg County. RO Unlimited is licensed in South Carolina for water and sewer lines, and builds to the specifications of whichever utility will own the pipe when the job is done.`,
    heroImage: IMG.ductileValve.src, heroAlt: IMG.ductileValve.alt,
    guideTitle: 'Pipe in the Ground in', guideAccent: 'Spartanburg',
    sections: [
      {
        heading: 'One name, two utilities',
        body: [
          `Spartanburg Water is two legal entities operating under one name: the Spartanburg Water System, which supplies drinking water, and the Spartanburg Sanitary Sewer District. Water comes from three interconnected reservoirs, Municipal Reservoir #1, Lake Bowen and Lake Blalock, and the service area covers roughly 864 square miles of retail and wholesale territory.`,
          `On the sewer side the district operates nine wastewater treatment facilities, from Fingerville and Chesnee to Pacolet and the South Tyger River. Which plant your flow ends up at is the district's call, and it is one of the first things that decides whether a connection is simple.`,
        ],
      },
      {
        heading: 'How an extension gets approved',
        body: [
          `Spartanburg Water's Engineering Department handles developer work. For a water extension it offers distribution system design at no charge, and says an uncomplicated subdivision or commercial layout can be completed in 45 to 60 days from receipt of the electronic plat. You may also hire your own South Carolina engineer.`,
          `Permitting runs through the SCDES Delegated Review Program, with Spartanburg Water doing the review. Its Developers' Manual requires that all water and sewer construction be done by a utility contractor licensed in South Carolina and approved by Spartanburg Water. That approval is settled before the bid, not assumed.`,
        ],
      },
      {
        heading: 'What the field process demands',
        body: [
          `A pre-construction conference with the utility's engineer is required at least 72 hours before work begins. A Spartanburg Water field technician must be present for all testing, and the lines have to pass every applicable test: air, deflection, hydrostatic, vacuum and bacteriological.`,
          `Taps are not released until record drawings are submitted and approved, with an electronic copy in DWG format on the State Plane coordinate system. After final acceptance the facilities become the property of Spartanburg Water, and the contractor remains responsible for repairs for one year. We keep as-built measurements as the pipe goes in, because rebuilding them from memory is how closeout stalls.`,
        ],
      },
      {
        heading: 'Outside Spartanburg Water territory',
        body: [
          `Not every site in the county is theirs. The SJWD Water District has served western Spartanburg County since 1956, starting with the mill towns of Startex, Jackson, Wellford and Duncan. It has its own standard construction specifications and wants its pre-construction conference at least 48 hours ahead.`,
          `The Liberty-Chesnee-Fingerville Water District serves the northeast part of the county. Two districts can meet along one road, each with its own details for the same fitting, so the first thing we establish on a county site is whose main is in front of it.`,
        ],
      },
    ],
    authorities: [
      { role: 'Water', name: 'Spartanburg Water System', note: 'Three reservoirs, about 864 square miles of service area. Engineering Department reviews extensions; free design service for water.', url: 'https://www.spartanburgwater.org/water-extension-projects' },
      { role: 'Sewer', name: 'Spartanburg Sanitary Sewer District', note: 'Nine wastewater treatment facilities. Extensions follow the district technical specifications and the delegated review process.', url: 'https://www.spartanburgwater.org/sewer-extension-projects' },
      { role: 'Western county water', name: 'SJWD Water District', note: 'Own standard specifications; pre-construction conference at least 48 hours before work starts.', url: 'https://www.sjwd.com/business/downloads-for-developers-engineers-and-contractors/' },
      { role: 'State permit', name: 'SCDES (formerly DHEC)', note: 'Water and sewer construction permits, issued here through the Delegated Review Program.', url: 'https://des.sc.gov/' },
    ],
    gallery: [IMG.ductileValve, IMG.hotTap, IMG.sewerLateral],
    faq: [
      { q: 'Who provides water and sewer in Spartanburg?', a: `In the city and much of the county, Spartanburg Water, which is the Spartanburg Water System and the Spartanburg Sanitary Sewer District under one name. Western Spartanburg County is served for water by SJWD, and the northeast by the Liberty-Chesnee-Fingerville Water District.` },
      { q: 'Can any contractor install a water line for Spartanburg Water?', a: `No. Spartanburg Water's Developers' Manual requires that water and sewer construction be completed by utility contractors licensed in South Carolina and approved by Spartanburg Water. RO holds the South Carolina water and sewer lines classification; approval for a given project is arranged with the utility before work starts.` },
      { q: 'How long does Spartanburg Water take to design a water extension?', a: `Spartanburg Water says an uncomplicated subdivision or commercial layout can be completed within 45 to 60 days of receiving the electronic plat, and it provides that design service free of charge. Review and permitting follow through the SCDES Delegated Review Program.` },
      { q: 'What has to happen before Spartanburg Water releases taps?', a: `The lines must pass all applicable tests with a Spartanburg Water technician present, and record drawings must be submitted and approved, including an electronic copy in DWG format on the State Plane coordinate system.` },
    ],
    ctaLine: `Send the utility sheets or the address of your Spartanburg site. We will tell you whose main it is, what they will require and what it takes to put the pipe in.`,
  },

  /* ══════════ ANDERSON ══════════ */
  {
    town: 'anderson-sc', service: 'commercial-contractor', kind: 'commercial',
    place: 'Anderson, SC', placeShort: 'Anderson',
    cities: [{ name: 'Anderson', state: 'South Carolina' }],
    h1: 'Commercial General Contractor Serving Anderson, SC',
    h1Lead: 'Commercial General Contractor', h1Place: 'Serving Anderson, SC',
    metaTitle: 'Commercial General Contractor in Anderson, SC',
    metaDescription: 'Licensed commercial general contractor serving Anderson, SC and the I-85 corridor: ground-up buildings, steel shells and build-outs, city or county permits.',
    intro: `RO Unlimited is a licensed general contractor serving Anderson and Anderson County: ground-up commercial and light industrial buildings, steel shells, build-outs and renovations. From the city center to the I-85 exits, we handle the building and the ground it stands on.`,
    heroImage: IMG.steelFrame.src, heroAlt: IMG.steelFrame.alt,
    guideTitle: 'Building in', guideAccent: 'Anderson',
    sections: [
      {
        heading: 'Thirty miles of interstate',
        body: [
          `Anderson County's economic development office points out that the county has over 30 miles of I-85 frontage, more than any other county in the Upstate. That frontage is why industrial developers keep looking here.`,
          `At Exit 40 in Powdersville, a developer announced a 248,000 square foot Class A industrial building at Anderson Gateway Commerce Center in November 2025. Further down, county staff told the area transportation committee in 2025 that industrial traffic at Exit 27 now rivals the BMW exit. For an owner, an interstate site usually means a larger pad, heavier pavement and a longer utility run than a site in town.`,
        ],
      },
      {
        heading: 'City permits and county permits are both online',
        body: [
          `Inside the City of Anderson, the Building and Codes Department on South Main Street takes all plan review and permit applications through the city's online portal. The city prices commercial plan review at half the cost of the building permit, which is useful to know when the first budget is built.`,
          `In the unincorporated county, Anderson County Building and Codes requires every permit to be applied for online through its OpenGov portal. Both offices have enforced the 2021 International Building Code with South Carolina modifications since January 1, 2023, and the 2024 edition takes over on January 1, 2027.`,
        ],
      },
      {
        heading: 'Water depends on the address',
        body: [
          `The Anderson Regional Joint Water System treats Lake Hartwell water, but it is a wholesaler. A building buys its water from one of the member utilities: Electric City Utilities inside the City of Anderson, or a district such as Hammond, Sandy Springs, West Anderson, Big Creek, Broadway, Homeland Park, Starr-Iva or Powdersville Water.`,
          `Each of them has its own tap process, its own fees and its own inspector. Electric City Utilities, despite the name, is the city's water and wastewater division. We identify the provider from the parcel before pricing, because tap fees and requirements differ from one district to the next.`,
        ],
      },
      {
        heading: 'Sewer and site approvals',
        body: [
          `Where sewer is the county's, Anderson County Wastewater requires a permit before any connection, charges a capacity fee based on the SCDES unit contributory loading rate, and calculates that fee case by case for commercial and industrial customers. Its staff must inspect every connection, with 48 hours' notice.`,
          `On the site side, the county requires a stormwater permit at one acre of disturbance and takes up to 20 working days to review a plan. The grading permit is a separate application to a different department. Both are covered on our Anderson site work page.`,
        ],
      },
    ],
    authorities: [
      { role: 'Building permit, city', name: 'City of Anderson Building and Codes', note: 'All plan review and permit applications are submitted through the city online portal.', url: 'https://www.cityofandersonsc.com/building-permit-information/' },
      { role: 'Building permit, county', name: 'Anderson County Building and Codes', note: 'All permits applied for online through OpenGov. 2021 codes now; 2024 codes from January 1, 2027.', url: 'https://www.andersoncountysc.org/departments-a-z/building-codes/' },
      { role: 'Water, wholesale', name: 'Anderson Regional Joint Water System', note: 'Treats Lake Hartwell water for its member utilities. Your retail provider is one of those members.', url: 'https://arjwater.com/member-agencies/' },
      { role: 'Water and sewer, city', name: 'Electric City Utilities', note: 'The City of Anderson division for water distribution, wastewater collection and treatment.', url: 'https://www.cityofandersonsc.com/water-department/' },
      { role: 'Sewer, county', name: 'Anderson County Wastewater', note: 'Permit before connecting, capacity fee, inspection of every connection with 48 hours notice.', url: 'https://www.andersoncountysc.org/departments-a-z/wastewater/' },
    ],
    gallery: [IMG.steelFrame, IMG.scissorLift, IMG.metalBuilding],
    faq: [
      { q: 'Who supplies water to a commercial site in Anderson County?', a: `It depends on the location. The Anderson Regional Joint Water System is the wholesale supplier, drawing from Lake Hartwell, and its member utilities sell to customers. Inside the City of Anderson that is Electric City Utilities; elsewhere it is a district such as Hammond, Sandy Springs, West Anderson, Big Creek or Powdersville Water.` },
      { q: 'How do I apply for a commercial building permit in Anderson?', a: `Online in both cases. The City of Anderson takes plan review and permit applications through its city portal, and Anderson County requires all permits to be applied for through its OpenGov portal. RO prepares and submits the application as the licensed contractor.` },
      { q: 'Does Anderson County charge a sewer capacity fee for commercial buildings?', a: `Yes. Anderson County Wastewater applies a capacity fee to all permits, based on the SCDES unit contributory loading rate, and asks commercial and industrial customers to call to have the fee calculated for their use.` },
      { q: 'Does RO build along I-85 in Anderson County?', a: `We serve all of Anderson County, including the interstate exits, as part of our Upstate South Carolina service area. We do not keep an office there; we come to the site.` },
    ],
    ctaLine: `Send the drawings or the parcel. We will tell you which Anderson office permits it, which district supplies it and what it will take to build.`,
  },
  {
    town: 'anderson-sc', service: 'site-work-grading', kind: 'grading',
    place: 'Anderson, SC', placeShort: 'Anderson',
    cities: [{ name: 'Anderson', state: 'South Carolina' }],
    h1: 'Site Work and Grading Contractor Serving Anderson, SC',
    h1Lead: 'Site Work and Grading Contractor', h1Place: 'Serving Anderson, SC',
    metaTitle: 'Site Work & Grading Contractor in Anderson, SC',
    metaDescription: 'Site work and grading in Anderson, SC under our own grading license: clearing, pads and erosion control, with county stormwater and grading permits handled.',
    intro: `Clearing, mass grading, building pads, erosion control and storm drainage for commercial and industrial sites in Anderson and Anderson County, under RO Unlimited's own South Carolina grading license. Anderson County splits site approval into two permits from two departments, and adds a stream buffer wider than most.`,
    heroImage: IMG.siteWork.src, heroAlt: IMG.siteWork.alt,
    guideTitle: 'Moving Dirt in', guideAccent: 'Anderson County',
    sections: [
      {
        heading: 'Two permits, two departments',
        body: [
          `Anderson County requires a stormwater permit for land disturbing activity of one acre or more, and its Stormwater Department has 20 working days to review a plan. That is four weeks on the calendar for the first review alone, before any comments are answered.`,
          `The grading permit is not part of it. The county's own flow chart notes that the grading permit must be obtained from the Development Standards Department by separate application. The stormwater approval, the stamped plans and the grading permit are then handed over together at the pre-construction meeting. We file the two applications side by side so one is not waiting on the other.`,
        ],
      },
      {
        heading: 'Buffers of 50 to 100 feet',
        body: [
          `Anderson County adopted a riparian buffer ordinance, Ordinance 2025-018, that sets a buffer of 50 to 100 feet from all waters of the state. In a county that borders Lake Hartwell and is cut by creeks running to it, that takes real ground out of a site plan.`,
          `A buffer that wide can move a pad, a detention pond or a driveway, and it has to be flagged in the field before clearing so an operator does not cross it. If your survey shows a stream or a wet-weather draw, the buffer should be on the first sketch, not discovered at plan review.`,
        ],
      },
      {
        heading: 'City sites and small sites',
        body: [
          `Inside the City of Anderson the reviewer changes. The city owns and operates its own small municipal storm sewer system, has its own land development regulations for plan review, and SCDES lists the city's Building Department as the reviewing entity. Incorporated towns in the county that are not listed by SCDES send their plans to the state's Bureau of Water instead.`,
          `State coverage comes under SCDES Construction General Permit SCR100000 at one acre or more, or for smaller lots in a larger common plan. Below an acre, SCDES says you must still complete a form, though you do not need a permit.`,
        ],
      },
      {
        heading: 'Big pads on Piedmont clay',
        body: [
          `With over 30 miles of I-85 frontage, Anderson County sees a lot of large industrial pads. The ground under them is typically Piedmont upland soil of the kind the USDA describes in the Cecil series: very deep, red clay in the subsoil, saprolite beneath, formed from weathered igneous and metamorphic rock.`,
          `On a large pad the work is in the numbers. Tens of thousands of cubic yards have to balance between cut and fill, every lift of fill is tested for density, and the finished subgrade has to carry truck traffic. Clay that is too wet will not reach density however many passes it gets, so we plan drying and proof-rolling time into the job.`,
        ],
      },
    ],
    authorities: [
      { role: 'Stormwater permit, county', name: 'Anderson County Stormwater Department', note: 'Permit for one acre or more of land disturbance; 20 working days to review a plan. Riparian buffers of 50 to 100 feet.', url: 'https://www.andersoncountysc.org/departments-a-z/stormwater/' },
      { role: 'Grading permit, county', name: 'Anderson County Development Standards', note: 'Separate application from the stormwater permit; delivered with it at the pre-construction meeting.', url: 'https://www.andersoncountysc.org/wp-content/uploads/2023/09/Stormwater-application-flow-chart-redux4.pdf' },
      { role: 'Stormwater, city', name: 'City of Anderson Stormwater Management', note: 'The city runs its own storm sewer system and land development regulations for plan review.', url: 'https://www.cityofandersonsc.com/stormwater-management/' },
      { role: 'State stormwater permit', name: 'SCDES Bureau of Water', note: 'Construction General Permit SCR100000. Lists which local office reviews plans in each jurisdiction.', url: 'https://www.des.sc.gov/programs/bureau-water/stormwater/where-apply' },
    ],
    gallery: [IMG.siteWork, IMG.slab, IMG.sewerLateral],
    faq: [
      { q: 'How long does Anderson County take to review a stormwater plan?', a: `The county's Stormwater Department states it has 20 working days to review a plan for land disturbing activity of one acre or more. The grading permit is a separate application to the Development Standards Department.` },
      { q: 'How close to a creek can I grade in Anderson County?', a: `Anderson County's riparian buffer ordinance, Ordinance 2025-018, sets a buffer of 50 to 100 feet from all waters of the state. The width that applies to your stream is confirmed with the county at plan review.` },
      { q: 'Do I need a permit to grade less than an acre in Anderson?', a: `At the state level, SCDES says that for land disturbance of less than one acre you must complete a form but do not need a permit, unless the lot is part of a larger common plan. City and county requirements can still apply, so we check with the reviewing office for the parcel.` },
      { q: 'Can RO handle the storm drainage as well as the grading?', a: `Yes. RO Unlimited holds South Carolina classifications for grading and for water and sewer lines, which covers storm drainage, along with concrete and highway work for curbs, parking and drives.` },
    ],
    ctaLine: `Send the civil set or the survey for your Anderson site. We will tell you which permits it needs, where the buffers fall and what the dirt work involves.`,
  },
  {
    town: 'anderson-sc', service: 'underground-utilities', kind: 'utilities',
    place: 'Anderson, SC', placeShort: 'Anderson',
    cities: [{ name: 'Anderson', state: 'South Carolina' }],
    h1: 'Underground Utility Contractor Serving Anderson, SC',
    h1Lead: 'Underground Utility Contractor', h1Place: 'Serving Anderson, SC',
    metaTitle: 'Underground Utility Contractor in Anderson, SC',
    metaDescription: 'Licensed underground utility contractor serving Anderson, SC: water lines, sewer and storm drainage for city, county wastewater and district water systems.',
    intro: `Water lines, sanitary sewer, force mains, storm drainage and service connections for commercial sites in Anderson and Anderson County. RO Unlimited is licensed in South Carolina for water and sewer lines. In Anderson County the first job is working out which of many systems the pipe will belong to.`,
    heroImage: IMG.valveTrench.src, heroAlt: IMG.valveTrench.alt,
    guideTitle: 'Pipe in the Ground in', guideAccent: 'Anderson',
    sections: [
      {
        heading: 'A wholesaler and its members',
        body: [
          `Anderson's water starts at Lake Hartwell. The Anderson Regional Joint Water System, a partnership of rural and municipal water districts, runs the Lake Hartwell Water Treatment Plant, which it bought from Duke Energy in 2002, and sells treated water wholesale across Anderson and Pickens counties.`,
          `The pipe in front of your site belongs to a member, not to the joint system. The members include the City of Anderson, Big Creek, Broadway, Hammond, Homeland Park, Powdersville Water, Sandy Springs, Starr-Iva and West Anderson, as well as the towns of Pendleton and Williamston. Each one sets its own standards for a tap or an extension.`,
        ],
      },
      {
        heading: 'Inside the city: Electric City Utilities',
        body: [
          `Electric City Utilities is the City of Anderson's division for water distribution, wastewater collection and wastewater treatment. It has about 15,800 service connections across 31 square miles.`,
          `On the sewer side the city operates two treatment plants, Rocky River at 9.5 million gallons a day and Generostee at 10 million, fed by roughly 280 miles of gravity line and five pump stations. The city publishes a standard specification for gravity and force main sewer construction and a checklist for the state Delegated Review Program, and that is what its inspectors hold the work to.`,
        ],
      },
      {
        heading: 'County sewer: collection and transport',
        body: [
          `Anderson County Wastewater serves residential, commercial and industrial customers with about 250 miles of collection lines and 43 pump stations. With that many pump stations, a new connection often means a force main or a station upgrade, not just a gravity lateral.`,
          `The county's rules are short and firm. A permit must be completed before connecting. A capacity fee applies to every permit. Any connection to the county system must be inspected by county wastewater personnel, and inspections need 48 hours' notice. It also provides a flow request form, which is where a commercial project should start.`,
        ],
      },
      {
        heading: 'Trenching here',
        body: [
          `Piedmont clay of the Cecil type, which the USDA describes as red clay over saprolite on the uplands, generally digs cleanly and stands well when it is dry. It should never be trusted to. Every trench a person enters is sloped, benched or shielded, and the hot tap photo on this page shows the trench box we work inside.`,
          `Near Lake Hartwell and along the creeks, groundwater changes the job: dewatering, stone bedding and a slower pace. We look at the creek crossings and low points on the utility plan first, because that is where the time goes.`,
        ],
      },
    ],
    authorities: [
      { role: 'Water, wholesale', name: 'Anderson Regional Joint Water System', note: 'Lake Hartwell Water Treatment Plant; wholesale supplier to member utilities in Anderson and Pickens counties.', url: 'https://arjwater.com/about-us/' },
      { role: 'Water and sewer, city', name: 'Electric City Utilities (City of Anderson)', note: 'About 15,800 connections. Rocky River and Generostee treatment plants. Publishes its own sewer construction specification.', url: 'https://www.cityofandersonsc.com/wastewater/' },
      { role: 'Sewer, county', name: 'Anderson County Wastewater', note: 'About 250 miles of line and 43 pump stations. Permit, capacity fee and inspection required for every connection.', url: 'https://www.andersoncountysc.org/departments-a-z/wastewater/' },
      { role: 'State permit', name: 'SCDES (formerly DHEC)', note: 'Construction permits for water and sewer extensions, including the Delegated Review Program.', url: 'https://des.sc.gov/' },
    ],
    gallery: [IMG.valveTrench, IMG.hotTap, IMG.ductileValve],
    faq: [
      { q: 'Is Anderson Regional Joint Water System my water provider?', a: `Not directly. It is the wholesale supplier that treats Lake Hartwell water. Your account and your tap are with one of its member utilities, such as Electric City Utilities in the City of Anderson, or the Hammond, Sandy Springs, West Anderson, Big Creek or Powdersville water districts.` },
      { q: 'Does Electric City Utilities provide electricity?', a: `No. Electric City is Anderson's nickname. Electric City Utilities is the City of Anderson's water and wastewater division, responsible for water distribution, wastewater collection and wastewater treatment.` },
      { q: 'What does Anderson County require for a sewer connection?', a: `A permit completed before connecting, a capacity fee based on the SCDES unit contributory loading rate, and inspection of the connection by Anderson County Wastewater personnel, scheduled with 48 hours' notice.` },
      { q: 'Is RO licensed to install water and sewer lines in Anderson?', a: `Yes. RO Unlimited holds the South Carolina water and sewer lines license classification, which applies statewide. Each utility's own contractor requirements are confirmed before the bid.` },
    ],
    ctaLine: `Send the utility sheets or the address of your Anderson site. We will work out whose water and whose sewer it is and what each system will require.`,
  },

  /* ══════════ EASLEY ══════════ */
  {
    town: 'easley-sc', service: 'commercial-contractor', kind: 'commercial',
    place: 'Easley, SC', placeShort: 'Easley',
    cities: [{ name: 'Easley', state: 'South Carolina' }],
    h1: 'Commercial General Contractor Serving Easley, SC',
    h1Lead: 'Commercial General Contractor', h1Place: 'Serving Easley, SC',
    metaTitle: 'Commercial General Contractor in Easley, SC',
    metaDescription: 'Licensed commercial general contractor serving Easley, SC and Pickens County: ground-up buildings and build-outs, with utility and city permits handled.',
    intro: `RO Unlimited is a licensed general contractor serving Easley and Pickens County: ground-up commercial buildings, shells, build-outs and the site and utility work that goes with them. In Easley, sewer capacity and city limits decide what can be built before anyone draws a floor plan.`,
    heroImage: IMG.slab.src, heroAlt: IMG.slab.alt,
    guideTitle: 'Building in', guideAccent: 'Easley',
    sections: [
      {
        heading: 'One utility for power, water and sewer',
        body: [
          `Easley Combined Utilities is municipally owned and governed by a three-member Commission of Public Works. It supplies electric, water and wastewater service, so a building in its territory has one utility to deal with for all three.`,
          `Its water comes from Saluda Lake, a 330-acre impoundment of the Saluda River, through an 18 million gallon a day treatment plant. Power is supplied through the Piedmont Municipal Power Agency. The utility publishes standard water and sewer specifications, and those govern any line that will be turned over to it.`,
        ],
      },
      {
        heading: 'Sewer service is tied to annexation',
        body: [
          `This is the rule that surprises owners. Under the Easley Combined Utilities sewer service policy effective February 10, 2025, the utility will not hold capacity for a development until capacity fees are paid in full. A property contiguous to the city must attempt annexation before sewer service is approved.`,
          `In the Middle Branch basin the rule is stricter: the property must be annexed into the City of Easley first, and the policy describes the Middle Branch treatment plant as reaching its rated capacity. The developer is also required to complete any off-site improvements needed to serve the parcel. Check the basin before you close on the land.`,
        ],
      },
      {
        heading: 'City permits, county permits and impact fees',
        body: [
          `Inside the city, the Building Department on North 1st Street reviews plans, issues permits and inspects. Commercial plans are submitted as two stamped hard copies. Planning and Development administers the city's Unified Development Ordinance, last updated in April 2026, and the city has charged development impact fees at the full rate since January 2024.`,
          `Outside the city limits the permit comes from Pickens County Building Codes Administration through its online self-service portal. Both enforce the 2021 building codes, and the 2024 codes take effect on January 1, 2027.`,
        ],
      },
      {
        heading: 'Site rules start at a quarter acre',
        body: [
          `Pickens County regulates smaller sites than the state does. Land disturbance of a quarter acre or more needs a simplified stormwater grading permit, and one acre or more needs a full land disturbance permit with a pollution prevention plan prepared by a licensed professional. The county responds within 30 calendar days. In the city, the stormwater ordinance requires an approved sediment and erosion control plan before a building permit is granted.`,
          `New access matters here too. The SC 153 Extension, a 4.4 mile road from US 123 to Saluda Dam Road, opened in December 2020, and the Department of Transportation said it would open new opportunities for economic development in the Easley area.`,
        ],
      },
    ],
    authorities: [
      { role: 'Power, water, sewer', name: 'Easley Combined Utilities', note: 'Municipal utility. Sewer capacity is not held until fees are paid; annexation rules apply by basin.', url: 'https://www.easleyutilities.com/sewer' },
      { role: 'Building permit, city', name: 'City of Easley Building Department', note: 'Plan review, permits and inspections. Commercial plans submitted as two stamped hard copies.', url: 'https://www.cityofeasley.com/entities/building-department' },
      { role: 'Zoning and annexation', name: 'City of Easley Planning & Development', note: 'Unified Development Ordinance, annexation applications and zoning clearance.', url: 'https://www.cityofeasley.com/entities/planning-development' },
      { role: 'Building permit, county', name: 'Pickens County Building Codes Administration', note: 'Sites outside the city limits, through the county online self-service portal.', url: 'https://www.co.pickens.sc.us/departments/building_codes/index.php' },
      { role: 'Stormwater, county', name: 'Pickens County Stormwater Management', note: 'Simplified grading permit at a quarter acre; land disturbance permit at one acre.', url: 'https://www.co.pickens.sc.us/departments/stormwater_management/index.php' },
    ],
    gallery: [IMG.slab, IMG.interior, IMG.rooftop],
    faq: [
      { q: 'Do I have to annex into Easley to get sewer for a commercial building?', a: `Often, yes. The Easley Combined Utilities sewer policy effective February 10, 2025 requires a property contiguous to the city to attempt annexation before sewer service is approved, and in the Middle Branch basin the property must be annexed first. Confirm the basin and the policy with the utility for your parcel.` },
      { q: 'Who provides electricity and water in Easley?', a: `Easley Combined Utilities, a municipally owned utility, provides electric, water and wastewater service. Its water comes from Saluda Lake and its power supply from the Piedmont Municipal Power Agency.` },
      { q: 'How do I submit commercial plans to the City of Easley?', a: `The city's Building Department asks for two stamped hard copies of commercial plans, mailed or delivered to its office on North 1st Street. Sites outside the city go through the Pickens County online portal instead.` },
      { q: 'What size of site needs a grading permit in Pickens County?', a: `A quarter acre. Pickens County requires a simplified stormwater grading permit for land disturbance of one-quarter acre or more, and a land disturbance permit with a professionally prepared pollution prevention plan at one acre or more.` },
    ],
    ctaLine: `Send the plans or the parcel. We will check the sewer basin, the city limit and the permit office before you spend money on design, then tell you what the building will take.`,
  },

  /* ══════════ NORTHEAST GEORGIA ══════════ */
  {
    town: 'northeast-georgia', service: 'commercial-construction-site-work', kind: 'commercial-site',
    place: 'Northeast Georgia', placeShort: 'Northeast Georgia',
    cities: [{ name: 'Toccoa', state: 'Georgia' }, { name: 'Lavonia', state: 'Georgia' }, { name: 'Hartwell', state: 'Georgia' }],
    h1: 'Commercial Construction and Site Work Serving Toccoa, Lavonia and Hartwell, GA',
    h1Lead: 'Commercial Construction and Site Work', h1Place: 'Serving Toccoa, Lavonia and Hartwell, GA',
    metaTitle: 'Commercial Contractor: Toccoa, Lavonia & Hartwell, GA',
    metaDescription: 'Commercial construction and site work serving Toccoa, Lavonia and Hartwell, GA. A licensed general contractor that knows Georgia EPD land disturbance rules.',
    intro: `RO Unlimited builds commercial buildings and does the site work under them across the Savannah River in Northeast Georgia: Stephens, Franklin and Hart counties. We are licensed as a general contractor in Georgia as well as South Carolina. The rules for moving dirt change at the state line, and this page covers how.`,
    heroImage: IMG.siteWork.src, heroAlt: IMG.siteWork.alt,
    guideTitle: 'Building in', guideAccent: 'Northeast Georgia',
    sections: [
      {
        heading: 'Who issues the land disturbance permit',
        body: [
          `Georgia lets a city or county be certified as a Local Issuing Authority and issue its own land disturbance permits. On the Georgia Environmental Protection Division's August 2025 list, the City of Toccoa is certified. Stephens County, Franklin County, the City of Lavonia, Hart County and the City of Hartwell are not.`,
          `Where there is no local authority, the erosion control plan goes to EPD itself: one copy to the Watershed Protection Branch and one to the district office, which for all three counties is the Northeast District in Athens. So a site inside Toccoa and a site five miles outside it follow different paths.`,
        ],
      },
      {
        heading: 'The state permit and its 14 days',
        body: [
          `Sites that disturb one acre or more need coverage under one of Georgia's construction stormwater general permits: GAR100001 for a stand-alone project, GAR100002 for infrastructure, GAR100003 for a common development. The current permits took effect on August 1, 2023 and run to July 31, 2028.`,
          `The Notice of Intent has to be filed at least 14 days before construction starts, through EPD's online system. Franklin County's own permit checklist asks for that notice with the application when grading exceeds an acre. Georgia 811 asks for at least three business days' notice before digging.`,
        ],
      },
      {
        heading: 'Buffers and certified people on site',
        body: [
          `Georgia's permit bars construction within a 25 foot buffer along the banks of all state waters, and within 50 feet on waters classed as trout streams. The buffer is measured from where the stream has wrested the vegetation, not from the property line.`,
          `The state also regulates who is on the job. Each permittee needs at least one person in responsible charge of erosion control who holds the Georgia Soil and Water Conservation Commission's Level IA certification, the card Stephens and Franklin counties both ask to see. Certified personnel must inspect the site at least twice every seven days.`,
        ],
      },
      {
        heading: 'Water, sewer and gas by town',
        body: [
          `Toccoa draws its water mainly from Lake Toccoa, supplemented from Davidson Creek and Lake Yonah, and also runs Toccoa Natural Gas, a regional system reaching Stephens, Franklin and Hart counties. New commercial service starts with the city's tap applications. Hartwell withdraws from Lake Hartwell, treats up to 4.5 million gallons a day, and upgraded its sewer plant in 2025 for industrial loadings.`,
          `Outside Hartwell, the Hart County Water and Sewer Authority serves the unincorporated county, including sewer customers at Gateway Park near I-85. Franklin County's water system runs on groundwater wells. In Lavonia we confirm the provider and the tap process with the city for each site.`,
        ],
      },
      {
        heading: 'Licensing differs from South Carolina',
        body: [
          `Georgia requires a license to perform commercial general contracting, and RO's Georgia general contractor license number is furnished with any bid or prequalification package.`,
          `Georgia also licenses utility contracting on its own. State board rules define it as work on utility systems at least five feet underground, and the Hart County Water and Sewer Authority requires any contractor connecting to its system to hold a Georgia utility contractor's license. On a Georgia project we set out in the proposal which license each part of the work is performed under.`,
        ],
      },
      {
        heading: 'What is being built here',
        body: [
          `The I-85 corridor through these counties is drawing large projects. In August 2026 the Governor's office announced a 1.5 million square foot Walmart fulfillment center at the Franklin 85 Logistics Center in Carnesville, a $1.3 billion investment. Hart County's Gateway Industrial Park sits at Exit 177, and Nestlé Purina committed $550 million to expanding its Hartwell plant in 2020.`,
          `In Toccoa, the Stephens County Development Authority's Hayestone Brady Business Park has about 100 acres left with pad-ready certified sites. The ground is rolling Piedmont: Hart County's plan names Madison sandy loam as its most common soil, a mica-rich soil over weathered schist that needs care to compact.`,
        ],
      },
    ],
    authorities: [
      { role: 'Land disturbance, Toccoa', name: 'City of Toccoa (Local Issuing Authority)', note: 'The only certified Local Issuing Authority among these cities and counties on the EPD list of August 2025.', url: 'https://epd.georgia.gov/watershed-protection-branch/erosion-and-sedimentation' },
      { role: 'Land disturbance, elsewhere', name: 'Georgia EPD, Northeast District (Athens)', note: 'Receives erosion control plans where there is no Local Issuing Authority. Notice of Intent 14 days before construction.', url: 'https://epd.georgia.gov/forms-permits/watershed-protection-branch-forms-permits/storm-water-forms/npdes-construction' },
      { role: 'Building permit, Stephens', name: 'Stephens County Building Department', note: 'Asks for the Level IA erosion control certification where it applies.', url: 'https://stephenscountyga.gov/building-inspections/' },
      { role: 'Building permit, Franklin', name: 'Franklin County Building Department', note: 'Issues permits and enforces erosion and sediment controls for new development in the county.', url: 'https://www.franklincountyga.gov/1266/Building-Department' },
      { role: 'Building permit, Hart', name: 'Hart County Building Permitting Office', note: 'Building permits in the unincorporated areas of Hart County.', url: 'https://hartcountyga.gov/permitting.html' },
      { role: 'Water and sewer, Hart', name: 'Hart County Water and Sewer Authority', note: 'Written approval required before connecting; contractor must hold a Georgia utility contractor license.', url: 'http://www.hartwatersewer.com/newconstruction.html' },
    ],
    gallery: [IMG.siteWork, IMG.metalBuilding, IMG.steelFrame],
    faq: [
      { q: 'Who issues land disturbance permits in Toccoa, Lavonia and Hartwell?', a: `On the Georgia EPD list updated in August 2025, the City of Toccoa is a certified Local Issuing Authority and issues its own. Stephens County, Franklin County, Lavonia, Hart County and Hartwell are not certified, so erosion control plans there are submitted to Georgia EPD and its Northeast District office in Athens.` },
      { q: 'How far ahead must a Notice of Intent be filed in Georgia?', a: `At least 14 days before construction activity begins, for sites disturbing one acre or more. It is filed electronically with Georgia EPD under general permit GAR100001, GAR100002 or GAR100003, depending on the type of project.` },
      { q: 'How close to a stream can we build in Northeast Georgia?', a: `Georgia's construction stormwater permit prohibits construction within a 25 foot buffer along the banks of state waters, and within 50 feet along trout streams, measured from the point where stream flow has wrested the vegetation.` },
      { q: 'Is RO Unlimited licensed to build in Georgia?', a: `Yes. RO Unlimited holds a Georgia general contractor license in addition to its South Carolina licenses. The Georgia license number is furnished with any bid or prequalification package. We serve Northeast Georgia from the Upstate and have no office there.` },
    ],
    ctaLine: `Send the plans or the site address in Stephens, Franklin or Hart County. We will tell you who issues the permits, who supplies the utilities and what the work involves.`,
  },
  // @@PAGES@@
];

/* ─── Helpers ─────────────────────────────────────────────── */

export const areaPath = (p: Pick<AreaPage, 'town' | 'service'>) => `/areas/${p.town}/${p.service}`;

export function getAreaPage(town: string, service: string): AreaPage | undefined {
  return AREA_PAGES.find((p) => p.town === town && p.service === service);
}

/** The same kind of work in the other towns. */
export function siblingTowns(page: AreaPage): AreaPage[] {
  const same = AREA_PAGES.filter((p) => p.kind === page.kind && p.town !== page.town);
  if (same.length) return same;
  // A one-off page (Northeast Georgia) links across to the commercial pages.
  return AREA_PAGES.filter((p) => p.kind === 'commercial' && p.town !== page.town);
}

/** The other services written up for this town. */
export function otherServicesInTown(page: AreaPage): AreaPage[] {
  const here = AREA_PAGES.filter((p) => p.town === page.town && p.service !== page.service);
  if (here.length) return here;
  // A town with one page (Greer, Easley) points at the nearest town's site and
  // utility pages, so the reader can still get to that work.
  if (page.kind !== 'commercial') return [];
  return AREA_PAGES.filter((p) => p.town === 'greenville-sc' && p.kind !== 'commercial');
}
