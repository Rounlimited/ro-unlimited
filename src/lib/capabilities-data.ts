/** Commercial capabilities page — aligned with commercial pivot strategy (technical credibility). */

export type CapabilitySection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export const CAPABILITY_SECTIONS: CapabilitySection[] = [
  {
    id: 'kitchen',
    title: 'Commercial Kitchen & Restaurant Systems',
    summary:
      'Restaurant and QSR work demands more than passing inspections. We handle the kitchen systems, brand standards, and infrastructure details that let the finished space feel sharp, efficient, and built for repeat business.',
    bullets: [
      'Type I and Type II hood systems — installation, ductwork, make-up air',
      'Grease trap and interceptor installation',
      'Commercial gas line infrastructure and connection',
      'Walk-in cooler/freezer construction and utility pre-plumb',
      'Drive-thru lane construction, menu board foundations, speaker post install',
    ],
  },
  {
    id: 'life-safety',
    title: 'Life Safety & Code Compliance',
    summary:
      'Commercial occupancy and multi-jurisdictional work across SC, NC, and GA. We coordinate systems that have to pass inspection the first time.',
    bullets: [
      'Fire suppression system coordination (wet/dry sprinkler, Ansul systems)',
      'Commercial fire alarm and detection rough-in',
      'ADA-compliant construction throughout',
      'Commercial occupancy permitting and certificate of occupancy coordination',
      'Multi-jurisdictional code compliance (SC, NC, GA)',
    ],
  },
  {
    id: 'structural',
    title: 'Structural & Shell',
    summary:
      'Ground-up commercial shell work for developers and GCs who need execution and presence. Steel, concrete, and envelope built to perform, then support a finished project that looks deliberate instead of merely complete.',
    bullets: [
      'Steel erection and structural steel packages',
      'CMU / block construction',
      'Tilt-up and precast concrete coordination',
      'Commercial foundation systems',
      'Metal building erection and insulation',
    ],
  },
  {
    id: 'site',
    title: 'Site Development',
    summary:
      'Mass grading, utilities, parking, and site sequencing that keep schedules moving while setting up the finished project to arrive with the right first impression.',
    bullets: [
      'Mass grading and pad preparation',
      'Underground utility installation (storm, sanitary, water, gas, electric)',
      'Parking lot construction, ADA spaces, striping',
      'Stormwater management and detention',
      'Commercial landscape and hardscape',
    ],
  },
];
