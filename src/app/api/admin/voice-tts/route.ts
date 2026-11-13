import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Nexa AI module — the assistant's voice. Turns one sentence into speech and
 * streams the sound back as it is made (raw 24 kHz PCM), so the page can start
 * playing within a few hundred milliseconds. Runs on the OpenRouter account
 * like everything else; the cost is counted with the spoken turn in ai-chat.
 */
export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return NextResponse.json({ error: 'Voice is not set up yet.' }, { status: 503 });
  const b = await req.json().catch(() => ({}));
  const text = typeof b.text === 'string' ? b.text.trim().slice(0, 1200) : '';
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });
  const voice = typeof b.voice === 'string' && /^[a-z0-9_-]{2,40}$/i.test(b.voice) ? b.voice : 'leo';

  const r = await fetch('https://openrouter.ai/api/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.VOICE_TTS_MODEL || 'x-ai/grok-voice-tts-1.0', input: text, voice, response_format: 'pcm' }),
  });
  if (!r.ok || !r.body) {
    console.error('[voice-tts]', r.status, (await r.text().catch(() => '')).slice(0, 200));
    return NextResponse.json({ error: 'Voice failed' }, { status: 502 });
  }
  return new Response(r.body, {
    headers: { 'Content-Type': 'audio/pcm;rate=24000;channels=1', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  });
}
