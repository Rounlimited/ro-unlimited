// ═══════════════════════════════════════════════════════════════
//  SHARED SUB-SERVICE TYPES
//  Used by roofing-data.ts, electrical-data.ts, and SubServicePage
// ═══════════════════════════════════════════════════════════════

export interface OverviewBlock {
  heading: string;
  content: string;
}

export interface WarningSign {
  trigger: string;
  detail: string;
}

export interface MaintenanceTip {
  tip: string;
  detail: string;
}

export interface ProcessStep {
  num: string;
  title: string;
  description: string;
}

export interface CostRow {
  item: string;
  cost: string;
  lifespan: string;
}

export interface SubService {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  heroDescription: string;
  heroImage: string;
  cardImage: string;
  overview: OverviewBlock[];
  galleryImages?: string[];
  warningSigns: WarningSign[];
  maintenanceTips: MaintenanceTip[];
  processSteps: ProcessStep[];
  faq: { q: string; a: string }[];
  costData: CostRow[];
  seoKeywords: string[];
}
