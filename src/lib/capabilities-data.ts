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
      'Restaurant and QSR builds demand systems residential contractors never touch. We speak the language of brand standards, exhaust, and food-service infrastructure.',
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
      'Ground-up commercial shell work — steel, concrete, and envelope — built for developers and GCs who need a partner that can execute.',
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
      'Pad to building: mass grading, utilities, and parking — the front end that keeps commercial schedules on track.',
    bullets: [
      'Mass grading and pad preparation',
      'Underground utility installation (storm, sanitary, water, gas, electric)',
      'Parking lot construction, ADA spaces, striping',
      'Stormwater management and detention',
      'Commercial landscape and hardscape',
    ],
  },
];
