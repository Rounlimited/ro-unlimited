import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { listMembers, addMember, updateMember, sendMemberInvite, ensureShareToken, type Member } from '@/lib/project-members';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

/** GET — the owner + everyone the Project Page is shared with, each with recent activity. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const supabase = createAdminClient();
    const { data: est } = await supabase.from('estimates')
      .select('id, share_token, view_count, last_viewed_at, last_viewed_device, signed_name, customer:customers(id, first_name, last_name, company_name, email, phone)')
      .eq('id', params.id).maybeSingle();
    if (!est) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const c: any = (est as any).customer;
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com').replace(/\/$/, '');
    return NextResponse.json({
      owner: c ? {
        name: (c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ').trim()) || 'Customer',
        email: c.email || null, phone: c.phone || null, customer_id: c.id,
        link: est.share_token ? `${site}/estimate/${est.share_token}` : null,
        views: est.view_count || 0, last_seen: est.last_viewed_at, last_device: est.last_viewed_device,
      } : null,
      members: await listMembers(params.id),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 }); }
}

/** POST { name, email?, phone?, label?, role, invite? } — add a person (and email them their link). */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const b = await req.json().catch(() => ({}));
    await ensureShareToken(params.id);
    const out = await addMember(params.id, { name: b.name, email: b.email, phone: b.phone, label: b.label, role: b.role, added_by: 'RO' });
    if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
    let invited: any = null;
    if (b.invite && out.member.email) invited = await sendMemberInvite(out.member);
    return NextResponse.json({ ok: true, member: out.member, invited });
  } catch (e: any) { return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 }); }
}

/** PATCH { member_id, role? | revoke? | restore? | invite? | name/email/phone/label } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const b = await req.json().catch(() => ({}));
    const supabase = createAdminClient();
    const { data: cur } = await supabase.from('project_members').select('*').eq('id', String(b.member_id || '')).eq('estimate_id', params.id).maybeSingle();
    if (!cur) return NextResponse.json({ error: 'Person not found on this project' }, { status: 404 });
    if (b.invite) {
      const r = await sendMemberInvite(cur as Member);
      return 'error' in r ? NextResponse.json({ error: r.error }, { status: 400 }) : NextResponse.json({ ok: true });
    }
    const out = await updateMember(cur.id, { role: b.role, name: b.name, email: b.email, phone: b.phone, label: b.label, revoke: !!b.revoke, restore: !!b.restore });
    if ('error' in out) return NextResponse.json({ error: out.error }, { status: 400 });
    return NextResponse.json({ ok: true, member: out.member });
  } catch (e: any) { return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 }); }
}
