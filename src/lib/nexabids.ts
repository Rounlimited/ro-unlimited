/**
 * NexaBids: bidding from plans, a premium Nexa module inside the admin.
 *
 * A bid starts in NexaBids (plans in, measured, priced). When it is turned into an estimate it lives in
 * Estimates; when the customer signs, it is a job in Jobs. NexaBids keeps showing where each bid stands.
 */

export type BidStage = 'working' | 'ready' | 'submitted' | 'won' | 'lost';
export const BID_STAGES: { key: BidStage; label: string; where: string; color: string }[] = [
  { key: 'working', label: 'Working on it', where: 'Still in NexaBids', color: '#7dd3fc' },
  { key: 'ready', label: 'In Estimates', where: 'An estimate, not sent yet', color: '#c4b5fd' },
  { key: 'submitted', label: 'Submitted', where: 'Sent, waiting on an answer', color: '#fbbf24' },
  { key: 'won', label: 'Won', where: 'Signed. It is in Jobs', color: '#4ade80' },
  { key: 'lost', label: 'Not won', where: 'Declined or expired', color: '#f87171' },
];

export function bidStage(est: { status?: string | null; signed_at?: string | null } | null | undefined): BidStage {
  if (!est) return 'working';
  if (est.signed_at || est.status === 'accepted') return 'won';
  if (est.status === 'declined' || est.status === 'expired' || est.status === 'lost') return 'lost';
  if (est.status === 'sent' || est.status === 'viewed' || est.status === 'revised') return 'submitted';
  return 'ready';
}

/* ── Access ───────────────────────────────────────────────────────────
   NexaBids will be a paid module. Until billing is switched on, everyone is on the preview. Turning it off for
   a site is one row: app_settings key `nexabids_access`, value { active: false }. Every NexaBids route checks. */
export type NexaBidsAccess = { active: boolean; plan: string };
export async function nexaBidsAccess(admin: any): Promise<NexaBidsAccess> {
  try {
    const { data } = await admin.from('app_settings').select('value').eq('key', 'nexabids_access').maybeSingle();
    const v = (data?.value || null) as { active?: boolean; plan?: string } | null;
    if (!v) return { active: true, plan: 'preview' };
    return { active: v.active !== false, plan: String(v.plan || 'preview') };
  } catch {
    return { active: true, plan: 'preview' };
  }
}
export const NEXABIDS_LOCKED = 'NexaBids is a premium Nexa module and is not switched on for this account.';
