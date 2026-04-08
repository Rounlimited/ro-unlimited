import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// One-time migration: creates service_page_images table
// Hit GET /api/admin/migrate-service-images?secret=rou-migrate-2026

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== 'rou-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Create table using raw SQL via supabase-js
  const { error: tableError } = await supabase.rpc('exec_ddl', {
    sql: `CREATE TABLE IF NOT EXISTS service_page_images (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      division text NOT NULL,
      service_id text NOT NULL,
      image_type text NOT NULL CHECK (image_type IN ('hero', 'card', 'gallery')),
      image_url text NOT NULL,
      sort_order integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )`
  });

  // If exec_ddl doesn't exist, we need to create the table via the SQL editor
  // For now, try inserting a test row — if table doesn't exist, return instructions
  if (tableError) {
    return NextResponse.json({
      status: 'exec_ddl not available',
      instructions: 'Run this SQL in Supabase Dashboard > SQL Editor:',
      sql: `CREATE TABLE IF NOT EXISTS service_page_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  division text NOT NULL,
  service_id text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('hero', 'card', 'gallery')),
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spi_lookup ON service_page_images(division, service_id, image_type);
ALTER TABLE service_page_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "svc_all_service_page_images" ON service_page_images FOR ALL USING (true) WITH CHECK (true);`,
      error: tableError.message,
    });
  }

  return NextResponse.json({ status: 'Table created successfully' });
}
