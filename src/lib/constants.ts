export const COMPANY = {
  name: 'RO Unlimited',
  fullName: 'RO Unlimited Construction & Development',
  phone: '(864) 304-0139',
  email: 'Rounlimitedco@gmail.com',
  tagline: 'Show Up. Build Right. Stand Behind It.',
  heroStatement: '25 Years of Showing Up and Building It Right.',
  cta: 'Send us your project. We\'ll show you what we can do.',
  experience: '25+',
  serviceArea: 'Georgia, South Carolina & North Carolina',
  areaCode: '864',
  serviceAreaShort: 'Tri-State (GA, SC, NC)',
  hours: 'Monâ€“Sat 7amâ€“6pm',
  facebook: 'https://www.facebook.com/profile.php?id=61578630061375',
} as const;

export const DIVISIONS = [
  {
    id: 'grading', name: 'Site Development & Grading', shortName: 'Site Development', href: '/grading',
    description: 'From raw land to pad-ready \u2014 clearing, mass grading, stormwater, and complete commercial site development, self-performed on our own iron.',
    services: ['Clearing & Mass Grading','Building Pads & Site Balancing','Stormwater Management','Erosion & Sediment Control','Complete Site Preparation','Foundation & Drainage Work'],
    icon: 'mountain', targetAudience: 'Commercial developers, land owners, project managers',
    featured: true,
  },
  {
    id: 'utilities', name: 'Underground Utilities', shortName: 'Utilities', href: '/utilities',
    description: 'Licensed water, sewer, and septic infrastructure \u2014 main taps, ductile iron and C900 water lines, storm drainage, and commercial grease traps.',
    services: ['Water Main Taps & Hot Taps','Ductile Iron & C900 Water Lines','Sanitary Sewer Installation','Storm Drainage Systems','Tier 2 Septic Systems','Commercial Grease Traps'],
    icon: 'droplets', targetAudience: 'Commercial developers, general contractors, municipalities',
    featured: true,
  },
  {
    id: 'commercial', name: 'Commercial Division', shortName: 'Commercial', href: '/commercial',
    description: 'Ground-up commercial construction on sites we develop ourselves \u2014 sitework and utilities self-performed, vertical construction delivered with proven subs.',
    services: ['Ground-Up Commercial Builds','QSR & Franchise Buildouts','Retail & Strip Centers','Steel & Mixed-Material Construction','Light Multi-Family Development','Development Consulting'],
    icon: 'building', targetAudience: 'Commercial developers, project managers, general contractors',
    featured: true,
  },
  {
    id: 'residential', name: 'Residential Division', shortName: 'Residential', href: '/residential',
    description: 'Large-scale custom homes, complex structural framing, and luxury interior renovations.',
    services: ['Custom Home Framing','Ground-Up New Builds','Complex Structural Shells','Luxury Interior Renovations','Modern Industrial Design','Vaulted Ceilings & Complex Gables'],
    icon: 'home', targetAudience: 'Homeowners, luxury buyers, real estate investors',
    featured: true,
  },
  {
    id: 'services', name: 'RO Services', shortName: 'Services', href: '/services',
    description: 'Roofing, plumbing, electrical, and general repairs \u2014 dedicated crews for every job, big or small.',
    services: ['Roofing & Storm Damage','Electrical Services','Plumbing','General Repairs','Small Renovations','Decks & Exterior Repairs'],
    icon: 'wrench', targetAudience: 'Homeowners, property managers, small business owners',
    featured: false,
  },
  {
    id: 'process', name: 'The Build Process', shortName: 'Our Process', href: '/process',
    description: 'See how we take projects from raw land to finished product \u2014 every phase, every detail.',
    services: ['Architectural Design','Project Planning & Consulting','Permitting & Compliance','Construction Management','Quality Assurance','Final Walkthrough & Delivery'],
    icon: 'hardhat', targetAudience: 'All prospects evaluating capabilities',
    featured: true,
  },
] as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Site Development', href: '/grading' },
  { label: 'Utilities', href: '/utilities' },
  { label: 'Commercial', href: '/commercial' },
  { label: 'Our Process', href: '/process' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Residential', href: '/residential' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
] as const;

export const TRUST_STATS = [
  { value: '25+', label: 'Years Experience' },
  { value: '500+', label: 'Projects Completed' },
  { value: '100%', label: 'Client Satisfaction' },
  { value: '3', label: 'State Service Area' },
] as const;
