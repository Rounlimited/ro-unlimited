export const COMPANY = {
  name: 'RO Unlimited',
  fullName: 'RO Unlimited Construction & Development',
  phone: '(864) 304-0139',
  email: 'build@rounlimited.com',
  tagline: 'Show Up. Build Right. Stand Behind It.',
  heroStatement: 'Commercial work that earns attention and holds up.',
  cta: 'Bring us the site, the scope, or the full vision. We know how to move it forward.',
  experience: '25+',
  serviceArea: 'Georgia, South Carolina & North Carolina',
  areaCode: '864',
  serviceAreaShort: 'Tri-State (GA, SC, NC)',
  facebook: 'https://www.facebook.com/profile.php?id=61578630061375',
} as const;

/** Public site: commercial-first order (homepage division cards + footer). */
export const DIVISIONS = [
  {
    id: 'commercial', name: 'Commercial Division', shortName: 'Commercial', href: '/commercial',
    description: 'Steel builds, retail storefronts, mixed-material construction, and full commercial development.',
    services: ['Commercial Building Development','Steel & Mixed-Material Construction','Modern Retail Storefronts','Problem Solving for Complex Sites','Development Consulting','Large-Scale Commercial Projects'],
    icon: 'building', targetAudience: 'Commercial developers, project managers, general contractors',
  },
  {
    id: 'grading', name: 'Land Grading & Site Prep', shortName: 'Land Grading', href: '/grading',
    description: 'Excavation, land grading, and complete site preparation for residential and commercial projects.',
    services: ['Land Grading & Excavation','Site Preparation','Foundation Work','Drainage Solutions','Lot Clearing','Erosion Control'],
    icon: 'mountain', targetAudience: 'Developers, land owners, project managers',
  },
  {
    id: 'process', name: 'The Build Process', shortName: 'Our Process', href: '/process',
    description: 'See how we take projects from raw land to finished product \u2014 every phase, every detail.',
    services: ['Architectural Design','Project Planning & Consulting','Permitting & Compliance','Construction Management','Quality Assurance','Final Walkthrough & Delivery'],
    icon: 'hardhat', targetAudience: 'All prospects evaluating capabilities',
  },
  {
    id: 'residential', name: 'Residential Division', shortName: 'Residential', href: '/residential',
    description: 'Large-scale custom homes, complex structural framing, and luxury interior renovations.',
    services: ['Custom Home Framing','Ground-Up New Builds','Complex Structural Shells','Luxury Interior Renovations','Modern Industrial Design','Vaulted Ceilings & Complex Gables'],
    icon: 'home', targetAudience: 'Homeowners, luxury buyers, real estate investors',
  },
] as const;

/** Primary navigation — commercial-first IA (Land Grading + Process stay in footer divisions). */
export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Commercial', href: '/commercial' },
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/our-story' },
  { label: 'Residential', href: '/residential' },
  { label: 'Contact', href: '/contact' },
] as const;

/** Footer: core pages beyond division links (URLs stay stable for SEO). */
export const FOOTER_COMPANY_LINKS = [
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/our-story' },
] as const;

/** Homepage hero trust strip — commercial-first framing */
export const TRUST_STATS = [
  { value: '25+', label: 'Years in Business' },
  { value: '500+', label: 'Projects Built' },
  { value: '3', label: 'States Licensed' },
  { value: '100%', label: 'We Stand Behind It' },
] as const;

/**
 * Homepage “division” cards — commercial project types (pivot).
 * Same shape as DIVISIONS for DivisionCards; links go to commercial or capabilities anchors.
 */
export const COMMERCIAL_HOME_CARDS = [
  {
    id: 'qsr',
    name: 'QSR & Franchise',
    shortName: 'QSR & Franchise',
    href: '/capabilities#kitchen',
    description: 'Restaurants, drive-thrus, and fast casual work with kitchen systems, utility pressure, and brand timing already understood.',
    services: ['Type I & II hoods', 'Drive-thru lanes', 'Franchise timelines'],
    icon: 'utensils',
    targetAudience: 'Brands, owner-operators, development teams',
  },
  {
    id: 'retail',
    name: 'Retail & Strip',
    shortName: 'Retail & Strip',
    href: '/commercial',
    description: 'Retail pads, mixed-use shells, and storefront work shaped for visibility, traffic, and commercial occupancy from day one.',
    services: ['Shell & tenant buildout', 'Parking & ADA', 'Pad development'],
    icon: 'store',
    targetAudience: 'Developers, ownership groups, investors',
  },
  {
    id: 'bank',
    name: 'Bank & Financial',
    shortName: 'Banks',
    href: '/commercial',
    description: 'Financial builds that demand security, ADA precision, vault coordination, and a clean finished presence.',
    services: ['Vault & secure areas', 'ADA compliance', 'MEP coordination'],
    icon: 'landmark',
    targetAudience: 'Institutions, developers, project teams',
  },
  {
    id: 'renovation',
    name: 'Renovation & Buildout',
    shortName: 'Renovation',
    href: '/commercial',
    description: 'Tenant improvements and repositioning executed with sequencing that keeps active buildings moving.',
    services: ['Tenant buildouts', 'Core & shell', 'Phased work'],
    icon: 'hammer',
    targetAudience: 'Landlords, tenants, general contractors',
  },
  {
    id: 'industrial',
    name: 'Industrial & Warehouse',
    shortName: 'Industrial',
    href: '/commercial',
    description: 'Warehousing, metal buildings, and light industrial work delivered from slab and utilities through envelope.',
    services: ['Metal buildings', 'Slabs & docks', 'Site utilities'],
    icon: 'warehouse',
    targetAudience: 'Owners, logistics groups, developers',
  },
  {
    id: 'groundup',
    name: 'Ground-Up Commercial',
    shortName: 'Ground-Up',
    href: '/commercial',
    description: 'Ground-up commercial delivery with one team carrying the job from first dirt to final turnover.',
    services: ['Steel & shell', 'Site development', 'CO coordination'],
    icon: 'building',
    targetAudience: 'Developers, end users, institutional teams',
  },
] as const;

/** Shared shape for homepage division / commercial-type cards (DivisionCards). */
export type DivisionCardEntry = (typeof DIVISIONS)[number] | (typeof COMMERCIAL_HOME_CARDS)[number];
