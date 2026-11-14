'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceTurn } from './AiVoice';

/**
 * Nexa AI module — LIVE voice (the fast engine).
 *
 * One open line to a speech-to-speech model: it hears you as you talk and
 * answers in about a second, and talking over it stops it. That line is billed
 * per minute it is open, so it is only open while a conversation is going:
 *
 *   - A free speech detector runs on the phone the whole time.
 *   - After ~20 seconds of quiet the paid line hangs up. The screen stays put.
 *   - When you speak again the line reconnects (well under a second). What you
 *     said while it was reconnecting is held on the phone and sent first, and
 *     the conversation so far is handed back so it remembers.
 *
 * If the live service cannot start (not funded, or down) the screen falls back
 * to the standard voice, which runs per spoken turn on the main account.
 */

type Phase = 'starting' | 'resting' | 'connecting' | 'listening' | 'hearing' | 'thinking' | 'speaking' | 'ended';
const RATE = 24000;
const IDLE_HANGUP_MS = 20000;
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
const WORKLET = `class P extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor('nxa-mic',P);`;

function b64FromPcm(f32: Float32Array): string {
  const buf = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) { const s = Math.max(-1, Math.min(1, f32[i])); buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
  const bytes = new Uint8Array(buf.buffer); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(bin);
}
function pcmFromB64(b64: string): Float32Array {
  const bin = atob(b64); const n = bin.length >> 1; const out = new Float32Array(n);
  for (let i = 0; i < n; i++) { let v = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8); if (v >= 0x8000) v -= 0x10000; out[i] = v / 0x8000; }
  return out;
}
function resample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const n = Math.floor(input.length * to / from); const out = new Float32Array(n); const step = from / to;
  for (let i = 0; i < n; i++) { const p = i * step; const a = Math.floor(p); const b = Math.min(a + 1, input.length - 1); out[i] = input[a] + (input[b] - input[a]) * (p - a); }
  return out;
}

export default function AiVoiceLive({ ctx, history, currentPage, onNavigate, onClose, onOutOfCredit, onFallback }: {
  ctx: AudioContext;
  history: VoiceTurn[];
  currentPage: string | null;
  onNavigate: (path: string, description?: string) => void;
  onClose: (turns: VoiceTurn[]) => void;
  onOutOfCredit: () => void;
  onFallback: (byChoice: boolean) => void;   // switch to the standard voice (ctx is still open and handed over)
}) {
  const [phase, setPhaseState] = useState<Phase>('starting');
  const [err, setErr] = useState('');
  const [muted, setMuted] = useState(false);
  const [voices, setVoices] = useState<string[]>([]);
  const [voice, setVoice] = useState(() => ls.get('nxa-voice') || 'leo');
  const [bargeIn, setBargeIn] = useState(() => ls.get('nxa-voice-barge') !== '0');
  const [showSet, setShowSet] = useState(false);
  const [youSaid, setYouSaid] = useState('');
  const [aiSaying, setAiSaying] = useState('');
  const [toolLabel, setToolLabel] = useState('');
  const [liveSecs, setLiveSecs] = useState(0);
  const [perMin, setPerMin] = useState(0);

  const phaseRef = useRef<Phase>('starting');
  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };
  const startRef = useRef<any>(null);                 // { url, session, usage_id }
  const wsRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);                     // session configured, safe to stream audio
  const connectingRef = useRef(false);
  const queueRef = useRef<Float32Array[]>([]);        // what you said while the line was (re)connecting
  const prerollRef = useRef<Float32Array[]>([]);      // the last ~1.2 s, so the first word is never clipped
  const micRef = useRef<MediaStream | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const vadRef = useRef<any>(null);
  const outRef = useRef<GainNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const srcsRef = useRef<AudioBufferSourceNode[]>([]);
  const nextAtRef = useRef(0);
  const turnsRef = useRef<VoiceTurn[]>([]);
  const mutedRef = useRef(false); mutedRef.current = muted;
  const bargeRef = useRef(true); bargeRef.current = bargeIn;
  const voiceRef = useRef(voice); voiceRef.current = voice;
  const endedRef = useRef(false);
  const handedOffRef = useRef(false);
  const curRespRef = useRef('');
  const droppedRef = useRef<Set<string>>(new Set());
  const toolsRef = useRef<Promise<void>[]>([]);
  const busyToolsRef = useRef(0);
  const aiTextRef = useRef('');
  const lastActiveRef = useRef(Date.now());
  const connectedAtRef = useRef(0);
  const connectedMsRef = useRef(0);
  const lastBilledRef = useRef(-1);
  const orbRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef(0);
  const outLevelRef = useRef(0);
  const wakeRef = useRef<any>(null);
  const loudMsRef = useRef(0);
  const hasNeuralRef = useRef(false);

  const api = (body: any, keepalive = false) => fetch('/api/admin/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive });
  const send = (o: any) => { const w = wsRef.current; if (w && w.readyState === 1) w.send(JSON.stringify(o)); };
  const playing = () => ctx.currentTime < nextAtRef.current - 0.04;
  const touch = () => { lastActiveRef.current = Date.now(); };
  const totalConnectedMs = () => connectedMsRef.current + (connectedAtRef.current ? Date.now() - connectedAtRef.current : 0);

  const flushAudio = () => {
    for (const s of srcsRef.current) { try { s.onended = null; s.stop(); } catch { /* already stopped */ } }
    srcsRef.current = []; nextAtRef.current = 0;
  };
  const play = (f32: Float32Array) => {
    const out = outRef.current; if (!out) return;
    const buf = ctx.createBuffer(1, f32.length, RATE); buf.getChannelData(0).set(f32);
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(out);
    const at = Math.max(ctx.currentTime + 0.04, nextAtRef.current);
    src.start(at); nextAtRef.current = at + buf.duration; srcsRef.current.push(src);
    src.onended = () => {
      srcsRef.current = srcsRef.current.filter((x) => x !== src);
      if (!srcsRef.current.length && !endedRef.current && phaseRef.current === 'speaking') { touch(); setPhase(busyToolsRef.current > 0 || curRespRef.current ? 'thinking' : 'listening'); }
    };
    let sum = 0; for (let i = 0; i < f32.length; i += 8) sum += f32[i] * f32[i];
    outLevelRef.current = Math.min(1, Math.sqrt(sum / (f32.length / 8 || 1)) * 4);
  };

  const interrupt = useCallback(() => {
    if (curRespRef.current) droppedRef.current.add(curRespRef.current);
    flushAudio();
    send({ type: 'response.cancel' });
    if (aiTextRef.current.trim()) { turnsRef.current.push({ role: 'assistant', content: aiTextRef.current.trim() + ' …' }); aiTextRef.current = ''; }
    setAiSaying(''); setToolLabel('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bill = async (final = false) => {
    const id = startRef.current?.usage_id; if (!id) return;
    const secs = Math.round(totalConnectedMs() / 1000);
    if (!final && secs === lastBilledRef.current) return;
    lastBilledRef.current = secs;
    try {
      const r = await api({ mode: 'voice_live_bill', messages: [], usage_id: id, seconds: secs }, final);
      if (final) return;
      const d = await r.json();
      if (d.stop && !endedRef.current) { stopAll(); onOutOfCredit(); onClose(turnsRef.current); }
    } catch { /* next beat */ }
  };

  const runTool = (name: string, callId: string, argStr: string) => {
    busyToolsRef.current++;
    const p = (async () => {
      let args: any = {};
      try { args = JSON.parse(argStr || '{}'); } catch { /* the tool reports what is missing */ }
      let output = JSON.stringify({ error: 'Tool failed' });
      try {
        const r = await api({ mode: 'voice_tool', messages: [], tool: { name, args } });
        const d = await r.json();
        if (d.label) setToolLabel(d.label);
        output = d.result || output;
        if (d.action?.type === 'navigate' && d.action.path) onNavigate(d.action.path, d.action.description);
      } catch { /* keep the error output */ }
      send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output } });
      busyToolsRef.current--; touch();
    })();
    toolsRef.current.push(p);
  };

  const onEvent = (e: any) => {
    switch (e.type) {
      case 'session.updated': {
        if (readyRef.current) break;
        readyRef.current = true; connectingRef.current = false;
        // Send what was said while the line was coming up, oldest first, then go live
        const q = queueRef.current; queueRef.current = [];
        for (const f of q) send({ type: 'input_audio_buffer.append', audio: b64FromPcm(f) });
        touch();
        if (phaseRef.current === 'connecting') setPhase(q.length ? 'hearing' : 'listening');
        break;
      }
      case 'input_audio_buffer.speech_started':
        touch();
        if (playing() || curRespRef.current) { if (bargeRef.current) interrupt(); else break; }
        setPhase('hearing'); setYouSaid('');
        break;
      case 'input_audio_buffer.speech_stopped': touch(); setPhase('thinking'); break;
      case 'conversation.item.input_audio_transcription.updated': if (e.transcript) setYouSaid(e.transcript); break;
      case 'conversation.item.input_audio_transcription.completed':
        if (e.transcript && e.transcript.trim()) { setYouSaid(e.transcript.trim()); turnsRef.current.push({ role: 'user', content: e.transcript.trim() }); }
        break;
      case 'response.created': curRespRef.current = e.response?.id || ''; aiTextRef.current = ''; setAiSaying(''); touch(); break;
      case 'response.output_audio.delta':
      case 'response.audio.delta':
        if (e.response_id && droppedRef.current.has(e.response_id)) break;
        touch(); if (phaseRef.current !== 'speaking') setPhase('speaking'); setToolLabel('');
        play(pcmFromB64(e.delta));
        break;
      case 'response.output_audio_transcript.delta':
        if (e.response_id && droppedRef.current.has(e.response_id)) break;
        aiTextRef.current += e.delta || ''; setAiSaying(aiTextRef.current);
        break;
      case 'response.function_call_arguments.done':
        touch(); if (!playing()) setPhase('thinking'); setToolLabel('Working on it…');
        runTool(e.name, e.call_id, e.arguments);
        break;
      case 'response.done': {
        const id = e.response?.id || e.response_id || '';
        const cancelled = e.response?.status === 'cancelled' || droppedRef.current.has(id);
        if (!cancelled && aiTextRef.current.trim()) turnsRef.current.push({ role: 'assistant', content: aiTextRef.current.trim() });
        if (curRespRef.current === id) curRespRef.current = '';
        const pending = toolsRef.current; toolsRef.current = [];
        if (pending.length && !cancelled) Promise.all(pending).then(() => send({ type: 'response.create' }));
        else if (!playing() && !cancelled && phaseRef.current === 'thinking') setPhase('listening');
        touch();
        break;
      }
      case 'error': {
        const msg = e.error?.message || e.message || '';
        if (!/cancel|no active response|not found/i.test(msg)) console.warn('[voice-live]', msg);
        break;
      }
    }
  };

  // Open (or reopen) the paid line
  const connect = async () => {
    if (endedRef.current || connectingRef.current || wsRef.current) return;
    connectingRef.current = true; readyRef.current = false;
    if (phaseRef.current === 'resting') setPhase('connecting');
    try {
      let protocols: string[] = startRef.current.protocols;
      if (!protocols) {
        const r = await api({ mode: 'voice_live_token', messages: [], usage_id: startRef.current.usage_id });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'reconnect failed');
        protocols = d.protocols;
      }
      startRef.current.protocols = null;   // a token opens one line only
      if (endedRef.current) return;
      const ws = new WebSocket(startRef.current.url, protocols);
      wsRef.current = ws;
      ws.onopen = () => {
        connectedAtRef.current = Date.now();
        // After a hang-up the model starts fresh, so hand it the conversation so far
        const said = turnsRef.current.slice(-24).map((t) => `${t.role === 'user' ? 'User' : 'You'}: ${t.content.slice(0, 600)}`).join('\n');
        const session = { ...startRef.current.session, voice: voiceRef.current };
        if (said) session.instructions = `${session.instructions}\n\n## EARLIER IN THIS CALL (spoken). Carry on from here; do not greet again.\n${said}`;
        ws.send(JSON.stringify({ type: 'session.update', session }));
      };
      ws.onmessage = (m) => { try { onEvent(JSON.parse(m.data)); } catch { /* not JSON */ } };
      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        if (connectedAtRef.current) { connectedMsRef.current += Date.now() - connectedAtRef.current; connectedAtRef.current = 0; }
        readyRef.current = false; connectingRef.current = false; curRespRef.current = '';
        bill();
        if (endedRef.current) return;
        flushAudio(); setToolLabel('');
        setPhase('resting');
      };
    } catch {
      connectingRef.current = false; queueRef.current = [];
      if (!endedRef.current) { setToolLabel('Could not connect. Try again in a moment.'); setPhase('resting'); }
    }
  };

  const hangUp = () => { try { wsRef.current?.close(); } catch { /* closed */ } };

  // Every chunk of microphone sound comes through here
  const onMic = (f24: Float32Array, rms: number) => {
    levelRef.current = Math.min(1, rms * 6);
    if (mutedRef.current) { prerollRef.current = []; return; }
    // Without the neural detector, plain loudness decides when to wake the line
    if (!hasNeuralRef.current) { loudMsRef.current = rms > 0.03 ? loudMsRef.current + 80 : 0; if (loudMsRef.current >= 240) onLocalSpeech(); }
    if (readyRef.current) {
      if (!bargeRef.current && playing()) return;       // cut-in off: it must not hear itself
      send({ type: 'input_audio_buffer.append', audio: b64FromPcm(f24) });
      return;
    }
    if (connectingRef.current) { queueRef.current.push(f24); if (queueRef.current.length > 190) queueRef.current.shift(); return; }
    prerollRef.current.push(f24); if (prerollRef.current.length > 15) prerollRef.current.shift();
  };

  // The free on-phone detector heard you start talking
  const onLocalSpeech = () => {
    if (endedRef.current || mutedRef.current) return;
    touch();
    if (!wsRef.current && !connectingRef.current) {
      queueRef.current = prerollRef.current; prerollRef.current = [];
      setYouSaid(''); setAiSaying('');
      connect();
    }
  };

  const stopAll = useCallback(() => {
    endedRef.current = true;
    try { wsRef.current?.close(); } catch { /* closed */ }
    if (connectedAtRef.current) { connectedMsRef.current += Date.now() - connectedAtRef.current; connectedAtRef.current = 0; }
    flushAudio();
    try { vadRef.current?.pause?.(); vadRef.current?.destroy?.(); } catch { /* gone */ }
    micRef.current?.getTracks().forEach((t) => t.stop());
    for (const n of nodesRef.current) { try { n.disconnect(); } catch { /* gone */ } }
    try { wakeRef.current?.release?.(); } catch { /* none */ }
    try { if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.srcObject = null; } } catch { /* gone */ }
    bill(true);
    if (!handedOffRef.current) {
      try { const as: any = (navigator as any).audioSession; if (as) as.type = 'auto'; } catch { /* older iOS */ }
      try { ctx.close(); } catch { /* closed */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const end = () => { stopAll(); onClose(turnsRef.current); };
  const useStandard = () => { ls.set('nxa-voice-engine', 'standard'); handedOffRef.current = true; stopAll(); onFallback(true); };

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        await ctx.resume();
        // 1. Can the live service start at all? (Before touching the microphone.)
        const r = await api({ mode: 'voice_live_start', messages: history.slice(-12), currentPage });
        const d = await r.json().catch(() => ({}));
        if (dead) return;
        if (!r.ok) {
          if (d.out_of_credit) { endedRef.current = true; onOutOfCredit(); onClose([]); return; }
          handedOffRef.current = true; endedRef.current = true; onFallback(false); return;
        }
        startRef.current = d; setPerMin(d.price_per_min || 0);
        const list: string[] = Array.isArray(d.voices) ? d.voices : [];
        setVoices(list);
        if (!list.includes(voiceRef.current)) { voiceRef.current = list[0] || 'leo'; setVoice(voiceRef.current); }

        // 2. Sound out (iPhone needs the loudspeaker route — see AiVoice)
        const out = ctx.createGain(); out.gain.value = 1; outRef.current = out;
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
        try { const as: any = (navigator as any).audioSession; if (as) as.type = 'play-and-record'; } catch { /* older iOS */ }
        if (isIOS) {
          const dest = ctx.createMediaStreamDestination(); out.connect(dest);
          const el = document.createElement('audio'); el.setAttribute('playsinline', ''); el.autoplay = true; el.srcObject = dest.stream;
          audioElRef.current = el; el.play().catch(() => {});
        } else out.connect(ctx.destination);

        // 3. Microphone
        const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } as any });
        if (dead) { mic.getTracks().forEach((t) => t.stop()); return; }
        micRef.current = mic; audioElRef.current?.play().catch(() => {});
        const src = ctx.createMediaStreamSource(mic);
        const sink = ctx.createGain(); sink.gain.value = 0; sink.connect(ctx.destination);
        let acc: Float32Array[] = []; let accLen = 0; const chunk = Math.round(ctx.sampleRate * 0.08);
        const feed = (f: Float32Array) => {
          acc.push(f); accLen += f.length;
          if (accLen < chunk) return;
          const all = new Float32Array(accLen); let o = 0; for (const a of acc) { all.set(a, o); o += a.length; }
          acc = []; accLen = 0;
          let sum = 0; for (let i = 0; i < all.length; i += 4) sum += all[i] * all[i];
          onMic(resample(all, ctx.sampleRate, RATE), Math.sqrt(sum / (all.length / 4)));
        };
        try {
          const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
          await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
          const node = new AudioWorkletNode(ctx, 'nxa-mic');
          node.port.onmessage = (ev) => feed(ev.data as Float32Array);
          src.connect(node); node.connect(sink); nodesRef.current = [src, node, sink, out];
        } catch {
          const node = ctx.createScriptProcessor(2048, 1, 1);
          node.onaudioprocess = (ev) => feed(new Float32Array(ev.inputBuffer.getChannelData(0)));
          src.connect(node); node.connect(sink); nodesRef.current = [src, node, sink, out];
        }

        // 4. The free on-phone speech detector that wakes the line
        try {
          await loadScript(`https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/ort.js`);
          await loadScript(`https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@${VAD_VER}/dist/bundle.min.js`);
          const lib = (window as any).vad;
          if (!lib?.MicVAD) throw new Error('no vad');
          const v = await lib.MicVAD.new({
            stream: mic,
            baseAssetPath: `https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@${VAD_VER}/dist/`,
            onnxWASMBasePath: `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/`,
            positiveSpeechThreshold: 0.6, negativeSpeechThreshold: 0.4, redemptionFrames: 6, minSpeechFrames: 3, preSpeechPadFrames: 2,
            onSpeechStart: onLocalSpeech, onSpeechEnd: () => { touch(); }, onVADMisfire: () => {},
          });
          if (dead) { v.destroy?.(); return; }
          vadRef.current = v; v.start(); hasNeuralRef.current = true;
        } catch { hasNeuralRef.current = false; }

        try { wakeRef.current = await (navigator as any).wakeLock?.request?.('screen'); } catch { /* not supported */ }
        // 5. Open the line right away: they tapped Talk because they are about to speak
        setPhase('connecting');
        await connect();
      } catch (e: any) {
        if (dead || endedRef.current) return;
        const name = e?.name || '';
        setErr(name === 'NotAllowedError' ? 'The microphone is blocked. Allow the microphone for this site, then try again.'
          : name === 'NotFoundError' ? 'No microphone was found.' : 'Could not start voice.');
        setPhase('ended');
      }
    })();

    // Hang up the paid line when the conversation goes quiet; keep the meter honest
    const tick = setInterval(() => {
      if (endedRef.current) return;
      setLiveSecs(Math.round(totalConnectedMs() / 1000));
      const quietFor = Date.now() - lastActiveRef.current;
      if (wsRef.current && readyRef.current && !playing() && !curRespRef.current && busyToolsRef.current === 0 && quietFor > IDLE_HANGUP_MS) hangUp();
    }, 1000);
    const beat = setInterval(() => { if (!endedRef.current) bill(); }, 15000);
    const wake = () => {
      if (document.visibilityState !== 'visible' || endedRef.current) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      audioElRef.current?.play().catch(() => {});
      (navigator as any).wakeLock?.request?.('screen').then((w: any) => { wakeRef.current = w; }).catch(() => {});
    };
    document.addEventListener('visibilitychange', wake);
    let raf = 0;
    const draw = () => {
      outLevelRef.current *= 0.93; levelRef.current *= 0.9;
      const lv = Math.max(playing() ? outLevelRef.current : 0, mutedRef.current ? 0 : levelRef.current);
      if (orbRef.current) orbRef.current.style.transform = `scale(${1 + lv * 0.32})`;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { dead = true; clearInterval(tick); clearInterval(beat); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', wake); if (!endedRef.current) stopAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickVoice = (id: string) => { setVoice(id); voiceRef.current = id; ls.set('nxa-voice', id); send({ type: 'session.update', session: { voice: id } }); };
  const toggleBarge = () => { const v = !bargeIn; setBargeIn(v); ls.set('nxa-voice-barge', v ? '1' : '0'); };

  const label = err ? err
    : phase === 'starting' ? 'Getting ready…'
    : muted ? 'Microphone is off'
    : phase === 'resting' ? (toolLabel || 'Resting. Just start talking.')
    : phase === 'connecting' ? 'Connecting…'
    : phase === 'hearing' ? 'Listening…'
    : phase === 'thinking' ? (toolLabel || 'Thinking…')
    : phase === 'speaking' ? (bargeIn ? 'Speaking. Just talk to cut in.' : 'Speaking. Tap the circle to cut in.')
    : phase === 'ended' ? 'Voice ended' : 'Go ahead, I’m listening';
  const mm = `${Math.floor(liveSecs / 60)}:${String(liveSecs % 60).padStart(2, '0')}`;
  const orbClass = err ? 'ended' : phase === 'starting' || phase === 'connecting' ? 'connecting' : phase === 'resting' ? 'resting' : phase;

  return (
    <div className="nxv" role="dialog" aria-label="Voice conversation">
      <div className="nxv-top">
        <button className="nxa-pill" onClick={() => setShowSet((v) => !v)}>🔊 {cap(voice)} · Live</button>
        <div className="nxv-time">{mm} live{perMin > 0 ? ` · $${(liveSecs / 60 * perMin).toFixed(2)}` : ''}</div>
        <button className="nxa-icon" aria-label="End voice" onClick={end}>✕</button>
      </div>

      {showSet && (
        <div className="nxv-set">
          <div className="nxa-grp" style={{ marginTop: 0 }}>Voice</div>
          <div className="nxv-voices">
            {voices.map((v) => <button key={v} className={'nxa-mini' + (v === voice ? ' on' : '')} onClick={() => pickVoice(v)}>{cap(v)}</button>)}
          </div>
          <div className="nxa-grp">Cutting in</div>
          <button className="nxa-mrow" onClick={toggleBarge}>
            <div className="tx"><b>{bargeIn ? 'Talk to cut in: on' : 'Talk to cut in: off'}</b><span>{bargeIn ? 'Start talking and it stops. If it keeps stopping itself on a loud speaker, turn this off.' : 'It finishes unless you tap the circle. Best on a loud speaker or a noisy site.'}</span></div>
          </button>
          <div className="nxa-grp">How it is charged</div>
          <div className="nxa-rackstat">Live voice costs ${perMin.toFixed(2)} a minute while the line is open. The line hangs up by itself after {IDLE_HANGUP_MS / 1000} seconds of quiet and comes back when you talk, so leaving this screen open costs nothing.</div>
          <button className="nxa-btn" onClick={useStandard}>Use the standard voice (slower to answer, charged per reply)</button>
          <button className="nxa-btn" onClick={() => setShowSet(false)}>Done</button>
        </div>
      )}

      <div className="nxv-mid">
        <button className={'nxv-orbwrap ' + orbClass + (muted ? ' muted' : '')} aria-label="Tap to cut in or wake"
          onClick={() => {
            if (ctx.state !== 'running') { ctx.resume().catch(() => {}); audioElRef.current?.play().catch(() => {}); }
            if (phase === 'speaking' || phase === 'thinking') { interrupt(); setPhase('listening'); touch(); }
            else if (phase === 'resting') { setToolLabel(''); touch(); connect(); }
          }}>
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
            <button className={'nxv-btn' + (muted ? ' on' : '')} onClick={() => setMuted((m) => !m)}>{muted ? '🎤 Turn mic on' : '🎤 Mute'}</button>
            <button className="nxv-btn end" onClick={end}>End</button>
          </>
        )}
      </div>
    </div>
  );
}
