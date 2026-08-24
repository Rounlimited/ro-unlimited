/**
 * Option-group presets — the configurator's starter library, organized by
 * division. Each preset is a ready-to-add group (label, type, choices with
 * Southeast-US 2025–26 price deltas). Used by the OptionsBuilder "Add from
 * presets" sheet and the AI's list_option_presets / add_option_group tools.
 *
 * Deltas are FLAT dollars relative to the default choice, sized for the
 * "typical job" named in the group description (e.g. a 400 SF patio, 150 LF
 * of fence, a 25-square roof). JR adjusts per job — these are starting points.
 * `image_key` points at src/lib/option-images.ts (the photo library).
 */

export type PresetDivision =
  | 'utilities' | 'septic' | 'grease_traps' | 'grading' | 'concrete' | 'roofing'
  | 'electrical' | 'plumbing' | 'repairs' | 'residential' | 'commercial';

export interface OptionPresetChoice {
  label: string;
  description?: string;
  price_delta: number;
  is_default?: boolean;
  /** Default photo from the option image library (src/lib/option-images.ts) */
  image_key?: string;
}

export interface OptionPreset {
  division: PresetDivision;
  label: string;
  description?: string;
  selection_type: 'single' | 'multi' | 'addon';
  required?: boolean;
  choices: OptionPresetChoice[];
}

export const DIVISION_LABELS: Record<PresetDivision, string> = {
  utilities: 'Underground Utilities',
  septic: 'Septic',
  grease_traps: 'Grease Traps',
  grading: 'Grading & Site Development',
  concrete: 'Concrete & Masonry',
  roofing: 'Roofing',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  repairs: 'Repairs',
  residential: 'Residential Construction',
  commercial: 'Commercial Construction',
};

const c = (label: string, price_delta: number, extra: Partial<OptionPresetChoice> = {}): OptionPresetChoice =>
  ({ label, price_delta, ...extra });
const d = (label: string, extra: Partial<OptionPresetChoice> = {}): OptionPresetChoice =>
  ({ label, price_delta: 0, is_default: true, ...extra });

// Keep labels unique across the library — the AI addresses presets by name.
export const OPTION_PRESETS: OptionPreset[] = [
  /* ───────────────────────── UNDERGROUND UTILITIES ───────────────────────── */
  {
    division: 'utilities', label: 'Water Main Pipe Material', selection_type: 'single',
    description: 'Sized for 300 LF of 8" main. Pipe material drives life, utility acceptance and cost.',
    choices: [
      d('C900 PVC DR18', { description: 'Standard pressure-rated PVC — accepted by most utilities', image_key: 'util-c900-pvc' }),
      c('C900 PVC DR14', 1350, { description: 'Thicker wall for high pressure or deep bury', image_key: 'util-c900-pvc' }),
      c('Ductile Iron Class 350', 7200, { description: 'Poly-wrapped; required under pavement and crossings, longest life', image_key: 'util-ductile-iron' }),
      c('HDPE DR11 Fused', 5700, { description: 'Jointless, directional-drill capable; includes fusion setup', image_key: 'util-hdpe-fused' }),
    ],
  },
  {
    division: 'utilities', label: 'Water Main Size', selection_type: 'single',
    description: 'Per 300 LF, open cut, C900. Larger mains carry fire flow and future capacity.',
    choices: [
      c('2" Service-Class', -9000, { description: 'Poly/PVC service line for small sites', image_key: 'util-service-line' }),
      d('6" Main', { description: 'Typical residential loop / small commercial', image_key: 'util-c900-pvc' }),
      c('8" Main', 4500, { description: 'Fire-flow capable; most new commercial', image_key: 'util-c900-pvc' }),
      c('12" Main', 12500, { description: 'Transmission / large development', image_key: 'util-large-main' }),
    ],
  },
  {
    division: 'utilities', label: 'Main Connection Method', selection_type: 'single',
    description: 'How we tie into the existing main. 8"×6" tap assumed.',
    choices: [
      d('Wet Tap w/ Tapping Sleeve & Valve', { description: 'No service interruption; utility-witnessed', image_key: 'util-hot-tap' }),
      c('Cut-In Tee & Valve', -2000, { description: 'Cheaper hardware but requires a utility shutdown and notice', image_key: 'util-gate-valve' }),
      c('Utility Performs Tap (we dig & backfill)', -3200, { description: 'Some systems tap their own mains — utility tap fee passes through', image_key: 'util-trench-open' }),
    ],
  },
  {
    division: 'utilities', label: 'Domestic Service Tap Size', selection_type: 'single',
    description: 'Contractor side only — utility meter and capacity fees pass through separately.',
    choices: [
      d('3/4" Service', { description: 'Typical single-family home', image_key: 'util-meter-box' }),
      c('1" Service', 450, { description: 'Larger home or irrigation demand', image_key: 'util-meter-box' }),
      c('2" Service', 3000, { description: 'Commercial / multi-unit (higher utility capacity fee)', image_key: 'util-service-line' }),
    ],
  },
  {
    division: 'utilities', label: 'Sanitary Sewer Pipe', selection_type: 'single',
    description: 'Per 200 LF of 8" gravity sewer at 6–10 ft depth.',
    choices: [
      d('8" PVC SDR-35 Gasketed', { description: 'Standard gravity sewer pipe', image_key: 'util-sdr35-sewer' }),
      c('8" PVC SDR-26 Heavy Wall', 1200, { description: 'Heavier wall for deep or traffic areas', image_key: 'util-sdr35-sewer' }),
      c('HDPE Fused (Directional Bore)', 13000, { description: 'No open trench through driveways or roads', image_key: 'util-directional-drill' }),
    ],
  },
  {
    division: 'utilities', label: 'Storm Pipe Material', selection_type: 'single',
    description: 'Per 150 LF of 18" storm drain.',
    choices: [
      d('HDPE Dual-Wall N-12 (Soil-Tight)', { description: 'Lightweight, corrosion-proof', image_key: 'util-hdpe-storm' }),
      c('HDPE Watertight Gasketed', 900, { description: 'Required in some jurisdictions / under buildings', image_key: 'util-hdpe-storm' }),
      c('Reinforced Concrete Pipe Class III', 3750, { description: 'Required under public right-of-way and heavy loads', image_key: 'util-rcp-concrete-pipe' }),
    ],
  },
  {
    division: 'utilities', label: 'Storm Structure Type', selection_type: 'single',
    description: 'Per structure, installed.',
    choices: [
      c('Nyloplast / HDPE Drain Basin', -1600, { description: 'Residential drainage — lighter and cheaper', image_key: 'util-drain-basin' }),
      d('2\'×2\' Precast Catch Basin w/ Grate', { description: 'Standard yard / parking-lot inlet', image_key: 'util-catch-basin' }),
      c('4\' Precast Manhole / Junction Box', 3500, { description: 'Deep or multi-pipe junctions', image_key: 'util-manhole' }),
      c('DOT Curb Inlet', 2250, { description: 'Parking-lot curb line', image_key: 'util-curb-inlet' }),
    ],
  },
  {
    division: 'utilities', label: 'Trench Backfill & Restoration', selection_type: 'single',
    description: 'Per 200 LF of trench. What the surface gets put back to.',
    choices: [
      d('Native Soil, Compacted', { description: 'Lawns and unpaved areas', image_key: 'util-trench-backfill' }),
      c('#57 Stone Bedding + ABC Under Pavement', 3700, { description: 'Required under driveways and parking', image_key: 'util-stone-bedding' }),
      c('Flowable Fill (CLSM)', 8000, { description: 'Utility-mandated in right-of-way', image_key: 'util-flowable-fill' }),
      c('Saw-Cut Asphalt Patch', 5500, { description: '4" HMA patch over the trench line', image_key: 'util-asphalt-patch' }),
      c('Saw-Cut Concrete Patch', 8000, { description: '6" concrete patch for driveways / sidewalks', image_key: 'concrete-broom' }),
    ],
  },
  {
    division: 'utilities', label: 'Fire Service Line', selection_type: 'single',
    description: 'Per 150 LF of ductile-iron fire line with post-indicator valve.',
    choices: [
      d('6" DIP Fire Line w/ PIV', { description: 'Typical sprinklered commercial building', image_key: 'util-fire-line-piv' }),
      c('8" DIP Fire Line', 3750, { description: 'Larger buildings / hydrant loops', image_key: 'util-ductile-iron' }),
    ],
  },
  {
    division: 'utilities', label: 'Backflow & Fire Protection Extras', selection_type: 'multi',
    description: 'Utility- and fire-marshal-required devices.',
    choices: [
      c('6" Double-Check Backflow in Vault', 17000, { description: 'Required on most fire services', image_key: 'util-backflow-vault' }),
      c('6" RPZ Above-Grade in Hot Box', 21500, { description: 'Where a reduced-pressure zone device is required', image_key: 'util-rpz-hotbox' }),
      c('Fire Department Connection', 3750, { description: 'FDC with check valve per fire marshal', image_key: 'util-fdc' }),
    ],
  },
  {
    division: 'utilities', label: 'Utility Add-Ons', selection_type: 'multi',
    description: 'Common extras on water / sewer / storm jobs.',
    choices: [
      c('Fire Hydrant Assembly', 8000, { description: 'Hydrant + 6" valve + lead', image_key: 'util-fire-hydrant' }),
      c('8" Gate Valve & Box', 3600, { description: 'Isolation valve with valve box to grade', image_key: 'util-gate-valve' }),
      c('Tracer Wire & Warning Tape', 400, { description: 'Locatable main — per 300 LF', image_key: 'util-tracer-wire' }),
      c('Pressure Test & Chlorination', 2500, { description: 'Hydrostatic test + bac-T sampling per run', image_key: 'util-pressure-test' }),
      c('CCTV / Mandrel Test (Sewer)', 600, { description: 'Camera inspection + deflection test, per 200 LF', image_key: 'util-cctv-sewer' }),
      c('Directional Bore Crossing', 7200, { description: 'Road or driveway crossing, ~80 LF of bore', image_key: 'util-directional-drill' }),
      c('Rock Excavation Allowance', 4500, { description: 'Hammer / rock trenching — Upstate granite likely', image_key: 'util-rock-hammer' }),
      c('Dewatering', 3000, { description: 'Pump / well-point for wet trench, per day', image_key: 'util-dewatering' }),
      c('Traffic Control / Lane Closure', 1500, { description: 'Signs, cones, flaggers — per day', image_key: 'util-traffic-control' }),
      c('Private Utility Locate (GPR)', 650, { description: 'SC811 plus private locate of unmarked lines', image_key: 'util-locate-gpr' }),
    ],
  },

  /* ────────────────────────────────── SEPTIC ────────────────────────────────── */
  {
    division: 'septic', label: 'Septic System Type', selection_type: 'single',
    description: '3-bedroom home, Upstate clay. The SCDES permit governs what\'s allowed.',
    choices: [
      d('Conventional Gravel Trench', { description: 'Gravity tank to perforated pipe in stone trenches', image_key: 'septic-gravel-trench' }),
      c('Chamber System (Infiltrator)', 400, { description: 'Plastic chambers — no gravel hauling, faster install', image_key: 'septic-chamber' }),
      c('Low-Pressure Pipe (Pump) System', 7000, { description: 'Pump tank doses a pressurized field — common on shallow Piedmont soils', image_key: 'septic-lpp-pump' }),
      c('Mound / Elevated System', 18000, { description: 'Field built above grade in imported sand fill', image_key: 'septic-mound' }),
      c('Aerobic Treatment Unit (ATU)', 15000, { description: 'Treats to higher quality; required on tight lots (needs maintenance contract)', image_key: 'septic-atu' }),
      c('Drip Dispersal', 11500, { description: 'Shallow drip tubing for sloped or tight sites', image_key: 'septic-drip' }),
    ],
  },
  {
    division: 'septic', label: 'Septic Tank Size', selection_type: 'single',
    description: 'SC minimum is 1,000 gal for up to 3 bedrooms.',
    choices: [
      d('1,000 gal Concrete (≤3 BR)', { description: 'Two-compartment precast concrete', image_key: 'septic-tank-concrete' }),
      c('1,250 gal Concrete (4 BR)', 400, { image_key: 'septic-tank-concrete' }),
      c('1,500 gal Concrete (5 BR)', 800, { image_key: 'septic-tank-concrete' }),
      c('2,000 gal Concrete (6+ BR / Light Commercial)', 2000, { image_key: 'septic-tank-concrete' }),
      c('1,000 gal Poly Tank', 150, { description: 'Lighter — limited-access sites, no crane', image_key: 'septic-tank-poly' }),
      c('Dual Tanks in Series', 2200, { description: 'Extra settling for ATUs or large homes', image_key: 'septic-tank-concrete' }),
    ],
  },
  {
    division: 'septic', label: 'Drain Field Product', selection_type: 'single',
    description: 'Per 300 LF of trench.',
    choices: [
      d('36" Gravel & 4" Perforated Pipe', { description: 'Traditional stone trench', image_key: 'septic-gravel-trench' }),
      c('Infiltrator Quick4 Chambers', 450, { description: 'Standard chamber — no gravel', image_key: 'septic-chamber' }),
      c('High-Capacity Chambers (Quick4 Plus / Arc 36)', 1350, { description: 'Shorter field for the same capacity', image_key: 'septic-chamber' }),
      c('EZflow Gravelless Bundles', 1050, { description: 'Pipe in polystyrene aggregate bundles', image_key: 'septic-ezflow' }),
      c('Extra Trench Beyond Permit Minimum', 3750, { description: 'Future-proofing — ~100 extra LF', image_key: 'septic-gravel-trench' }),
    ],
  },
  {
    division: 'septic', label: 'Septic Access & Service Features', selection_type: 'multi',
    description: 'Strongly recommended — saves a dig fee every pump-out.',
    choices: [
      c('Risers & Lids to Grade (2)', 600, { description: 'Both tank openings brought to the surface', image_key: 'septic-riser-lid' }),
      c('Effluent Filter', 175, { description: 'Outlet-tee filter protects the field from solids', image_key: 'septic-effluent-filter' }),
      c('Inspection Ports at Field Ends', 225, { description: 'Lets you monitor the field without digging', image_key: 'septic-inspection-port' }),
      c('Distribution Box w/ Speed Levelers', 150, { description: 'Even flow to every trench', image_key: 'septic-dbox' }),
      c('High-Water Alarm', 350, { description: 'Audible/visual alarm panel', image_key: 'septic-alarm-panel' }),
    ],
  },
  {
    division: 'septic', label: 'Pump System Components', selection_type: 'single',
    description: 'When the permit requires a pump.',
    choices: [
      d('500 gal Pump Tank, 1/2 HP Pump, Simplex Panel', { image_key: 'septic-lpp-pump' }),
      c('Duplex Pumps w/ Alternating Panel', 2400, { description: 'Redundancy for commercial / large homes', image_key: 'septic-alarm-panel' }),
      c('1,000 gal Pump Tank', 800, { description: 'Extra storage during outages', image_key: 'septic-tank-concrete' }),
      c('Wi-Fi / Telemetry Alarm Panel', 600, { description: 'Remote alerts to your phone', image_key: 'septic-alarm-panel' }),
    ],
  },
  {
    division: 'septic', label: 'Septic Site Restoration', selection_type: 'single',
    description: 'Over ~3,000 SF of disturbed area.',
    choices: [
      d('Rough Grade, Straw & Seed', { image_key: 'grading-straw-seed' }),
      c('Hydroseed', 450, { image_key: 'grading-hydroseed' }),
      c('Sod Over Field', 3300, { image_key: 'grading-sod' }),
      c('Tree & Brush Clearing of Field Area', 3000, { image_key: 'grading-clearing-light' }),
    ],
  },
  {
    division: 'septic', label: 'Septic Permits, Design & Testing', selection_type: 'multi',
    choices: [
      c('SCDES Site Evaluation & Permit', 500, { description: '$150 state fee + handling', image_key: 'septic-permit' }),
      c('Engineered / Soil-Scientist Design', 2750, { description: 'Required for mound, ATU and drip systems', image_key: 'septic-soil-eval' }),
      c('Private Soil Evaluation (Pre-Purchase)', 650, { image_key: 'septic-soil-eval' }),
    ],
  },
  {
    division: 'septic', label: 'Existing Septic Work', selection_type: 'single',
    description: 'Standalone repair scopes.',
    choices: [
      d('Partial Drain Field Repair', { description: 'Replace failed trenches only', image_key: 'septic-gravel-trench' }),
      c('Full Drain Field Replacement', 6000, { image_key: 'septic-field-replace' }),
      c('Tank Replacement Only', -500, { image_key: 'septic-tank-concrete' }),
      c('Abandon Old Tank (Pump, Crush, Fill)', -4200, { image_key: 'septic-abandon' }),
      c('Pump-Out & Inspection', -5000, { description: 'Real-estate inspection', image_key: 'septic-pumpout' }),
    ],
  },

  /* ─────────────────────────────── GREASE TRAPS ─────────────────────────────── */
  {
    division: 'grease_traps', label: 'Grease Interceptor Type', selection_type: 'single',
    description: 'SC utilities typically require 1,000 gal minimum for full-service kitchens.',
    choices: [
      c('Indoor Hydromechanical (50–75 GPM)', -7000, { description: 'Under/near sink — small QSR, coffee, bakery where the utility allows', image_key: 'grease-indoor-hgi' }),
      d('1,000 gal Precast Concrete In-Ground', { description: 'Gravity interceptor — the utility standard', image_key: 'grease-precast-concrete' }),
      c('1,500 gal Precast Concrete', 3500, { description: 'Larger seat count or volume', image_key: 'grease-precast-concrete' }),
      c('2,000 gal Precast Concrete', 6000, { description: 'Schools / high-volume kitchens', image_key: 'grease-precast-concrete' }),
      c('Fiberglass / Poly High-Capacity (Schier GB-250/500)', 3500, { description: 'Corrosion-proof, lighter, outdoor-rated', image_key: 'grease-schier-gb' }),
      c('Above-Grade Indoor Large HGI', 2500, { description: 'When exterior placement is impossible', image_key: 'grease-indoor-hgi' }),
    ],
  },
  {
    division: 'grease_traps', label: 'Interceptor Lid & Traffic Rating', selection_type: 'single',
    choices: [
      d('Pedestrian-Rated Lids (Landscape)', { image_key: 'grease-lid-pedestrian' }),
      c('H-20 Traffic-Rated Cast-Iron Lids & Risers', 1400, { description: 'In a parking / drive lane', image_key: 'grease-lid-h20' }),
      c('Bolt-Down Gasketed Lids', 450, { description: 'Odor control', image_key: 'grease-lid-h20' }),
    ],
  },
  {
    division: 'grease_traps', label: 'Interceptor Piping & Site Work', selection_type: 'single',
    choices: [
      d('Kitchen Waste Line ≤ 50 ft', { image_key: 'grease-waste-line' }),
      c('Additional 50 ft Trench & 4" Pipe', 2250, { image_key: 'grease-waste-line' }),
      c('Saw-Cut & Patch Through Slab / Pavement', 2750, { image_key: 'grease-slab-sawcut' }),
      c('Utility Conflict Relocation', 5000, { description: 'Site-dependent allowance', image_key: 'util-trench-open' }),
    ],
  },
  {
    division: 'grease_traps', label: 'FOG Compliance Add-Ons', selection_type: 'multi',
    description: 'Most SC utilities (Charleston Water, ReWa, Columbia) require a sampling port.',
    choices: [
      c('Downstream Sampling Port / Manhole', 1700, { image_key: 'grease-sampling-port' }),
      c('Vented Flow-Control Fitting', 425, { description: 'Required on hydromechanical units', image_key: 'grease-flow-control' }),
      c('Solids Interceptor / Strainer', 650, { image_key: 'grease-solids-strainer' }),
      c('Utility FOG Permit & Inspection Coordination', 550, { image_key: 'septic-permit' }),
      c('Plumbing Permit', 275, { image_key: 'septic-permit' }),
    ],
  },
  {
    division: 'grease_traps', label: 'Fixtures Connected to Trap', selection_type: 'multi',
    description: 'First 3-compartment sink is included; each additional fixture rough-in below.',
    choices: [
      c('Additional 3-Compartment Sink', 900, { image_key: 'grease-3comp-sink' }),
      c('Pre-Rinse / Dish Machine (Indirect w/ Air Gap)', 750, { image_key: 'grease-dish-machine' }),
      c('Floor Drain / Floor Sink', 675, { image_key: 'grease-floor-sink' }),
      c('Mop Sink', 700, { image_key: 'grease-mop-sink' }),
    ],
  },
  {
    division: 'grease_traps', label: 'Existing Grease Trap Work', selection_type: 'single',
    choices: [
      d('Pump & Inspect Existing', { image_key: 'grease-pumpout' }),
      c('Replace Failed Concrete Trap (Same Size)', 10500, { image_key: 'grease-precast-concrete' }),
      c('Abandon in Place', 600, { image_key: 'septic-abandon' }),
    ],
  },

  /* ────────────────────────── GRADING & SITE DEVELOPMENT ────────────────────────── */
  {
    division: 'grading', label: 'Land Clearing Level', selection_type: 'single',
    description: 'Per acre.',
    choices: [
      c('Grubbing & Stumps Only (Already Cut)', -700, { image_key: 'grading-stump-removal' }),
      d('Light Clearing (Brush, Saplings ≤6")', { image_key: 'grading-clearing-light' }),
      c('Medium Clearing (Hardwoods 6–12")', 2750, { image_key: 'grading-clearing-medium' }),
      c('Heavy Forested Clearing (>12", Stump Removal)', 5500, { image_key: 'grading-clearing-heavy' }),
    ],
  },
  {
    division: 'grading', label: 'Clearing Debris Disposal', selection_type: 'single',
    description: 'Per acre.',
    choices: [
      d('Burn On Site (Permit Allowing)', { image_key: 'grading-burn-pile' }),
      c('Forestry Mulch / Grind On Site', 2250, { image_key: 'grading-forestry-mulcher' }),
      c('Haul Off to Landfill', 4250, { image_key: 'grading-haul-off' }),
      c('Stockpile Logs for Owner', -500, { image_key: 'grading-log-pile' }),
    ],
  },
  {
    division: 'grading', label: 'Grading Scope', selection_type: 'single',
    description: 'Sized for a 1-acre homesite.',
    choices: [
      d('Rough Grade Only', { image_key: 'grading-dozer-rough' }),
      c('Rough + Finish Grade (Laser / GPS)', 4500, { image_key: 'grading-finish-laser' }),
      c('Import Structural Fill (100 CY)', 2600, { image_key: 'grading-fill-dirt' }),
      c('Export Spoils (100 CY)', 1800, { image_key: 'grading-haul-off' }),
    ],
  },
  {
    division: 'grading', label: 'Building Pad', selection_type: 'single',
    description: '2,500 SF pad.',
    choices: [
      d('Pad to ±0.1\', 95% Compaction, Tested', { image_key: 'grading-building-pad' }),
      c('Pad w/ 6" ABC Stone Cap', 3400, { image_key: 'grading-stone-cap' }),
      c('Engineered Fill w/ Geotech Proctor & Density', 2750, { image_key: 'grading-compaction-test' }),
      c('Undercut & Replace Unsuitable Soils', 3500, { description: 'Site-dependent allowance (100 CY)', image_key: 'grading-undercut' }),
    ],
  },
  {
    division: 'grading', label: 'Driveway Surface', selection_type: 'single',
    description: 'Per 200 LF × 12\' wide.',
    choices: [
      d('4" Crusher Run (ABC) Gravel', { image_key: 'grading-gravel-drive' }),
      c('6" ABC w/ Geotextile Fabric', 800, { image_key: 'grading-geotextile' }),
      c('#57 Stone Topping', 600, { image_key: 'grading-57-stone' }),
      c('Compacted Asphalt Millings', 1200, { image_key: 'grading-millings' }),
      c('2" Asphalt Over 6" ABC', 9000, { image_key: 'commercial-asphalt-paving' }),
      c('4" Concrete Driveway', 18000, { image_key: 'concrete-driveway' }),
    ],
  },
  {
    division: 'grading', label: 'Driveway Culvert', selection_type: 'single',
    description: '20 ft pipe with headwalls / rip-rap ends.',
    choices: [
      d('15" HDPE', { image_key: 'grading-culvert-hdpe' }),
      c('18" HDPE', 450, { image_key: 'grading-culvert-hdpe' }),
      c('24" HDPE', 1000, { image_key: 'grading-culvert-hdpe' }),
      c('Concrete Pipe (DOT Encroachment)', 850, { image_key: 'util-rcp-concrete-pipe' }),
      c('Precast Concrete End Sections', 1300, { description: 'Pair of flared ends', image_key: 'grading-culvert-end-section' }),
    ],
  },
  {
    division: 'grading', label: 'Erosion Control Package', selection_type: 'single',
    choices: [
      d('Basic — Silt Fence + Construction Entrance', { image_key: 'grading-silt-fence' }),
      c('County Erosion Plan Package (<1 ac)', 5000, { description: 'Plan + inlet protection + check dams + inspections', image_key: 'grading-inlet-protection' }),
      c('Full NPDES w/ Sediment Basin & Weekly Inspections', 16000, { description: '>1 acre disturbed — SCDES construction permit', image_key: 'grading-sediment-basin' }),
    ],
  },
  {
    division: 'grading', label: 'Retaining Wall Type', selection_type: 'single',
    description: 'Per 200 SF of wall face.',
    choices: [
      c('Timber (6×6 Treated)', -2800, { description: 'Lowest cost, shortest life', image_key: 'grading-wall-timber' }),
      d('Segmental Block ≤4\' (Allan Block / Versa-Lok)', { image_key: 'grading-wall-block' }),
      c('Segmental Block >4\' w/ Geogrid & Engineering', 5500, { image_key: 'grading-wall-block-tall' }),
      c('Big-Block Precast (2×2×4)', 2000, { image_key: 'grading-wall-bigblock' }),
      c('Poured Concrete w/ Veneer', 4500, { image_key: 'grading-wall-poured' }),
      c('Natural Stone / Boulder', 6000, { image_key: 'grading-wall-boulder' }),
    ],
  },
  {
    division: 'grading', label: 'Surface Stabilization', selection_type: 'single',
    description: 'Per 10,000 SF of disturbed ground.',
    choices: [
      d('Straw & Seed', { image_key: 'grading-straw-seed' }),
      c('Hydroseed', 750, { image_key: 'grading-hydroseed' }),
      c('Sod (Bermuda / Zoysia / Fescue)', 10500, { image_key: 'grading-sod' }),
      c('Erosion Matting on Slopes', 2500, { description: 'Per 1,100 SY', image_key: 'grading-erosion-matting' }),
    ],
  },
  {
    division: 'grading', label: 'Site Work Add-Ons', selection_type: 'multi',
    choices: [
      c('Rock Excavation / Hammering', 5000, { description: 'Allowance — ~30 CY', image_key: 'util-rock-hammer' }),
      c('Demolish Small Existing Structure', 9000, { image_key: 'grading-demolition' }),
      c('French Drain / Yard Drain (100 LF)', 3750, { image_key: 'grading-french-drain' }),
      c('Swale / Ditch w/ Rip-Rap (100 LF)', 2250, { image_key: 'grading-riprap-swale' }),
      c('Survey Stakeout / GPS Model', 1800, { image_key: 'grading-survey' }),
      c('Tree Protection Fencing (200 LF)', 800, { image_key: 'grading-tree-protection' }),
    ],
  },

  /* ───────────────────────────── CONCRETE & MASONRY ───────────────────────────── */
  {
    division: 'concrete', label: 'Slab Thickness & Mix', selection_type: 'single',
    description: 'Per 600 SF pour.',
    choices: [
      d('4" 3,000 psi, Fiber Mesh, on 4" Stone', { description: 'Standard driveways, patios, walks', image_key: 'concrete-broom' }),
      c('5" 3,500–4,000 psi (Trucks / RV)', 800, { image_key: 'concrete-driveway' }),
      c('6" 4,000 psi (Commercial / Dumpster Pad)', 1500, { image_key: 'concrete-commercial-slab' }),
      c('Air-Entrained Mix', 225, { description: 'Freeze-thaw durability', image_key: 'concrete-pour' }),
    ],
  },
  {
    division: 'concrete', label: 'Concrete Reinforcement', selection_type: 'single',
    description: 'Per 600 SF.',
    choices: [
      d('Fiber Mesh', { image_key: 'concrete-fiber-mesh' }),
      c('6×6 Welded Wire Mesh', 330, { image_key: 'concrete-wire-mesh' }),
      c('#3 Rebar @ 18" Grid', 700, { image_key: 'concrete-rebar-grid' }),
      c('#4 Rebar @ 12" Grid', 1200, { image_key: 'concrete-rebar-grid' }),
      c('Fiber + Rebar Combined', 825, { image_key: 'concrete-rebar-grid' }),
    ],
  },
  {
    division: 'concrete', label: 'Concrete Finish', selection_type: 'single',
    description: 'Per 400 SF patio / driveway.',
    choices: [
      d('Broom Finish', { description: 'Classic non-slip texture', image_key: 'concrete-broom' }),
      c('Smooth Trowel (Interior / Garage)', 200, { image_key: 'concrete-trowel-smooth' }),
      c('Salt Finish', 600, { image_key: 'concrete-salt-finish' }),
      c('Exposed Aggregate', 1800, { image_key: 'concrete-exposed-aggregate' }),
      c('Stamped — 1 Pattern, 1 Color', 4400, { image_key: 'concrete-stamped' }),
      c('Stamped w/ Borders, 2+ Colors', 6000, { image_key: 'concrete-stamped-border' }),
    ],
  },
  {
    division: 'concrete', label: 'Concrete Color', selection_type: 'single',
    description: 'Integral color mixed into the concrete, per 400 SF.',
    choices: [
      d('Natural Gray', { image_key: 'concrete-broom' }),
      c('Integral Color — Earth Tone (Tan / Sandstone)', 900, { image_key: 'concrete-color-tan' }),
      c('Integral Color — Charcoal / Slate', 900, { image_key: 'concrete-color-charcoal' }),
      c('Integral Color — Terra Cotta / Brick Red', 900, { image_key: 'concrete-color-red' }),
    ],
  },
  {
    division: 'concrete', label: 'Edge & Joint Details', selection_type: 'multi',
    description: 'Per 400 SF / ~80 LF of edge.',
    choices: [
      c('Hand-Tooled Joints', 100, { image_key: 'concrete-tooled-joint' }),
      c('Decorative Border Band', 900, { description: 'Stamped or colored border', image_key: 'concrete-stamped-border' }),
      c('Thickened Edge / Turn-Down Footing', 1300, { image_key: 'concrete-turndown-edge' }),
      c('Expansion Joints w/ Sealant', 350, { image_key: 'concrete-expansion-joint' }),
    ],
  },
  {
    division: 'concrete', label: 'Concrete Sealer', selection_type: 'single',
    description: 'Per 400 SF.',
    choices: [
      d('None', { image_key: 'concrete-broom' }),
      c('Cure & Seal Acrylic', 300, { image_key: 'concrete-sealer' }),
      c('Penetrating Silane / Siloxane', 450, { image_key: 'concrete-sealer' }),
      c('High-Gloss Decorative Sealer (Stamped)', 600, { image_key: 'concrete-sealer-gloss' }),
    ],
  },
  {
    division: 'concrete', label: 'Demolition & Subgrade', selection_type: 'single',
    description: 'Per 400 SF.',
    choices: [
      d('New Pour on Prepared Grade', { image_key: 'concrete-forms-prep' }),
      c('Remove & Haul Existing 4" Concrete', 1500, { image_key: 'concrete-demo' }),
      c('Remove Existing Asphalt', 900, { image_key: 'concrete-asphalt-removal' }),
      c('Add 4" Stone Base Over Poor Subgrade', 550, { image_key: 'grading-stone-cap' }),
      c('Vapor Barrier (Interior Slabs)', 120, { image_key: 'concrete-vapor-barrier' }),
    ],
  },
  {
    division: 'concrete', label: 'Footing Size', selection_type: 'single',
    description: 'Per 150 LF of continuous footing.',
    choices: [
      d('16"×8" w/ 2-#4 (1-Story)', { image_key: 'concrete-footing' }),
      c('20"×10" w/ 3-#4 (2-Story / Brick Veneer)', 1700, { image_key: 'concrete-footing' }),
      c('24"×12" w/ 3-#5', 3000, { image_key: 'concrete-footing' }),
    ],
  },
  {
    division: 'concrete', label: 'Wall & Veneer Type', selection_type: 'single',
    description: 'Per 300 SF of wall face.',
    choices: [
      d('8" CMU, Grouted & Reinforced', { description: 'Foundations / retaining', image_key: 'masonry-cmu' }),
      c('Split-Face CMU', 1800, { image_key: 'masonry-splitface' }),
      c('Stucco (3-Coat)', -3000, { image_key: 'masonry-stucco' }),
      c('Thin Brick Adhered', -1800, { image_key: 'masonry-thin-brick' }),
      c('Brick Veneer (Modular)', -300, { image_key: 'masonry-brick-veneer' }),
      c('Manufactured Stone Veneer', 600, { image_key: 'masonry-stone-veneer' }),
      c('Natural Thin-Stone Veneer', 5400, { image_key: 'masonry-natural-stone' }),
    ],
  },
  {
    division: 'concrete', label: 'Brick Color', selection_type: 'single',
    description: 'Common modular brick blends.',
    choices: [
      d('Classic Red', { image_key: 'masonry-brick-red' }),
      c('Brown / Tan Blend', 0, { image_key: 'masonry-brick-brown' }),
      c('Gray / Charcoal', 300, { image_key: 'masonry-brick-gray' }),
      c('White / Painted Look', 450, { image_key: 'masonry-brick-white' }),
      c('Tumbled / Reclaimed Look', 900, { image_key: 'masonry-brick-tumbled' }),
    ],
  },
  {
    division: 'concrete', label: 'Masonry Add-Ons', selection_type: 'multi',
    choices: [
      c('Brick Rowlock Sills / Soldier Course (50 LF)', 1200, { image_key: 'masonry-soldier-course' }),
      c('Cast-Stone Wall / Column Caps (30 LF)', 1950, { image_key: 'masonry-cast-stone-cap' }),
      c('Brick or Stone Column 24"×24"', 2600, { image_key: 'masonry-column' }),
      c('Below-Grade Foundation Waterproofing (300 SF)', 900, { image_key: 'masonry-waterproofing' }),
      c('Weep & Flashing System (100 LF)', 300, { image_key: 'masonry-brick-veneer' }),
    ],
  },

  /* ──────────────────────────────── ROOFING ──────────────────────────────── */
  {
    division: 'roofing', label: 'Roofing Material', selection_type: 'single',
    description: '25-square roof, tear-off of 1 layer included.',
    choices: [
      c('3-Tab Asphalt (25-yr)', -2250, { image_key: 'roof-3tab' }),
      d('Architectural Shingle (GAF HDZ / OC Duration)', { description: 'Dimensional shingle — the standard', image_key: 'roof-architectural' }),
      c('Impact-Resistant Class 4 Shingle', 2250, { description: 'Possible insurance discount', image_key: 'roof-impact-resistant' }),
      c('Designer / Luxury Shingle', 8750, { description: 'GAF Grand Canyon, CertainTeed Presidential', image_key: 'roof-designer' }),
      c('Exposed-Fastener Metal 26ga', 7500, { image_key: 'roof-metal-exposed' }),
      c('Standing Seam 26ga (SMP Paint)', 19500, { image_key: 'roof-standing-seam' }),
      c('Standing Seam 24ga (Kynar / PVDF)', 27500, { description: 'Premium paint, longest color life', image_key: 'roof-standing-seam' }),
    ],
  },
  {
    division: 'roofing', label: 'Shingle Color', selection_type: 'single',
    description: 'Most popular architectural shingle colors — same price.',
    choices: [
      d('Charcoal', { image_key: 'roof-shingle-charcoal' }),
      c('Weathered Wood', 0, { image_key: 'roof-shingle-weathered-wood' }),
      c('Pewter Gray', 0, { image_key: 'roof-shingle-pewter' }),
      c('Slate / Blue-Gray', 0, { image_key: 'roof-shingle-slate' }),
      c('Hickory / Brown', 0, { image_key: 'roof-shingle-brown' }),
      c('Black', 0, { image_key: 'roof-shingle-black' }),
    ],
  },
  {
    division: 'roofing', label: 'Metal Roof Color', selection_type: 'single',
    description: 'Standard standing-seam colors — same price.',
    choices: [
      d('Charcoal Gray', { image_key: 'roof-metal-charcoal' }),
      c('Matte Black', 0, { image_key: 'roof-metal-black' }),
      c('Galvalume (Bare Silver)', -750, { image_key: 'roof-metal-galvalume' }),
      c('Burnished Slate / Bronze', 0, { image_key: 'roof-metal-bronze' }),
      c('Barn Red', 0, { image_key: 'roof-metal-red' }),
      c('Forest Green', 0, { image_key: 'roof-metal-green' }),
      c('White', 0, { image_key: 'roof-metal-white' }),
    ],
  },
  {
    division: 'roofing', label: 'Underlayment', selection_type: 'single',
    description: '25 squares.',
    choices: [
      c('#15 Felt', -375, { image_key: 'roof-felt' }),
      d('Synthetic Underlayment', { image_key: 'roof-synthetic-underlayment' }),
      c('Premium Breathable Synthetic', 550, { image_key: 'roof-synthetic-underlayment' }),
      c('Full Ice & Water Shield (Whole Roof)', 2900, { image_key: 'roof-ice-water' }),
      c('High-Temp Ice & Water (Under Metal)', 3500, { image_key: 'roof-ice-water' }),
    ],
  },
  {
    division: 'roofing', label: 'Ice & Water Locations', selection_type: 'multi',
    description: 'Valleys and penetrations are always included.',
    choices: [
      c('Eaves (36")', 650, { description: '~160 LF', image_key: 'roof-ice-water' }),
      c('Rakes', 400, { image_key: 'roof-ice-water' }),
      c('Low-Slope Sections Full Coverage', 700, { description: '<4:12 areas', image_key: 'roof-low-slope' }),
    ],
  },
  {
    division: 'roofing', label: 'Attic Ventilation', selection_type: 'single',
    choices: [
      d('Reuse Existing Vents', { image_key: 'roof-box-vent' }),
      c('Ridge Vent (Full Ridge)', 700, { image_key: 'roof-ridge-vent' }),
      c('Ridge Vent + New Soffit Vents', 1100, { image_key: 'roof-soffit-vent' }),
      c('Solar Attic Fan', 900, { image_key: 'roof-solar-fan' }),
      c('Powered Attic Fan w/ Thermostat', 675, { image_key: 'roof-power-vent' }),
      c('Turbine Vents (2)', 450, { image_key: 'roof-turbine' }),
    ],
  },
  {
    division: 'roofing', label: 'Flashing & Accessories', selection_type: 'multi',
    choices: [
      c('Lifetime Pipe Boots', 200, { description: 'Replaces standard neoprene on ~3 penetrations', image_key: 'roof-pipe-boot' }),
      c('New Step & Counter Flashing at Chimney / Walls', 825, { description: '~30 LF', image_key: 'roof-step-flashing' }),
      c('Chimney Cricket', 575, { image_key: 'roof-chimney-cricket' }),
      c('Skylight Flashing Kit', 450, { image_key: 'roof-skylight' }),
      c('Replace Skylight', 2000, { image_key: 'roof-skylight' }),
      c('Manufacturer High-Profile Hip & Ridge Cap', 600, { image_key: 'roof-ridge-cap' }),
    ],
  },
  {
    division: 'roofing', label: 'Roof Decking', selection_type: 'single',
    choices: [
      d('Re-Nail Existing, Replace Up to 2 Sheets', { image_key: 'roof-decking-osb' }),
      c('Replace 10 Sheets 7/16" OSB', 925, { image_key: 'roof-decking-osb' }),
      c('Full Re-Deck (25 sq)', 6500, { image_key: 'roof-decking-osb' }),
      c('Overlay Plank Decking (Older Homes)', 7200, { image_key: 'roof-decking-plank' }),
    ],
  },
  {
    division: 'roofing', label: 'Tear-Off Layers', selection_type: 'single',
    choices: [
      d('1 Layer', { image_key: 'roof-tearoff' }),
      c('2 Layers', 2500, { image_key: 'roof-tearoff' }),
      c('3+ Layers', 5000, { image_key: 'roof-tearoff' }),
    ],
  },
  {
    division: 'roofing', label: 'Roof Warranty Tier', selection_type: 'single',
    choices: [
      d('Manufacturer Standard Limited', { image_key: 'roof-architectural' }),
      c('GAF System Plus (50-yr Materials)', 225, { image_key: 'roof-warranty' }),
      c('GAF Silver Pledge', 375, { image_key: 'roof-warranty' }),
      c('GAF Golden Pledge (25-yr Workmanship)', 500, { image_key: 'roof-warranty' }),
    ],
  },
  {
    division: 'roofing', label: 'Gutters', selection_type: 'single',
    description: 'Per 160 LF, seamless aluminum.',
    choices: [
      d('None / Reuse Existing', { image_key: 'roof-gutter-existing' }),
      c('5" K-Style Seamless', 1600, { image_key: 'roof-gutter-k-style' }),
      c('6" K-Style Seamless (3×4 Downspouts)', 2000, { image_key: 'roof-gutter-k-style' }),
      c('Half-Round Aluminum', 3700, { image_key: 'roof-gutter-half-round' }),
      c('Copper Half-Round', 8400, { image_key: 'roof-gutter-copper' }),
    ],
  },
  {
    division: 'roofing', label: 'Gutter Add-Ons', selection_type: 'multi',
    description: 'Per 160 LF of gutter.',
    choices: [
      c('Micro-Mesh Gutter Guards', 3600, { image_key: 'roof-gutter-guard-mesh' }),
      c('Perforated Aluminum Guards', 1450, { image_key: 'roof-gutter-guard-perf' }),
      c('Downspout Extensions / Splash Blocks', 175, { image_key: 'roof-splash-block' }),
      c('Underground Downspout Drains to Pop-Up (100 LF)', 2250, { image_key: 'roof-downspout-drain' }),
      c('Aluminum Fascia Wrap', 1300, { image_key: 'roof-fascia-wrap' }),
      c('Fascia Board Replacement (PVC)', 2100, { image_key: 'roof-fascia-wrap' }),
    ],
  },

  /* ─────────────────────────────── ELECTRICAL ─────────────────────────────── */
  {
    division: 'electrical', label: 'Electrical Service Upgrade', selection_type: 'single',
    choices: [
      d('200A Panel Replacement (Same Location)', { image_key: 'elec-panel-200a' }),
      c('200A w/ New Meter Base, Mast & SE Cable', 1300, { image_key: 'elec-meter-base' }),
      c('200A Panel Relocated', 2100, { image_key: 'elec-panel-200a' }),
      c('400A Service (Two 200A Panels)', 5000, { image_key: 'elec-panel-400a' }),
      c('100A Subpanel (Garage / Shop / Addition)', -1500, { image_key: 'elec-subpanel' }),
    ],
  },
  {
    division: 'electrical', label: 'Panel Brand & Grade', selection_type: 'single',
    choices: [
      d('Square D Homeline / Eaton BR', { image_key: 'elec-panel-200a' }),
      c('Square D QO / Eaton CH', 375, { description: 'Commercial-grade breakers', image_key: 'elec-panel-qo' }),
      c('Leviton Smart Load Center', 1150, { image_key: 'elec-panel-smart' }),
      c('Span Smart Panel', 4500, { description: 'App-controlled circuits, solar/battery ready', image_key: 'elec-panel-span' }),
    ],
  },
  {
    division: 'electrical', label: 'Panel Add-Ons', selection_type: 'multi',
    choices: [
      c('Whole-House Surge Protector', 450, { image_key: 'elec-surge-protector' }),
      c('AFCI / GFCI Breakers (Code Set of 8)', 500, { image_key: 'elec-afci-breaker' }),
      c('Generator Interlock Kit + 50A Inlet', 1050, { image_key: 'elec-interlock-inlet' }),
      c('Manual Transfer Switch (10-Circuit)', 1400, { image_key: 'elec-transfer-switch' }),
      c('Grounding Electrode Upgrade', 375, { description: 'Two rods + water bond', image_key: 'elec-ground-rod' }),
    ],
  },
  {
    division: 'electrical', label: 'EV Charger', selection_type: 'single',
    description: '≤25 ft from panel.',
    choices: [
      d('NEMA 14-50 Outlet on 50A Circuit', { image_key: 'elec-nema-1450' }),
      c('Hardwired 48A Level 2 Charger', 750, { description: 'Tesla Wall Connector / ChargePoint / Emporia', image_key: 'elec-ev-charger' }),
      c('Charger + Load Management (Full Panel)', 1400, { image_key: 'elec-ev-charger' }),
      c('Outdoor Pedestal-Mount Charger', 1350, { image_key: 'elec-ev-pedestal' }),
    ],
  },
  {
    division: 'electrical', label: 'Standby Generator Size', selection_type: 'single',
    description: 'Air-cooled, includes ATS, pad and ≤20 ft gas/electric runs.',
    choices: [
      c('14 kW (Essentials)', -2500, { image_key: 'elec-generator-standby' }),
      c('18 kW', -1250, { image_key: 'elec-generator-standby' }),
      d('22–24 kW (Whole House ≤3,000 SF)', { image_key: 'elec-generator-standby' }),
      c('26 kW', 1500, { image_key: 'elec-generator-standby' }),
      c('30–38 kW Liquid-Cooled', 11500, { image_key: 'elec-generator-liquid' }),
      c('Portable Generator Package (Interlock + Inlet + 9 kW)', -9000, { image_key: 'elec-generator-portable' }),
    ],
  },
  {
    division: 'electrical', label: 'Generator Options', selection_type: 'multi',
    choices: [
      c('Kohler Instead of Generac', 1150, { image_key: 'elec-generator-kohler' }),
      c('Poured Concrete Pad', 525, { image_key: 'elec-generator-pad' }),
      c('250 gal Above-Ground Propane Tank', 2400, { image_key: 'elec-propane-tank' }),
      c('500 gal Buried Propane Tank', 4750, { image_key: 'elec-propane-buried' }),
      c('Gas Line Extension (50 LF Beyond 20\')', 1750, { image_key: 'plumb-gas-line' }),
      c('Cold-Weather Kit', 325, { image_key: 'elec-generator-standby' }),
      c('10-Year Extended Warranty', 900, { image_key: 'elec-generator-standby' }),
    ],
  },
  {
    division: 'electrical', label: 'Recessed Lighting', selection_type: 'single',
    description: 'Per 10 fixtures.',
    choices: [
      d('6" LED Wafer / Canless (Retrofit)', { image_key: 'elec-recessed-led' }),
      c('4" LED Wafer', -175, { image_key: 'elec-recessed-4in' }),
      c('Selectable-CCT Dimmable Premium', 300, { image_key: 'elec-recessed-led' }),
      c('Add Lutron Dimmers (2)', 250, { image_key: 'elec-dimmer' }),
    ],
  },
  {
    division: 'electrical', label: 'Smart Home Package', selection_type: 'multi',
    choices: [
      c('Smart Switches / Dimmers (6)', 1000, { description: 'Lutron Caseta', image_key: 'elec-smart-switch' }),
      c('Smart Thermostat', 350, { image_key: 'elec-smart-thermostat' }),
      c('Wired Video Doorbell', 350, { image_key: 'elec-video-doorbell' }),
      c('Smart Lock', 375, { image_key: 'elec-smart-lock' }),
      c('Cat6 Data Drops (4)', 900, { image_key: 'elec-cat6' }),
      c('Wired Wi-Fi Access Points (2)', 750, { image_key: 'elec-wifi-ap' }),
      c('Leak Sensors + Auto Shutoff Valve', 850, { image_key: 'elec-leak-shutoff' }),
      c('Under-Cabinet LED Strip (20 LF)', 700, { image_key: 'elec-undercabinet' }),
    ],
  },
  {
    division: 'electrical', label: 'Circuits & Outlets', selection_type: 'multi',
    choices: [
      c('Dedicated 20A Circuit', 375, { image_key: 'elec-outlet' }),
      c('30A Dryer / 50A Range Circuit', 600, { image_key: 'elec-range-outlet' }),
      c('50A RV Outlet (Weatherproof)', 900, { image_key: 'elec-rv-outlet' }),
      c('Hot Tub 50A GFCI Disconnect & Feed', 1350, { image_key: 'elec-hot-tub' }),
      c('Mini-Split 240V Disconnect & Circuit', 700, { image_key: 'elec-minisplit' }),
      c('Exterior GFCI Receptacle', 275, { image_key: 'elec-exterior-gfci' }),
      c('Ceiling Fan (Fan-Rated Box)', 250, { image_key: 'elec-ceiling-fan' }),
      c('Exterior Flood / Security Lights (2)', 650, { image_key: 'elec-flood-light' }),
      c('Low-Voltage Landscape Lighting (8 Fixtures)', 1800, { image_key: 'elec-landscape-light' }),
    ],
  },

  /* ──────────────────────────────── PLUMBING ──────────────────────────────── */
  {
    division: 'plumbing', label: 'Water Heater Type', selection_type: 'single',
    description: 'Replace in place, like-for-like connections.',
    choices: [
      c('50 gal Electric Tank', -350, { image_key: 'plumb-wh-electric' }),
      d('50 gal Gas Tank (Atmospheric)', { image_key: 'plumb-wh-gas' }),
      c('50 gal Gas Power-Vent', 900, { image_key: 'plumb-wh-powervent' }),
      c('80 gal Electric Tank', 700, { image_key: 'plumb-wh-electric' }),
      c('Heat Pump / Hybrid 50–65 gal', 2150, { description: '30% federal credit may apply', image_key: 'plumb-wh-heatpump' }),
      c('Gas Tankless Condensing (199k BTU)', 3500, { description: 'Rinnai / Navien — includes venting & condensate', image_key: 'plumb-wh-tankless' }),
      c('Electric Tankless Whole-House', 1850, { description: 'Needs 120–150A of panel capacity', image_key: 'plumb-wh-tankless-electric' }),
    ],
  },
  {
    division: 'plumbing', label: 'Water Heater Add-Ons', selection_type: 'multi',
    choices: [
      c('Expansion Tank', 250, { description: 'Code-required with a PRV', image_key: 'plumb-expansion-tank' }),
      c('Drain Pan w/ Drain Line', 175, { image_key: 'plumb-drain-pan' }),
      c('Strap & Stand (Garage)', 140, { image_key: 'plumb-wh-stand' }),
      c('Recirculation Pump w/ Timer', 850, { description: 'Instant hot water at far fixtures', image_key: 'plumb-recirc-pump' }),
      c('Gas Line Upsizing for Tankless', 800, { image_key: 'plumb-gas-line' }),
      c('12-Year Warranty Model', 275, { image_key: 'plumb-wh-gas' }),
    ],
  },
  {
    division: 'plumbing', label: 'Repipe Material', selection_type: 'single',
    description: 'Whole house, 2–2.5 bath, accessible crawl / attic. Drywall repair excluded.',
    choices: [
      c('CPVC', -1150, { description: 'Lowest cost — not recommended', image_key: 'plumb-cpvc' }),
      c('PEX-B Crimp w/ Branch & Tee', -850, { image_key: 'plumb-pex' }),
      d('PEX-A (Uponor) w/ Manifold', { image_key: 'plumb-pex-manifold' }),
      c('Copper Type L', 6000, { image_key: 'plumb-copper' }),
    ],
  },
  {
    division: 'plumbing', label: 'Repipe Add-Ons', selection_type: 'multi',
    choices: [
      c('Central Manifold w/ Individual Shutoffs', 900, { image_key: 'plumb-pex-manifold' }),
      c('Drywall Patch & Paint', 2750, { image_key: 'repair-drywall-patch' }),
    ],
  },
  {
    division: 'plumbing', label: 'Fixture Grade', selection_type: 'single',
    description: 'Per bathroom (toilet, faucet, shower valve) — supply and install.',
    choices: [
      d('Builder Grade (Moen Adler / Glacier Bay / Kohler Wellworth)', { image_key: 'plumb-fixture-builder' }),
      c('Mid-Grade (Moen Arbor / Delta Leland / Toto Drake)', 800, { image_key: 'plumb-fixture-mid' }),
      c('Premium (Kohler / Brizo / Grohe, Comfort Height)', 2500, { image_key: 'plumb-fixture-premium' }),
      c('Owner-Supplied Fixtures (Labor Only)', -900, { image_key: 'plumb-fixture-builder' }),
    ],
  },
  {
    division: 'plumbing', label: 'Faucet Finish', selection_type: 'single',
    choices: [
      d('Chrome', { image_key: 'plumb-faucet-chrome' }),
      c('Brushed Nickel', 60, { image_key: 'plumb-faucet-nickel' }),
      c('Matte Black', 90, { image_key: 'plumb-faucet-black' }),
      c('Oil-Rubbed Bronze', 90, { image_key: 'plumb-faucet-bronze' }),
      c('Brushed Gold / Champagne Bronze', 150, { image_key: 'plumb-faucet-gold' }),
    ],
  },
  {
    division: 'plumbing', label: 'Water Treatment', selection_type: 'single',
    choices: [
      c('Sediment Pre-Filter Only', -1950, { image_key: 'plumb-sediment-filter' }),
      d('Water Softener 48k Metered', { image_key: 'plumb-softener' }),
      c('Softener + Whole-House Carbon Filter', 1300, { image_key: 'plumb-carbon-filter' }),
      c('Iron / Sulfur Air-Injection Filter (Well)', 2150, { image_key: 'plumb-iron-filter' }),
      c('Salt-Free Conditioner', 300, { image_key: 'plumb-softener' }),
    ],
  },
  {
    division: 'plumbing', label: 'Water Treatment Add-Ons', selection_type: 'multi',
    choices: [
      c('UV Disinfection (Well)', 1050, { image_key: 'plumb-uv' }),
      c('Reverse-Osmosis Under-Sink', 675, { image_key: 'plumb-ro' }),
    ],
  },
  {
    division: 'plumbing', label: 'Well Water Supply', selection_type: 'multi',
    choices: [
      c('Pressure Tank Replacement (86 gal)', 1250, { image_key: 'plumb-pressure-tank' }),
      c('Constant-Pressure VFD Controller', 2150, { image_key: 'plumb-vfd' }),
      c('Submersible Pump Replacement (≤200\')', 3500, { image_key: 'plumb-well-pump' }),
      c('Well-to-House Line (100 LF 1" Poly)', 1400, { image_key: 'util-service-line' }),
    ],
  },
  {
    division: 'plumbing', label: 'Plumbing Service Add-Ons', selection_type: 'multi',
    choices: [
      c('Pressure Reducing Valve', 525, { image_key: 'plumb-prv' }),
      c('Main Shutoff Ball Valve', 375, { image_key: 'plumb-shutoff' }),
      c('Frost-Free Hose Bib', 325, { image_key: 'plumb-hose-bib' }),
      c('Sump Pump w/ Check & Discharge', 1300, { image_key: 'plumb-sump-pump' }),
      c('Two-Way Sewer Cleanout', 1400, { image_key: 'plumb-cleanout' }),
      c('Gas Line Appliance Drop', 850, { image_key: 'plumb-gas-line' }),
      c('Drain Camera Inspection', 350, { image_key: 'util-cctv-sewer' }),
      c('Hydro-Jetting', 650, { image_key: 'plumb-hydrojet' }),
      c('Garbage Disposal (3/4 HP)', 500, { image_key: 'plumb-disposal' }),
    ],
  },

  /* ─────────────────────────── REPAIRS / HANDYMAN ─────────────────────────── */
  {
    division: 'repairs', label: 'Deck Decking Material', selection_type: 'single',
    description: 'Per 300 SF deck surface, treated frame standard.',
    choices: [
      d('Pressure-Treated 5/4×6', { image_key: 'deck-pt-wood' }),
      c('Premium Treated (KDAT #1 Grade)', 900, { image_key: 'deck-pt-wood' }),
      c('Composite Entry (Trex Enhance Basics)', 3300, { image_key: 'deck-composite-entry' }),
      c('Composite Mid (Trex Select / TimberTech Edge)', 4500, { image_key: 'deck-composite-mid' }),
      c('Composite Premium (Trex Transcend / TimberTech Pro)', 6900, { image_key: 'deck-composite-premium' }),
      c('PVC (Azek / TimberTech Advanced)', 8100, { image_key: 'deck-pvc' }),
      c('Hardwood (Ipe / Cumaru)', 8250, { image_key: 'deck-ipe' }),
    ],
  },
  {
    division: 'repairs', label: 'Composite Deck Color', selection_type: 'single',
    description: 'Popular composite board colors — same price.',
    choices: [
      d('Saddle / Warm Brown', { image_key: 'deck-color-brown' }),
      c('Gray / Clam Shell', 0, { image_key: 'deck-color-gray' }),
      c('Dark Walnut / Spiced Rum', 0, { image_key: 'deck-color-dark' }),
      c('Coastal / Driftwood', 0, { image_key: 'deck-color-driftwood' }),
    ],
  },
  {
    division: 'repairs', label: 'Deck Railing', selection_type: 'single',
    description: 'Per 60 LF.',
    choices: [
      d('Treated Wood w/ 2×2 Balusters', { image_key: 'deck-rail-wood' }),
      c('Treated Wood w/ Aluminum Balusters', 900, { image_key: 'deck-rail-alum-baluster' }),
      c('Composite Railing', 3600, { image_key: 'deck-rail-composite' }),
      c('Aluminum Railing (Westbury / Fortress)', 4000, { image_key: 'deck-rail-aluminum' }),
      c('Cable Railing', 6900, { image_key: 'deck-rail-cable' }),
      c('Glass Panel Railing', 10200, { image_key: 'deck-rail-glass' }),
    ],
  },
  {
    division: 'repairs', label: 'Deck Framing Upgrades', selection_type: 'multi',
    description: 'Per 300 SF deck.',
    choices: [
      c('Helical / Screw Piles Instead of Concrete (6)', 1350, { image_key: 'deck-helical-pile' }),
      c('Joist Tape (Trex Protect)', 600, { image_key: 'deck-joist-tape' }),
      c('12" O.C. Joists (for Composite)', 750, { image_key: 'deck-framing' }),
      c('Under-Deck Drainage System', 4200, { image_key: 'deck-underdeck-drain' }),
      c('Hidden Fasteners (Composite)', 675, { image_key: 'deck-hidden-fastener' }),
    ],
  },
  {
    division: 'repairs', label: 'Deck Add-Ons', selection_type: 'multi',
    choices: [
      c('Stairs (5 Steps, 4\' Wide)', 1100, { image_key: 'deck-stairs' }),
      c('Deck Lighting Package (8 Fixtures)', 800, { image_key: 'deck-lighting' }),
      c('Privacy Screen (12 LF)', 1100, { image_key: 'deck-privacy-screen' }),
      c('Pergola (12×12)', 7500, { image_key: 'deck-pergola' }),
      c('Covered Roof Over Deck (12×16)', 21000, { image_key: 'deck-covered-roof' }),
      c('Screened Enclosure (12×16)', 4300, { image_key: 'deck-screened' }),
      c('Stain & Seal (New Treated Wood)', 900, { image_key: 'deck-stain' }),
      c('Demo & Haul Existing Deck', 2500, { image_key: 'deck-demo' }),
    ],
  },
  {
    division: 'repairs', label: 'Fence Type', selection_type: 'single',
    description: 'Per 150 LF, 6\' tall unless noted. Gates priced separately.',
    choices: [
      c('Field / Horse Wire w/ T-Posts', -2800, { image_key: 'fence-field-wire' }),
      c('4\' Chain Link Galvanized', -2100, { image_key: 'fence-chain-link' }),
      c('6\' Chain Link Galvanized', -1100, { image_key: 'fence-chain-link-6' }),
      c('3-Rail Farm / Ranch Wood', -1100, { image_key: 'fence-ranch-rail' }),
      c('4\' Wood Picket', -1700, { image_key: 'fence-wood-picket' }),
      d('6\' Treated Pine Privacy (Dog-Ear)', { image_key: 'fence-wood-privacy' }),
      c('6\' Board-on-Board / Shadowbox', 1350, { image_key: 'fence-shadowbox' }),
      c('6\' Cedar Privacy', 2100, { image_key: 'fence-cedar' }),
      c('4\' Vinyl Picket', 600, { image_key: 'fence-vinyl-picket' }),
      c('6\' Vinyl Privacy', 2800, { image_key: 'fence-vinyl-privacy' }),
      c('4\' Aluminum Ornamental', 1700, { image_key: 'fence-aluminum' }),
      c('6\' Aluminum Commercial Grade', 4100, { image_key: 'fence-aluminum-6' }),
    ],
  },
  {
    division: 'repairs', label: 'Fence Post & Hardware Options', selection_type: 'multi',
    description: 'Per 150 LF.',
    choices: [
      c('Black Vinyl-Coated Chain Link', 675, { image_key: 'fence-chain-link-black' }),
      c('Steel Posts (Postmaster) for Wood Fence', 900, { image_key: 'fence-steel-post' }),
      c('6×6 Posts at Corners & Gates (4)', 240, { image_key: 'fence-wood-privacy' }),
      c('Decorative Post Caps (20)', 330, { image_key: 'fence-post-cap' }),
      c('Top Cap & Trim (Privacy)', 675, { image_key: 'fence-top-cap' }),
      c('Stain & Seal New Wood Fence', 675, { image_key: 'fence-stained' }),
      c('Remove & Haul Old Fence', 1050, { image_key: 'fence-removal' }),
    ],
  },
  {
    division: 'repairs', label: 'Gates', selection_type: 'multi',
    choices: [
      c('4\' Walk Gate — Wood', 375, { image_key: 'fence-gate-wood' }),
      c('4\' Walk Gate — Vinyl', 525, { image_key: 'fence-gate-vinyl' }),
      c('4\' Walk Gate — Chain Link', 300, { image_key: 'fence-gate-chainlink' }),
      c('10–12\' Double Drive Gate — Wood / Chain Link', 1100, { image_key: 'fence-gate-double' }),
      c('10–12\' Double Drive Gate — Vinyl / Aluminum', 1850, { image_key: 'fence-gate-double-alum' }),
      c('Self-Closing Hinges & Latch (Pool Code)', 175, { image_key: 'fence-gate-latch' }),
      c('Automatic Gate Operator', 4250, { image_key: 'fence-gate-operator' }),
    ],
  },
  {
    division: 'repairs', label: 'Drywall Repair Scope', selection_type: 'single',
    choices: [
      d('Small Patch ≤1 SF, Texture Match', { image_key: 'repair-drywall-patch' }),
      c('Water-Damage Cut-Out 1–10 SF', 225, { image_key: 'repair-drywall-water' }),
      c('Replace Full Sheet / Ceiling Section', 350, { image_key: 'repair-drywall-sheet' }),
      c('Skim Coat Level 5 (200 SF)', 600, { image_key: 'repair-skim-coat' }),
      c('Popcorn Ceiling Removal & Refinish (300 SF)', 1350, { image_key: 'repair-popcorn' }),
      c('New Drywall Hang/Tape/Finish (500 SF)', 1450, { image_key: 'repair-drywall-new' }),
    ],
  },
  {
    division: 'repairs', label: 'Wall Texture', selection_type: 'single',
    choices: [
      d('Smooth', { image_key: 'repair-texture-smooth' }),
      c('Orange Peel', 300, { image_key: 'repair-texture-orange-peel' }),
      c('Knockdown', 400, { image_key: 'repair-texture-knockdown' }),
    ],
  },
  {
    division: 'repairs', label: 'Interior Paint Scope', selection_type: 'single',
    description: '1,500 SF of floor area, 2 coats.',
    choices: [
      d('Walls Only, 1 Color', { image_key: 'paint-interior-walls' }),
      c('Walls + Ceilings', 1500, { image_key: 'paint-ceiling' }),
      c('Walls + Ceilings + Trim & Doors', 3000, { image_key: 'paint-trim' }),
      c('Kitchen Cabinet Painting (Spray)', 5000, { image_key: 'paint-cabinets' }),
    ],
  },
  {
    division: 'repairs', label: 'Exterior Paint Scope', selection_type: 'single',
    description: '2,000 SF of siding.',
    choices: [
      d('Siding & Trim, 1 Story', { image_key: 'paint-exterior' }),
      c('Siding & Trim, 2 Story', 2000, { image_key: 'paint-exterior-2story' }),
      c('Add Deck / Porch Stain', 900, { image_key: 'deck-stain' }),
    ],
  },
  {
    division: 'repairs', label: 'Paint Grade', selection_type: 'single',
    choices: [
      d('Contractor Grade (SW ProMar / Behr Premium)', { image_key: 'paint-can' }),
      c('Premium (SW Duration / Emerald / Aura)', 650, { description: 'Better washability, fewer coats over time', image_key: 'paint-can-premium' }),
    ],
  },
  {
    division: 'repairs', label: 'Paint Sheen', selection_type: 'single',
    choices: [
      d('Eggshell (Walls)', { image_key: 'paint-sheen-eggshell' }),
      c('Flat / Matte', 0, { image_key: 'paint-sheen-flat' }),
      c('Satin (Kitchens / Baths)', 0, { image_key: 'paint-sheen-satin' }),
      c('Semi-Gloss (Trim)', 0, { image_key: 'paint-sheen-semigloss' }),
    ],
  },
  {
    division: 'repairs', label: 'Interior Door Type', selection_type: 'single',
    description: 'Installed, per door.',
    choices: [
      c('Slab Only (Reuse Frame)', -150, { image_key: 'door-interior-slab' }),
      d('Prehung Hollow-Core 6-Panel', { image_key: 'door-interior-6panel' }),
      c('Prehung Solid-Core', 250, { image_key: 'door-interior-solid' }),
      c('Shaker-Style (2-Panel Flat)', 150, { image_key: 'door-interior-shaker' }),
      c('Pocket Door (New)', 1150, { image_key: 'door-pocket' }),
      c('Barn Door Kit', 650, { image_key: 'door-barn' }),
    ],
  },
  {
    division: 'repairs', label: 'Exterior Door Type', selection_type: 'single',
    description: 'Installed, per door.',
    choices: [
      d('Steel 6-Panel Prehung', { image_key: 'door-exterior-steel' }),
      c('Fiberglass w/ Glass (Smooth / Woodgrain)', 1150, { image_key: 'door-exterior-fiberglass' }),
      c('Wood / Mahogany w/ Sidelights', 4250, { image_key: 'door-exterior-wood' }),
      c('6\' Sliding Patio Door (Vinyl)', 1400, { image_key: 'door-sliding-patio' }),
      c('French Patio Doors', 2200, { image_key: 'door-french' }),
      c('Storm Door (Larson / Andersen)', -550, { image_key: 'door-storm' }),
    ],
  },
  {
    division: 'repairs', label: 'Door Hardware', selection_type: 'single',
    choices: [
      d('Builder Lockset', { image_key: 'door-lockset-builder' }),
      c('Schlage / Kwikset Upgraded Lockset', 120, { image_key: 'door-lockset-upgrade' }),
      c('Smart Lock (Schlage Encode / Yale)', 350, { image_key: 'elec-smart-lock' }),
    ],
  },
  {
    division: 'repairs', label: 'Replacement Window Grade', selection_type: 'single',
    description: 'Per window, insert replacement ~3\'×5\' double-hung.',
    choices: [
      d('Vinyl Double-Pane Low-E (Builder)', { image_key: 'window-vinyl' }),
      c('Vinyl Premium (Andersen 100 / Pella 250)', 350, { image_key: 'window-vinyl-premium' }),
      c('Fiberglass (Marvin Elevate / Pella Impervia)', 700, { image_key: 'window-fiberglass' }),
      c('Wood-Clad (Andersen 400 / Marvin)', 1100, { image_key: 'window-wood-clad' }),
    ],
  },
  {
    division: 'repairs', label: 'Window Options', selection_type: 'multi',
    description: 'Per window.',
    choices: [
      c('Full-Frame Replacement (New Fin, Trim, Flashing)', 375, { image_key: 'window-full-frame' }),
      c('Grids / Grilles', 100, { image_key: 'window-grids' }),
      c('Triple Pane', 250, { image_key: 'window-triple-pane' }),
      c('Tempered Glass (Code Locations)', 140, { image_key: 'window-vinyl' }),
      c('Black Exterior Frame', 140, { image_key: 'window-black' }),
      c('Exterior Aluminum Capping', 110, { image_key: 'window-capping' }),
    ],
  },
  {
    division: 'repairs', label: 'Handyman Extras', selection_type: 'multi',
    choices: [
      c('Crown / Baseboard Trim (100 LF)', 1000, { image_key: 'repair-trim' }),
      c('Closet Shelving System', 750, { image_key: 'repair-closet' }),
      c('TV Wall Mount', 250, { image_key: 'repair-tv-mount' }),
      c('Attic Ladder', 675, { image_key: 'repair-attic-ladder' }),
      c('Pressure Wash House / Deck / Drive', 425, { image_key: 'repair-pressure-wash' }),
      c('Soffit / Fascia Repair (40 LF)', 520, { image_key: 'roof-fascia-wrap' }),
      c('Siding Patch Repair', 600, { image_key: 'repair-siding' }),
      c('Rotten Wood Replacement (Jamb / Sill / Trim)', 525, { image_key: 'repair-rot' }),
      c('Caulk & Seal Exterior', 500, { image_key: 'repair-caulk' }),
      c('Gutter Cleaning', 250, { image_key: 'repair-gutter-clean' }),
    ],
  },

  /* ──────────────────────── RESIDENTIAL CONSTRUCTION ──────────────────────── */
  {
    division: 'residential', label: 'Exterior Siding', selection_type: 'single',
    description: 'Per 2,000 SF of wall.',
    choices: [
      d('Vinyl Lap (.044)', { image_key: 'siding-vinyl' }),
      c('Insulated Vinyl', 6000, { image_key: 'siding-vinyl' }),
      c('LP SmartSide (Engineered Wood)', 6000, { image_key: 'siding-lp-smartside' }),
      c('James Hardie Primed (Painted On Site)', 9500, { image_key: 'siding-hardie' }),
      c('Hardie ColorPlus Prefinished', 13000, { image_key: 'siding-hardie-colorplus' }),
      c('Board & Batten (Hardie / LP)', 14500, { image_key: 'siding-board-batten' }),
      c('Full Brick Veneer', 28000, { image_key: 'masonry-brick-veneer' }),
      c('Cedar Lap / Shake', 18000, { image_key: 'siding-cedar' }),
      c('Stucco', 12000, { image_key: 'masonry-stucco' }),
    ],
  },
  {
    division: 'residential', label: 'Siding Color', selection_type: 'single',
    description: 'Popular Hardie / vinyl colors — same price.',
    choices: [
      d('Arctic White', { image_key: 'siding-color-white' }),
      c('Light Gray / Pearl', 0, { image_key: 'siding-color-light-gray' }),
      c('Iron Gray / Charcoal', 0, { image_key: 'siding-color-charcoal' }),
      c('Navy / Evening Blue', 0, { image_key: 'siding-color-navy' }),
      c('Sage / Mountain Green', 0, { image_key: 'siding-color-green' }),
      c('Khaki / Tan', 0, { image_key: 'siding-color-tan' }),
      c('Black', 0, { image_key: 'siding-color-black' }),
    ],
  },
  {
    division: 'residential', label: 'Exterior Accents', selection_type: 'multi',
    choices: [
      c('Stone Veneer Accent (200 SF)', 3800, { image_key: 'masonry-stone-veneer' }),
      c('Board & Batten Gables', 2400, { image_key: 'siding-board-batten' }),
      c('Shake Accent Gables', 2000, { image_key: 'siding-shake-gable' }),
      c('PVC (Azek) Trim Upgrade', 3000, { image_key: 'siding-pvc-trim' }),
      c('Wrapped / Tapered Porch Columns (4)', 3200, { image_key: 'porch-columns' }),
      c('Decorative Shutters (8)', 1200, { image_key: 'siding-shutters' }),
    ],
  },
  {
    division: 'residential', label: 'New Construction Windows', selection_type: 'single',
    description: 'Per 20 openings.',
    choices: [
      d('Vinyl Low-E Double-Hung', { image_key: 'window-vinyl' }),
      c('Vinyl Premium (Andersen 100 / Pella 250)', 5000, { image_key: 'window-vinyl-premium' }),
      c('Fiberglass (Marvin Elevate / Pella Impervia)', 12000, { image_key: 'window-fiberglass' }),
      c('Wood-Clad (Andersen 400 / Marvin Ultimate)', 20000, { image_key: 'window-wood-clad' }),
    ],
  },
  {
    division: 'residential', label: 'Window Style Options', selection_type: 'multi',
    description: 'Per 20 openings.',
    choices: [
      c('Black Exterior Frames', 2750, { image_key: 'window-black' }),
      c('Casement Instead of Double-Hung', 3500, { image_key: 'window-casement' }),
      c('Simulated Divided-Lite Grilles', 2750, { image_key: 'window-grids' }),
      c('Tempered / Impact Glass', 3500, { image_key: 'window-vinyl' }),
    ],
  },
  {
    division: 'residential', label: 'Flooring', selection_type: 'single',
    description: 'Per 1,500 SF installed.',
    choices: [
      c('Carpet w/ 8-lb Pad', -3300, { image_key: 'floor-carpet' }),
      c('Laminate 12mm', -1100, { image_key: 'floor-laminate' }),
      d('Luxury Vinyl Plank (LVP) 5–6mm', { image_key: 'floor-lvp' }),
      c('Premium LVP 8mm+ (COREtec / Shaw Floorté)', 3400, { image_key: 'floor-lvp-premium' }),
      c('Engineered Hardwood', 6750, { image_key: 'floor-engineered-hardwood' }),
      c('Prefinished Solid Hardwood', 9000, { image_key: 'floor-solid-hardwood' }),
      c('Site-Finished Solid Oak', 10500, { image_key: 'floor-oak-site-finished' }),
      c('Porcelain Tile 12×24', 9000, { image_key: 'floor-tile' }),
      c('Large-Format / Wood-Look Tile', 15750, { image_key: 'floor-tile-wood-look' }),
      c('Polished / Stained Concrete', 2250, { image_key: 'floor-polished-concrete' }),
    ],
  },
  {
    division: 'residential', label: 'Flooring Color', selection_type: 'single',
    description: 'Popular LVP / hardwood tones — same price.',
    choices: [
      d('Natural Oak / Light', { image_key: 'floor-color-natural-oak' }),
      c('Honey / Warm Brown', 0, { image_key: 'floor-color-honey' }),
      c('Gray / Greige', 0, { image_key: 'floor-color-gray' }),
      c('Dark Walnut / Espresso', 0, { image_key: 'floor-color-dark' }),
      c('Whitewashed / Coastal', 0, { image_key: 'floor-color-whitewash' }),
    ],
  },
  {
    division: 'residential', label: 'Stair Treads', selection_type: 'single',
    description: '14-riser staircase.',
    choices: [
      d('Carpeted Stairs', { image_key: 'stairs-carpet' }),
      c('Oak Treads & Painted Risers', 2100, { image_key: 'stairs-oak' }),
      c('Oak Treads w/ Iron Balusters', 4500, { image_key: 'stairs-iron-baluster' }),
    ],
  },
  {
    division: 'residential', label: 'Countertops', selection_type: 'single',
    description: '60 SF kitchen.',
    choices: [
      c('Laminate (Formica / Wilsonart)', -1650, { image_key: 'counter-laminate' }),
      c('Butcher Block', -1050, { image_key: 'counter-butcher-block' }),
      d('Granite Level 1', { image_key: 'counter-granite' }),
      c('Granite Level 2–3', 1500, { image_key: 'counter-granite-premium' }),
      c('Quartz Level 1 (MSI / Viatera)', 1050, { image_key: 'counter-quartz' }),
      c('Quartz Premium (Cambria / Caesarstone)', 2700, { image_key: 'counter-quartz-premium' }),
      c('Quartzite', 3600, { image_key: 'counter-quartzite' }),
      c('Solid Surface (Corian)', 750, { image_key: 'counter-solid-surface' }),
    ],
  },
  {
    division: 'residential', label: 'Countertop Color', selection_type: 'single',
    description: 'Common quartz / granite looks — same price at Level 1.',
    choices: [
      d('White w/ Gray Veining (Calacatta Look)', { image_key: 'counter-color-white-vein' }),
      c('Pure White', 0, { image_key: 'counter-color-white' }),
      c('Light Gray / Concrete Look', 0, { image_key: 'counter-color-gray' }),
      c('Black / Dark Charcoal', 0, { image_key: 'counter-color-black' }),
      c('Speckled Tan / Santa Cecilia', 0, { image_key: 'counter-color-tan' }),
    ],
  },
  {
    division: 'residential', label: 'Countertop Edge', selection_type: 'single',
    description: '~40 LF of exposed edge.',
    choices: [
      d('Eased / Pencil', { image_key: 'counter-edge-eased' }),
      c('Bullnose', 400, { image_key: 'counter-edge-bullnose' }),
      c('Ogee', 640, { image_key: 'counter-edge-ogee' }),
      c('Mitered Waterfall End', 1850, { image_key: 'counter-waterfall' }),
    ],
  },
  {
    division: 'residential', label: 'Cabinet Grade', selection_type: 'single',
    description: '25 LF kitchen.',
    choices: [
      d('Stock (Hampton Bay / RTA Plywood)', { image_key: 'cabinet-stock' }),
      c('Semi-Custom (KraftMaid / Fabuwood / Wolf)', 6900, { image_key: 'cabinet-semi-custom' }),
      c('Custom (Local Shop, Full Overlay)', 17000, { image_key: 'cabinet-custom' }),
    ],
  },
  {
    division: 'residential', label: 'Cabinet Door Style', selection_type: 'single',
    choices: [
      d('Shaker', { image_key: 'cabinet-shaker' }),
      c('Slab / Flat Panel (Modern)', 0, { image_key: 'cabinet-slab' }),
      c('Raised Panel', 700, { image_key: 'cabinet-raised-panel' }),
      c('Inset', 2900, { image_key: 'cabinet-inset' }),
    ],
  },
  {
    division: 'residential', label: 'Cabinet Finish', selection_type: 'single',
    choices: [
      d('Painted White', { image_key: 'cabinet-white' }),
      c('Painted Gray', 0, { image_key: 'cabinet-gray' }),
      c('Painted Navy / Green (Accent)', 250, { image_key: 'cabinet-navy' }),
      c('Stained Natural Oak / Maple', 250, { image_key: 'cabinet-stained-oak' }),
      c('Stained Dark Walnut / Espresso', 250, { image_key: 'cabinet-stained-dark' }),
      c('Two-Tone (Island Accent)', 500, { image_key: 'cabinet-two-tone' }),
    ],
  },
  {
    division: 'residential', label: 'Cabinet Upgrades', selection_type: 'multi',
    choices: [
      c('Soft-Close Doors & Drawers', 900, { image_key: 'cabinet-soft-close' }),
      c('Plywood Box Upgrade', 750, { image_key: 'cabinet-plywood' }),
      c('Crown Molding on Uppers', 550, { image_key: 'cabinet-crown' }),
      c('Kitchen Island (6 LF)', 2500, { image_key: 'cabinet-island' }),
      c('Pull-Outs, Lazy Susan, Trash Pull (3)', 900, { image_key: 'cabinet-pullout' }),
      c('Upgraded Hardware (Pulls / Knobs)', 350, { image_key: 'cabinet-hardware' }),
      c('Under-Cabinet Lighting', 700, { image_key: 'elec-undercabinet' }),
    ],
  },
  {
    division: 'residential', label: 'Garage Door', selection_type: 'single',
    description: '16×7 double door. Opener priced separately.',
    choices: [
      c('Single 9×7 Door', -700, { image_key: 'garage-door-single' }),
      d('Non-Insulated Steel, Short Panel', { image_key: 'garage-door-steel' }),
      c('Insulated Steel R-9 to R-13', 850, { image_key: 'garage-door-insulated' }),
      c('Insulated R-18 Triple-Layer', 1700, { image_key: 'garage-door-insulated' }),
      c('Carriage-House Steel', 2500, { image_key: 'garage-door-carriage' }),
      c('Faux-Wood Composite (Clopay Canyon Ridge)', 5000, { image_key: 'garage-door-faux-wood' }),
      c('Full-View Aluminum & Glass', 5500, { image_key: 'garage-door-glass' }),
    ],
  },
  {
    division: 'residential', label: 'Garage Door Options', selection_type: 'multi',
    choices: [
      c('Windows in Top Section', 350, { image_key: 'garage-door-windows' }),
      c('Belt-Drive Wi-Fi Opener', 225, { image_key: 'garage-opener-belt' }),
      c('Wall-Mount Jackshaft Opener', 550, { image_key: 'garage-opener-jackshaft' }),
      c('Decorative Carriage Hardware', 150, { image_key: 'garage-door-carriage' }),
    ],
  },
  {
    division: 'residential', label: 'Insulation Package', selection_type: 'single',
    description: '~2,200 SF home.',
    choices: [
      d('Fiberglass Batts R-15 Walls, Blown Attic R-38', { image_key: 'insul-batts' }),
      c('Blown Cellulose Attic R-49', 900, { image_key: 'insul-blown' }),
      c('Open-Cell Spray Foam Roof Deck (Encapsulated Attic)', 7000, { image_key: 'insul-spray-foam' }),
      c('Closed-Cell Spray Foam Walls (2")', 6000, { image_key: 'insul-spray-foam' }),
      c('Full Spray-Foam Envelope', 12500, { image_key: 'insul-spray-foam' }),
    ],
  },
  {
    division: 'residential', label: 'Energy & Envelope Upgrades', selection_type: 'multi',
    choices: [
      c('Rigid Foam Exterior Sheathing (R-5)', 4000, { image_key: 'insul-rigid-foam' }),
      c('Sealed / Encapsulated Crawlspace w/ Dehumidifier', 7500, { image_key: 'insul-crawlspace' }),
      c('Radiant-Barrier Roof Sheathing', 1400, { image_key: 'insul-radiant-barrier' }),
      c('Blower-Door Test & Air Sealing', 1200, { image_key: 'insul-blower-door' }),
    ],
  },
  {
    division: 'residential', label: 'Porch & Outdoor Living', selection_type: 'single',
    description: '12×16 (192 SF).',
    choices: [
      d('Covered Front Porch (Slab, Shingle Roof)', { image_key: 'porch-covered' }),
      c('Screened Rear Porch', 8600, { image_key: 'porch-screened' }),
      c('Covered Porch w/ T&G Ceiling & Wrapped Columns', 5800, { image_key: 'porch-tongue-groove' }),
      c('Open Deck Instead of Porch', -6000, { image_key: 'deck-pt-wood' }),
    ],
  },
  {
    division: 'residential', label: 'Outdoor Living Add-Ons', selection_type: 'multi',
    choices: [
      c('Outdoor Kitchen Rough-In (Gas / Water / Electric)', 2500, { image_key: 'porch-outdoor-kitchen' }),
      c('Outdoor Gas Fireplace (Stone Veneer)', 13000, { image_key: 'porch-fireplace' }),
      c('Ceiling Fan & Lighting Package', 1000, { image_key: 'porch-ceiling-fan' }),
      c('Metal Accent Roof on Porch', 3500, { image_key: 'roof-standing-seam' }),
    ],
  },
  {
    division: 'residential', label: 'Interior Trim Package', selection_type: 'single',
    description: '~2,200 SF home.',
    choices: [
      d('Builder — 3-1/4" Base, 2-1/4" Casing, Hollow Doors', { image_key: 'trim-builder' }),
      c('Upgraded — 5-1/4" Base, 3-1/2" Casing, Solid-Core Doors', 6500, { image_key: 'trim-upgraded' }),
      c('Craftsman — Flat Stock Trim, Headers, Solid Doors', 8500, { image_key: 'trim-craftsman' }),
    ],
  },
  {
    division: 'residential', label: 'Interior Feature Upgrades', selection_type: 'multi',
    choices: [
      c('Crown Molding Main Living (150 LF)', 1350, { image_key: 'trim-crown' }),
      c('Coffered / Tray Ceiling', 2750, { image_key: 'trim-coffered' }),
      c('Shiplap Accent Wall (100 SF)', 1300, { image_key: 'trim-shiplap' }),
      c('Wainscoting / Board & Batten Wall (100 SF)', 1300, { image_key: 'trim-wainscot' }),
      c('Fireplace Built-Ins (Pair)', 5500, { image_key: 'trim-builtins' }),
      c('Tile Shower Instead of Fiberglass Unit', 5750, { image_key: 'bath-tile-shower' }),
      c('Freestanding Tub', 2750, { image_key: 'bath-freestanding-tub' }),
      c('Frameless Glass Shower Door', 1500, { image_key: 'bath-frameless-glass' }),
    ],
  },
  {
    division: 'residential', label: 'Mechanical Package', selection_type: 'single',
    choices: [
      d('Standard — 50 gal Electric WH, 14 SEER2 Heat Pump, 200A', { image_key: 'hvac-heat-pump' }),
      c('Tankless Gas Water Heater', 3500, { image_key: 'plumb-wh-tankless' }),
      c('16–18 SEER2 Variable-Speed HVAC', 5000, { image_key: 'hvac-variable-speed' }),
      c('Dual-Fuel / Gas Furnace', 2250, { image_key: 'hvac-furnace' }),
    ],
  },
  {
    division: 'residential', label: 'Mechanical Add-Ons', selection_type: 'multi',
    choices: [
      c('Recessed Lighting Package (20 Cans)', 4000, { image_key: 'elec-recessed-led' }),
      c('Generator-Ready (Inlet + Interlock)', 1050, { image_key: 'elec-interlock-inlet' }),
      c('EV-Ready 50A in Garage', 600, { image_key: 'elec-nema-1450' }),
      c('Whole-House Dehumidifier', 2800, { image_key: 'hvac-dehumidifier' }),
      c('Zoned HVAC (2 Zones)', 3000, { image_key: 'hvac-zoning' }),
    ],
  },

  /* ───────────────────────── COMMERCIAL CONSTRUCTION ───────────────────────── */
  {
    division: 'commercial', label: 'Building Shell Type', selection_type: 'single',
    description: '5,000 SF footprint.',
    choices: [
      d('Pre-Engineered Metal Building (26ga)', { image_key: 'comm-pemb' }),
      c('PEMB w/ 24ga Standing-Seam Roof', 22500, { image_key: 'comm-pemb-standing-seam' }),
      c('PEMB w/ Insulated Metal Panel Walls', 57500, { image_key: 'comm-pemb-imp' }),
      c('PEMB w/ 4\' Masonry Wainscot', 30000, { image_key: 'comm-pemb-wainscot' }),
      c('Wood-Frame w/ Hardie / Brick (Office / Retail)', 87500, { image_key: 'comm-wood-frame' }),
      c('CMU Load-Bearing w/ Steel Joists', 112500, { image_key: 'comm-cmu' }),
      c('Tilt-Up Concrete', 75000, { description: 'Typically >20,000 SF', image_key: 'comm-tilt-up' }),
    ],
  },
  {
    division: 'commercial', label: 'Metal Building Options', selection_type: 'multi',
    description: '5,000 SF PEMB.',
    choices: [
      c('16\' Clear Height (vs 14\')', 7500, { image_key: 'comm-pemb-interior' }),
      c('20\'+ Clear Height', 20000, { image_key: 'comm-pemb-interior' }),
      c('6" R-19 Insulation (vs 4" R-13)', 3750, { image_key: 'comm-pemb-insulation' }),
      c('Liner System R-30', 16000, { image_key: 'comm-pemb-insulation' }),
      c('Additional 12×12 Overhead Door', 4750, { image_key: 'comm-overhead-door' }),
      c('14×14 Overhead Door', 6750, { image_key: 'comm-overhead-door' }),
      c('Gutters & Downspouts (300 LF)', 3300, { image_key: 'roof-gutter-k-style' }),
      c('3070 Hollow-Metal Walk Door', 1700, { image_key: 'comm-hm-door' }),
      c('Skylights / Wall Lights (6)', 2700, { image_key: 'comm-skylight-panel' }),
      c('Canopy / Awning (200 SF)', 12000, { image_key: 'comm-canopy' }),
    ],
  },
  {
    division: 'commercial', label: 'Storefront System', selection_type: 'single',
    description: 'Per 400 SF of glazing.',
    choices: [
      d('Aluminum Storefront, Clear Anodized, 1" Low-E', { image_key: 'comm-storefront' }),
      c('Dark Bronze / Black Anodized', 1800, { image_key: 'comm-storefront-black' }),
      c('Painted Kynar Custom Color', 3200, { image_key: 'comm-storefront-black' }),
      c('Thermally Broken Frames', 4600, { image_key: 'comm-storefront' }),
      c('Curtain Wall (2-Story)', 24000, { image_key: 'comm-curtain-wall' }),
    ],
  },
  {
    division: 'commercial', label: 'Storefront Glass & Entrance', selection_type: 'multi',
    choices: [
      c('Tempered / Laminated Security Glass', 5200, { image_key: 'comm-storefront' }),
      c('Tinted / Spandrel Panels', 3400, { image_key: 'comm-spandrel' }),
      c('Wide-Stile Entrance Doors', 1150, { image_key: 'comm-entrance-doors' }),
      c('Automatic Sliding Entrance', 11500, { image_key: 'comm-auto-slider' }),
      c('ADA Auto Door Operator', 4750, { image_key: 'comm-ada-operator' }),
    ],
  },
  {
    division: 'commercial', label: 'Parking Lot Pavement', selection_type: 'single',
    description: 'Per 20,000 SF lot.',
    choices: [
      c('Gravel Lot (6" ABC)', -50000, { image_key: 'comm-gravel-lot' }),
      d('Asphalt 2" Over 6" ABC (Light Duty)', { image_key: 'commercial-asphalt-paving' }),
      c('Asphalt 3" Over 8" ABC (Standard)', 27500, { image_key: 'commercial-asphalt-paving' }),
      c('Heavy-Duty Asphalt 4–5" (Truck Lanes)', 55000, { image_key: 'comm-asphalt-heavy' }),
      c('Concrete 6" w/ Rebar', 130000, { image_key: 'comm-concrete-lot' }),
      c('Pervious Pavers / Concrete', 230000, { description: 'Stormwater credit', image_key: 'comm-pervious' }),
      c('Mill & Overlay Existing', -30000, { image_key: 'comm-mill-overlay' }),
      c('Full-Depth Reclamation + 3" HMA', 40000, { image_key: 'comm-fdr' }),
    ],
  },
  {
    division: 'commercial', label: 'Parking Lot Add-Ons', selection_type: 'multi',
    choices: [
      c('Striping (40 Spaces)', 600, { image_key: 'comm-striping' }),
      c('ADA Space Package (2)', 700, { image_key: 'comm-ada-space' }),
      c('Wheel Stops (20)', 1800, { image_key: 'comm-wheel-stop' }),
      c('Curb & Gutter (300 LF)', 8500, { image_key: 'comm-curb-gutter' }),
      c('5\' Concrete Sidewalk (200 LF)', 9500, { image_key: 'comm-sidewalk' }),
      c('Sealcoat + Crack Fill', 6500, { image_key: 'comm-sealcoat' }),
      c('Speed Humps (2)', 1600, { image_key: 'comm-speed-hump' }),
      c('Steel Bollards (6)', 6600, { image_key: 'comm-bollard' }),
      c('CMU Dumpster Enclosure w/ Gates', 13500, { image_key: 'comm-dumpster-enclosure' }),
      c('8" Concrete Dumpster Pad w/ Approach', 6250, { image_key: 'comm-dumpster-pad' }),
      c('Landscape Islands w/ Irrigation (4)', 11000, { image_key: 'comm-landscape-island' }),
      c('Monument Sign Base & Electrical', 5250, { image_key: 'comm-monument-sign' }),
    ],
  },
  {
    division: 'commercial', label: 'Stormwater Management', selection_type: 'single',
    choices: [
      d('Sheet Flow to Existing Drainage', { image_key: 'grading-riprap-swale' }),
      c('Bio-Retention Cell', 35000, { image_key: 'comm-bioretention' }),
      c('Dry Detention Pond', 60000, { image_key: 'comm-detention-pond' }),
      c('Underground Detention (Chambers)', 120000, { image_key: 'comm-underground-detention' }),
    ],
  },
  {
    division: 'commercial', label: 'Site Lighting', selection_type: 'single',
    description: 'Per 6 poles, including bases, conduit and wire.',
    choices: [
      d('20\' Steel Pole, Single 150W LED Shoebox', { image_key: 'comm-site-light' }),
      c('25\' Pole, Dual Heads', 13500, { image_key: 'comm-site-light-dual' }),
      c('Decorative / Acorn Post-Top (Pedestrian)', 8400, { image_key: 'comm-site-light-acorn' }),
      c('Solar Standalone Poles', 12000, { description: 'No trenching', image_key: 'comm-site-light-solar' }),
    ],
  },
  {
    division: 'commercial', label: 'Lighting Add-Ons', selection_type: 'multi',
    choices: [
      c('Networked Lighting Controls / Dimming', 3900, { image_key: 'comm-site-light' }),
      c('LED Wall Packs (6)', 4000, { image_key: 'comm-wall-pack' }),
      c('Photometric Lighting Plan', 1650, { image_key: 'grading-survey' }),
    ],
  },
  {
    division: 'commercial', label: 'Restaurant Build-Out Scope', selection_type: 'single',
    description: '2,500 SF.',
    choices: [
      d('Second-Generation Restaurant Space (Cosmetic + Reconnect)', { image_key: 'comm-restaurant-2ndgen' }),
      c('Vanilla Shell to Restaurant (New MEP, Hood, Grease)', 470000, { image_key: 'comm-restaurant-shell' }),
      c('Add Drive-Thru (Lane, Window, Canopy, Menu Boards)', 137500, { image_key: 'comm-drive-thru' }),
      c('Double Drive-Thru', 212500, { image_key: 'comm-drive-thru' }),
    ],
  },
  {
    division: 'commercial', label: 'Restaurant MEP Packages', selection_type: 'multi',
    choices: [
      c('Type 1 Hood 10\' w/ Ansul, MUA & Grease Duct', 35000, { image_key: 'comm-type1-hood' }),
      c('Type 2 Hood (Dish / Oven)', 8500, { image_key: 'comm-type2-hood' }),
      c('Walk-In Cooler 8×10', 17000, { image_key: 'comm-walkin-cooler' }),
      c('Walk-In Freezer 8×10', 21500, { image_key: 'comm-walkin-freezer' }),
      c('Grease Interceptor 1,000–1,500 gal', 13500, { image_key: 'grease-precast-concrete' }),
      c('Floor Sinks / Drains (6)', 5400, { image_key: 'grease-floor-sink' }),
      c('3-Compartment Sink w/ Indirect Drain', 3500, { image_key: 'grease-3comp-sink' }),
      c('Hand Sinks (3)', 3750, { image_key: 'comm-hand-sink' }),
      c('Gas Service & Manifold to Cook Line', 8000, { image_key: 'plumb-gas-line' }),
      c('400–600A 3-Phase Electrical Service', 21000, { image_key: 'comm-3phase-service' }),
      c('Restaurant HVAC w/ Make-Up Air (10 Ton)', 35000, { image_key: 'comm-rtu' }),
      c('Fire Sprinkler (New / Modify)', 12500, { image_key: 'comm-sprinkler' }),
      c('Fire Alarm', 7500, { image_key: 'comm-fire-alarm' }),
      c('ADA Restroom Package (2)', 35000, { image_key: 'comm-ada-restroom' }),
    ],
  },
  {
    division: 'commercial', label: 'Commercial Interior Finish Level', selection_type: 'single',
    description: '2,500 SF.',
    choices: [
      d('Open Shell — Sealed Concrete, Exposed Ceiling', { image_key: 'comm-open-shell' }),
      c('Office / Retail Standard — ACT Ceiling, LVT, Painted Drywall', 112500, { image_key: 'comm-office-finish' }),
      c('Restaurant Front-of-House — Tile, Millwork, Lighting', 225000, { image_key: 'comm-restaurant-foh' }),
      c('Medical / Dental', 287500, { image_key: 'comm-medical' }),
    ],
  },
];

import { imageForKey } from '@/lib/option-images';

/** Preset choices with image_key resolved to a CDN url — what the API wants. */
export function presetChoicesWithImages(pr: OptionPreset) {
  return pr.choices.map((ch) => ({
    label: ch.label,
    description: ch.description || null,
    price_delta: ch.price_delta,
    is_default: !!ch.is_default,
    image_url: imageForKey(ch.image_key),
  }));
}

export function findOptionPreset(name: string): OptionPreset | undefined {
  const q = name.trim().toLowerCase();
  return OPTION_PRESETS.find((p) => p.label.toLowerCase() === q)
    || OPTION_PRESETS.find((p) => p.label.toLowerCase().includes(q));
}

/** Every image_key referenced by the presets (for the sourcing pass / audits). */
export function presetImageKeys(): string[] {
  const keys = new Set<string>();
  for (const p of OPTION_PRESETS) for (const ch of p.choices) if (ch.image_key) keys.add(ch.image_key);
  return Array.from(keys).sort();
}
