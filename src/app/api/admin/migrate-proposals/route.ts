import { NextRequest, NextResponse } from 'next/server';

// TEMP migration route — delete after running once.
// GET /api/admin/migrate-proposals?secret=rou-migrate-2026

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'rou-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const statements = [
    `CREATE TABLE IF NOT EXISTS dev_proposals (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL DEFAULT 'Untitled proposal',
      template_id text NOT NULL DEFAULT 'upgrade-proposal',
      share_token text UNIQUE,
      status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','published','viewed','responded','approved')),
      content jsonb NOT NULL DEFAULT '{}'::jsonb,
      responses jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_by text,
      viewed_at timestamptz,
      approved_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_dev_proposals_share_token ON dev_proposals(share_token)`,
    `ALTER TABLE dev_proposals ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dev_proposals' AND policyname='svc_all_dev_proposals') THEN
        CREATE POLICY "svc_all_dev_proposals" ON dev_proposals FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of statements) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_ddl`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });
      const text = await res.text();
      results.push(res.ok
        ? { sql: sql.substring(0, 60), ok: true }
        : { sql: sql.substring(0, 60), ok: false, error: text });
    } catch (e: unknown) {
      results.push({ sql: sql.substring(0, 60), ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ results });
}
