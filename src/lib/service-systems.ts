/** Systems RO can put on a maintenance schedule — client-safe. */
export const SERVICE_SYSTEMS: { id: string; label: string; interval: number; hint: string }[] = [
  { id: 'septic', label: 'Septic tank pump-out', interval: 36, hint: 'Every 3 years for a typical household' },
  { id: 'grease_trap', label: 'Grease trap service', interval: 3, hint: 'Quarterly for most restaurants' },
  { id: 'backflow', label: 'Backflow preventer test', interval: 12, hint: 'Annual, usually required by the water system' },
  { id: 'water_heater', label: 'Water heater flush', interval: 12, hint: 'Annual' },
  { id: 'hvac', label: 'HVAC service', interval: 6, hint: 'Spring and fall' },
  { id: 'generator', label: 'Generator service', interval: 12, hint: 'Annual' },
  { id: 'gutters', label: 'Gutter cleaning', interval: 6, hint: 'Twice a year' },
  { id: 'roof', label: 'Roof inspection', interval: 12, hint: 'Annual, after storm season' },
  { id: 'drainage', label: 'Drainage / culvert check', interval: 12, hint: 'Before the wet season' },
  { id: 'other', label: 'Other', interval: 12, hint: '' },
];
export const serviceLabel = (id: string) => SERVICE_SYSTEMS.find((s) => s.id === id)?.label || 'Service';
