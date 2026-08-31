import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { renderLetterPDF } from '@/lib/letter-pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: { id: string } };

/** The letter on company letterhead. ?download=1 to save rather than preview. */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = createAdminClient();
    const { data: letter, error } = await supabase
      .from('company_letters').select('*').eq('id', params.id).single();
    if (error || !letter) return NextResponse.json({ error: 'Letter not found' }, { status: 404 });

    const pdf = await renderLetterPDF(letter);
    const download = new URL(req.url).searchParams.get('download');
    const safe = (letter.title || 'letter').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60);

    return new NextResponse(pdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="RO-${safe || 'letter'}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[letters/pdf] error:', err);
    return NextResponse.json({ error: 'Could not build the PDF' }, { status: 500 });
  }
}
