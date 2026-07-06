import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Text-to-speech for the AI voice conversation mode.
// Groq PlayAI Dialog (natural conversational voice, ~$50/1M chars).
// The client falls back to the device's built-in speechSynthesis if this
// route errors, so TTS model deprecations degrade gracefully.
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

    const res = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'playai-tts',
        voice: voice || 'Fritz-PlayAI',
        input: text.slice(0, 3000),
        response_format: 'wav',
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('[tts] Groq TTS error:', res.status, err.slice(0, 300));
      return NextResponse.json({ error: 'TTS failed' }, { status: 502 });
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
