/**
 * Content for /grading (Site Development & Grading).
 *
 * Shared by the page (client) and its layout (server, FAQPage markup), so the
 * questions a visitor reads and the ones Google reads are the same list.
 *
 * Photos: files starting `ro-` are RO Unlimited's own job photos; files
 * starting `px-` are Pexels placeholders to swap for real job photos as the
 * owner sends them. Captions on placeholders describe the work, not a job.
 */

export const GRADING_SERVICES = [
  {
    num: '01',
    title: 'Land Clearing & Grubbing',
    img: '/images/grading/px-excavator-clearing-12164798.jpg',
    alt: 'Excavator clearing and stripping a lot at the edge of a tree line',
    desc: 'Trees, brush, stumps and roots come out, and the topsoil is stripped and stockpiled, so the grading starts on clean ground instead of on top of organics that will settle later.',
    points: ['Tree, brush and stump removal', 'Grubbing and root raking', 'Topsoil stripping and stockpiling'],
  },
  {
    num: '02',
    title: 'Mass Grading & Excavation',
    img: '/images/grading/px-dozer-mass-grading-9577586.jpg',
    alt: 'Bulldozer cutting and spreading red soil across an open site',
    desc: 'Bulk cut and fill to the elevations on the grading plan. Upstate red clay is moved, placed in lifts and compacted so the whole site lands on design grade.',
    points: ['Cut and fill to plan elevations', 'Embankment built in compacted lifts', 'Haul-off or import when the site does not balance'],
  },
  {
    num: '03',
    title: 'Building Pads & Site Balancing',
    img: '/images/grading/ro-pad-metal-building-2026.jpg',
    alt: 'RO Unlimited job site in Upstate South Carolina: metal building standing on a graded red clay pad',
    desc: 'A pad built to the elevation and compaction the foundation design calls for, with the dirt balanced across the site where the plan allows so less of it has to be trucked.',
    points: ['Pads to finished subgrade elevation', 'Compaction ready for third-party testing', 'Positive drainage away from the slab'],
  },
  {
    num: '04',
    title: 'Stormwater & Detention',
    img: '/images/grading/px-detention-pond-aerial-12485784.jpg',
    alt: 'Aerial view of a detention pond beside commercial buildings and parking',
    desc: 'Detention and retention ponds, swales and outfalls shaped to the civil drawings, with the storm pipe and structures installed under our water and sewer classification.',
    points: ['Detention and retention ponds', 'Swales, berms and outfall protection', 'Storm pipe, catch basins and structures'],
  },
  {
    num: '05',
    title: 'Erosion & Sediment Control',
    img: '/images/grading/px-graded-slope-outlet-11576765.jpg',
    alt: 'Freshly graded slope with a storm pipe outlet at the top',
    desc: 'The controls on the approved plan go in before the dirt moves and stay maintained until the site is stabilized, so sediment stays on the site and the permit stays clean.',
    points: ['Silt fence, construction entrances and inlet protection', 'Sediment basins and traps', 'Seeding, matting and final stabilization'],
  },
  {
    num: '06',
    title: 'Driveways, Roads & Parking Subgrade',
    img: '/images/grading/px-motor-grader-subgrade-37701411.jpg',
    alt: 'Motor grader shaping a road subgrade along a tree line',
    desc: 'Subgrade cut, shaped and compacted for drives, access roads and parking lots, then stone base placed and fine graded so it is ready for paving or concrete.',
    points: ['Subgrade shaping and proof-rolling', 'Stone base placement', 'Fine grading for curb, paving and slabs'],
  },
] as const;

export const GRADING_STEPS = [
  { num: '01', title: 'Walk the Site, Read the Plans', desc: 'We start with the survey, the civil drawings and the geotechnical report if there is one, then walk the ground. That is where the quantities, the access and the problem spots get sorted out before a number is given.' },
  { num: '02', title: 'Permits, Locates & Controls', desc: 'Land disturbance and stormwater approvals are confirmed, existing utilities are located through 811, and the erosion and sediment controls on the plan are installed first.' },
  { num: '03', title: 'Clear, Grub & Strip', desc: 'Trees, stumps and brush come out. Topsoil is stripped and stockpiled for later, leaving clean subsoil to build on.' },
  { num: '04', title: 'Cut, Fill & Compact', desc: 'Dirt moves from the high side to the low side. Fill goes down in lifts and is compacted, and unsuitable soil is undercut and replaced where it turns up.' },
  { num: '05', title: 'Storm, Utilities & Fine Grade', desc: 'Storm drainage, water and sewer go in while the site is still open. Then the pads, drives and parking areas are brought to finished subgrade.' },
  { num: '06', title: 'Pad-Ready & Stabilized', desc: 'The pad is ready for footings, slopes are seeded or matted, and the site is ready for the building. When that building is ours too, the next phase starts without a new contractor learning the site.' },
] as const;

export const GRADING_FAQS = [
  {
    q: 'What does a site work contractor do?',
    a: 'Site work is everything that happens to the land before the building goes up: clearing, grading the site to the elevations on the plan, building the pad, installing storm drainage and underground utilities, controlling erosion, and preparing the subgrade for drives and parking. RO Unlimited is licensed for each of those pieces, so the site can be delivered pad-ready under one contractor.',
  },
  {
    q: 'Are you a licensed grading contractor in South Carolina?',
    a: 'Yes. Grading is one of the 13 state license classifications RO Unlimited holds. It covers clearing and grubbing, mass excavation, embankment, building pads, site balancing and finish grading. We also hold the Highway, Concrete, Water & Sewer Lines and Boring & Tunneling classifications that site work usually touches. Every license number is listed on our licenses page.',
  },
  {
    q: 'Where do you do site work and grading?',
    a: 'We are based in Easley and work across Upstate South Carolina, including Greenville, Greer, Spartanburg, Anderson and the towns in between, and into Northeast Georgia. We are licensed in South Carolina and Georgia.',
  },
  {
    q: 'What do you need from me to price a grading job?',
    a: 'The site address, a survey or civil drawings if you have them, a geotechnical report if one has been done, and your timeline. If all you have is an address and an idea of what you want built, send that. We can walk the site and tell you what else is needed.',
  },
  {
    q: 'Do I need a permit to clear and grade my land?',
    a: 'Often, yes. Most commercial sites need a land disturbance permit from the county or city, and sites that disturb an acre or more generally need coverage under the state construction stormwater permit, with an approved erosion and sediment control plan. Requirements vary by jurisdiction, so we confirm what applies to your site before any dirt moves.',
  },
  {
    q: 'Can you install the storm drainage and utilities too?',
    a: 'Yes. Storm drainage, water and sanitary sewer are installed under our Water & Sewer Lines classification, which most grading contractors do not hold. Putting pipe in while the site is still open saves digging up finished grade later.',
  },
  {
    q: 'Can you build the building after the site is ready?',
    a: 'Yes. RO Unlimited is a licensed general contractor for commercial buildings as well as site work. Site, utilities and building can run under one contract, with one license holder accountable from the first cut to the finished building.',
  },
  {
    q: 'Does red clay cause problems for grading?',
    a: 'Upstate red clay compacts well and makes a solid pad when it is placed at the right moisture. It is hard to work when it is saturated, so wet weather has to be planned around, and soft or organic pockets need to be undercut and replaced. Compaction on a building pad is normally verified by an independent testing firm.',
  },
] as const;
