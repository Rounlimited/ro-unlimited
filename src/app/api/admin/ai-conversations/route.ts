import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getServerUser, roleOf } from '@/lib/supabase/server';

// ── Per-user chat history with role-based visibility ──
// Everyone owns their chats. Visibility of OTHER people's boxes:
//   dev (DEV_EMAIL)  → every user's chats + legacy unassigned, full access
//   admin            → own chats + read-only view of employees' chats
//   employee         → own chats only
const DEV_EMAIL = 'admin@nexavisiongroup.com';
const isDev = (user: any) => (user?.email || '').toLowerCase() === DEV_EMAIL;

// Rough token estimate: ~4 chars per token
function estimateTokens(messages: any[]): number {
  return Math.ceil(JSON.stringify(messages).length / 4);
}

function displayName(u: any): string {
  const meta = u.user_metadata || {};
  const name = [meta.first_name, meta.last_name].filter(Boolean).join(' ') || meta.name || meta.full_name;
  return name || u.email || 'Unknown';
}

// Can `viewer` see the chat box belonging to `owner`? (read access)
function canView(viewer: any, ownerUser: any | null): boolean {
  if (!ownerUser) return isDev(viewer); // legacy unassigned chats → dev only
  if (ownerUser.id === viewer.id) return true;
  if (isDev(viewer)) return true;
  return roleOf(viewer) !== 'employee' && roleOf(ownerUser) === 'employee';
}

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const url = new URL(req.url);

  // ── User picker list for the history panel dropdown ──
  if (url.searchParams.get('users') === '1') {
    if (roleOf(user) === 'employee' && !isDev(user)) return NextResponse.json({ users: [] });
    const { data: page } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const all = (page?.users || []).filter((u: any) => u.id !== user.id);
    const visible = isDev(user) ? all : all.filter((u: any) => roleOf(u) === 'employee');
    const users = visible.map((u: any) => ({ id: u.id, email: u.email, name: displayName(u), role: roleOf(u) }));
    if (isDev(user)) users.push({ id: 'legacy', email: null, name: 'Older chats (unassigned)', role: 'legacy' });
    return NextResponse.json({ users });
  }

  // ── Conversation list — own by default, ?view=<user_id|legacy> for others ──
  const view = url.searchParams.get('view');
  let query = supabase
    .from('ai_conversations')
    .select('id, title, summary, token_estimate, compacted, created_at, updated_at, user_email')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (!view || view === user.id) {
    query = query.eq('user_id', user.id);
  } else if (view === 'legacy') {
    if (!isDev(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    query = query.is('user_id', null);
  } else {
    const { data: target } = await supabase.auth.admin.getUserById(view);
    if (!target?.user || !canView(user, target.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    query = query.eq('user_id', view);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const body = await req.json();
  const { action } = body;

  // Fetch a conversation and decide access. write=true requires ownership
  // (or dev, who has full access).
  const getConvWithAccess = async (id: string, write: boolean) => {
    const { data: conv } = await supabase.from('ai_conversations').select('*').eq('id', id).single();
    if (!conv) return { conv: null, allowed: false };
    const mine = conv.user_id === user.id || (conv.user_id === null && isDev(user));
    if (write) return { conv, allowed: mine || isDev(user) };
    if (mine || isDev(user)) return { conv, allowed: true };
    // Admin read-only view of an employee's chat
    if (conv.user_id && roleOf(user) !== 'employee') {
      const { data: owner } = await supabase.auth.admin.getUserById(conv.user_id);
      return { conv, allowed: !!owner?.user && roleOf(owner.user) === 'employee' };
    }
    return { conv, allowed: false };
  };

  // Create new conversation — always owned by the caller
  if (action === 'create') {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        title: body.title || 'New Chat',
        messages: body.messages || [],
        user_id: user.id,
        user_email: user.email || null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ conversation: data });
  }

  // Save messages to existing conversation (owner or dev only)
  if (action === 'save') {
    const { id, messages, title } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { allowed } = await getConvWithAccess(id, true);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const tokens = estimateTokens(messages);
    const update: any = {
      messages,
      token_estimate: tokens,
      updated_at: new Date().toISOString(),
    };
    if (title) update.title = title;
    const { error } = await supabase.from('ai_conversations').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, token_estimate: tokens });
  }

  // Load a conversation (read access — includes admin→employee and dev→anyone)
  if (action === 'load') {
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { conv, allowed } = await getConvWithAccess(id, false);
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const readOnly = conv.user_id !== user.id && !isDev(user);
    return NextResponse.json({ conversation: conv, readOnly });
  }

  // Delete a conversation (owner or dev only)
  if (action === 'delete') {
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { allowed } = await getConvWithAccess(id, true);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { error } = await supabase.from('ai_conversations').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Rename (owner or dev only)
  if (action === 'rename') {
    const { id, title } = body;
    if (!id || !title) return NextResponse.json({ error: 'id and title required' }, { status: 400 });
    const { allowed } = await getConvWithAccess(id, true);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { error } = await supabase.from('ai_conversations').update({ title }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Compact conversation — summarize and replace messages (owner or dev only)
  if (action === 'compact') {
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { conv, allowed } = await getConvWithAccess(id, true);
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const messages = conv.messages as any[];
    if (messages.length < 6) return NextResponse.json({ error: 'Too short to compact' }, { status: 400 });

    // Call Claude to summarize
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    if (!claudeKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    const summaryRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: 'Summarize this conversation into 3-5 bullet points. Include: key decisions made, data looked up, questions answered, and any pending items. Be concise and factual.',
        messages: [{ role: 'user', content: messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n') }],
      }),
    });

    if (!summaryRes.ok) return NextResponse.json({ error: 'Compaction failed' }, { status: 500 });
    const summaryData = await summaryRes.json();
    const summary = summaryData.content?.[0]?.text || 'Previous conversation (compacted)';

    // Keep last 4 messages + prepend summary
    const kept = messages.slice(-4);
    const compactedMessages = [
      { role: 'assistant', content: `**Previous conversation summary:**\n${summary}` },
      ...kept,
    ];

    const tokens = estimateTokens(compactedMessages);
    await supabase.from('ai_conversations').update({
      messages: compactedMessages,
      summary,
      token_estimate: tokens,
      compacted: true,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    return NextResponse.json({ success: true, summary, token_estimate: tokens, messages: compactedMessages });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
