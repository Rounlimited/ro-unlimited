'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Nexa AI module — voice conversation, running entirely on the one OpenRouter
 * account (no separate voice service to fund).
 *
 * How a turn works:
 *   1. A speech detector (a small neural model, not a loudness meter) runs in
 *      the browser and knows when you start and stop talking.
 *   2. The moment you stop, that clip goes to the server: fast speech-to-text,
 *      then the normal assistant (same tools, same model) answers as a stream.
 *   3. Each sentence is turned into speech as soon as it is written and played
 *      back-to-back, so the voice starts before the full answer exists.
 *   4. Talk over it and it ducks at once, then stops if you keep talking.
 *
 * What made the old voice mode poor was the loudness-threshold detector (it
 * misfired on noise and on its own voice) and waiting for whole answers.
 */

export type VoiceTurn = { role: 'user' | 'assistant'; content: string };
type Phase = 'starting' | 'listening' | 'hearing' | 'thinking' | 'speaking' | 'ended';

const VOICES = ['leo', 'rex', 'sal', 'atlas', 'orion', 'eve', 'ara', 'luna'];
const BRAINS: { key: string; label: string; note: string }[] = [
  { key: 'haiku', label: 'Fast', note: 'Quickest replies. Best for talking.' },
  { key: 'sonnet', label: 'Smart', note: 'Thinks harder. A little slower and costs more.' },
];
const OUT_RATE = 24000;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const VAD_VER = '0.0.22';
const ORT_VER = '1.14.0';
function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[data-nxa="${src}"]`)) return res();
    const s = document.createElement('script'); s.src = src; s.async = true; s.dataset.nxa = src;
    s.onload = () => res(); s.onerror = () => { s.remove(); rej(new Error('load failed')); };
    document.head.appendChild(s);
  });
}

function wavBase64(f32: Float32Array, rate: number): string {
  const n = f32.length; const buf = new ArrayBuffer(44 + n * 2); const v = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, f32[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  const bytes = new Uint8Array(buf); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(bin);
}
function resample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const n = Math.floor(input.length * to / from); const out = new Float32Array(n); const step = from / to;
  for (let i = 0; i < n; i++) { const p = i * step; const a = Math.floor(p); const b = Math.min(a + 1, input.length - 1); out[i] = input[a] + (input[b] - input[a]) * (p - a); }
  return out;
}
// What should be said aloud: no markdown, links or symbols
function speakable(t: string): string {
  return t.replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_#`>|]/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function AiVoice({ ctx, history, currentPage, onNavigate, onClose, onOutOfCredit }: {
  ctx: AudioContext;                       // created in the tap that opened voice (browsers require that)
  history: VoiceTurn[];
  currentPage: string | null;
  onNavigate: (path: string, description?: string) => void;
  onClose: (turns: VoiceTurn[]) => void;
  onOutOfCredit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('starting');
  const [err, setErr] = useState('');
  const [muted, setMuted] = useState(false);
  const [voice, setVoice] = useState(() => { const v = ls.get('nxa-voice') || ''; return VOICES.includes(v) ? v : 'leo'; });
  const [brain, setBrain] = useState(() => { const v = ls.get('nxa-voice-brain') || ''; return BRAINS.some((b) => b.key === v) ? v : 'haiku'; });
  const [bargeIn, setBargeIn] = useState(() => ls.get('nxa-voice-barge') !== '0');
  const [showSet, setShowSet] = useState(false);
  const [youSaid, setYouSaid] = useState('');
  const [aiSaying, setAiSaying] = useState('');
  const [toolLabel, setToolLabel] = useState('');
  const [spent, setSpent] = useState(0);
  const [basic, setBasic] = useState(false);

  const phaseRef = useRef<Phase>('starting');
  const setP = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const turnsRef = useRef<VoiceTurn[]>([]);
  const mutedRef = useRef(false); mutedRef.current = muted;
  const bargeRef = useRef(true); bargeRef.current = bargeIn;
  const voiceRef = useRef(voice); voiceRef.current = voice;
  const brainRef = useRef(brain); brainRef.current = brain;
  const endedRef = useRef(false);
  const micRef = useRef<MediaStream | null>(null);
  const vadRef = useRef<any>(null);
  const fallbackStopRef = useRef<(() => void) | null>(null);
  const outRef = useRef<GainNode | null>(null);
  const srcsRef = useRef<AudioBufferSourceNode[]>([]);
  const nextAtRef = useRef(0);
  const turnIdRef = useRef(0);                    // bumps on every new turn / interruption; stale work checks it and stops
  const abortRef = useRef<AbortController | null>(null);
  const bargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef(0);
  const outLevelRef = useRef(0);
  const wakeRef = useRef<any>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const playing = () => ctx.currentTime < nextAtRef.current - 0.03;

  const flushAudio = () => {
    for (const s of srcsRef.current) { try { s.onended = null; s.stop(); } catch { /* already stopped */ } }
    srcsRef.current = []; nextAtRef.current = 0;
    if (outRef.current) outRef.current.gain.value = 1;
  };

  const playPcm = (bytes: Uint8Array) => {
    const out = outRef.current; if (!out || bytes.length < 2) return;
    const n = bytes.length >> 1; const f32 = new Float32Array(n); const dv = new DataView(bytes.buffer, bytes.byteOffset, n * 2);
    let sum = 0;
    for (let i = 0; i < n; i++) { const x = dv.getInt16(i * 2, true) / 0x8000; f32[i] = x; if (!(i & 7)) sum += x * x; }
    outLevelRef.current = Math.min(1, Math.sqrt(sum / (n / 8 || 1)) * 4);
    const buf = ctx.createBuffer(1, n, OUT_RATE); buf.getChannelData(0).set(f32);
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(out);
    const at = Math.max(ctx.currentTime + 0.05, nextAtRef.current);
    src.start(at); nextAtRef.current = at + buf.duration;
    srcsRef.current.push(src);
    src.onended = () => { srcsRef.current = srcsRef.current.filter((x) => x !== src); };
  };

  // Stop the assistant now: you talked over it, or tapped the circle
  const interrupt = useCallback(() => {
    turnIdRef.current++;
    try { abortRef.current?.abort(); } catch { /* nothing running */ }
    flushAudio();
    setToolLabel('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speak one sentence: start fetching right away, play when it is this sentence's turn
  const speakQueueRef = useRef<Promise<void>>(Promise.resolve());
  const speak = (text: string, turn: number) => {
    const clean = speakable(text); if (!clean) return;
    const fetching = fetch('/api/admin/voice-tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: clean, voice: voiceRef.current }) }).catch(() => null);
    speakQueueRef.current = speakQueueRef.current.then(async () => {
      if (turn !== turnIdRef.current) return;
      const res = await fetching;
      if (!res || !res.ok || !res.body) return;
      const reader = res.body.getReader(); let carry: Uint8Array | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (turn !== turnIdRef.current) { try { reader.cancel(); } catch { /* done */ } return; }
        if (done) break;
        let chunk = value as Uint8Array;
        if (carry) { const j = new Uint8Array(carry.length + chunk.length); j.set(carry); j.set(chunk, carry.length); chunk = j; carry = null; }
        if (chunk.length & 1) { carry = chunk.slice(chunk.length - 1); chunk = chunk.subarray(0, chunk.length - 1); }
        if (chunk.length) { if (phaseRef.current !== 'speaking') setP('speaking'); playPcm(chunk); }
      }
    }).catch(() => {});
  };

  // One spoken turn: clip → text → assistant (tools) → sentences → voice
  const handleUtterance = async (audio16k: Float32Array) => {
    if (endedRef.current || mutedRef.current) return;
    if (audio16k.length < 16000 * 0.25) { if (!playing()) setP('listening'); return; }
    interrupt();
    const turn = turnIdRef.current;
    setP('thinking'); setAiSaying(''); setYouSaid('…');
    const ctl = new AbortController(); abortRef.current = ctl;
    speakQueueRef.current = Promise.resolve();
    let reply = ''; let pending = ''; let heard = ''; let nav: any = null; let first = true;
    const flushSentences = (final: boolean) => {
      for (;;) {
        // A sentence end, or a long clause at a comma for the very first words (so the voice starts sooner)
        const m = /[.!?…]["')\]]?(\s|$)|\n/.exec(pending);
        let cutAt = m ? m.index + m[0].length : -1;
        if (cutAt < 0 && first && pending.length > 90) { const c = pending.lastIndexOf(', '); if (c > 40) cutAt = c + 2; }
        if (cutAt < 0) break;
        const sentence = pending.slice(0, cutAt); pending = pending.slice(cutAt);
        if (speakable(sentence).length < 2) continue;
        speak(sentence, turn); first = false;
      }
      if (final && speakable(pending).length > 1) { speak(pending, turn); pending = ''; }
    };
    try {
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({
          mode: 'voice_turn', model: brainRef.current, currentPage, stream: true,
          audio: { data: wavBase64(audio16k, 16000), format: 'wav' },
          messages: [...history, ...turnsRef.current].slice(-30).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (turn !== turnIdRef.current) return;
      if (!res.headers.get('content-type')?.includes('ndjson') || !res.body) {
        const d = await res.json().catch(() => ({}));
        if (d.out_of_credit) { stopAll(); onOutOfCredit(); onClose(turnsRef.current); return; }
        setYouSaid(''); if (d.error) setToolLabel(d.error);
        setP('listening'); return;
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (turn !== turnIdRef.current) { try { reader.cancel(); } catch { /* done */ } break; }
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          let e: any; try { e = JSON.parse(line); } catch { continue; }
          if (e.type === 'heard') { heard = e.text; setYouSaid(heard); turnsRef.current.push({ role: 'user', content: heard }); }
          else if (e.type === 'delta' && e.text) { reply += e.text; pending += e.text; setAiSaying(speakable(reply)); setToolLabel(''); flushSentences(false); }
          else if (e.type === 'status' && e.label) { setToolLabel(e.label); flushSentences(true); }
          else if (e.type === 'done') { nav = (e.actions || []).find((a: any) => a.type === 'navigate' && a.path) || null; }
          else if (e.type === 'usage') setSpent((s) => s + (Number(e.charged_usd) || 0));
          else if (e.type === 'error' && !reply) { reply = 'Sorry, something went wrong. Say that again?'; pending = reply; }
        }
      }
    } catch { /* aborted by an interruption, or the network dropped */ }
    const mine = turn === turnIdRef.current;
    if (mine) flushSentences(true);
    if (reply.trim()) turnsRef.current.push({ role: 'assistant', content: reply.trim() + (mine ? '' : ' …') });
    if (!mine) return;
    if (nav) onNavigate(nav.path, nav.description);
    // Back to listening once the last sentence has finished playing
    await speakQueueRef.current;
    const wait = () => {
      if (turn !== turnIdRef.current || endedRef.current) return;
      if (playing()) { setTimeout(wait, 120); return; }
      setToolLabel(''); setP('listening');
    };
    wait();
  };

  // You started making sound while it was thinking or talking
  const onSpeechStart = () => {
    if (endedRef.current || mutedRef.current) return;
    const busy = phaseRef.current === 'speaking' || phaseRef.current === 'thinking';
    if (!busy) { setP('hearing'); return; }
    if (!bargeRef.current) return;
    // Duck at once; stop for real only if the talking continues (a cough or its own echo will not).
    if (outRef.current) outRef.current.gain.value = 0.2;
    if (bargeTimerRef.current) clearTimeout(bargeTimerRef.current);
    bargeTimerRef.current = setTimeout(() => { bargeTimerRef.current = null; interrupt(); setP('hearing'); setAiSaying(''); }, 380);
  };
  const onMisfire = () => {
    if (bargeTimerRef.current) { clearTimeout(bargeTimerRef.current); bargeTimerRef.current = null; }
    if (outRef.current) outRef.current.gain.value = 1;
    if (phaseRef.current === 'hearing') setP('listening');
  };
  const onSpeechEnd = (audio: Float32Array) => {
    const wasBusy = phaseRef.current === 'speaking' || phaseRef.current === 'thinking';
    if (bargeTimerRef.current) { clearTimeout(bargeTimerRef.current); bargeTimerRef.current = null; if (audio.length < 16000 * 0.45) { onMisfire(); return; } }
    if (wasBusy && !bargeRef.current) return;
    handleUtterance(audio);
  };

  // Fallback detector (only if the neural one cannot load): loudness against a moving noise floor
  const startBasicVad = (mic: MediaStream) => {
    const src = ctx.createMediaStreamSource(mic);
    const node = ctx.createScriptProcessor(2048, 1, 1);
    const sink = ctx.createGain(); sink.gain.value = 0; src.connect(node); node.connect(sink); sink.connect(ctx.destination);
    let floor = 0.006; let talking = false; let above = 0; let below = 0; let chunks: Float32Array[] = []; const pre: Float32Array[] = [];
    const frameMs = 2048 / ctx.sampleRate * 1000;
    node.onaudioprocess = (ev) => {
      const f = new Float32Array(ev.inputBuffer.getChannelData(0));
      let sum = 0; for (let i = 0; i < f.length; i++) sum += f[i] * f[i];
      const rms = Math.sqrt(sum / f.length); levelRef.current = Math.min(1, rms * 6);
      const thr = Math.max(0.018, floor * 3.2);
      if (!talking) {
        if (rms < thr) floor = floor * 0.97 + rms * 0.03;
        pre.push(f); if (pre.length > 6) pre.shift();
        above = rms > thr ? above + frameMs : 0;
        if (above >= 170) { talking = true; below = 0; chunks = [...pre]; onSpeechStart(); }
      } else {
        chunks.push(f);
        below = rms < thr * 0.7 ? below + frameMs : 0;
        const total = chunks.length * frameMs;
        if (below >= 800 || total > 30000) {
          talking = false; above = 0;
          const all = new Float32Array(chunks.reduce((n, c) => n + c.length, 0)); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
          chunks = [];
          if (total - below < 300) onMisfire(); else onSpeechEnd(resample(all, ctx.sampleRate, 16000));
        }
      }
    };
    fallbackStopRef.current = () => { try { node.disconnect(); src.disconnect(); sink.disconnect(); } catch { /* gone */ } };
  };

  const stopAll = useCallback(() => {
    endedRef.current = true; turnIdRef.current++;
    try { abortRef.current?.abort(); } catch { /* none */ }
    if (bargeTimerRef.current) clearTimeout(bargeTimerRef.current);
    flushAudio();
    try { vadRef.current?.pause?.(); vadRef.current?.destroy?.(); } catch { /* gone */ }
    fallbackStopRef.current?.();
    micRef.current?.getTracks().forEach((t) => t.stop());
    try { wakeRef.current?.release?.(); } catch { /* none */ }
    try { if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.srcObject = null; } } catch { /* gone */ }
    try { const as: any = (navigator as any).audioSession; if (as) as.type = 'auto'; } catch { /* older iOS */ }
    try { ctx.close(); } catch { /* closed */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const end = () => { stopAll(); onClose(turnsRef.current); };

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        await ctx.resume();
        const out = ctx.createGain(); out.gain.value = 1; outRef.current = out;
        // iPhone / iPad: with the microphone on, Safari sends plain web audio to the quiet
        // earpiece and obeys the silent switch. Telling it this is a two-way call, and playing
        // through a media element, puts the voice on the loudspeaker at normal volume.
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
        try { const as: any = (navigator as any).audioSession; if (as) as.type = 'play-and-record'; } catch { /* older iOS */ }
        if (isIOS) {
          const dest = ctx.createMediaStreamDestination(); out.connect(dest);
          const el = document.createElement('audio'); el.setAttribute('playsinline', ''); el.autoplay = true; el.srcObject = dest.stream;
          audioElRef.current = el; el.play().catch(() => { /* retried once the mic is live */ });
        } else out.connect(ctx.destination);
        const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } as any });
        if (dead) { mic.getTracks().forEach((t) => t.stop()); return; }
        micRef.current = mic;
        audioElRef.current?.play().catch(() => {});
        try {
          await loadScript(`https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/ort.js`);
          await loadScript(`https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@${VAD_VER}/dist/bundle.min.js`);
          const lib = (window as any).vad;
          if (!lib?.MicVAD) throw new Error('no vad');
          const v = await lib.MicVAD.new({
            stream: mic,
            baseAssetPath: `https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@${VAD_VER}/dist/`,
            onnxWASMBasePath: `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/`,
            positiveSpeechThreshold: 0.6, negativeSpeechThreshold: 0.4,
            redemptionFrames: 6, minSpeechFrames: 4, preSpeechPadFrames: 3,
            onSpeechStart, onSpeechEnd, onVADMisfire: onMisfire,
            onFrameProcessed: (p: any) => { levelRef.current = Math.max(levelRef.current, Math.min(1, (p?.isSpeech || 0) * 0.9)); },
          });
          if (dead) { v.destroy?.(); return; }
          vadRef.current = v; v.start();
        } catch {
          if (dead) return;
          setBasic(true); startBasicVad(mic);
        }
        try { wakeRef.current = await (navigator as any).wakeLock?.request?.('screen'); } catch { /* not supported */ }
        setP('listening');
      } catch (e: any) {
        if (dead) return;
        const name = e?.name || '';
        setErr(name === 'NotAllowedError' ? 'The microphone is blocked. Allow the microphone for this site, then try again.'
          : name === 'NotFoundError' ? 'No microphone was found.' : 'Could not start voice.');
        setP('ended');
      }
    })();
    // Coming back from another app, a phone call or the lock screen: wake the audio up again
    const wake = () => {
      if (document.visibilityState !== 'visible' || endedRef.current) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      audioElRef.current?.play().catch(() => {});
      (navigator as any).wakeLock?.request?.('screen').then((w: any) => { wakeRef.current = w; }).catch(() => {});
    };
    document.addEventListener('visibilitychange', wake);
    ctx.onstatechange = () => { if (!endedRef.current && (ctx.state as string) === 'interrupted') setToolLabel('Paused. Tap the circle to continue.'); };
    let raf = 0;
    const draw = () => {
      outLevelRef.current *= 0.93; levelRef.current *= 0.88;
      const lv = Math.max(playing() ? outLevelRef.current : 0, mutedRef.current ? 0 : levelRef.current);
      if (orbRef.current) orbRef.current.style.transform = `scale(${1 + lv * 0.32})`;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { dead = true; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', wake); if (!endedRef.current) stopAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickVoice = (id: string) => { setVoice(id); ls.set('nxa-voice', id); };
  const warm = (k: string) => { fetch('/api/admin/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'voice_warm', model: k, messages: [] }) }).catch(() => {}); };
  const pickBrain = (k: string) => { setBrain(k); ls.set('nxa-voice-brain', k); warm(k); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { warm(brainRef.current); }, []);
  const toggleBarge = () => { const v = !bargeIn; setBargeIn(v); ls.set('nxa-voice-barge', v ? '1' : '0'); };
  const toggleMute = () => { const m = !muted; setMuted(m); mutedRef.current = m; if (m && phaseRef.current === 'hearing') setP('listening'); };

  const label = err ? err
    : phase === 'starting' ? 'Getting ready…'
    : muted ? 'Microphone is off'
    : phase === 'hearing' ? 'Listening…'
    : phase === 'thinking' ? (toolLabel || 'Thinking…')
    : phase === 'speaking' ? (bargeIn ? 'Speaking. Just talk to cut in.' : 'Speaking. Tap the circle to cut in.')
    : phase === 'ended' ? 'Voice ended' : (toolLabel || 'Go ahead, I’m listening');

  return (
    <div className="nxv" role="dialog" aria-label="Voice conversation">
      <div className="nxv-top">
        <button className="nxa-pill" onClick={() => setShowSet((v) => !v)}>🔊 {cap(voice)} · {BRAINS.find((b) => b.key === brain)?.label}</button>
        <div className="nxv-time">{spent > 0 ? `$${spent.toFixed(2)} this call` : ''}</div>
        <button className="nxa-icon" aria-label="End voice" onClick={end}>✕</button>
      </div>

      {showSet && (
        <div className="nxv-set">
          <div className="nxa-grp" style={{ marginTop: 0 }}>Voice</div>
          <div className="nxv-voices">
            {VOICES.map((v) => <button key={v} className={'nxa-mini' + (v === voice ? ' on' : '')} onClick={() => pickVoice(v)}>{cap(v)}</button>)}
          </div>
          <div className="nxa-grp">Thinking</div>
          {BRAINS.map((b) => (
            <button key={b.key} className={'nxa-mrow' + (b.key === brain ? ' on' : '')} onClick={() => pickBrain(b.key)}>
              <div className="tx"><b>{b.label}</b><span>{b.note}</span></div>
            </button>
          ))}
          <div className="nxa-grp">Cutting in</div>
          <button className="nxa-mrow" onClick={toggleBarge}>
            <div className="tx"><b>{bargeIn ? 'Talk to cut in: on' : 'Talk to cut in: off'}</b><span>{bargeIn ? 'Start talking and it stops. If it keeps stopping itself on a loud speaker, turn this off.' : 'It finishes unless you tap the circle. Best on a loud speaker or a noisy site.'}</span></div>
          </button>
          {basic && <div className="nxa-rackstat" style={{ marginTop: 8 }}>The better speech detector could not load on this device, so a simpler one is in use. A quiet spot or headphones will help.</div>}
          <button className="nxa-btn" onClick={() => setShowSet(false)}>Done</button>
        </div>
      )}

      <div className="nxv-mid">
        <button className={'nxv-orbwrap ' + (err ? 'ended' : phase === 'starting' ? 'connecting' : phase) + (muted ? ' muted' : '')} aria-label="Tap to cut in"
          onClick={() => { if (ctx.state !== 'running') { ctx.resume().catch(() => {}); audioElRef.current?.play().catch(() => {}); setToolLabel(''); } if (phase === 'speaking' || phase === 'thinking') { interrupt(); setAiSaying(''); setP('listening'); } }}>
          <div className="nxv-orb" ref={orbRef} />
        </button>
        <div className={'nxv-label' + (err ? ' bad' : '')}>{label}</div>
        <div className="nxv-caps">
          {youSaid && <p className="you">{youSaid}</p>}
          {aiSaying && <p className="ai">{aiSaying}</p>}
        </div>
      </div>

      <div className="nxv-bar">
        {phase === 'ended' ? (
          <button className="nxv-btn end" onClick={() => onClose(turnsRef.current)}>Close</button>
        ) : (
          <>
            <button className={'nxv-btn' + (muted ? ' on' : '')} onClick={toggleMute}>{muted ? '🎤 Turn mic on' : '🎤 Mute'}</button>
            <button className="nxv-btn end" onClick={end}>End</button>
          </>
        )}
      </div>
    </div>
  );
}
