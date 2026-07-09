import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Text-to-speech for the AI voice conversation mode.
// Primary: Groq Orpheus (canopylabs) — professionally-trained natural
// voices (superseded PlayAI on GroqCloud). Fallback: playai-tts, then the
// client falls back to device speechSynthesis if everything errors.
const ORPHEUS_VOICES = new Set(['autumn', 'diana', 'hannah', 'austin', 'daniel', 'troy']);

async function groqSpeech(apiKey: string, model: string, voice: string, input: string): Promise<Response> {
  return fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, voice, input, response_format: 'wav' }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });

    const input = text.slice(0, 3000);
    const requested = typeof voice === 'string' ? voice.toLowerCase() : '';
    const orpheusVoice = ORPHEUS_VOICES.has(requested) ? requested : 'troy';

    let res = await groqSpeech(apiKey, 'canopylabs/orpheus-v1-english', orpheusVoice, input);

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('[tts] Orpheus error:', res.status, err.slice(0, 300));
      // Fallback to the older PlayAI model in case Orpheus is unavailable
      res = await groqSpeech(apiKey, 'playai-tts', 'Fritz-PlayAI', input);
      if (!res.ok) {
        const err2 = await res.text().catch(() => '');
        console.error('[tts] PlayAI fallback error:', res.status, err2.slice(0, 300));
        return NextResponse.json({ error: 'TTS failed' }, { status: 502 });
      }
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error('[tts] error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
