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
  facebook: 'https://www.facebook.com/profile.php?id=61578630061375',
} as const;

export const DIVISIONS = [
  {
    id: 'commercial', name: 'Commercial Division', shortName: 'Commercial', href: '/commercial',
    description: 'Steel builds, retail storefronts, mixed-material construction, and full commercial development.',
    services: ['Commercial Building Development','Steel & Mixed-Material Construction','Modern Retail Storefronts','Problem Solving for Complex Sites','Development Consulting','Large-Scale Commercial Projects'],
    icon: 'building', targetAudience: 'Commercial developers, project managers, general contractors',
  },
  {
    id: 'residential', name: 'Residential Division', shortName: 'Residential', href: '/residential',
    description: 'Large-scale custom homes, complex structural framing, and luxury interior renovations.',
    services: ['Custom Home Framing','Ground-Up New Builds','Complex Structural Shells','Luxury Interior Renovations','Modern Industrial Design','Vaulted Ceilings & Complex Gables'],
    icon: 'home', targetAudience: 'Homeowners, luxury buyers, real estate investors',
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
] as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Residential', href: '/residential' },
  { label: 'Commercial', href: '/commercial' },
  { label: 'Land Grading', href: '/grading' },
  { label: 'Our Process', href: '/process' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Contact', href: '/contact' },
] as const;

export const TRUST_STATS = [
  { value: '25+', label: 'Years Experience' },
  { value: '500+', label: 'Projects Completed' },
  { value: '100%', label: 'Client Satisfaction' },
  { value: '3', label: 'State Service Area' },
] as const;
