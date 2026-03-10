/**
 * COMMERCIAL SERVICE EXPANSION DATA
 * Rich detail content for the ServiceDrawer component.
 * Each service gets a full breakdown that answers every question
 * a commercial client would have before picking up the phone.
 */

export interface ServiceDetail {
  id: string;
  title: string;
  overview: string;
  includes: string[];
  targetClient: string;
  timeline: string;
  ctaText: string;
}

export interface ProcessDetail {
  title: string;
  bullets: string[];
  clientRole: string;
  deliverable: string;
}

export interface VettingPillar {
  id: string;
  title: string;
  shortDesc: string;
  expandedDesc: string;
  stat?: string;
  statLabel?: string;
}

export const COMMERCIAL_SERVICE_DETAILS: Record<string, ServiceDetail> = {
  'Commercial Building Development': {
    id: 'commercial-building-dev',
    title: 'Commercial Building Development',
    overview: 'From vacant land to occupied building — RO manages the full development lifecycle. We coordinate site selection advisory, feasibility analysis, zoning research, architectural design-build, and ground-up construction under one contract. No middlemen, no coordination gaps, no finger-pointing.',
    includes: [
      'Site selection and feasibility advisory across GA, SC, and NC',
      'Zoning research, variance applications, and municipal compliance',
      'Architectural and engineering design-build coordination',
      'Full permitting — building, environmental, fire, ADA',
      'Ground-up construction through certificate of occupancy',
      'Final punch list walkthrough and project closeout',
    ],
    targetClient: 'Developers, investors, and business owners building new commercial space from the ground up.',
    timeline: '6–14 months depending on scope, permitting complexity, and site conditions',
    ctaText: 'Start Your Development',
  },
  'Steel & Mixed-Material Construction': {
    id: 'steel-mixed-material',
    title: 'Steel & Mixed-Material Construction',
    overview: 'Steel is the backbone of commercial construction — and RO self-performs structural steel work rather than subbing it out. We build with pre-engineered metal buildings, structural steel frames, and hybrid steel-wood-concrete systems. The result is faster erection timelines, clear-span interiors, superior fire resistance, and predictable costs.',
    includes: [
      'Pre-engineered metal building (PEMB) erection and finishing',
      'Structural steel framing for multi-story commercial builds',
      'Hybrid steel-wood and steel-concrete construction',
      'Tilt-up concrete panel integration with steel structures',
      'Material sourcing through established supplier relationships',
      'Welding, bolting, and connection engineering to commercial code',
    ],
    targetClient: 'Owners and developers building warehouses, distribution centers, retail shells, office buildings, or industrial facilities.',
    timeline: '4–10 months depending on building size, material lead times, and complexity',
    ctaText: 'Discuss Your Steel Build',
  },
  'Modern Retail Storefronts': {
    id: 'modern-retail',
    title: 'Modern Retail Storefronts',
    overview: 'Every day a retail space sits unfinished is a day of lost revenue. RO builds retail environments that prioritize speed-to-open without cutting corners on quality. We understand customer flow optimization, ADA compliance, signage integration, and the specific HVAC, electrical, and plumbing demands of open-concept retail and restaurant spaces.',
    includes: [
      'Strip mall tenant buildouts and standalone retail construction',
      'Restaurant and food service builds including hood systems and grease traps',
      'Storefront glass, curtain wall, and entrance systems',
      'Customer flow and display layout optimization',
      'ADA-compliant entrances, restrooms, and parking',
      'Signage integration — monument signs, channel letters, illuminated facades',
    ],
    targetClient: 'Retail chains, franchise operators, restaurant groups, and commercial landlords preparing spaces for tenants.',
    timeline: '3–8 months depending on tenant requirements and permitting',
    ctaText: 'Build Your Retail Space',
  },
  'Problem Solving for Complex Sites': {
    id: 'complex-sites',
    title: 'Problem Solving for Complex Sites',
    overview: 'Not every site is flat, clear, and ready to build. RO specializes in the projects other contractors walk away from — difficult terrain, limited access, wetlands, unusual soil conditions, existing structure demolition, and environmental restrictions. With an in-house land grading division and 25+ years of tri-state experience, we solve site problems before they become schedule killers.',
    includes: [
      'Difficult terrain grading — slopes, rock, poor drainage',
      'Wetland mitigation and environmental compliance coordination',
      'Limited-access site logistics and equipment staging',
      'Existing structure demolition and site clearing',
      'Unusual soil condition management — clay, fill, high water table',
      'Creative engineering solutions for setback and easement challenges',
    ],
    targetClient: 'Developers and owners who\'ve been told their site is unbuildable or too expensive by other contractors.',
    timeline: 'Varies significantly by site — scope calls are free and fast',
    ctaText: 'Send Us Your Site Challenge',
  },
  'Development Consulting': {
    id: 'dev-consulting',
    title: 'Development Consulting',
    overview: 'Not ready to break ground yet? RO offers pre-construction consulting that helps you make informed decisions before committing capital. We evaluate sites, develop realistic budgets, create phased timelines, advise on material selection, and help you understand what your project will actually cost — not what a salesperson wants you to hear.',
    includes: [
      'Site feasibility analysis — can this site support your vision?',
      'Budget development with real-world cost benchmarks',
      'Material selection guidance balancing cost, quality, and timeline',
      'Phased project timeline development with milestone markers',
      'Subcontractor coordination strategy and procurement planning',
      'Risk assessment — what could go wrong and how to prevent it',
    ],
    targetClient: 'First-time commercial developers, investors evaluating properties, and businesses expanding into new facilities.',
    timeline: 'Consulting engagements typically run 2–6 weeks before construction decisions',
    ctaText: 'Schedule a Consultation',
  },
  'Large-Scale Commercial Projects': {
    id: 'large-scale',
    title: 'Large-Scale Commercial Projects',
    overview: 'RO has the equipment, workforce, and bonding capacity to handle projects that exceed what most regional contractors can take on. Multi-building developments, industrial facilities, distribution centers, institutional buildings, and phased commercial campuses — we manage the complexity without losing control of quality, timeline, or budget.',
    includes: [
      'Multi-building commercial campus development',
      'Industrial facilities — manufacturing, processing, distribution',
      'Warehouse and logistics center construction',
      'Institutional builds — churches, schools, community centers',
      'Phased construction management for occupied-site projects',
      'Heavy equipment fleet for large-scale earthwork and structural erection',
    ],
    targetClient: 'Corporations, institutions, logistics companies, and developers with projects exceeding 10,000 sq ft.',
    timeline: '8–18 months depending on phases, scale, and regulatory requirements',
    ctaText: 'Discuss Your Large-Scale Project',
  },
};

export const PROCESS_DETAILS: Record<string, ProcessDetail> = {
  'Consultation': {
    title: 'Consultation',
    bullets: [
      'Walk the site or review plans together — virtual or in-person',
      'Define project scope, budget range, and target completion date',
      'Identify potential challenges early — zoning, soil, access, utilities',
      'Receive a preliminary feasibility assessment at no cost',
    ],
    clientRole: 'Bring your vision, budget expectations, and any existing plans or surveys.',
    deliverable: 'Written scope summary and preliminary budget range.',
  },
  'Site Evaluation': {
    title: 'Site Evaluation',
    bullets: [
      'Physical site inspection — topography, drainage, existing conditions',
      'Utility mapping — water, sewer, electric, gas, telecom availability',
      'Geotechnical assessment coordination if soil conditions warrant it',
      'Permitting pathway research — building, environmental, fire marshal',
    ],
    clientRole: 'Provide property access, existing surveys, and any known site history.',
    deliverable: 'Site evaluation report with identified risks and recommended solutions.',
  },
  'Design-Build Coordination': {
    title: 'Design-Build Coordination',
    bullets: [
      'Architectural design managed under RO\'s contract — one point of contact',
      'Structural engineering, MEP design, and civil engineering coordination',
      'Material selection balancing performance, aesthetics, and budget',
      'Permit submission and municipal review management',
    ],
    clientRole: 'Review and approve design milestones. Provide feedback on layouts and finishes.',
    deliverable: 'Approved construction documents, secured permits, and locked project budget.',
  },
  'Ground-Up Construction': {
    title: 'Ground-Up Construction',
    bullets: [
      'Site grading and foundation work by RO\'s in-house grading division',
      'Structural erection — steel, concrete, wood framing, or hybrid',
      'MEP rough-in coordination with vetted trade partners',
      'Weekly progress updates with photos and milestone tracking',
    ],
    clientRole: 'Attend scheduled site walks. Approve any change orders promptly to maintain schedule.',
    deliverable: 'Completed structure ready for finishing, with all inspections passed.',
  },
  'Final Delivery': {
    title: 'Final Delivery',
    bullets: [
      'Comprehensive punch list walkthrough with the client',
      'All deficiencies corrected before final sign-off',
      'Certificate of occupancy obtained from the municipality',
      'Project documentation package — as-builts, warranties, manuals',
    ],
    clientRole: 'Walk the site with RO\'s project manager. Flag anything that doesn\'t meet spec.',
    deliverable: 'Keys in hand. Certificate of occupancy. Full documentation package.',
  },
};

export const VETTING_PILLARS: VettingPillar[] = [
  {
    id: 'licensed',
    title: 'Licensed & Insured — No Exceptions',
    shortDesc: 'Every trade carries current licensing, liability insurance, and workers\' comp. Verified before they set foot on site.',
    expandedDesc: 'RO requires proof of active state licensing, general liability coverage, and workers\' compensation insurance from every subcontractor and trade partner before they receive a single work order. We re-verify annually and before every new project. No paper, no badge, no entry.',
    stat: '100',
    statLabel: '% Verified',
  },
  {
    id: 'track-record',
    title: 'Proven Track Record',
    shortDesc: 'We only partner with tradespeople who\'ve demonstrated consistent quality across multiple commercial projects.',
    expandedDesc: 'Our trade partners aren\'t pulled from a directory. They\'re electricians, plumbers, HVAC techs, concrete crews, and specialty contractors who\'ve delivered on commercial-grade projects repeatedly — and whose work has been inspected by our project managers in the field. References checked. Workmanship verified. Callbacks tracked.',
    stat: '25',
    statLabel: 'Years Vetting',
  },
  {
    id: 'relationships',
    title: 'Decades of Relationships',
    shortDesc: 'Our network was built over 25+ years. These are tradespeople we\'ve worked with across hundreds of projects.',
    expandedDesc: 'When you hire RO, you get the electrician who\'s wired 200 commercial panels. The concrete crew that\'s poured foundations in red clay, rock, and sand. The steel erector who shows up on time because they know we don\'t tolerate delays. These relationships were earned job by job, year by year — not bought from a staffing agency.',
  },
  {
    id: 'accountability',
    title: 'Direct Accountability Chain',
    shortDesc: 'Every sub reports to RO\'s project management. One chain of command — if something\'s not right, it gets fixed immediately.',
    expandedDesc: 'You will never have to chase down a plumber or argue with an electrician you didn\'t hire. Every trade partner on an RO job site operates under our direct supervision, our quality standards, and our schedule. If work doesn\'t meet spec, our project manager handles it on the spot — not three phone calls later.',
  },
  {
    id: 'commercial-grade',
    title: 'Commercial-Grade Standards',
    shortDesc: 'Residential quality isn\'t commercial quality. Our trades understand commercial code, timelines, and expectations.',
    expandedDesc: 'Commercial construction demands different skills than residential work — heavier structural loads, stricter fire codes, ADA compliance, complex HVAC systems, three-phase electrical, and inspection schedules that don\'t flex. Our trade partners have commercial experience as a baseline requirement, not a bonus.',
  },
];
