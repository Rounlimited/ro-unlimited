/**
 * RO Unlimited's state licenses — THE source of truth. Everything that prints
 * or displays a license (site footer, /licenses page, Our Story, JSON-LD,
 * capability statement, letterhead, invoice footer) reads from here, so a
 * renewal or a new classification is a one-line change.
 *
 * Owner-confirmed 2026-10-24 (JR's classification sheet, the version that
 * includes Public Electrical Utility). Group limits per SC LLR after H.4115
 * (2023): GC Group 4 = $3,000,000 per job, Mechanical Group 4 = $400,000.
 */

export type Classification = {
  code: string;      // as printed on the license: BD4, GD4 …
  name: string;      // LLR classification name
  covers: string;    // plain-English scope for customers and GCs
};

export type License = {
  id: 'gc' | 'mech' | 'osww';
  title: string;
  number: string;
  issuer: string;
  issuerShort: string;
  group?: number;
  limit?: string;    // "$3,000,000 per job"
  verifyUrl: string;
  classifications: Classification[];
  note?: string;
};

export const LLR_LOOKUP_URL = 'https://verify.llronline.com/LicLookup/Contractors/Contractor.aspx?div=69';
export const SCDES_SEPTIC_URL = 'https://des.sc.gov/permits-regulations/septic-tanks/licensing-septic-system-installers';

export const LICENSES: License[] = [
  {
    id: 'gc',
    title: 'General Contractor',
    number: 'CLG.127704',
    issuer: 'South Carolina Contractor’s Licensing Board (LLR)',
    issuerShort: 'SC LLR',
    group: 4,
    limit: '$3,000,000 per job',
    verifyUrl: LLR_LOOKUP_URL,
    classifications: [
      { code: 'BD4', name: 'Building', covers: 'Commercial, industrial, institutional and multi-family buildings — ground-up, shells, build-outs and additions.' },
      { code: 'GD4', name: 'Grading', covers: 'Clearing and grubbing, mass excavation, embankment, building pads, site balancing and finish grading.' },
      { code: 'WL4', name: 'Water & Sewer Lines', covers: 'Water mains, taps and services, sanitary sewer, storm drainage, force mains and lift stations.' },
      { code: 'CT4', name: 'Concrete', covers: 'Footings, foundations, structural slabs, walls, curb and gutter, sidewalks and concrete paving.' },
      { code: 'BT4', name: 'Boring & Tunneling', covers: 'Directional boring, jack-and-bore casings and tunneling under roads, rail and structures that can’t be cut.' },
      { code: 'HY4', name: 'Highway', covers: 'Roads, streets, parking lots, bridges and the incidental structures that go with them.' },
      { code: 'MS4', name: 'Masonry', covers: 'Block, brick and stone — structural masonry, veneer and retaining walls.' },
      { code: 'MR4', name: 'Marine', covers: 'Docks, piers, bulkheads, seawalls, boat ramps and shoreline structures.' },
      { code: '2U4', name: 'Public Electrical Utility', covers: 'Overhead and underground electrical distribution for utilities — poles, conduit, duct banks and vaults.' },
    ],
  },
  {
    id: 'mech',
    title: 'Mechanical Contractor',
    number: 'CLM.119115',
    issuer: 'South Carolina Contractor’s Licensing Board (LLR)',
    issuerShort: 'SC LLR',
    group: 4,
    limit: '$400,000 per job',
    verifyUrl: LLR_LOOKUP_URL,
    classifications: [
      { code: 'PB4', name: 'Plumbing', covers: 'Water, drain, waste, vent and gas piping — under-slab rough-in through finish, commercial and residential.' },
      { code: 'EL4', name: 'Electrical', covers: 'Services, panels, branch wiring, lighting and power for buildings and sites.' },
      { code: 'AC4', name: 'Air Conditioning', covers: 'Heating, ventilation and air-conditioning systems — installation, replacement and service.' },
    ],
  },
  {
    id: 'osww',
    title: 'Onsite Wastewater Systems — Tier 2 Installer',
    number: 'OSWWI0837',
    issuer: 'South Carolina Department of Environmental Services (formerly DHEC)',
    issuerShort: 'SCDES',
    verifyUrl: SCDES_SEPTIC_URL,
    classifications: [
      { code: 'TIER 2', name: 'Septic & Commercial Systems', covers: 'Conventional systems plus pump systems, grease traps, curtain drains, elevated and mounded systems, and all commercial onsite systems.' },
    ],
  },
];

/** "CLG.127704 · CLM.119115 · OSWWI0837" */
export const LICENSE_NUMBERS_LINE = LICENSES.map((l) => `${l.issuerShort === 'SCDES' ? 'Septic' : l.id === 'gc' ? 'GC' : 'Mech'} #${l.number}`).join(' · ');

/** One-line classification roll-up for footers and PDFs. */
export const CLASSIFICATIONS_LINE = LICENSES.flatMap((l) => l.classifications.map((c) => c.code === 'TIER 2' ? 'Tier 2 Septic' : c.name)).join(' · ');

/** Flat list for places that show a simple list of what RO is licensed for. */
export const LICENSE_LABELS: string[] = LICENSES.flatMap((l) =>
  l.classifications.map((c) => (c.code === 'TIER 2' ? 'Tier 2 Septic Installer' : `${c.name} (${c.code})`)),
);

/** For schema.org hasCredential. */
export const LICENSE_CREDENTIALS = LICENSES.flatMap((l) => [
  { name: `${l.title} License`, id: l.number },
  ...l.classifications.filter((c) => c.code !== 'TIER 2').map((c) => ({ name: `${c.name} Classification (${c.code})`, id: l.number })),
]);
