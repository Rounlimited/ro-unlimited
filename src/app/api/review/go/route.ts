import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { reviewUrl } from '@/lib/review-request';

export const dynamic = 'force-dynamic';

/** Email button → logs that the review link was tapped → Google's review form. */
export async function GET(req: NextRequest) {
  const url = await reviewUrl();
  try {
    const t = req.nextUrl.searchParams.get('t') || '';
    if (/^[a-f0-9]{16,64}$/i.test(t)) {
      const supabase = createAdminClient();
      const { data: est } = await supabase.from('estimates').select('id').eq('share_token', t).maybeSingle();
      if (est) await supabase.from('document_events').insert({ doc_type: 'estimate', doc_id: est.id, event: 'review_click', internal: false });
    }
  } catch { /* never block the redirect */ }
  return NextResponse.redirect(url, 302);
}
