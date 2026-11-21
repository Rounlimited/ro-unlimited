import { NextRequest, NextResponse } from 'next/server';

/**
 * RO connector for the Claude app (TEST, look-ups only).
 *
 * A remote MCP server (Streamable HTTP, JSON responses) that Claude's own apps can add as a custom connector, so a
 * Claude subscriber can ask about RO's customers, estimates, invoices and tasks, by typing or by voice, in the Claude
 * app. The secret in the address is the only lock for this test, so it offers look-up tools only; the tools run in
 * the ai-chat route with the same code the RO assistant uses. Switched off unless MCP_TEST_KEY is set.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
const INSTRUCTIONS = 'Tools for RO Unlimited, a commercial general contractor in South Carolina. Use them to look up the owner\'s customers, estimates (also called bids, proposals or contracts), invoices, tasks and business numbers. They only read; nothing can be changed through them. Answer in short, plain sentences.';

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: any };
const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id, result });
const bad = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function inner(body: unknown) {
  const r = await fetch(`${SITE}/api/admin/ai-chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-push-secret': process.env.PUSH_SECRET || '' },
    body: JSON.stringify(body), cache: 'no-store',
  });
  return r.json().catch(() => ({}));
}

async function handle(m: Rpc) {
  const id = m.id ?? null;
  switch (m.method) {
    case 'initialize':
      return ok(id, { protocolVersion: m.params?.protocolVersion || '2025-06-18', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'ro-unlimited', title: 'RO Unlimited', version: '0.1.0' }, instructions: INSTRUCTIONS });
    case 'ping':
      return ok(id, {});
    case 'tools/list': {
      const d = await inner({ mode: 'mcp_list' });
      const tools = (Array.isArray(d.tools) ? d.tools : []).map((t: any) => ({
        name: t.name, description: String(t.description || '').slice(0, 2000), inputSchema: t.input_schema || { type: 'object', properties: {} },
        annotations: { readOnlyHint: true, openWorldHint: false },
      }));
      return ok(id, { tools });
    }
    case 'tools/call': {
      const d = await inner({ mode: 'mcp_tool', tool: { name: m.params?.name, args: m.params?.arguments || {} } });
      const text = typeof d.result === 'string' ? d.result : JSON.stringify(d);
      return ok(id, { content: [{ type: 'text', text }], isError: /^\{"error"/.test(text) });
    }
    case 'resources/list': return ok(id, { resources: [] });
    case 'prompts/list': return ok(id, { prompts: [] });
    default:
      return bad(id, -32601, `Method not found: ${m.method}`);
  }
}

const allowed = (key: string) => !!process.env.MCP_TEST_KEY && key === process.env.MCP_TEST_KEY;

export async function POST(req: NextRequest, { params }: { params: { key: string } }) {
  if (!allowed(params.key)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(bad(null, -32700, 'Parse error'), { status: 400 });
  const list: Rpc[] = Array.isArray(body) ? body : [body];
  const out = [];
  for (const m of list) { if (m && m.id !== undefined && m.id !== null) out.push(await handle(m)); }
  if (!out.length) return new NextResponse(null, { status: 202 });           // notifications only
  return NextResponse.json(Array.isArray(body) ? out : out[0], { headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  if (!allowed(params.key)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse('This connector answers over POST only.', { status: 405, headers: { Allow: 'POST' } });
}

export async function DELETE() { return new NextResponse(null, { status: 204 }); }
