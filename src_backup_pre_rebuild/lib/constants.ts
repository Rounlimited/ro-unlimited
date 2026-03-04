export const COMPANY = {
  name: 'RO Unlimited',
  fullName: 'RO Unlimited Contractor & Developer',
  phone: '(864) 304-0139',
  email: 'Rounlimitedco@gmail.com',
  tagline: 'One Company. Total Capability. Ground Up.',
  heroStatement: 'From Land Grading to Luxury Finishes — We Build Everything from the Ground Up.',
  cta: 'Send us your project — let us make it a reality.',
  experience: '25+',
  serviceArea: 'Upstate South Carolina',
  areaCode: '864',
  facebook: 'https://www.facebook.com/profile.php?id=61578630061375',
} as const;

export const DIVISIONS = [
  {
    id: 'residential', name: 'Residential Division', shortName: 'Residential', href: '/residential',
    description: 'Large-scale custom homes, complex structural framing, and luxury interior renovations.',
    services: ['Custom Home Framing','Ground-Up New Builds','Complex Structural Shells','Luxury Interior Renovations','Modern Industrial Design','Vaulted Ceilings & Complex Gables'],
    icon: 'home', targetAudience: 'Homeowners, luxury buyers, real estate investors',
  },
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
    description: 'See how we take projects from raw land to finished product — every phase, every detail.',
    services: ['Architectural Design & 3D Modeling','Project Planning & Consulting','Permitting & Compliance','Construction Management','Quality Assurance','Final Walkthrough & Delivery'],
    icon: 'hardhat', targetAudience: 'All prospects evaluating capabilities',
  },
] as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Residential', href: '/residential' },
  { label: 'Commercial', href: '/commercial' },
  { label: 'Land Grading', href: '/grading' },
  { label: 'Our Process', href: '/process' },
  { label: 'Contact', href: '/contact' },
] as const;

export const TRUST_STATS = [
  { value: '25+', label: 'Years Experience' },
  { value: '500+', label: 'Projects Completed' },
  { value: '100%', label: 'Client Satisfaction' },
  { value: '864', label: 'Upstate SC Strong' },
] as const;
