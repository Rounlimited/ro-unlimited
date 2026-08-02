import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Text-to-speech for the AI voice conversation mode.
// Primary: Microsoft Edge neural voices (free, no key, no terms gate —
// the same voices Copilot Read Aloud uses). Groq Orpheus is kept as a
// fallback but is gated behind a one-time terms acceptance in the Groq
// console that has never been done (playai-tts is fully decommissioned),
// so Edge is the only path that actually works today. The client falls
// back to device speechSynthesis if everything here errors.
const EDGE_VOICES: Record<string, string> = {
  andrew: 'en-US-AndrewMultilingualNeural', // deep male — most ChatGPT-like
  brian: 'en-US-BrianMultilingualNeural',   // warm male
  guy: 'en-US-GuyNeural',                   // energetic male
  ava: 'en-US-AvaMultilingualNeural',       // polished female
  emma: 'en-US-EmmaMultilingualNeural',     // friendly female
  jenny: 'en-US-JennyNeural',               // classic assistant female
};
const DEFAULT_VOICE = 'andrew';

// Legacy Orpheus voice ids saved in localStorage before the Edge switch
const ORPHEUS_TO_EDGE: Record<string, string> = {
  troy: 'andrew', austin: 'brian', daniel: 'guy',
  autumn: 'ava', diana: 'emma', hannah: 'jenny',
};

function edgeSpeech(edgeVoice: string, input: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(edgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(input);
      const chunks: Buffer[] = [];
      // Short — sentence-sized chunks render in ~1s, so a slow attempt
      // should hand off to the relay fast rather than stalling speech
      const timer = setTimeout(() => reject(new Error('edge-tts timeout')), 7000);
      audioStream.on('data', (c: Buffer) => chunks.push(c));
      audioStream.on('end', () => {
        clearTimeout(timer);
        const buf = Buffer.concat(chunks);
        if (buf.length < 1000) reject(new Error('edge-tts empty audio'));
        else resolve(buf);
      });
      audioStream.on('error', (e: Error) => { clearTimeout(timer); reject(e); });
    } catch (e) { reject(e); }
  });
}

async function orpheusSpeech(apiKey: string, voice: string, input: string): Promise<Response> {
  return fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'canopylabs/orpheus-v1-english', voice, input, response_format: 'wav' }),
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

    const input = text.slice(0, 3000);
    let requested = typeof voice === 'string' ? voice.toLowerCase() : '';
    if (ORPHEUS_TO_EDGE[requested]) requested = ORPHEUS_TO_EDGE[requested];
    const voiceId = EDGE_VOICES[requested] ? requested : DEFAULT_VOICE;
    // Which engines were tried and why they failed — surfaced in the 502
    // body because Vercel runtime logs are impractical to tail
    const tried: Record<string, string> = {};

    try {
      const audio = await edgeSpeech(EDGE_VOICES[voiceId], input);
      return new Response(new Uint8Array(audio), {
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
      });
    } catch (err: any) {
      tried.edge = String(err?.message || err).slice(0, 200);
      console.error('[tts] Edge TTS error:', err?.message || err);
    }

    // Microsoft blocks Edge TTS from Vercel datacenter IPs — relay through
    // the Oracle box (tts-relay systemd service behind dav.rounlimited.com)
    const proxyUrl = process.env.TTS_PROXY_URL;
    if (proxyUrl) {
      try {
        const res = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tts-secret': process.env.TTS_PROXY_SECRET || '',
          },
          body: JSON.stringify({ text: input, voice: EDGE_VOICES[voiceId] }),
          signal: AbortSignal.timeout(28000),
        });
        if (res.ok) {
          const audio = await res.arrayBuffer();
          return new Response(audio, {
            headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
          });
        }
        tried.relay = `HTTP ${res.status}`;
        console.error('[tts] relay error:', res.status);
      } catch (err: any) {
        tried.relay = String(err?.message || err).slice(0, 200);
        console.error('[tts] relay error:', err?.message || err);
      }
    } else {
      tried.relay = 'skipped — TTS_PROXY_URL not set';
    }

    // Fallback: Groq Orpheus (works only once terms are accepted in console)
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      const res = await orpheusSpeech(apiKey, 'troy', input);
      if (res.ok) {
        const audio = await res.arrayBuffer();
        return new Response(audio, {
          headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' },
        });
      }
      const err = await res.text().catch(() => '');
      tried.orpheus = `HTTP ${res.status}`;
      console.error('[tts] Orpheus fallback error:', res.status, err.slice(0, 300));
    }

    return NextResponse.json({ error: 'TTS failed', tried }, { status: 502 });
  } catch (err: any) {
    console.error('[tts] error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
