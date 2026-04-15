/**
 * RO SERVICES DIVISION DATA
 * Content for the Services hub and individual service pages.
 * Speaks to homeowners, property managers, and small business owners
 * looking for reliable trade work — not large-scale construction.
 */

import type { ServiceDetail, ProcessDetail } from './commercial-data';

/* ─── Service Categories ─────────────────────────────────────────── */

export interface ServiceCategory {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  icon: string;
  description: string;
  hero: string;
  services: string[];
  faq: { q: string; a: string }[];
  seoKeywords: string[];
  heroImage: string;
  cardImage: string;
  galleryImages: string[];
  serviceImages: Record<string, string>;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'roofing',
    slug: 'roofing',
    title: 'Roofing',
    tagline: 'Roof Repair & Replacement in Upstate SC',
    icon: 'hard-hat',
    description: 'From storm damage repairs to full roof replacements, RO handles residential and light commercial roofing with licensed crews and quality materials. We show up fast, assess honestly, and build roofs that last.',
    hero: 'Whether it\'s a missing shingle or a full tear-off, RO\'s roofing crews deliver fast, honest work backed by 25+ years of construction experience. We don\'t upsell — we fix what needs fixing and build what needs building.',
    services: [
      'Roof repair and patching',
      'Full roof replacement (shingle, metal, flat)',
      'Storm damage assessment and insurance coordination',
      'Roof inspections and maintenance',
      'Gutter installation and repair',
      'Flashing, soffit, and fascia work',
    ],
    faq: [
      { q: 'How much does roof repair cost in SC?', a: 'Minor repairs typically run $300–$1,500. Full replacements vary by size and material — we provide free estimates so you know the real number before any work starts.' },
      { q: 'Do you handle insurance claims for storm damage?', a: 'Yes. We document the damage, provide detailed estimates, and work directly with your insurance adjuster to make the process as smooth as possible.' },
      { q: 'What roofing materials do you install?', a: 'Architectural shingles, standing seam metal, TPO/EPDM flat roofing, and more. We\'ll recommend the best option for your building and budget.' },
    ],
    seoKeywords: ['roof repair Greenville SC', 'roofing contractor near me', 'storm damage roof repair', 'roof replacement Upstate SC'],
    heroImage: '/images/services/roofing/roofing-hero.jpg',
    cardImage: '/images/services/hub/hub-roofing.jpg',
    galleryImages: [
      '/images/services/roofing/storm-damage.jpg',
      '/images/services/roofing/roofer-working.jpg',
      '/images/services/roofing/builders-roof.jpg',
      '/images/services/roofing/shingle-closeup.jpg',
      '/images/services/roofing/roof-construction.jpg',
      '/images/services/roofing/gutter-installation.jpg',
    ],
    serviceImages: {
      'Roof repair and patching': '/images/services/roofing/storm-damage.jpg',
      'Full roof replacement (shingle, metal, flat)': '/images/services/roofing/builders-roof.jpg',
      'Storm damage assessment and insurance coordination': '/images/services/roofing/roof-construction.jpg',
      'Roof inspections and maintenance': '/images/services/roofing/roofer-working.jpg',
      'Gutter installation and repair': '/images/services/roofing/gutter-installation.jpg',
      'Flashing, soffit, and fascia work': '/images/services/roofing/shingle-closeup.jpg',
    },
  },
  {
    id: 'septic',
    slug: 'septic',
    title: 'Septic Systems',
    tagline: 'Septic Repair & Installation — Done Right the First Time',
    icon: 'droplets',
    description: 'Septic system repair, replacement, and new installation for residential and light commercial properties. RO handles the full scope — from soil testing to final inspection — so your system meets code and works for decades.',
    hero: 'Septic work isn\'t glamorous, but it\'s critical. A failed system means health hazards, property damage, and code violations. RO\'s crews have the equipment and experience to diagnose, repair, or replace your septic system — and we do it right the first time.',
    services: [
      'Septic system repair and troubleshooting',
      'Full septic system replacement',
      'New septic system installation',
      'Tank pumping coordination',
      'Drain field repair and installation',
      'Soil testing and permitting',
    ],
    faq: [
      { q: 'How do I know if my septic system needs repair?', a: 'Slow drains, sewage odors, standing water near the drain field, or unusually green grass over the system are all warning signs. We can inspect and diagnose the issue quickly.' },
      { q: 'Do you install new septic systems for new construction?', a: 'Yes. We handle soil testing, system design, permitting, installation, and final inspection — the full scope from start to finish.' },
      { q: 'What areas do you serve for septic work?', a: 'We cover Upstate South Carolina and nearby counties in Georgia and North Carolina. Call us to confirm coverage for your location.' },
    ],
    seoKeywords: ['septic repair Greenville SC', 'septic tank installer', 'septic system contractor Upstate SC'],
    heroImage: '/images/services/septic/septic-hero.jpg',
    cardImage: '/images/services/hub/hub-septic.jpg',
    galleryImages: [
      '/images/services/septic/excavator-digging.jpg',
      '/images/services/septic/drain-field.jpg',
      '/images/services/septic/equipment-jobsite.jpg',
      '/images/services/septic/septic-hero.jpg',
    ],
    serviceImages: {
      'Septic system repair and troubleshooting': '/images/services/septic/equipment-jobsite.jpg',
      'Full septic system replacement': '/images/services/septic/excavator-digging.jpg',
      'New septic system installation': '/images/services/septic/septic-hero.jpg',
      'Drain field repair and installation': '/images/services/septic/drain-field.jpg',
    },
  },
  {
    id: 'electrical',
    slug: 'electrical',
    title: 'Electrical Services',
    tagline: 'Licensed Electrical Work for Homes & Light Commercial',
    icon: 'zap',
    description: 'Panel upgrades, rewiring, service calls, lighting, and outlet work — handled by RO\'s licensed electricians. Safe, code-compliant, and done on schedule.',
    hero: 'Electrical work isn\'t something you want to cut corners on. RO\'s licensed electricians do the job right — whether it\'s a simple outlet install or a full panel upgrade. Every job is code-compliant and inspected.',
    services: [
      'Panel Upgrades (100A to 200A+)',
      'Whole-House Rewiring',
      'Generator Installation',
      'EV Charger Installation',
      'Solar & Battery Storage',
      'Smart Home & Automation',
      'Lighting Design & Installation',
      'Surge Protection & Safety',
    ],
    faq: [
      { q: 'How much does an electrical panel upgrade cost?', a: 'A standard 200-amp panel upgrade typically runs $1,500–$3,500 depending on your home\'s wiring condition and whether the service entrance needs replacing. We provide free estimates.' },
      { q: 'Are your electricians licensed?', a: 'Yes. All electrical work is performed by our licensed electricians, and every job is permitted and inspected to meet NEC code requirements in South Carolina.' },
      { q: 'Can you install EV chargers at my home?', a: 'Absolutely. We install Tesla Wall Connectors, ChargePoint, and universal Level 2 chargers with dedicated 240V circuits. A 30% federal tax credit applies to installation costs.' },
      { q: 'Do you install solar panels and battery storage?', a: 'Yes. We install complete solar-plus-storage systems including Tesla Powerwall, Enphase, and Generac PWRcell — with full electrical integration from panel to rooftop.' },
      { q: 'What is a smart electrical panel?', a: 'A smart panel like the SPAN Panel replaces your traditional breaker box, giving you app-based control and monitoring of every circuit. It\'s the foundation for whole-home energy management.' },
    ],
    seoKeywords: ['electrician Greenville SC', 'electrical panel upgrade', 'EV charger installation SC', 'solar battery storage Upstate SC', 'electrical contractor Upstate SC'],
    heroImage: '/images/services/electrical/electrical-hero.jpg',
    cardImage: '/images/services/hub/hub-electrical.jpg',
    galleryImages: [
      '/images/services/electrical/switchboard-closeup.jpg',
      '/images/services/electrical/panel-closeup.jpg',
      '/images/services/electrical/electrician-panel.jpg',
      '/images/services/electrical/outlet-installation.jpg',
      '/images/services/electrical/socket-repair.jpg',
      '/images/services/electrical/rewiring-work.jpg',
      '/images/services/electrical/lighting-installation.jpg',
      '/images/services/electrical/electrician-fusebox.jpg',
    ],
    serviceImages: {
      'Panel Upgrades (100A to 200A+)': '/images/services/electrical/panel-closeup.jpg',
      'Whole-House Rewiring': '/images/services/electrical/rewiring-work.jpg',
      'Generator Installation': '/images/services/electrical/switchboard-closeup.jpg',
      'EV Charger Installation': '/images/services/electrical/electrician-panel.jpg',
      'Solar & Battery Storage': '/images/services/electrical/electrician-fusebox.jpg',
      'Smart Home & Automation': '/images/services/electrical/socket-repair.jpg',
      'Lighting Design & Installation': '/images/services/electrical/lighting-installation.jpg',
      'Surge Protection & Safety': '/images/services/electrical/outlet-installation.jpg',
    },
  },
  {
    id: 'plumbing',
    slug: 'plumbing',
    title: 'Plumbing',
    tagline: 'Reliable Plumbing Repair & Installation',
    icon: 'pipette',
    description: 'Plumbing repairs, re-pipes, fixture installs, water heater replacement, and drain clearing. RO\'s plumbing team handles the jobs that keep your home running — fast response, honest pricing, quality work.',
    hero: 'A plumbing problem doesn\'t wait — and neither do we. From leaking pipes to water heater failures, RO\'s plumbing crew responds fast and fixes it right. No hourly padding, no surprise charges — just honest work at a fair price.',
    services: [
      'Pipe Repair & Re-Piping',
      'Water Heater Services',
      'Drain Cleaning & Sewer',
      'Fixture Installation',
      'Gas Line Services',
      'Water Filtration & Treatment',
      'Bathroom & Kitchen Plumbing',
      'Emergency Plumbing',
    ],
    faq: [
      { q: 'Do you offer emergency plumbing service?', a: 'Yes. Call us and we\'ll get someone out as quickly as possible. Burst pipes, major leaks, and sewer backups are priorities. Emergency dispatch is available with same-day response.' },
      { q: 'How much does a water heater replacement cost?', a: 'Standard tank water heaters run $800–$2,000 installed. Tankless units are $2,500–$4,500. Heat pump water heaters (the most efficient option for SC) run $2,000–$4,000. We size it to your household.' },
      { q: 'Can you re-pipe an entire house?', a: 'Yes. We re-pipe homes with copper or PEX. PEX is 30–40% cheaper and freeze-resistant. Full re-pipes typically take 2–5 days. Polybutylene and galvanized replacements are our most common re-pipe jobs.' },
      { q: 'Do you install water filtration systems?', a: 'Yes — whole-house carbon filters, water softeners, reverse osmosis, and well water treatment. We test your water first to design the right system. Most Upstate SC homes benefit from at least a softener.' },
      { q: 'Can you run a gas line for a new stove?', a: 'Absolutely. We install and extend natural gas and propane lines for stoves, dryers, water heaters, fireplaces, and outdoor grills. All gas work is permitted and pressure-tested.' },
    ],
    seoKeywords: ['plumber near me', 'plumbing repair Greenville SC', 'emergency plumber Upstate SC'],
    heroImage: '/images/services/plumbing/plumbing-hero.jpg',
    cardImage: '/images/services/hub/hub-plumbing.jpg',
    galleryImages: [
      '/images/services/plumbing/drain-work.jpg',
      '/images/services/plumbing/pipe-closeup.jpg',
      '/images/services/plumbing/faucet-fixture.jpg',
      '/images/services/plumbing/water-heater.jpg',
    ],
    serviceImages: {
      'Pipe Repair & Re-Piping': '/images/services/plumbing/pipe-closeup.jpg',
      'Water Heater Services': '/images/services/plumbing/water-heater.jpg',
      'Drain Cleaning & Sewer': '/images/services/plumbing/drain-work.jpg',
      'Fixture Installation': '/images/services/plumbing/faucet-fixture.jpg',
      'Gas Line Services': '/images/services/plumbing/pipe-closeup.jpg',
      'Water Filtration & Treatment': '/images/services/plumbing/faucet-fixture.jpg',
      'Bathroom & Kitchen Plumbing': '/images/services/plumbing/drain-work.jpg',
      'Emergency Plumbing': '/images/services/plumbing/water-heater.jpg',
    },
  },
  {
    id: 'repairs',
    slug: 'repairs',
    title: 'General Repairs',
    tagline: 'Home & Property Repairs — No Job Too Small',
    icon: 'wrench',
    description: 'Drywall, painting, decks, fencing, concrete patchwork, doors, windows, and everything in between. RO\'s repair crews handle the small jobs that big contractors ignore — with the same quality and professionalism.',
    hero: 'Not every job needs a general contractor — but every job deserves one who cares. RO handles the repairs and maintenance work that keeps properties in shape: drywall patches, deck repairs, fence replacements, door installs, and more. We show up on time and do it right.',
    services: [
      'Drywall repair and installation',
      'Interior and exterior painting',
      'Deck building, repair, and staining',
      'Fence installation and repair',
      'Door and window replacement',
      'Concrete patchwork and flatwork',
    ],
    faq: [
      { q: 'Do you handle small handyman-type jobs?', a: 'Yes. We take on jobs of all sizes — from a single drywall patch to a full deck build. No job is too small for RO.' },
      { q: 'Can you build a new deck?', a: 'Absolutely. We build custom decks in wood, composite, and PVC. We handle design, permitting, and construction start to finish.' },
      { q: 'Do you do exterior painting?', a: 'Yes — both interior and exterior. We prep properly, use quality paint, and stand behind the finish.' },
    ],
    seoKeywords: ['handyman Greenville SC', 'home repair contractor', 'deck repair near me', 'fence installation Upstate SC'],
    heroImage: '/images/services/repairs/repairs-hero.jpg',
    cardImage: '/images/services/hub/hub-repairs.jpg',
    galleryImages: [
      '/images/services/repairs/deck-building.jpg',
      '/images/services/repairs/drywall-painting.jpg',
      '/images/services/repairs/fence-installation.jpg',
      '/images/services/repairs/door-window.jpg',
    ],
    serviceImages: {
      'Drywall repair and installation': '/images/services/repairs/drywall-painting.jpg',
      'Interior and exterior painting': '/images/services/repairs/drywall-painting.jpg',
      'Deck building, repair, and staining': '/images/services/repairs/deck-building.jpg',
      'Fence installation and repair': '/images/services/repairs/fence-installation.jpg',
      'Door and window replacement': '/images/services/repairs/door-window.jpg',
    },
  },
];

/* ─── Detailed service info for ServiceDrawer ────────────────────── */

export const SERVICES_DETAIL: Record<string, ServiceDetail> = {
  'Roofing & Storm Damage': {
    id: 'roofing',
    title: 'Roofing & Storm Damage',
    overview: 'From emergency tarps after a storm to full roof replacements, RO\'s roofing division handles it all. We assess honestly, price fairly, and build roofs that hold up for decades. We also coordinate directly with insurance adjusters for storm damage claims.',
    includes: [
      'Roof repair, patching, and leak resolution',
      'Full tear-off and replacement — shingle, metal, flat',
      'Storm damage documentation and insurance coordination',
      'Gutter, soffit, fascia, and flashing work',
      'Preventive maintenance inspections',
      'Emergency tarp and temporary weather protection',
    ],
    targetClient: 'Homeowners dealing with leaks or storm damage, property managers maintaining roofing across multiple units, and small business owners needing commercial roof repair.',
    timeline: 'Repairs: 1–3 days. Full replacements: 3–7 days depending on size and weather.',
    ctaText: 'Get a Roof Estimate',
  },
  'Septic Systems': {
    id: 'septic',
    title: 'Septic Systems',
    overview: 'RO handles the full lifecycle of septic systems — diagnosing failures, repairing drain fields, replacing tanks, and installing brand-new systems for new construction. We manage soil testing, permitting, and final inspections so you don\'t have to.',
    includes: [
      'Septic system diagnosis and repair',
      'Tank replacement and drain field restoration',
      'New system design and installation',
      'Soil testing and DHEC permitting',
      'Tank pumping coordination',
      'Code compliance and final inspection',
    ],
    targetClient: 'Homeowners with failing systems, builders needing septic for new construction, and property owners maintaining rural properties.',
    timeline: 'Repairs: 1–5 days. New installations: 1–3 weeks including permitting.',
    ctaText: 'Schedule a Septic Assessment',
  },
  'Electrical Services': {
    id: 'electrical',
    title: 'Electrical Services',
    overview: 'RO\'s licensed electricians handle it all — panel upgrades, whole-house rewiring, lighting installs, and generator hookups. Every job is code-compliant and inspected.',
    includes: [
      'Electrical panel upgrades (100A to 200A+)',
      'Whole-house and partial rewiring',
      'Outlet, switch, and circuit installation',
      'Indoor and outdoor lighting design',
      'Ceiling fan and fixture installation',
      'Generator transfer switch hookup',
    ],
    targetClient: 'Homeowners upgrading older electrical systems, property managers handling tenant maintenance, and anyone adding circuits or upgrading panels.',
    timeline: 'Service calls: same day to 2 days. Panel upgrades: 1–2 days. Rewiring: 3–7 days.',
    ctaText: 'Book an Electrician',
  },
  'Plumbing': {
    id: 'plumbing',
    title: 'Plumbing',
    overview: 'RO\'s plumbing crew handles everything from emergency leak repairs to full re-pipes and fixture installs. Fast response, honest pricing, and work that\'s done right the first time.',
    includes: [
      'Pipe repair, replacement, and re-piping',
      'Water heater repair and replacement (tank and tankless)',
      'Faucet, toilet, and sink installation',
      'Drain clearing and sewer line repair',
      'Gas line work',
      'Rough-in plumbing for renovations',
    ],
    targetClient: 'Homeowners with plumbing emergencies, property managers handling maintenance, and anyone upgrading fixtures or water heaters.',
    timeline: 'Emergency repairs: same day. Standard work: 1–3 days. Re-pipes: 2–5 days.',
    ctaText: 'Call for Plumbing Help',
  },
  'General Repairs': {
    id: 'repairs',
    title: 'General Repairs',
    overview: 'The jobs that big contractors ignore — drywall, painting, decks, fences, doors, windows, and concrete patchwork. RO treats every repair with the same professionalism and quality as a full build. We show up on time, do it right, and leave the site clean.',
    includes: [
      'Drywall patching, hanging, and finishing',
      'Interior and exterior painting',
      'Deck construction, repair, and staining',
      'Fence installation and repair (wood, vinyl, chain-link)',
      'Door and window replacement',
      'Concrete patchwork, sidewalks, and small flatwork',
    ],
    targetClient: 'Homeowners maintaining their property, landlords keeping rentals in shape, and small business owners handling facility upkeep.',
    timeline: 'Most repairs: 1–3 days. Decks and fences: 3–7 days. Painting: 2–5 days depending on scope.',
    ctaText: 'Request a Repair Quote',
  },
  'Small Renovations': {
    id: 'renovations',
    title: 'Small Renovations',
    overview: 'Bathroom updates, kitchen refreshes, ADA modifications, and room conversions. Not every renovation needs to be a six-figure gut job — RO handles focused, scope-controlled renovations that transform spaces without the chaos of a full remodel.',
    includes: [
      'Bathroom updates — vanity, tile, fixtures, lighting',
      'Kitchen refreshes — cabinets, countertops, backsplash',
      'ADA accessibility modifications (grab bars, ramps, widened doors)',
      'Room conversions (garage to office, basement finishing)',
      'Closet and storage buildouts',
      'Flooring replacement and upgrades',
    ],
    targetClient: 'Homeowners wanting targeted updates, families adding accessibility features, and property owners increasing rental value with cosmetic upgrades.',
    timeline: 'Bathroom updates: 1–3 weeks. Kitchen refreshes: 2–4 weeks. Room conversions: 2–6 weeks.',
    ctaText: 'Plan Your Renovation',
  },
};

/* ─── Services Process Steps ─────────────────────────────────────── */

export const SERVICES_PROCESS: Record<string, ProcessDetail> = {
  'Call or Request': {
    title: 'Call or Request a Quote',
    bullets: [
      'Call us directly or submit a quote request through the website',
      'Describe the issue or project — no need to diagnose it yourself',
      'We\'ll ask a few questions to understand scope and urgency',
      'Same-day callback for urgent issues',
    ],
    clientRole: 'Tell us what\'s going on. A photo helps but isn\'t required.',
    deliverable: 'Scheduled site visit or phone estimate for straightforward jobs.',
  },
  'Assessment': {
    title: 'On-Site Assessment',
    bullets: [
      'A crew member visits to inspect the work area',
      'We identify the root cause — not just the symptom',
      'You get an honest assessment: what needs fixing now vs. what can wait',
      'Written estimate with clear scope and pricing',
    ],
    clientRole: 'Be available for the site visit. Show us everything that concerns you.',
    deliverable: 'Written estimate — no surprises, no hidden fees.',
  },
  'Schedule & Execute': {
    title: 'Schedule & Execute',
    bullets: [
      'We lock in a start date that works for you',
      'Materials ordered and staged before we arrive',
      'Work completed on schedule — we respect your time and property',
      'Site left clean every day, spotless when we\'re done',
    ],
    clientRole: 'Make the work area accessible. Let us know about any scheduling constraints.',
    deliverable: 'Completed work — inspected, tested, and ready to use.',
  },
  'Follow-Up': {
    title: 'Follow-Up & Warranty',
    bullets: [
      'We check in after the job to make sure everything is holding up',
      'Any warranty issues are handled promptly — no runaround',
      'Your info is on file for future service calls',
      'One call gets you back on the schedule if anything comes up',
    ],
    clientRole: 'Let us know if anything doesn\'t feel right. We stand behind our work.',
    deliverable: 'Peace of mind — and a contractor you can call again.',
  },
};
