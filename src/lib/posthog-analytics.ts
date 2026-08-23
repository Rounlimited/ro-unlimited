/**
 * PostHog — site behaviour for the Analytics page, pulled server-side with the
 * personal API key (POSTHOG_PERSONAL_API_KEY) via HogQL. The browser SDK
 * (SiteAnalytics.tsx) sends page views, autocapture, our named conversions
 * (phone_tap / sms_tap / email_tap / contact_form_submitted) and session
 * replays; this reads them back.
 */
const HOST = process.env.POSTHOG_API_HOST || 'https://us.posthog.com';

export interface PosthogSummary {
  available: boolean;
  error?: string;
  project_url: string;
  totals: { visitors: number; page_views: number; sessions: number; avg_scroll_pct: number | null; avg_seconds_on_page: number | null };
  days: { date: string; visitors: number; page_views: number }[];
  conversions: { event: string; label: string; count: number; people: number }[];
  funnel: { visitors: number; service_page: number; contact_page: number; converted: number };
  top_pages: { path: string; page_views: number; visitors: number }[];
  entry_pages: { path: string; sessions: number }[];
  referrers: { host: string; visitors: number }[];
  utm_sources: { source: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  browsers: { browser: string; visitors: number }[];
  recordings: { id: string; start: string; seconds: number; start_url: string | null; clicks: number; url: string }[];
}

const CONVERSION_LABELS: Record<string, string> = {
  phone_tap: 'Tapped the phone number', sms_tap: 'Tapped to text', email_tap: 'Tapped the email', contact_form_submitted: 'Sent the contact form',
};

type Row = any[];
const cache = new Map<string, { at: number; value: any }>();
const TTL = 5 * 60 * 1000;

async function hogql(projectId: string, key: string, query: string): Promise<Row[]> {
  const ck = projectId + query;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const res = await fetch(`${HOST}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    // PostHog caches identical queries for hours; force a fresh computation
    // (our 5-minute in-memory cache above keeps the load reasonable).
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query }, refresh: 'force_blocking' }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`PostHog ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const json = await res.json();
  const rows: Row[] = json.results || [];
  cache.set(ck, { at: Date.now(), value: rows });
  return rows;
}

// Public-site-only guard used in every query. Staff never run PostHog in
// /admin, but the path filter keeps any stray admin/doc pages out regardless.
const PUBLIC = `and properties.$pathname not like '/admin%' and properties.$pathname not like '/estimate/%' and properties.$pathname not like '/i/%' and properties.$pathname not like '/intake/%'`;
const SERVICE_PATHS = `(properties.$pathname like '/residential%' or properties.$pathname like '/commercial%' or properties.$pathname like '/utilities%' or properties.$pathname like '/grading%' or properties.$pathname like '/services%')`;

export async function getPosthog(days: number): Promise<PosthogSummary> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const project_url = `${HOST}/project/${projectId || ''}`;
  const empty: PosthogSummary = {
    available: false, project_url,
    totals: { visitors: 0, page_views: 0, sessions: 0, avg_scroll_pct: null, avg_seconds_on_page: null },
    days: [], conversions: [], funnel: { visitors: 0, service_page: 0, contact_page: 0, converted: 0 },
    top_pages: [], entry_pages: [], referrers: [], utm_sources: [], devices: [], browsers: [], recordings: [],
  };
  if (!key || !projectId) return { ...empty, error: 'PostHog not configured' };

  const since = `timestamp > now() - interval ${Math.max(1, Math.min(365, days))} day`;
  const q = (s: string) => hogql(projectId, key, s);

  try {
    const [byDay, totals, conv, funnelRows, pages, entry, refs, utm, devices, browsers, engagement] = await Promise.all([
      q(`select toDate(timestamp) as day, count(distinct person_id) as visitors, count() as views from events where event = '$pageview' and ${since} ${PUBLIC} group by day order by day`),
      q(`select count(distinct person_id), count(), count(distinct properties.$session_id) from events where event = '$pageview' and ${since} ${PUBLIC}`),
      q(`select event, count(), count(distinct person_id) from events where event in ('phone_tap','sms_tap','email_tap','contact_form_submitted') and ${since} group by event order by count() desc`),
      q(`select
           count(distinct person_id) as visitors,
           count(distinct if(${SERVICE_PATHS}, person_id, null)) as service_page,
           count(distinct if(properties.$pathname like '/contact%', person_id, null)) as contact_page,
           count(distinct if(event in ('phone_tap','sms_tap','email_tap','contact_form_submitted'), person_id, null)) as converted
         from events where (event = '$pageview' or event in ('phone_tap','sms_tap','email_tap','contact_form_submitted')) and ${since} ${PUBLIC}`),
      q(`select properties.$pathname as path, count() as views, count(distinct person_id) as visitors from events where event = '$pageview' and ${since} ${PUBLIC} group by path order by views desc limit 12`),
      q(`select properties.$entry_pathname as path, count(distinct session_id) as sessions from sessions where $start_timestamp > now() - interval ${days} day and properties.$entry_pathname not like '/admin%' group by path order by sessions desc limit 8`).catch(() => [] as Row[]),
      q(`select properties.$referring_domain as host, count(distinct person_id) as visitors from events where event = '$pageview' and ${since} ${PUBLIC} and host is not null and host != '$direct' and host not like '%rounlimited.com%' group by host order by visitors desc limit 8`),
      q(`select properties.utm_source as source, count(distinct person_id) as visitors from events where event = '$pageview' and ${since} and source is not null and source != '' group by source order by visitors desc limit 8`),
      q(`select properties.$device_type as device, count(distinct person_id) as visitors from events where event = '$pageview' and ${since} ${PUBLIC} group by device order by visitors desc limit 5`),
      q(`select properties.$browser as browser, count(distinct person_id) as visitors from events where event = '$pageview' and ${since} ${PUBLIC} group by browser order by visitors desc limit 6`),
      q(`select avg(toFloat(properties.$prev_pageview_max_scroll_percentage)) * 100, avg(toFloat(properties.$prev_pageview_duration)) from events where event in ('$pageleave', '$pageview') and ${since} and properties.$prev_pageview_max_scroll_percentage is not null`).catch(() => [[null, null]] as Row[]),
    ]);

    // Session replays — the most recent handful, with deep links to watch.
    let recordings: PosthogSummary['recordings'] = [];
    try {
      const res = await fetch(`${HOST}/api/projects/${projectId}/session_recordings/?limit=8&date_from=-${days}d`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        recordings = (json.results || []).map((r: any) => ({
          id: r.id, start: r.start_time, seconds: Math.round(r.recording_duration || 0), start_url: r.start_url || null, clicks: r.click_count || 0,
          url: `${HOST}/project/${projectId}/replay/${r.id}`,
        }));
      }
    } catch { /* optional */ }

    // Fill every day so the chart doesn't skip quiet days.
    const got: Record<string, { visitors: number; page_views: number }> = {};
    byDay.forEach((r) => { got[String(r[0]).slice(0, 10)] = { visitors: Number(r[1]) || 0, page_views: Number(r[2]) || 0 }; });
    const dayRows: PosthogSummary['days'] = [];
    const end = Date.now();
    for (let i = days - 1; i >= 0; i--) { const d = new Date(end - i * 86400000).toISOString().slice(0, 10); dayRows.push({ date: d, ...(got[d] || { visitors: 0, page_views: 0 }) }); }

    const t = totals[0] || [0, 0, 0];
    const f = funnelRows[0] || [0, 0, 0, 0];
    const e = engagement[0] || [null, null];
    return {
      available: true, project_url,
      totals: {
        visitors: Number(t[0]) || 0, page_views: Number(t[1]) || 0, sessions: Number(t[2]) || 0,
        avg_scroll_pct: e[0] != null ? Math.round(Number(e[0])) : null,
        avg_seconds_on_page: e[1] != null ? Math.round(Number(e[1])) : null,
      },
      days: dayRows,
      conversions: conv.map((r) => ({ event: String(r[0]), label: CONVERSION_LABELS[String(r[0])] || String(r[0]), count: Number(r[1]) || 0, people: Number(r[2]) || 0 })),
      funnel: { visitors: Number(f[0]) || 0, service_page: Number(f[1]) || 0, contact_page: Number(f[2]) || 0, converted: Number(f[3]) || 0 },
      top_pages: pages.map((r) => ({ path: String(r[0] ?? '/'), page_views: Number(r[1]) || 0, visitors: Number(r[2]) || 0 })),
      entry_pages: entry.map((r) => ({ path: String(r[0] ?? '/'), sessions: Number(r[1]) || 0 })),
      referrers: refs.map((r) => ({ host: String(r[0]), visitors: Number(r[1]) || 0 })),
      utm_sources: utm.map((r) => ({ source: String(r[0]), visitors: Number(r[1]) || 0 })),
      devices: devices.map((r) => ({ device: String(r[0] ?? 'Unknown'), visitors: Number(r[1]) || 0 })),
      browsers: browsers.map((r) => ({ browser: String(r[0] ?? 'Unknown'), visitors: Number(r[1]) || 0 })),
      recordings,
    };
  } catch (err: any) {
    return { ...empty, error: err?.message || 'PostHog query failed' };
  }
}
