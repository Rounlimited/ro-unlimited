/**
 * Pure helpers shared by the API and the admin UI: turn raw document events
 * into "visits" (one customer session) and human sentences.
 */
export interface DocEventRow {
  id: string; event: string; internal: boolean; visitor_id: string | null;
  device_type: string | null; os: string | null; browser: string | null;
  city: string | null; region: string | null; country: string | null;
  referrer?: string | null; meta: any; created_at: string;
}

export interface Visit {
  started_at: string; ended_at: string;
  visitor_id: string | null; device: string; location: string;
  internal: boolean;
  seconds: number | null; max_scroll: number | null;
  sections: string[]; pdf_views: number; pdf_downloads: number;
  events: DocEventRow[];
  visit_number: number; // nth visit by this visitor (1 = first)
}

export interface Summary {
  views: number; pdf_views: number; pdf_downloads: number; unique_visitors: number;
  first_view: string | null; last_view: string | null; last_device: string | null; last_location: string | null;
  reached_total: boolean; reached_sign: boolean; total_seconds: number;
  email: { sent: boolean; delivered: boolean; opened: boolean; clicked: boolean; bounced: boolean };
  visits: Visit[];
}

export function deviceLabel(e: { device_type?: string | null; os?: string | null; browser?: string | null }): string {
  const d = e.device_type || ''; const os = e.os || ''; const b = e.browser || '';
  let head = d;
  if (d === 'Phone') head = os === 'iOS' ? 'iPhone' : os === 'Android' ? 'Android phone' : 'Phone';
  else if (d === 'Tablet') head = os === 'iPadOS' ? 'iPad' : 'Tablet';
  else if (d === 'Desktop') head = os ? `${os} desktop` : 'Desktop';
  return [head, b && b !== 'Unknown' ? b : ''].filter(Boolean).join(' · ');
}

export function locationLabel(e: { city?: string | null; region?: string | null; country?: string | null }): string {
  const parts = [e.city, e.region].filter(Boolean);
  if (!parts.length) return e.country || '';
  return e.country && e.country !== 'US' ? `${parts.join(', ')} ${e.country}` : parts.join(', ');
}

const GAP_MS = 30 * 60 * 1000; // a new visit after 30 quiet minutes

/** Group events into visits (by visitor, 30-minute gap), newest first. */
export function summarizeVisits(rows: DocEventRow[]): Summary {
  const asc = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const visits: Visit[] = [];
  const open: Record<string, Visit> = {};
  const perVisitor: Record<string, number> = {};
  const email = { sent: false, delivered: false, opened: false, clicked: false, bounced: false };

  for (const e of asc) {
    if (e.event.startsWith('email_')) {
      const k = e.event.replace('email_', '') as keyof typeof email; if (k in email) email[k] = true;
      continue;
    }
    const key = e.visitor_id || `anon-${e.device_type}-${e.city}-${e.internal}`;
    const t = new Date(e.created_at).getTime();
    let v = open[key];
    if (!v || t - new Date(v.ended_at).getTime() > GAP_MS) {
      perVisitor[key] = (perVisitor[key] || 0) + 1;
      v = {
        started_at: e.created_at, ended_at: e.created_at, visitor_id: e.visitor_id,
        device: deviceLabel(e), location: locationLabel(e), internal: e.internal,
        seconds: null, max_scroll: null, sections: [], pdf_views: 0, pdf_downloads: 0, events: [],
        visit_number: perVisitor[key],
      };
      open[key] = v; visits.push(v);
    }
    v.ended_at = e.created_at; v.events.push(e);
    if (e.event === 'time_on_page') { v.seconds = Math.max(v.seconds || 0, Number(e.meta?.seconds) || 0); v.max_scroll = Math.max(v.max_scroll || 0, Number(e.meta?.max_scroll) || 0); }
    if (e.event === 'section_seen' && e.meta?.section && !v.sections.includes(e.meta.section)) v.sections.push(e.meta.section);
    if (e.event === 'pdf_view') v.pdf_views++;
    if (e.event === 'pdf_download') v.pdf_downloads++;
  }

  const customer = rows.filter((e) => !e.internal);
  const views = customer.filter((e) => e.event === 'link_view');
  const last = views[0] || null; // rows arrive newest-first
  return {
    views: views.length,
    pdf_views: customer.filter((e) => e.event === 'pdf_view').length,
    pdf_downloads: customer.filter((e) => e.event === 'pdf_download').length,
    unique_visitors: new Set(views.map((e) => e.visitor_id || e.id)).size,
    first_view: views.length ? views[views.length - 1].created_at : null,
    last_view: last?.created_at || null,
    last_device: last ? deviceLabel(last) : null,
    last_location: last ? locationLabel(last) : null,
    reached_total: customer.some((e) => e.event === 'section_seen' && e.meta?.section === 'total'),
    reached_sign: customer.some((e) => e.event === 'section_seen' && e.meta?.section === 'sign'),
    total_seconds: customer.filter((e) => e.event === 'time_on_page').reduce((s, e) => s + (Number(e.meta?.seconds) || 0), 0),
    email,
    visits: visits.reverse(),
  };
}

export function eventSentence(e: DocEventRow): string {
  switch (e.event) {
    case 'link_view': return 'Opened the link';
    case 'pdf_view': return 'Viewed the PDF';
    case 'pdf_download': return 'Downloaded the PDF';
    case 'section_seen': return e.meta?.section === 'total' ? 'Scrolled to the total' : e.meta?.section === 'sign' ? 'Reached the sign block' : `Read the ${e.meta?.section || 'page'}`;
    case 'time_on_page': return `${fmtSeconds(Number(e.meta?.seconds) || 0)} on the page${e.meta?.max_scroll ? ` · read ${e.meta.max_scroll}%` : ''}`;
    case 'options_changed': return 'Changed an option';
    case 'options_confirmed': return `Confirmed options${e.meta?.summary?.length ? ': ' + e.meta.summary.join(', ') : ''}`;
    case 'message_sent': return `Sent a message${e.meta?.name ? ` (${e.meta.name})` : ''}`;
    case 'signed': return `Signed${e.meta?.signed_name ? ` as ${e.meta.signed_name}` : ''}`;
    case 'email_sent': return `Emailed to ${e.meta?.to || 'customer'}`;
    case 'email_delivered': return 'Email delivered';
    case 'email_opened': return e.meta?.automated
      ? 'Email opened (automatic — mail scanner, not the customer)'
      : 'Email opened';
    case 'email_clicked': return 'Clicked the link in the email';
    case 'email_bounced': return 'Email bounced';
    default: return e.event.replace(/_/g, ' ');
  }
}

export function fmtSeconds(s: number): string {
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60); const r = s % 60;
  if (m < 60) return r ? `${m} min ${r} sec` : `${m} min`;
  return `${Math.floor(m / 60)} hr ${m % 60} min`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
