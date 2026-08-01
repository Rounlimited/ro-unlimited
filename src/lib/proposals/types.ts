// Dev Proposals — living interactive documents sent via share link.
// Template-driven: the renderer owns layout/brand; content JSON drives it.

export type ProposalSection =
  | QuotesSection
  | CardsSection
  | PhasesSection
  | ApproveSection;

export interface QuotesSection {
  kind: 'quotes';
  depth: string;            // e.g. "Depth −2 FT · The call"
  title: string;
  intro?: string;
  quotes?: { who: string; text: string }[];
  paragraphs?: string[];    // supports **bold** and ==highlight== markers
}

export interface CardsSection {
  kind: 'cards';
  depth: string;
  title: string;
  intro?: string;
  cards: {
    tag: string;
    title: string;
    body: string;
    items?: string[];
    lead?: boolean;         // orange highlight card
    demoted?: boolean;      // muted card
  }[];
  footnote?: string;
  licenses?: { label: string; num: string }[];
}

export interface PhasesSection {
  kind: 'phases';
  depth: string;
  title: string;
  intro?: string;
  phases: { n: number; title: string; body: string; note?: string }[];
}

export interface ApproveSection {
  kind: 'approve';
  depth: string;            // e.g. "Bedrock · Your call"
  title: string;
  intro?: string;
  asks?: string[];          // numbered list of what we need
  questions?: ProposalQuestion[];
  approveLabel?: string;    // default "Approve this plan"
  allowComment?: boolean;   // default true
}

export interface ProposalQuestion {
  id: string;
  question: string;
  type: 'choice' | 'text';
  options?: string[];       // for 'choice'
}

export interface ProposalContent {
  brandFrom: string;        // "NexaVision Group"
  preparedFor: string;      // "Prepared for JR"
  heroLines: string[];      // hero headline lines; last line renders outlined
  heroSub: string;
  gradeLeft?: string;       // "▼ Existing grade"
  gradeRight?: string;      // "Scroll down to dig in"
  footerLeft?: string;
  footerRight?: string;
  sections: ProposalSection[];
}

export interface ProposalResponse {
  at: string;               // ISO timestamp
  type: 'approval' | 'comment' | 'answers';
  comment?: string;
  answers?: Record<string, string>;
  meta?: { ua?: string; ip?: string };
}

export interface DevProposal {
  id: string;
  title: string;
  template_id: string;      // 'upgrade-proposal' for now
  share_token: string | null;
  status: 'draft' | 'published' | 'viewed' | 'responded' | 'approved';
  content: ProposalContent;
  responses: ProposalResponse[];
  created_by: string | null;
  viewed_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const TEMPLATE_IDS = ['upgrade-proposal'] as const;
