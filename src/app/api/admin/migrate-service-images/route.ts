import { NextRequest, NextResponse } from 'next/server';

// One-time migration: creates service_page_images table
// GET /api/admin/migrate-service-images?secret=rou-migrate-2026

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'rou-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const statements = [
    `CREATE TABLE IF NOT EXISTS service_page_images (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      division text NOT NULL,
      service_id text NOT NULL,
      image_type text NOT NULL CHECK (image_type IN ('hero','card','gallery')),
      image_url text NOT NULL,
      sort_order integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_spi_lookup ON service_page_images(division, service_id, image_type)`,
    `ALTER TABLE service_page_images ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='service_page_images' AND policyname='svc_all_service_page_images') THEN
        CREATE POLICY "svc_all_service_page_images" ON service_page_images FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of statements) {
    try {
      // Use Supabase pg-meta SQL execution endpoint
      const res = await fetch(`${supabaseUrl}/pg/query`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'X-Supabase-Project-Ref': 'ocizuduhqsmewcmtilae',
        },
        body: JSON.stringify({ query: sql }),
      });

      if (res.ok) {
        results.push({ sql: sql.substring(0, 60), ok: true });
      } else {
        const text = await res.text();
        // Try alternate endpoint
        const res2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_ddl`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql }),
        });
        if (res2.ok) {
          results.push({ sql: sql.substring(0, 60), ok: true });
        } else {
          results.push({ sql: sql.substring(0, 60), ok: false, error: text });
        }
      }
    } catch (e: unknown) {
      results.push({ sql: sql.substring(0, 60), ok: false, error: String(e) });
    }
  }

  const allOk = results.every(r => r.ok);

  if (!allOk) {
    return NextResponse.json({
      status: 'Some statements failed — run manually in Supabase SQL Editor',
      results,
      manualSql: `-- Run this in Supabase Dashboard > SQL Editor:
CREATE TABLE IF NOT EXISTS service_page_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  division text NOT NULL,
  service_id text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('hero','card','gallery')),
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spi_lookup ON service_page_images(division, service_id, image_type);
ALTER TABLE service_page_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "svc_all_service_page_images" ON service_page_images FOR ALL USING (true) WITH CHECK (true);`,
    });
  }

  return NextResponse.json({ status: 'All tables created successfully', results });
}
