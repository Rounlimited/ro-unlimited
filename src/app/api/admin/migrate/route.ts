import { NextRequest, NextResponse } from 'next/server';

// TEMP migration route — delete after running once
// Hit GET /api/admin/migrate to create email tables

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'rou-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const statements = [
    `CREATE TABLE IF NOT EXISTS email_messages (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      thread_id uuid NOT NULL DEFAULT gen_random_uuid(),
      lead_id uuid,
      direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
      from_email text NOT NULL,
      to_email text NOT NULL,
      subject text NOT NULL DEFAULT '(no subject)',
      body_html text,
      body_text text,
      resend_message_id text,
      read boolean NOT NULL DEFAULT false,
      starred boolean NOT NULL DEFAULT false,
      folder text NOT NULL DEFAULT 'inbox' CHECK (folder IN ('inbox','sent','drafts','trash','spam')),
      is_draft boolean NOT NULL DEFAULT false,
      has_attachments boolean NOT NULL DEFAULT false,
      cc_emails text[] NOT NULL DEFAULT '{}',
      bcc_emails text[] NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(thread_id)`,
    `CREATE INDEX IF NOT EXISTS idx_email_messages_folder ON email_messages(folder)`,
    `CREATE INDEX IF NOT EXISTS idx_email_messages_created_at ON email_messages(created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS email_attachments (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      message_id uuid NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
      filename text NOT NULL,
      content_type text NOT NULL DEFAULT 'application/octet-stream',
      size_bytes integer NOT NULL DEFAULT 0,
      s3_key text NOT NULL DEFAULT '',
      s3_url text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_email_attachments_message_id ON email_attachments(message_id)`,
    `CREATE TABLE IF NOT EXISTS email_contacts (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      phone text,
      company text,
      category text NOT NULL DEFAULT 'other' CHECK (category IN ('customer','vendor','contractor','subcontractor','other')),
      notes text,
      starred boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_email_contacts_email ON email_contacts(email)`,
    `ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_messages' AND policyname='svc_all_email_messages') THEN
        CREATE POLICY "svc_all_email_messages" ON email_messages FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_attachments' AND policyname='svc_all_email_attachments') THEN
        CREATE POLICY "svc_all_email_attachments" ON email_attachments FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_contacts' AND policyname='svc_all_email_contacts') THEN
        CREATE POLICY "svc_all_email_contacts" ON email_contacts FOR ALL USING (true) WITH CHECK (true);
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
      if (res.ok) {
        results.push({ sql: sql.substring(0, 60), ok: true });
      } else {
        results.push({ sql: sql.substring(0, 60), ok: false, error: text });
      }
    } catch (e: unknown) {
      results.push({ sql: sql.substring(0, 60), ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ results });
}
