/**
 * RESIDENTIAL SERVICE EXPANSION DATA
 * Warm, aspirational content for the residential ServiceDrawer.
 * Speaks to homeowners dreaming about their custom build —
 * not developers vetting a sub.
 */

import type { ServiceDetail, ProcessDetail } from './commercial-data';

export const RESIDENTIAL_SERVICE_DETAILS: Record<string, ServiceDetail> = {
  'Custom Home Framing': {
    id: 'custom-framing',
    title: 'Custom Home Framing',
    overview: 'Your floor plan is unique — your framing should be too. RO builds custom structural frames designed around your vision, not a template. Complex roof systems, engineered trusses, load-bearing wall design, and open-concept structural solutions that give you the space you actually want to live in.',
    includes: [
      'Custom floor plan structural engineering and framing',
      'Complex roof systems — hip, gable, shed, butterfly, combination',
      'Engineered truss design and installation',
      'Load-bearing wall layout for open-concept living',
      'Steel beam integration for wide spans and dramatic ceilings',
      'Hurricane tie-downs and seismic bracing to code and beyond',
    ],
    targetClient: 'Homeowners building from custom plans, architects needing a framing partner, and owners converting existing structures.',
    timeline: '4–8 weeks for framing depending on complexity and size',
    ctaText: 'Discuss Your Floor Plan',
  },
  'Ground-Up New Builds': {
    id: 'ground-up',
    title: 'Ground-Up New Builds',
    overview: 'From a vacant lot to the day you turn the key — RO handles every phase of your new home construction. Site grading, foundation, framing, roofing, mechanicals, finishes, and final walkthrough. One builder, one contract, one team that knows your project inside and out. No subcontractor shuffles. No miscommunication between trades.',
    includes: [
      'Complete design-build coordination from concept to move-in',
      'Site grading and foundation by RO\'s in-house crews',
      'Full structural framing, roofing, and exterior enclosure',
      'Mechanical rough-in coordination — plumbing, electrical, HVAC',
      'Interior finishing — drywall, flooring, cabinetry, paint, trim',
      'Final inspections, punch list, and certificate of occupancy',
    ],
    targetClient: 'Families building their forever home, investors developing residential properties, and anyone who wants total control over their new build.',
    timeline: '8–14 months from groundbreaking to move-in, depending on size and complexity',
    ctaText: 'Start Your New Build',
  },
  'Complex Structural Shells': {
    id: 'structural-shells',
    title: 'Complex Structural Shells',
    overview: 'Not every homeowner wants or needs a full turnkey build. Some want the structural bones delivered — foundation, framing, roofing, and exterior — then handle interior finishing themselves or bring in their own specialty trades. RO builds structural shells that are code-compliant, inspection-ready, and built to the same standard as our full builds.',
    includes: [
      'Foundation, framing, and roof system — fully completed',
      'Exterior sheathing, house wrap, and weather barrier',
      'Window and exterior door installation',
      'Roofing and gutter systems installed',
      'All structural inspections passed and documented',
      'Clean handoff with as-built drawings for your finishing team',
    ],
    targetClient: 'Owner-builders, contractors who need structural framing done right, and homeowners who want to self-finish interiors.',
    timeline: '3–6 months for shell completion depending on size and site conditions',
    ctaText: 'Get a Shell Quote',
  },
  'Luxury Interior Renovations': {
    id: 'luxury-renovations',
    title: 'Luxury Interior Renovations',
    overview: 'Your home has good bones but the interior doesn\'t reflect who you are anymore. RO transforms dated spaces into modern, high-end living — open-concept conversions, kitchen redesigns, master suite expansions, and full interior overhauls. We handle structural changes, permitting, and finishing so you get the home you\'ve been imagining.',
    includes: [
      'Kitchen redesign — layout, cabinetry, countertops, appliances, lighting',
      'Master suite expansion and luxury bathroom builds',
      'Open-concept wall removal with structural beam installation',
      'Hardwood, tile, and luxury vinyl flooring installation',
      'Custom trim, crown molding, and built-in cabinetry',
      'Complete interior repaint, texture, and accent wall design',
    ],
    targetClient: 'Homeowners who love their location but want to transform their living space into something that feels new.',
    timeline: '6–16 weeks depending on scope — kitchens and master suites are typically 8–12 weeks',
    ctaText: 'Plan Your Renovation',
  },
  'Modern Industrial Design': {
    id: 'modern-industrial',
    title: 'Modern Industrial Design',
    overview: 'Exposed beams, steel accents, concrete-wood combinations, loft spaces, and the raw-meets-refined aesthetic that\'s defining modern custom homes. RO specializes in the modern industrial look — not just surface-level finishes, but structural design that makes the industrial elements load-bearing and authentic, not decorative afterthoughts.',
    includes: [
      'Exposed structural beam design — wood, steel, or hybrid',
      'Steel staircase, railing, and accent fabrication',
      'Concrete countertops, floors, and feature walls',
      'Industrial farmhouse and modern loft floor plans',
      'Mixed-material exterior design — metal panel, wood, stone',
      'Open ductwork and exposed mechanical integration',
    ],
    targetClient: 'Homeowners who want a distinctive, modern aesthetic that goes beyond traditional residential design.',
    timeline: 'Varies by project — design consultation is the first step',
    ctaText: 'Explore This Style',
  },
  'Vaulted Ceilings & Complex Gables': {
    id: 'vaulted-gables',
    title: 'Vaulted Ceilings & Complex Gables',
    overview: 'This is where RO\'s craftsmanship shows up in ways most builders can\'t match. Multi-pitch rooflines, cathedral ceilings, dormers, and complex intersecting gables require a level of framing precision that separates custom builders from production builders. JR grew up framing these — it\'s in the DNA of how RO builds.',
    includes: [
      'Cathedral and vaulted ceiling framing with exposed ridge beams',
      'Multi-pitch and intersecting roof system engineering',
      'Dormer windows and bump-out roof extensions',
      'Complex gable-to-hip roof transitions',
      'Tongue-and-groove and wood plank ceiling finishing',
      'Skylight and clerestory window integration into roof framing',
    ],
    targetClient: 'Anyone who wants a home with dramatic interior volume and architectural roof detail that stands out from the street.',
    timeline: 'Framing phase adds 1–3 weeks depending on roof complexity',
    ctaText: 'Build Something Dramatic',
  },
};

export const RESIDENTIAL_PROCESS: Record<string, ProcessDetail> = {
  'Discovery': {
    title: 'Discovery',
    bullets: [
      'We sit down and listen — your vision, your lifestyle, your must-haves',
      'Walk your land or review your lot together — in person or virtually',
      'Discuss budget range, design preferences, and timeline goals',
      'Leave with a clear picture of what your home could be',
    ],
    clientRole: 'Bring your ideas, Pinterest boards, floor plan sketches — anything that shows us what you\'re imagining.',
    deliverable: 'Written project summary with scope outline and preliminary budget range.',
  },
  'Design': {
    title: 'Design',
    bullets: [
      'Floor plan development in collaboration with your architect or ours',
      'Elevation design — how your home looks from the street and every angle',
      'Material and finish selections — roofing, siding, windows, interior palette',
      'Engineering review to ensure your design is structurally sound and buildable',
    ],
    clientRole: 'Review designs at each milestone. Give us honest feedback — this is your home.',
    deliverable: 'Approved construction documents, material selections locked, and permits submitted.',
  },
  'Permitting': {
    title: 'Permitting',
    bullets: [
      'Municipal building permit application and management',
      'Engineering and architectural plan review coordination',
      'HOA and covenant compliance review if applicable',
      'All permitting handled across Georgia, South Carolina, and North Carolina',
    ],
    clientRole: 'Provide any HOA or covenant documents. We handle the rest.',
    deliverable: 'Approved building permits — construction-ready.',
  },
  'Construction': {
    title: 'Construction',
    bullets: [
      'Site grading and foundation work by our in-house crews',
      'Framing, roofing, and exterior enclosure',
      'Mechanical rough-in — plumbing, electrical, HVAC, insulation',
      'Weekly photo updates so you can watch your home come to life',
    ],
    clientRole: 'Attend scheduled site walks. Review and approve any changes promptly.',
    deliverable: 'Your home — framed, enclosed, and progressing through finishing phases.',
  },
  'Walkthrough & Keys': {
    title: 'Walkthrough & Keys',
    bullets: [
      'Final punch list walkthrough — every room, every detail, together',
      'All deficiencies corrected before you sign off',
      'Certificate of occupancy obtained from the municipality',
      'Warranty documentation, as-builts, and maintenance guides delivered',
    ],
    clientRole: 'Walk every room with us. If something doesn\'t feel right, we fix it.',
    deliverable: 'Keys in your hand. Your home. Your vision. Built.',
  },
};

export interface CraftPillar {
  title: string;
  desc: string;
}

export const CRAFT_PILLARS: CraftPillar[] = [
  { title: 'Structural Precision', desc: 'Complex roof systems, engineered trusses, and framing solutions most builders won\'t touch. The bones of your home matter more than anything.' },
  { title: 'Material Selection', desc: 'Every board, every beam, every finish — chosen for durability and beauty. We help you pick materials that look great now and hold up for decades.' },
  { title: 'Detail Obsession', desc: 'Crown molding, custom trim, seamless transitions between rooms — the details that make a house feel like home.' },
  { title: 'Built to Last', desc: 'Clients call us 20 years later. Not to complain — to build again. That\'s the kind of work we do.' },
];
