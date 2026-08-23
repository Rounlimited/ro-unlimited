import { createAdminClient } from '@/lib/supabase/server';

/**
 * Team alerts — one call writes the in-app notification (bell) and sends the
 * push, routed to the right people.
 *
 * Routing lives in app_settings.alert_routing:
 *   { "default": ["jr@…"], "by_division": { "utilities": ["…"] }, "by_event": { "estimate_signed": ["…"] } }
 * Today everything goes to JR. As departments get their own leads, add their
 * emails under by_division / by_event — no code change needed. An empty
 * recipient list means "everyone with push enabled".
 */
export interface AlertRouting {
  default: string[];
  by_division: Record<string, string[]>;
  by_event: Record<string, string[]>;
}

export interface TeamAlert {
  type: string;            // e.g. estimate_viewed, estimate_pdf_downloaded, estimate_signed
  title: string;
  body: string;
  url: string;
  reference_id?: string | null;
  division?: string | null;
  tag?: string;
}

export async function getAlertRouting(): Promise<AlertRouting> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'alert_routing').maybeSingle();
    const v = (data?.value || {}) as Partial<AlertRouting>;
    return {
      default: Array.isArray(v.default) ? v.default : [],
      by_division: v.by_division || {},
      by_event: v.by_event || {},
    };
  } catch {
    return { default: [], by_division: {}, by_event: {} };
  }
}

/** Resolve recipient emails for an alert. [] = broadcast to everyone. */
export function resolveRecipients(routing: AlertRouting, alert: Pick<TeamAlert, 'type' | 'division'>): string[] {
  const set = new Set<string>();
  (routing.by_event[alert.type] || []).forEach((e) => set.add(e.toLowerCase()));
  if (alert.division) (routing.by_division[alert.division] || []).forEach((e) => set.add(e.toLowerCase()));
  if (set.size === 0) routing.default.forEach((e) => set.add(e.toLowerCase()));
  return Array.from(set);
}

export async function notifyTeam(alert: TeamAlert): Promise<void> {
  const supabase = createAdminClient();
  try {
    await supabase.from('admin_notifications').insert({
      type: alert.type, title: alert.title, body: alert.body, url: alert.url,
      reference_id: alert.reference_id || null,
    });
  } catch (err) { console.error('[alerts] notification insert failed', err); }

  try {
    const routing = await getAlertRouting();
    const recipients = resolveRecipients(routing, alert);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
    await fetch(`${siteUrl}/api/admin/push-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-push-secret': process.env.PUSH_SECRET || '' },
      body: JSON.stringify({ title: alert.title, body: alert.body, url: alert.url, tag: alert.tag || alert.type, recipients }),
    });
  } catch (err) { console.error('[alerts] push failed', err); }
}
