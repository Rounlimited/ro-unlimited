import { NextResponse } from 'next/server';

// One-time migration route — DELETE THIS FILE after running
// Hit: GET http://localhost:3100/api/migrate-email

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  // We'll insert a bootstrap row to trigger table creation via a stored procedure.
  // But first, check if the table already exists by trying to query it.
  const checkRes = await fetch(`${supabaseUrl}/rest/v1/email_messages?limit=1`, { headers });
  
  if (checkRes.status === 200) {
    return NextResponse.json({ message: 'Tables already exist ✓', status: 200 });
  }

  // Tables don't exist — we need to run DDL.
  // Supabase service_role cannot run DDL via REST directly.
  // Use the pg library via a small inline node script approach.
  // Actually: call a migration via Supabase's internal pg endpoint with service role

  // The correct approach: POST to /rest/v1/rpc/exec_sql if we can create that function.
  // Bootstrap: create the exec_sql function first using the postgres REST internal API.

  // Supabase exposes postgres functions via /rest/v1/rpc/{function_name}
  // We need to create the function first - but that requires DDL access.
  // 
  // REAL solution: use node-postgres (pg) with the connection string.
  // The DB host is: db.czyphstkjyqhpzlwxued.supabase.co
  // The password is in the Supabase dashboard — we need it stored as env var.

  // For now return diagnostic info
  const diagRes = await fetch(`${supabaseUrl}/rest/v1/`, { headers });
  const diagData = await diagRes.json();
  
  return NextResponse.json({ 
    message: 'Tables do not exist yet. Need PAT or DB password to create them via DDL.',
    checkStatus: checkRes.status,
    checkError: await checkRes.text(),
    availableEndpoints: Object.keys(diagData?.paths || {}).slice(0, 20),
  });
}
