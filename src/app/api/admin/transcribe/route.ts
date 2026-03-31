import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: 'Transcription not configured' }, { status: 500 });

  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as File | null;
    if (!audio) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });

    const groqForm = new FormData();
    groqForm.append('file', audio, audio.name || 'audio.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('response_format', 'json');
    groqForm.append('language', 'en');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: groqForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[transcribe] Groq error:', res.status, err.slice(0, 200));
      return NextResponse.json({ error: 'Transcription failed' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ transcript: data.text || '' });
  } catch (err: any) {
    console.error('[transcribe] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
