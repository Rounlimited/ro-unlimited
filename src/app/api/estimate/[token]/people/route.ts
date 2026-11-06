import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveToken, addMember, updateMember, sendMemberInvite, memberLink, type Member } from '@/lib/project-members';
import { notifyTeam } from '@/lib/alerts';

export const dynamic = 'force-dynamic';
type Ctx = { params: { token: string } };

/**
 * "Share this project" — the OWNER's side of People on this project.
 * Only works when RO has turned on estimates.allow_customer_share for the job,
 * and only through the owner's own link (never a shared person's).
 * People the customer adds are always "Can view"; approve power stays RO's
 * call (Link Controls → People). RO is alerted on every add/remove.
 */
async function ownerProject(raw: string) {
  const rt = await resolveToken(raw);
  if (rt.member) return { error: NextResponse.json({ error: 'Only the project owner can share it.' }, { status: 403 }) };
  const { data: est } = await createAdminClient().from('estimates')
    .select('id, project_name, estimate_number, division, link_enabled, allow_customer_share, customer:customers(first_name, last_name, company_name)')
    .eq('share_token', rt.token).maybeSingle();
  if (!est) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) };
  if ((est as any).link_enabled === false) return { error: NextResponse.json({ error: 'This link is paused' }, { status: 423 }) };
  if (!(est as any).allow_customer_share) return { error: NextResponse.json({ error: 'Sharing isn’t turned on for this project — call RO at (864) 304-0139 to add someone.' }, { status: 403 }) };
  const c: any = (est as any).customer;
  return { est, ownerName: (c && (c.first_name || c.company_name)) || 'The customer' };
}
const pub = (m: Member) => ({ id: m.id, name: m.name, label: m.label, role: m.role, email: m.email, phone: m.phone, added_by_owner: m.added_by === 'owner', opened: !!m.first_seen_at, link: m.added_by === 'owner' ? memberLink(m) : null });

export async function GET(_req: NextRequest, { params }: Ctx) {
  const o = await ownerProject(params.token); if ('error' in o) return o.error;
  const { data } = await createAdminClient().from('project_members').select('*').eq('estimate_id', o.est.id).is('revoked_at', null).order('created_at');
  return NextResponse.json({ people: ((data || []) as Member[]).map(pub) });
}

/** POST { name, label?, email?, phone? } — add a view-only person and email them their link. */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const o = await ownerProject(params.token); if ('error' in o) return o.error;
    const b = await req.json().catch(() => ({}));
    if (!String(b.email || '').trim() && !String(b.phone || '').trim()) return NextResponse.json({ error: 'Add their email or mobile number so they can get their link.' }, { status: 400 });
    const { count } = await createAdminClient().from('project_members').select('id', { count: 'exact', head: true }).eq('estimate_id', o.est.id).eq('added_by', 'owner').is('revoked_at', null);
    if ((count || 0) >= 10) return NextResponse.json({ error: 'That’s the limit for sharing from here — call RO to add more.' }, { status: 429 });
    const out = await addMember(o.est.id, { name: b.name, label: b.label, email: b.email, phone: b.phone, role: 'viewer', added_by: 'owner' });
    if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
    const invited = out.member.email ? await sendMemberInvite(out.member) : null;
    await notifyTeam({
      type: 'customer_shared', title: `${o.ownerName} shared ${o.est.project_name || o.est.estimate_number} with ${out.member.name}${out.member.label ? ' (' + out.member.label + ')' : ''}`,
      body: 'View only. Change what they can do in Link Controls → People.', url: `/admin/jobs/${o.est.id}`, reference_id: o.est.id, division: (o.est as any).division || null, tag: `share-${out.member.id}`,
    } as any).catch(() => {});
    return NextResponse.json({ ok: true, person: pub(out.member), emailed: !!(invited && 'ok' in invited) });
  } catch (e: any) { return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 }); }
}

/** PATCH { id, remove: true } — the owner removes someone THEY added. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const o = await ownerProject(params.token); if ('error' in o) return o.error;
  const b = await req.json().catch(() => ({}));
  const { data: m } = await createAdminClient().from('project_members').select('*').eq('id', String(b.id || '')).eq('estimate_id', o.est.id).is('revoked_at', null).maybeSingle();
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (m.added_by !== 'owner') return NextResponse.json({ error: 'RO added this person — call us to change that.' }, { status: 403 });
  const out = await updateMember(m.id, { revoke: true });
  if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
  await notifyTeam({ type: 'customer_shared', title: `${o.ownerName} removed ${m.name} from ${o.est.project_name || o.est.estimate_number}`, body: 'Their link no longer works.', url: `/admin/jobs/${o.est.id}`, reference_id: o.est.id, tag: `share-${m.id}` } as any).catch(() => {});
  return NextResponse.json({ ok: true });
}
