'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Send, Loader2, Sparkles, Minimize2, MessageSquare, Plus, Trash2, Zap, Move, Maximize2, Shrink, Mic, MicOff, Volume2, VolumeX, Camera, MapPin, HelpCircle, Share2, AudioLines, MoreVertical, Settings, ChevronRight } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; imagePreview?: string; }
interface Conversation { id: string; title: string; summary: string | null; token_estimate: number; compacted: boolean; created_at: string; updated_at: string; }
interface NavigationAction { type: 'navigate'; path: string; description: string; }

const TOKEN_COMPACT_THRESHOLD = 20000;

type DisplayMode = 'full' | 'minimized' | 'floating' | 'fullscreen';

export default function AiChatBubble() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('full');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Thinking...');
  const [aiModel, setAiModel] = useState<'grok' | 'claude' | 'groq'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ro-ai-model');
      if (saved === 'grok' || saved === 'claude' || saved === 'groq') return saved;
    }
    return 'grok';
  });
  useEffect(() => { try { localStorage.setItem('ro-ai-model', aiModel); } catch {} }, [aiModel]);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  // Header overflow menu (declutters the top bar)
  const [showMenu, setShowMenu] = useState(false);

  // Chat history
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState(0);
  const [compacting, setCompacting] = useState(false);

  // Viewing other users' chat boxes (dev sees everyone; admins see employees)
  const [viewableUsers, setViewableUsers] = useState<{ id: string; email: string | null; name: string; role: string }[]>([]);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null); // null = my chats
  const [readOnly, setReadOnly] = useState(false);
  const viewingUserName = viewingUserId ? (viewableUsers.find(u => u.id === viewingUserId)?.name || 'user') : null;

  // Photo attachment
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Voice input (MediaRecorder → Groq Whisper — works on iPhone)
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingVoiceSubmitRef = useRef<string | null>(null);
  const sendMessageRef = useRef<(overrideText?: string) => Promise<string | null>>(async () => null);

  // TTS (SpeechSynthesis)
  const [speakEnabled, setSpeakEnabled] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ro-tts-autoread') === '1';
    return false;
  });
  useEffect(() => { try { localStorage.setItem('ro-tts-autoread', speakEnabled ? '1' : '0'); } catch {} }, [speakEnabled]);
  const speakingRef = useRef(false);

  const speakText = useCallback((text: string) => {
    if (!speakEnabled || typeof window === 'undefined') return;
    // Strip markdown for clean speech
    const clean = text
      .replace(/^\s*CHOICES:.*$/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{1,3}\s/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*•]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .replace(/---+/g, '')
      .trim();
    if (!clean) return;
    // Android native app: use RONative.speak() bridge (reliable TTS)
    if ((window as any).RONative?.speak) {
      (window as any).RONative.speak(clean);
      return;
    }
    // iOS / desktop: Web Speech API
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.volume = 1;
    utter.onstart = () => { speakingRef.current = true; };
    utter.onend = () => { speakingRef.current = false; };
    utter.onerror = () => { speakingRef.current = false; };
    window.speechSynthesis.speak(utter);
  }, [speakEnabled]);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      speakingRef.current = false;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // VOICE CONVERSATION MODE — hands-free, ChatGPT-voice style.
  // Loop: listen (energy VAD detects when you stop talking) →
  // Whisper transcribe → AI (full tool access) → speak reply
  // (Groq PlayAI natural voice, device TTS fallback) → listen again.
  // ═══════════════════════════════════════════════════════════
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [voiceCaption, setVoiceCaption] = useState('');
  const voiceModeRef = useRef(false);
  // Microsoft Edge neural voices (served via /api/admin/tts) — free,
  // natural, same voices as Copilot Read Aloud
  const VOICE_OPTIONS = ['andrew', 'brian', 'guy', 'ava', 'emma', 'jenny'] as const;
  const LEGACY_VOICE_MAP: Record<string, string> = {
    troy: 'andrew', austin: 'brian', daniel: 'guy',
    autumn: 'ava', diana: 'emma', hannah: 'jenny',
  };
  const [ttsVoice, setTtsVoice] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ro-tts-voice');
      if (saved) return LEGACY_VOICE_MAP[saved] || saved;
    }
    return 'andrew';
  });
  const ttsVoiceRef = useRef(ttsVoice);
  useEffect(() => {
    ttsVoiceRef.current = ttsVoice;
    try { localStorage.setItem('ro-tts-voice', ttsVoice); } catch {}
  }, [ttsVoice]);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceCleanupRef = useRef<() => void>(() => {});
  const speakDoneRef = useRef<(() => void) | null>(null);

  const cleanForSpeech = (text: string) =>
    text
      .replace(/^\s*CHOICES:.*$/gm, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{1,3}\s/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/^[-*•]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .replace(/---+/g, '')
      .replace(/\n{2,}/g, '. ')
      .trim();

  // Speak and resolve when done. Natural voice via /api/admin/tts (reliable
  // 'ended' event from the Audio element); falls back to device TTS.
  const speakReply = (text: string) => new Promise<void>((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; speakDoneRef.current = null; resolve(); } };
    speakDoneRef.current = finish;
    const clean = cleanForSpeech(text);
    if (!clean) return finish();
    setVoiceState('speaking');

    (async () => {
      try {
        const res = await fetch('/api/admin/tts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, voice: ttsVoiceRef.current }),
        });
        if (res.ok && voiceModeRef.current && !done) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = voiceAudioRef.current || new Audio();
          voiceAudioRef.current = audio;
          audio.src = url;
          audio.onended = () => { URL.revokeObjectURL(url); finish(); };
          audio.onerror = () => { URL.revokeObjectURL(url); finish(); };
          await audio.play();
          // Watchdog: if 'ended' never fires (iOS backgrounding, decode
          // stall) the loop must still return to listening
          let lastT = -1;
          const watchdog = () => {
            if (done) return;
            if (audio.paused || audio.ended || audio.currentTime === lastT) {
              URL.revokeObjectURL(url); finish(); return;
            }
            lastT = audio.currentTime;
            setTimeout(watchdog, 2000);
          };
          setTimeout(watchdog, Math.min(90000, (clean.length / 10) * 1000 + 8000));
          return;
        }
      } catch { /* fall through to device TTS */ }
      if (done || !voiceModeRef.current) return finish();
      // Device fallback
      if ((window as any).RONative?.speak) {
        (window as any).RONative.speak(clean);
        setTimeout(finish, Math.min(30000, (clean.length / 14) * 1000 + 600));
        return;
      }
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(clean);
        u.rate = 1.05;
        u.onend = finish;
        u.onerror = finish;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        setTimeout(finish, Math.min(35000, (clean.length / 11) * 1000 + 3000)); // safety net
        return;
      }
      finish();
    })();
  });

  const stopVoiceMode = useCallback(() => {
    voiceModeRef.current = false;
    setVoiceMode(false);
    setVoiceCaption('');
    speakDoneRef.current?.();
    voiceCleanupRef.current();
  }, []);

  const startVoiceMode = async () => {
    if (voiceModeRef.current) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setToast('Microphone not supported in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      voiceModeRef.current = true;
      setVoiceMode(true);
      setVoiceState('listening');
      setVoiceCaption('');

      // Prime an Audio element inside the tap gesture (iOS autoplay unlock)
      const primed = new Audio();
      primed.muted = true;
      primed.play().catch(() => {});
      primed.muted = false;
      voiceAudioRef.current = primed;

      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AC();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const mimeType = getSupportedMimeType();
      let recorder: MediaRecorder | null = null;
      let chunks: Blob[] = [];
      let vadTimer: ReturnType<typeof setTimeout> | null = null;
      let stopped = false;

      // Energy-based VAD tuning
      const FRAME_MS = 60;
      const START_FRAMES = 3;      // ~180ms of voice to trigger
      const END_SILENCE_MS = 1100; // pause length that ends your turn
      const MIN_UTTER_MS = 500;    // shorter = ignored as noise
      const MAX_UTTER_MS = 45000;
      const THRESHOLD = 0.022;     // RMS speech threshold

      let userSpeaking = false;
      let speechFrames = 0;
      let silenceMs = 0;
      let speechStartAt = 0;

      const startRecorder = () => {
        chunks = [];
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.start(250);
      };

      const rms = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        return Math.sqrt(sum / buf.length);
      };

      const resumeListening = () => {
        if (stopped || !voiceModeRef.current) return;
        userSpeaking = false; speechFrames = 0; silenceMs = 0;
        setVoiceState('listening');
        startRecorder();
      };

      const handleUtterance = async (rec: MediaRecorder, recChunks: Blob[]) => {
        const blob: Blob = await new Promise((res) => {
          rec.onstop = () => res(new Blob(recChunks, { type: mimeType || 'audio/webm' }));
          try { rec.stop(); } catch { res(new Blob(recChunks, { type: mimeType || 'audio/webm' })); }
        });
        if (stopped || !voiceModeRef.current) return;
        setVoiceState('thinking');
        try {
          const ext = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm';
          const form = new FormData();
          form.append('audio', blob, `voice.${ext}`);
          const tr = await fetch('/api/admin/transcribe', {
            method: 'POST', body: form,
            signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(30000) : undefined,
          });
          const transcript: string = tr.ok ? ((await tr.json()).transcript || '') : '';
          const text = transcript.trim();
          if (stopped || !voiceModeRef.current) return;
          if (text.length < 2) { resumeListening(); return; }
          setVoiceCaption(`“${text}”`);
          const reply = await sendMessageRef.current(text);
          if (stopped || !voiceModeRef.current) return;
          if (reply) {
            const spoken = cleanForSpeech(reply);
            setVoiceCaption(spoken.length > 240 ? spoken.slice(0, 240) + '…' : spoken);
            await speakReply(reply);
          }
        } catch { /* resume regardless */ }
        resumeListening();
      };

      const tick = () => {
        if (stopped) return;
        if (recorder) {
          const level = rms();
          if (!userSpeaking) {
            if (level > THRESHOLD) {
              speechFrames++;
              if (speechFrames >= START_FRAMES) { userSpeaking = true; speechStartAt = Date.now(); silenceMs = 0; }
            } else speechFrames = 0;
          } else {
            if (level < THRESHOLD) silenceMs += FRAME_MS; else silenceMs = 0;
            const dur = Date.now() - speechStartAt;
            if (silenceMs >= END_SILENCE_MS || dur >= MAX_UTTER_MS) {
              const rec = recorder; const recChunks = chunks;
              recorder = null;
              userSpeaking = false;
              if (dur - silenceMs >= MIN_UTTER_MS) {
                handleUtterance(rec, recChunks);
              } else {
                try { rec.stop(); } catch {}
                resumeListening();
              }
            }
          }
        }
        vadTimer = setTimeout(tick, FRAME_MS);
      };

      startRecorder();
      tick();

      voiceCleanupRef.current = () => {
        stopped = true;
        if (vadTimer) clearTimeout(vadTimer);
        try { recorder?.stop(); } catch {}
        recorder = null;
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close().catch(() => {});
        try { voiceAudioRef.current?.pause(); } catch {}
        window.speechSynthesis?.cancel();
      };
    } catch (err: any) {
      const name = err?.name || '';
      setToast(
        name === 'NotAllowedError' || name === 'PermissionDeniedError'
          ? 'Microphone permission denied — allow mic access in Settings > Safari (or your browser) and try again'
          : name === 'NotFoundError' || name === 'DevicesNotFoundError'
          ? 'No microphone found on this device'
          : name === 'NotReadableError'
          ? 'Microphone is in use by another app'
          : `Could not start voice mode (${name || 'unknown'}: ${String(err?.message || err).slice(0, 80)})`
      );
    }
  };

  // Interrupt the AI mid-speech → jump back to listening
  const interruptSpeech = () => {
    try { voiceAudioRef.current?.pause(); } catch {}
    window.speechSynthesis?.cancel();
    speakDoneRef.current?.();
  };

  const getSupportedMimeType = (): string => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const toggleVoice = async () => {
    if (listening) {
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      mediaRecorderRef.current?.stop();
      setListening(false);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setToast('Microphone not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length === 0) return;
        setTranscribing(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          const ext = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm';
          const form = new FormData();
          form.append('audio', blob, `recording.${ext}`);
          const res = await fetch('/api/admin/transcribe', { method: 'POST', body: form });
          if (res.ok) {
            const data = await res.json();
            if (data.transcript?.trim()) {
              setInput(data.transcript.trim());
              pendingVoiceSubmitRef.current = data.transcript.trim();
            }
          } else {
            setToast('Could not transcribe audio — try again');
          }
        } catch {
          setToast('Transcription error — try again');
        }
        setTranscribing(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect chunks every 250ms
      setListening(true);

      // Auto-stop after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setListening(false);
        }
      }, 30000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setToast('Microphone permission denied');
      } else {
        setToast('Could not access microphone');
      }
    }
  };

  // Photo attachment handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Compress: draw onto canvas at max 1024px
      const img = new Image();
      img.onload = () => {
        const maxSize = 1024;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = compressed.split(',')[1];
        setAttachedImage({ base64, mimeType: 'image/jpeg', preview: compressed });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be re-selected
  };

  // Floating window drag state
  const [floatPos, setFloatPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('ai-chat-float-pos');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return { x: -1, y: -1 }; // -1 means uninitialized, will set on first render
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize float position on first render
  useEffect(() => {
    if (floatPos.x === -1 && floatPos.y === -1 && typeof window !== 'undefined') {
      setFloatPos({ x: window.innerWidth - 320, y: window.innerHeight - 480 });
    }
  }, [floatPos]);

  // Persist float position
  useEffect(() => {
    if (floatPos.x >= 0 && typeof window !== 'undefined') {
      sessionStorage.setItem('ai-chat-float-pos', JSON.stringify(floatPos));
    }
  }, [floatPos]);

  // Auto-scroll
  useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight); }, [messages, loading]);
  useEffect(() => {
    if (open && displayMode !== 'minimized') {
      setTimeout(() => inputRef.current?.focus(), 200);
      setUnread(0);
    }
  }, [open, displayMode]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Keep sendMessageRef current so voice onstop can call it
  useEffect(() => { sendMessageRef.current = sendMessage; });

  // Auto-submit after voice transcription sets input
  useEffect(() => {
    if (input && pendingVoiceSubmitRef.current && input === pendingVoiceSubmitRef.current) {
      pendingVoiceSubmitRef.current = null;
      setTimeout(() => sendMessageRef.current(), 150);
    }
  }, [input]);

  // ── Load conversation list (optionally another user's box) ──
  const fetchConversations = useCallback(async (view?: string | null) => {
    const url = view ? `/api/admin/ai-conversations?view=${encodeURIComponent(view)}` : '/api/admin/ai-conversations';
    const res = await fetch(url);
    if (res.ok) { const data = await res.json(); setConversations(data.conversations || []); }
  }, []);
  useEffect(() => { if (open) fetchConversations(viewingUserId); }, [open, fetchConversations, viewingUserId]);

  // ── Load list of users whose chat boxes I'm allowed to view ──
  useEffect(() => {
    if (!open) return;
    fetch('/api/admin/ai-conversations?users=1')
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => setViewableUsers(d.users || []))
      .catch(() => {});
  }, [open]);

  // ── Auto-save messages to active conversation ──
  const saveMessages = useCallback(async (msgs: Message[], convId: string | null) => {
    if (!convId || msgs.length === 0) return;
    const res = await fetch('/api/admin/ai-conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', id: convId, messages: msgs }),
    });
    if (res.ok) { const data = await res.json(); setTokenEstimate(data.token_estimate || 0); }
  }, []);

  // ── Create new conversation ──
  const startNewChat = async () => {
    setMessages([]);
    setTokenEstimate(0);
    setViewingUserId(null);
    setReadOnly(false);
    const res = await fetch('/api/admin/ai-conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', title: 'New Chat' }),
    });
    if (res.ok) {
      const data = await res.json();
      setActiveConvId(data.conversation.id);
      fetchConversations();
    }
    setShowHistory(false);
  };

  // ── Load conversation ──
  const loadConversation = async (id: string) => {
    const res = await fetch('/api/admin/ai-conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'load', id }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.conversation.messages || []);
      setActiveConvId(id);
      setTokenEstimate(data.conversation.token_estimate || 0);
      setReadOnly(!!data.readOnly);
    }
    setShowHistory(false);
  };

  // ── Share conversation into another user's chat box ──
  const [shareConvId, setShareConvId] = useState<string | null>(null);
  const shareConversation = async (convId: string, targetId: string, targetName: string) => {
    const res = await fetch('/api/admin/ai-conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share', id: convId, target_user_id: targetId }),
    });
    setShareConvId(null);
    setToast(res.ok ? `Chat shared with ${targetName} ✓` : 'Share failed — try again');
  };

  // ── Delete conversation ──
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch('/api/admin/ai-conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    if (activeConvId === id) { setMessages([]); setActiveConvId(null); }
    fetchConversations();
  };

  // ── Compact conversation ──
  const compactChat = async () => {
    if (!activeConvId) return;
    setCompacting(true);
    const res = await fetch('/api/admin/ai-conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'compact', id: activeConvId }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setTokenEstimate(data.token_estimate);
    }
    setCompacting(false);
  };

  // ── Handle navigation actions from AI response ──
  const handleActions = (responseActions?: NavigationAction[]) => {
    if (!responseActions?.length) return;
    for (const action of responseActions) {
      if (action.type === 'navigate' && action.path) {
        setToast(`Navigating to ${action.description || action.path}...`);
        setTimeout(() => {
          router.push(action.path);
        }, 600);
      }
    }
  };

  // ── Send message ── (returns the assistant's reply text — used by voice mode)
  const sendMessage = async (overrideText?: string): Promise<string | null> => {
    if (readOnly) return null; // viewing someone else's chat — no sending
    const text = (overrideText ?? input).trim();
    if ((!text && !attachedImage) || loading) return null;

    // Create conversation if none active.
    // IMPORTANT: track the id in a local variable — setActiveConvId is async,
    // so reading activeConvId later in this closure would still be null and
    // the first message of every new chat silently never saved to the DB
    // (the "titles sync across devices but messages are empty" bug).
    let convId = activeConvId;
    if (!convId) {
      const res = await fetch('/api/admin/ai-conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title: (text || 'Image analysis').slice(0, 60) }),
      });
      if (res.ok) {
        const data = await res.json();
        convId = data.conversation.id;
        setActiveConvId(convId);
        fetchConversations();
      }
    }

    const userMsg: Message = { role: 'user', content: text || 'Analyze this image.', imagePreview: attachedImage?.preview };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const imageToSend = attachedImage;
    setAttachedImage(null);
    setLoading(true);

    // Smart loading status
    const lm = text.toLowerCase();
    if (imageToSend) setLoadingStatus('Analyzing image...');
    else if (lm.includes('search') || lm.includes('look up') || lm.includes('find')) setLoadingStatus('Querying database...');
    else if (lm.includes('list') || lm.includes('show') || lm.includes('pull up') || lm.includes('get')) setLoadingStatus('Querying database...');
    else if (lm.includes('create') || lm.includes('make') || lm.includes('new') || lm.includes('add')) setLoadingStatus('Creating...');
    else if (lm.includes('send') || lm.includes('email')) setLoadingStatus('Processing...');
    else if (lm.includes('update') || lm.includes('change') || lm.includes('edit') || lm.includes('set')) setLoadingStatus('Updating...');
    else if (lm.includes('go to') || lm.includes('open') || lm.includes('navigate') || lm.includes('take me')) setLoadingStatus('Processing...');
    else setLoadingStatus('Thinking...');

    try {
      let projectContext = null;
      const estimateMatch = pathname?.match(/\/admin\/estimates\/([a-f0-9-]{36})/);
      if (estimateMatch) {
        try {
          const ctxRes = await fetch(`/api/admin/estimates/${estimateMatch[1]}`);
          if (ctxRes.ok) { projectContext = { type: 'estimate', data: await ctxRes.json() }; }
        } catch {}
      }

      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          currentPage: pathname,
          projectContext,
          useModel: aiModel,
          stream: true,
          imageData: imageToSend ? { base64: imageToSend.base64, mimeType: imageToSend.mimeType } : undefined,
        }),
      });

      let replyText = '';
      let responseActions: NavigationAction[] | undefined;

      if (res.headers.get('content-type')?.includes('ndjson') && res.body) {
        // Streaming NDJSON: {type:'delta'|'status'|'done'|'error'}
        // Append a live assistant message and grow it as deltas arrive
        setMessages([...newMessages, { role: 'assistant', content: '' }]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.type === 'delta' && evt.text) {
                replyText += evt.text;
                const snapshot = replyText;
                setMessages([...newMessages, { role: 'assistant', content: snapshot }]);
              } else if (evt.type === 'status' && evt.label) {
                setLoadingStatus(evt.label);
              } else if (evt.type === 'done') {
                responseActions = evt.actions;
              } else if (evt.type === 'error') {
                replyText = replyText || evt.error || 'Sorry, something went wrong.';
                setMessages([...newMessages, { role: 'assistant', content: replyText }]);
              }
            } catch { /* skip malformed line */ }
          }
        }
        if (!replyText) {
          replyText = 'Sorry, something went wrong.';
          setMessages([...newMessages, { role: 'assistant', content: replyText }]);
        }
      } else {
        // Legacy JSON response (fallback providers)
        const data = await res.json();
        replyText = data.content || data.error || 'Sorry, something went wrong.';
        responseActions = data.actions;
        setMessages([...newMessages, { role: 'assistant', content: replyText }]);
      }

      const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: replyText }];
      if (displayMode === 'minimized' || !open) setUnread(prev => prev + 1);

      // Speak the response if TTS is enabled (voice mode speaks via its own loop)
      if (!voiceModeRef.current) speakText(replyText);

      // Handle navigation actions
      if (responseActions) {
        handleActions(responseActions);
      }

      // Auto-save (convId is the local variable — valid even on the first message)
      if (convId) {
        const title = newMessages.length <= 1 ? text.slice(0, 60) : undefined;
        await fetch('/api/admin/ai-conversations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', id: convId, messages: finalMessages, title }),
        }).then(r => r.json()).then(d => setTokenEstimate(d.token_estimate || 0));
        fetchConversations();
      }
      setLoading(false);
      return replyText;
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }

    setLoading(false);
    return null;
  };

  // ── Floating window drag handlers ──
  const onDragStart = (e: React.PointerEvent) => {
    if (displayMode !== 'floating') return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: floatPos.x,
      origY: floatPos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.max(0, Math.min(window.innerWidth - 310, dragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.origY + dy));
    setFloatPos({ x: newX, y: newY });
  };

  const onDragEnd = () => {
    dragRef.current = null;
  };

  // Satellite tile grid info — returns center tile + sub-pixel offset so address is exactly centered
  const getSatelliteTileInfo = (lat: number, lon: number, zoom = 19) => {
    const tileCount = Math.pow(2, zoom);
    const xFrac = (lon + 180) / 360 * tileCount;
    const sinLat = Math.sin(lat * Math.PI / 180);
    const yFrac = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * tileCount;
    const cx = Math.floor(xFrac);
    const cy = Math.floor(yFrac);
    const px = Math.round((xFrac - cx) * 256); // pixel X within center tile (0-255)
    const py = Math.round((yFrac - cy) * 256); // pixel Y within center tile (0-255)
    return { cx, cy, px, py, zoom };
  };

  // ── Guided-mode choices ──
  // The AI ends questions with a "CHOICES: A | B | C" line; we strip it from
  // the text and render the options as tap buttons under the last message.
  const parseChoices = (text: string): string[] => {
    const m = text.match(/^\s*CHOICES:\s*(.+?)\s*$/m);
    if (!m) return [];
    return m[1].split('|').map(s => s.trim()).filter(Boolean).slice(0, 4);
  };
  const stripChoices = (text: string) => text.replace(/^\s*CHOICES:.*$/gm, '').trimEnd();

  const HELP_PROMPT = "I need help. I'm not sure how to use this — walk me through it step by step, one question at a time.";

  // Markdown rendering
  const renderContent = (text: string) => {
    text = stripChoices(text);
    // Strip code fences
    let cleaned = text.replace(/```[\s\S]*?```/g, (m) => {
      const inner = m.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      return inner.split('\n').map(l => `<div style="font-family:monospace;font-size:12px;color:#8ab88a;background:#111;padding:2px 8px;border-radius:4px;margin:1px 0">${l}</div>`).join('');
    });
    // Strip the "Powered by" model tag
    cleaned = cleaned.replace(/\n*---\n\*Powered by [^*]+\*/, '');

    return cleaned.split('\n').map((line, i) => {
      let p = line;
      // Bold
      p = p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      p = p.replace(/`([^`]+)`/g, '<code style="background:#1a1a1a;padding:1px 5px;border-radius:3px;font-size:12px;color:#C9A84C">$1</code>');
      // Links [text](url)
      p = p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#C9A84C;text-decoration:underline">$1</a>');
      // Headings
      if (p.startsWith('### ')) return <div key={i} style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C', marginTop: 8, marginBottom: 4 }}><span dangerouslySetInnerHTML={{ __html: p.slice(4) }} /></div>;
      if (p.startsWith('## ')) return <div key={i} style={{ fontSize: 15, fontWeight: 700, color: '#C9A84C', marginTop: 8, marginBottom: 4 }}><span dangerouslySetInnerHTML={{ __html: p.slice(3) }} /></div>;
      if (p.startsWith('# ')) return <div key={i} style={{ fontSize: 16, fontWeight: 700, color: '#C9A84C', marginTop: 8, marginBottom: 4 }}><span dangerouslySetInnerHTML={{ __html: p.slice(2) }} /></div>;
      // Horizontal rule
      if (/^---+$/.test(p.trim())) return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />;
      // Numbered list
      if (/^\d+\.\s/.test(p)) {
        const content = p.replace(/^\d+\.\s/, '');
        return <div key={i} className="flex items-start gap-0 pl-2 py-0.5"><span style={{ color: '#C9A84C', marginRight: 6, fontWeight: 600 }}>{p.match(/^\d+/)?.[0]}.</span><span dangerouslySetInnerHTML={{ __html: content }} /></div>;
      }
      // Bullet list
      if (p.startsWith('- ') || p.startsWith('* ') || p.startsWith('• ')) {
        const content = p.replace(/^[-*•]\s/, '');
        return <div key={i} className="flex items-start gap-0 pl-2 py-0.5"><span style={{ color: '#C9A84C', marginRight: 4 }}>&#8226;</span><span dangerouslySetInnerHTML={{ __html: content }} /></div>;
      }
      // Blockquote
      if (p.startsWith('> ')) return <div key={i} style={{ borderLeft: '3px solid #C9A84C33', paddingLeft: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: p.slice(2) }} />;
      // Empty line
      if (!p.trim()) return <div key={i} className="h-2" />;
      // Satellite map link — render 3×3 tile grid centered exactly on the address
      const mapMatch = p.match(/https:\/\/www\.google\.com\/maps\?q=([-\d.]+),([-\d.]+)&t=k&z=\d+/);
      if (mapMatch) {
        const lat = parseFloat(mapMatch[1]);
        const lon = parseFloat(mapMatch[2]);
        const { cx, cy, px, py, zoom } = getSatelliteTileInfo(lat, lon, 19);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}&t=k&z=19`;
        // 3×3 grid = 768×768px. Address pixel within grid: (256+px, 256+py).
        // Shift grid so that pixel lands at center: left=calc(50%-(256+px)px), top=90-(256+py)
        const gridTop = 90 - (256 + py);
        return (
          <div key={i} className="my-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-white/10 hover:border-[#C9A84C]/40 transition-colors">
              <div className="relative h-[180px]" style={{ overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: `calc(50% - ${256 + px}px)`, top: gridTop, display: 'grid', gridTemplateColumns: 'repeat(3, 256px)', width: 768, pointerEvents: 'none' }}>
                  {([-1, 0, 1] as const).flatMap(dy => ([-1, 0, 1] as const).map(dx => (
                    <img key={`${dx},${dy}`} src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${cy + dy}/${cx + dx}`} width={256} height={256} alt="" style={{ display: 'block' }} />
                  )))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" style={{ zIndex: 1 }} />
                <div className="absolute bottom-2 left-3 flex items-center gap-1.5" style={{ zIndex: 2 }}>
                  <MapPin size={12} className="text-[#C9A84C]" />
                  <span className="text-[12px] text-white font-medium">Satellite View — tap to open in Maps</span>
                </div>
              </div>
            </a>
          </div>
        );
      }
      // Normal text
      return <div key={i} className="py-0.5" dangerouslySetInnerHTML={{ __html: p }} />;
    });
  };

  if (pathname === '/admin/login') return null;
  const onEstimateWizard = !!(pathname?.includes('/estimates/new') || pathname?.match(/\/estimates\/[a-f0-9-]{36}$/));

  // ── Toast notification ──
  const ToastNotification = () => {
    if (!toast) return null;
    return (
      <div className="fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl text-[14px] font-medium shadow-2xl animate-in slide-in-from-top-2"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)', color: '#000' }}>
        {toast}
      </div>
    );
  };

  // ── Closed state — header button triggers open via DOM click ──
  useEffect(() => {
    const btn = document.getElementById('ai-bubble-header-btn');
    if (!btn) return;
    const handler = () => { setOpen(true); setDisplayMode('full'); };
    btn.addEventListener('click', handler);
    // Show unread badge on header button
    if (unread > 0) {
      btn.setAttribute('data-unread', String(unread));
    } else {
      btn.removeAttribute('data-unread');
    }
    return () => btn.removeEventListener('click', handler);
  }, [open, unread]);

  if (!open) {
    return <ToastNotification />;
  }

  // ── Minimized bar ──
  if (displayMode === 'minimized') {
    return (
      <>
        <ToastNotification />
        <div className="fixed bottom-20 right-4 z-[90] flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-2xl cursor-pointer hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)', boxShadow: '0 2px 16px rgba(201,168,76,0.3)', marginBottom: 'env(safe-area-inset-bottom)' }}
          onClick={() => setDisplayMode('full')}>
          <Sparkles size={14} className="text-black" />
          <span className="text-black text-[12px] font-semibold">AI</span>
          {unread > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
        </div>
      </>
    );
  }

  // ── Chat history sidebar ──
  const HistoryPanel = () => (
    <div className="absolute inset-0 z-10 bg-[#0a0a0a] flex flex-col rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-[16px] font-semibold text-white">Chat History</span>
        <button onClick={() => setShowHistory(false)} className="p-1.5 text-white/30 hover:text-white"><X size={18} /></button>
      </div>
      {/* Whose chats — dev sees everyone, admins see employees */}
      {viewableUsers.length > 0 && (
        <div className="mx-3 mt-3">
          <select
            value={viewingUserId || 'me'}
            onChange={e => { const v = e.target.value; setViewingUserId(v === 'me' ? null : v); }}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/50"
          >
            <option value="me">👤 My chats</option>
            {viewableUsers.map(u => (
              <option key={u.id} value={u.id}>📁 {u.name}{u.email ? ` (${u.email})` : ''}</option>
            ))}
          </select>
        </div>
      )}
      {!viewingUserId && (
        <button onClick={startNewChat} className="flex items-center gap-2 mx-3 mt-3 mb-2 px-4 py-2.5 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl text-[#C9A84C] text-[14px] font-semibold hover:bg-[#C9A84C]/15 transition-colors">
        <Plus size={16} /> New Chat
      </button>
      )}
      {viewingUserId && (
        <p className="mx-3 mt-2 mb-1 text-[12px] text-[#C9A84C]/70">Viewing {viewingUserName}&apos;s chats — open one to read it</p>
      )}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {conversations.length === 0 ? (
          <p className="text-center text-white/20 text-[14px] py-8">No saved chats yet</p>
        ) : conversations.map(conv => {
          const shareTargets = viewableUsers.filter(u => u.id !== 'legacy');
          return (
          <div key={conv.id}>
            <button onClick={() => loadConversation(conv.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors mb-1 ${activeConvId === conv.id ? 'bg-[#C9A84C]/10' : 'hover:bg-white/5'}`}>
              <MessageSquare size={16} className={activeConvId === conv.id ? 'text-[#C9A84C]' : 'text-white/20'} />
              <div className="flex-1 min-w-0">
                <p className={`text-[14px] truncate ${activeConvId === conv.id ? 'text-[#C9A84C] font-semibold' : 'text-white/60'}`}>{conv.title}</p>
                <p className="text-[11px] text-white/20">{new Date(conv.updated_at).toLocaleDateString()}</p>
              </div>
              {/* Share to another user (dev/admin only — targets from picker rules) */}
              {!viewingUserId && shareTargets.length > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setShareConvId(shareConvId === conv.id ? null : conv.id); }}
                  className={`p-1 transition-colors shrink-0 ${shareConvId === conv.id ? 'text-[#C9A84C]' : 'text-white/10 hover:text-[#C9A84C]'}`}
                  title="Share this chat with...">
                  <Share2 size={14} />
                </button>
              )}
              <button onClick={(e) => deleteConversation(conv.id, e)} className="p-1 text-white/10 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </button>
            {/* Share target picker */}
            {shareConvId === conv.id && (
              <div className="mx-3 mb-2 p-2 bg-[#151515] border border-[#C9A84C]/20 rounded-xl">
                <p className="text-[11px] text-white/30 px-1 mb-1.5">Send a copy to their chat history:</p>
                {shareTargets.map(u => (
                  <button key={u.id} onClick={() => shareConversation(conv.id, u.id, u.name)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[13px] text-white/70 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C] transition-colors">
                    <Share2 size={12} className="opacity-50" /> {u.name}{u.email ? ` (${u.email})` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );

  // ── Determine container styles based on display mode ──
  const getContainerStyles = (): { className: string; style: React.CSSProperties } => {
    if (displayMode === 'fullscreen') {
      return {
        className: 'fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col overflow-hidden pt-safe',
        style: {},
      };
    }
    if (displayMode === 'floating') {
      return {
        className: 'fixed z-[95] bg-[#0a0a0a]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden',
        style: {
          width: 310,
          height: 420,
          left: floatPos.x,
          top: floatPos.y,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.1)',
        },
      };
    }
    // full (default panel)
    return {
      className: 'fixed left-3 right-3 top-safe-3 bottom-safe-3 sm:inset-4 sm:left-auto sm:w-[480px] sm:top-4 sm:bottom-20 z-[90] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden',
      style: { boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.1)' },
    };
  };

  const container = getContainerStyles();
  const isFloating = displayMode === 'floating';
  const isFullscreen = displayMode === 'fullscreen';

  // ── Chat panel (full, floating, or fullscreen) ──
  return (
    <>
      <ToastNotification />

      {/* ── VOICE CONVERSATION OVERLAY ── */}
      {voiceMode && (
        <div className="fixed inset-0 z-[140] bg-[#0a0a0a]/[0.97] backdrop-blur-xl flex flex-col items-center justify-center px-8"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
          {/* Orb — tap to interrupt while the AI is speaking */}
          <button
            onClick={voiceState === 'speaking' ? interruptSpeech : undefined}
            className="relative w-44 h-44 flex items-center justify-center outline-none"
          >
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700 ${
                voiceState === 'listening' ? 'animate-pulse' : voiceState === 'thinking' ? 'animate-ping opacity-30' : 'animate-pulse'
              }`}
              style={{
                background: voiceState === 'listening'
                  ? 'radial-gradient(circle, rgba(52,211,153,0.35), rgba(16,185,129,0.08) 70%)'
                  : voiceState === 'thinking'
                  ? 'radial-gradient(circle, rgba(201,168,76,0.35), rgba(212,119,44,0.08) 70%)'
                  : 'radial-gradient(circle, rgba(56,189,248,0.35), rgba(37,99,235,0.08) 70%)',
              }}
            />
            <div
              className="relative w-28 h-28 rounded-full flex items-center justify-center transition-colors duration-500"
              style={{
                background: voiceState === 'listening'
                  ? 'linear-gradient(135deg, #34d399, #059669)'
                  : voiceState === 'thinking'
                  ? 'linear-gradient(135deg, #C9A84C, #D4772C)'
                  : 'linear-gradient(135deg, #38bdf8, #2563eb)',
                boxShadow: '0 0 60px rgba(0,0,0,0.4)',
              }}
            >
              {voiceState === 'listening' ? <Mic size={44} className="text-black/80" />
                : voiceState === 'thinking' ? <Loader2 size={44} className="text-black/80 animate-spin" />
                : <Volume2 size={44} className="text-black/80" />}
            </div>
          </button>

          <p className="mt-8 text-[20px] font-semibold text-white">
            {voiceState === 'listening' ? 'Listening…' : voiceState === 'thinking' ? 'Working on it…' : 'Speaking — tap orb to interrupt'}
          </p>
          <p className="mt-1 text-[14px] text-white/35">
            {voiceState === 'listening' ? 'Just talk — I’ll answer when you pause' : ' '}
          </p>

          {voiceCaption && (
            <p className="mt-6 max-w-md text-center text-[15px] text-white/60 leading-relaxed px-2">{voiceCaption}</p>
          )}

          {/* Voice picker — takes effect on the next reply */}
          <div className="mt-8 flex flex-wrap justify-center gap-1.5 max-w-sm">
            {VOICE_OPTIONS.map(v => (
              <button key={v} onClick={() => setTtsVoice(v)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${
                  ttsVoice === v
                    ? 'bg-[#C9A84C] text-black shadow-[0_0_12px_rgba(201,168,76,0.5)]'
                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70'
                }`}>
                {v}
              </button>
            ))}
          </div>

          <button onClick={stopVoiceMode}
            className="absolute bottom-0 mb-10 flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 border border-white/15 text-white text-[15px] font-semibold active:scale-95 transition-transform"
            style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}>
            <X size={18} /> End conversation
          </button>
        </div>
      )}

      <div ref={floatRef} className={container.className} style={container.style}>
        {showHistory && <HistoryPanel />}

        {/* Header */}
        <div
          className={`flex items-center justify-between px-3 py-2.5 border-b border-white/10 flex-shrink-0 bg-[#0f0f0f] ${isFloating ? 'cursor-grab active:cursor-grabbing' : ''} ${isFullscreen ? 'px-6' : ''}`}
          onPointerDown={isFloating ? onDragStart : undefined}
          onPointerMove={isFloating ? onDragMove : undefined}
          onPointerUp={isFloating ? onDragEnd : undefined}
          style={{ touchAction: isFloating ? 'none' : undefined }}
        >
          <div className="flex items-center gap-2">
            {/* History toggle */}
            <button onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }} className="p-1.5 text-white/30 hover:text-[#C9A84C] hover:bg-white/5 rounded-lg transition-colors" title="Chat history">
              <MessageSquare size={isFloating ? 14 : 18} />
            </button>
            {!isFloating && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}>
                <Sparkles size={16} className="text-black" />
              </div>
            )}
            {isFloating && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}>
                <Sparkles size={12} className="text-black" />
              </div>
            )}
            <div>
              <span className={`font-semibold text-white block leading-tight ${isFloating ? 'text-[13px]' : 'text-[15px]'}`}>RO Assistant</span>
              {!isFloating && (
                <span className="text-[11px] text-green-400">
                  Online · <span className={aiModel === 'grok' ? 'text-blue-300/80' : aiModel === 'claude' ? 'text-[#C9A84C]/80' : 'text-green-300/80'}>{aiModel === 'grok' ? 'Smart' : aiModel === 'claude' ? 'Claude' : 'Fast'}</span>
                </span>
              )}
            </div>
            {isFloating && (
              <Move size={12} className="text-white/20 ml-1" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Usage chip — only surfaces when the chat is getting long */}
            {tokenEstimate > TOKEN_COMPACT_THRESHOLD && !isFloating && (
              <button onClick={compactChat} disabled={compacting}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30"
                title="Long chat — tap to compact">
                {compacting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                {Math.round(tokenEstimate / 1000)}k
              </button>
            )}
            {/* New chat — kept visible, most-used action */}
            <button onClick={startNewChat} className="p-2 text-white/40 hover:text-[#C9A84C] hover:bg-white/5 rounded-lg transition-colors" title="New chat">
              <Plus size={isFloating ? 14 : 18} />
            </button>
            {/* Overflow menu — everything else lives here */}
            {!isFloating && (
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                className={`p-2 rounded-lg transition-colors ${showMenu ? 'text-[#C9A84C] bg-[#C9A84C]/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                title="Menu">
                <MoreVertical size={18} />
              </button>
            )}
            {/* Float toggle stays visible in floating mode so you can get back */}
            {isFloating && (
              <button onClick={() => setDisplayMode('full')} className="p-1.5 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Expand panel">
                <Move size={14} />
              </button>
            )}
            {/* Minimize */}
            {!isFullscreen && (
              <button onClick={() => setDisplayMode('minimized')} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Minimize">
                <Minimize2 size={isFloating ? 14 : 18} />
              </button>
            )}
            {/* Close */}
            <button onClick={() => { setShowMenu(false); setOpen(false); }} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Close">
              <X size={isFloating ? 14 : 18} />
            </button>
          </div>
        </div>

        {/* ── Overflow menu panel ── */}
        {showMenu && !isFloating && (
          <>
            <div className="absolute inset-0 z-[59]" onClick={() => setShowMenu(false)} />
            <div className={`absolute z-[60] top-[52px] right-2 w-[290px] rounded-2xl bg-[#161616] border border-white/12 shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden ${isFullscreen ? 'right-6' : ''}`}>
              {/* AI model — outcome labels, color-coded */}
              <div className="px-4 pt-3.5 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-2">AI model</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    ['grok', 'Smart', 'Best overall', 'bg-blue-500/15 text-blue-300 border-blue-400/40'],
                    ['claude', 'Claude', 'Backup brain', 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40'],
                    ['groq', 'Fast', 'Quick answers', 'bg-green-500/15 text-green-300 border-green-400/40'],
                  ] as const).map(([id, label, desc, activeCls]) => (
                    <button key={id} onClick={() => setAiModel(id)}
                      className={`px-1 py-2 rounded-xl border text-center transition-all ${aiModel === id ? activeCls : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70'}`}>
                      <span className="block text-[13px] font-bold leading-tight">{label}</span>
                      <span className="block text-[10px] opacity-70 leading-tight mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-px bg-white/8 mx-3 my-1" />
              {/* Action rows — big targets, color-coded */}
              <button onClick={() => { setShowMenu(false); startVoiceMode(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #34d399 0%, #38bdf8 35%, #a78bfa 70%, #f472b6 100%)' }}>
                  <AudioLines size={18} className="text-white" />
                </span>
                <span className="text-left">
                  <span className="block text-[15px] font-semibold text-white">Voice conversation</span>
                  <span className="block text-[12px] text-white/35">Talk hands-free, like a phone call</span>
                </span>
              </button>
              <button onClick={() => { if (speakEnabled) stopSpeaking(); setSpeakEnabled(v => !v); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${speakEnabled ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-white/5 text-white/40'}`}>
                  {speakEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </span>
                <span className="text-left flex-1">
                  <span className="block text-[15px] font-semibold text-white">Read replies aloud</span>
                  <span className="block text-[12px] text-white/35">{speakEnabled ? 'On — replies are spoken' : 'Off'}</span>
                </span>
                <span className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${speakEnabled ? 'bg-[#C9A84C]' : 'bg-white/15'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${speakEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                </span>
              </button>
              <button onClick={() => { setShowMenu(false); sendMessage(HELP_PROMPT); }} disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors disabled:opacity-40">
                <span className="w-9 h-9 rounded-xl bg-[#C9A84C]/15 text-[#C9A84C] flex items-center justify-center flex-shrink-0">
                  <HelpCircle size={18} />
                </span>
                <span className="text-left">
                  <span className="block text-[15px] font-semibold text-white">Help me get started</span>
                  <span className="block text-[12px] text-white/35">Step-by-step guided walkthrough</span>
                </span>
              </button>
              <div className="h-px bg-white/8 mx-3 my-1" />
              <div className="flex">
                <button onClick={() => { setShowMenu(false); setDisplayMode(isFullscreen ? 'full' : 'fullscreen'); }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-3 text-[13px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                  {isFullscreen ? <Shrink size={15} /> : <Maximize2 size={15} />}
                  {isFullscreen ? 'Exit full screen' : 'Full screen'}
                </button>
                <div className="w-px bg-white/8 my-2" />
                <button onClick={() => { setShowMenu(false); setDisplayMode('floating'); }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-3 text-[13px] font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                  <Move size={15} /> Float
                </button>
              </div>
              <div className="h-px bg-white/8 mx-3 my-1" />
              <button onClick={() => { setShowMenu(false); router.push('/admin/ai-settings'); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-violet-500/10 transition-colors">
                <span className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center flex-shrink-0">
                  <Settings size={18} />
                </span>
                <span className="text-left flex-1">
                  <span className="block text-[15px] font-semibold text-white">AI Settings</span>
                  <span className="block text-[12px] text-white/35">Voices, memory, models &amp; usage</span>
                </span>
                <ChevronRight size={16} className="text-white/25" />
              </button>
            </div>
          </>
        )}

        {/* Messages */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto space-y-2 ${isFloating ? 'p-2' : isFullscreen ? 'p-6 max-w-4xl mx-auto w-full' : 'p-3 space-y-3'}`}>
          {messages.length === 0 && (
            <div className={`text-center ${isFloating ? 'py-4' : 'py-6'}`}>
              <Sparkles size={isFloating ? 24 : 32} className="text-[#C9A84C]/30 mx-auto mb-2" />
              <p className={`text-white/50 mb-1 ${isFloating ? 'text-[14px]' : 'text-[16px]'}`}>What would you like to do?</p>
              <p className={`text-white/25 mb-4 ${isFloating ? 'text-[12px]' : 'text-[14px]'}`}>Tap a button — I&apos;ll walk you through the rest, one step at a time</p>
              {!isFloating && (
                <div className="flex flex-col gap-2 max-w-[340px] mx-auto">
                  {/* Guided help — the front door for non-technical users */}
                  <button onClick={() => sendMessage(HELP_PROMPT)}
                    className="w-full px-4 py-3.5 rounded-xl text-[15px] font-bold text-black active:scale-[0.98] transition-transform"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}>
                    👋 Help me get started
                  </button>
                  {([
                    ['📄 Create an estimate or invoice', 'I want to create a new estimate. Walk me through it step by step, one question at a time, and give me choices to tap.'],
                    ['🔍 Check on an estimate', 'Help me find an estimate and see where it stands. Ask me which customer or project, with choices if you can.'],
                    ['👤 Add a new customer', 'I want to add a new customer. Ask me for their details one question at a time.'],
                    ['✉️ Send an estimate to a customer', 'Help me send an estimate to a customer. Walk me through it one step at a time.'],
                  ] as const).map(([label, prompt]) => (
                    <button key={label} onClick={() => sendMessage(prompt)}
                      className="w-full px-4 py-3 rounded-xl text-[14px] font-semibold text-left bg-white/5 border border-white/10 text-white/70 hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/30 hover:text-white active:scale-[0.98] transition-all">
                      {label}
                    </button>
                  ))}
                  <p className="text-[12px] text-white/20 mt-1">…or type or tap the mic 🎤 and just say what you need</p>
                </div>
              )}
              {isFloating && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {[
                    ['Help me', HELP_PROMPT],
                    ['New estimate', 'I want to create a new estimate. Walk me through it step by step.'],
                    ['Find estimate', 'Help me find an estimate.'],
                  ].map(([label, prompt]) => (
                    <button key={label} onClick={() => sendMessage(prompt)}
                      className="px-2 py-1.5 text-[12px] bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white/60 transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, idx) => {
            const isLastAssistant = msg.role === 'assistant' && idx === messages.length - 1 && !loading && !readOnly;
            const choices = isLastAssistant ? parseChoices(msg.content) : [];
            return (
            <div key={idx}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-3 py-2 leading-relaxed ${
                  isFloating ? 'max-w-[95%] text-[13px]' : isFullscreen ? 'max-w-[80%] text-[16px]' : 'max-w-[90%] text-[15px]'
                } ${
                  msg.role === 'user' ? 'bg-[#C9A84C]/15 text-white rounded-br-md' : 'bg-[#111] border border-white/5 text-white/80 rounded-bl-md'
                }`}>
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="Attached" className="rounded-lg mb-2 max-h-48 w-auto" style={{ maxWidth: '100%' }} />
                  )}
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
              </div>
              {/* Guided-mode tap choices */}
              {choices.length > 0 && (
                <div className={`flex flex-wrap gap-2 mt-2 ${isFullscreen ? 'max-w-[80%]' : ''}`}>
                  {choices.map(choice => (
                    <button key={choice} onClick={() => sendMessage(choice)}
                      className={`px-4 py-2.5 rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#C9A84C] font-semibold hover:bg-[#C9A84C]/20 active:scale-95 transition-all ${isFloating ? 'text-[13px] px-3 py-2' : 'text-[15px]'}`}>
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className={`bg-[#111] border border-white/5 rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-2 ${isFloating ? 'text-[13px]' : 'text-[15px]'}`}>
                <Loader2 size={isFloating ? 14 : 16} className="animate-spin text-[#C9A84C]" />
                <span className="text-white/40">{loadingStatus}</span>
              </div>
            </div>
          )}
        </div>

        {/* Read-only banner — viewing another user's chat */}
        {readOnly && (
          <div className="border-t border-[#C9A84C]/20 flex-shrink-0 bg-[#C9A84C]/5 px-4 py-3 flex items-center justify-between gap-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
            <span className="text-[13px] text-[#C9A84C]/80">
              👁 Viewing {viewingUserName || 'another user'}&apos;s chat — read only
            </span>
            <button onClick={startNewChat}
              className="px-3 py-2 rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-[13px] font-semibold whitespace-nowrap">
              My chats
            </button>
          </div>
        )}

        {/* Input */}
        {!readOnly && (
        <div className={`border-t border-white/10 flex-shrink-0 bg-[#0f0f0f] ${isFloating ? 'px-2 py-2' : isFullscreen ? 'px-6 pt-3 max-w-4xl mx-auto w-full' : 'px-3 pt-2.5'}`}
          style={!isFloating ? { paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' } : undefined}>
          {/* Image preview strip */}
          {attachedImage && (
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <img src={attachedImage.preview} alt="Attached" className="h-14 w-14 rounded-lg object-cover border border-white/20" />
                <button onClick={() => setAttachedImage(null)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black border border-white/30 rounded-full flex items-center justify-center">
                  <X size={9} className="text-white" />
                </button>
              </div>
              <span className="text-[12px] text-white/30">Photo attached — ask anything about it</span>
            </div>
          )}
          <div className="flex gap-2">
            {/* File input — sr-only instead of hidden so mobile browsers allow programmatic click */}
            <input id="chat-photo-input" ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoSelect} />
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={listening ? 'Recording... tap to stop' : transcribing ? 'Transcribing...' : attachedImage ? 'Describe what you need...' : 'Ask anything...'}
              disabled={loading || transcribing}
              className={`flex-1 bg-[#1a1a1a] border rounded-xl px-3 text-white placeholder-white/25 focus:outline-none transition-colors ${
                listening ? 'border-red-500/50 bg-red-500/5' : transcribing ? 'border-[#C9A84C]/30 bg-[#C9A84C]/5' : attachedImage ? 'border-[#C9A84C]/30' : 'border-white/10 focus:border-[#C9A84C]/50'
              } ${isFloating ? 'py-2 text-[13px]' : isFullscreen ? 'py-3 text-[16px] px-4' : 'py-3 text-[15px] px-4'}`} />
            {/* Camera / photo button — label for reliable mobile file picker */}
            <label htmlFor={loading ? undefined : 'chat-photo-input'}
              className={`rounded-xl transition-colors flex-shrink-0 inline-flex items-center justify-center ${
                loading ? 'opacity-30 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
              } ${attachedImage ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-white/5 text-white/40 hover:text-[#C9A84C] hover:bg-white/10'
              } ${isFloating ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
              title="Attach photo (camera or gallery)">
              <Camera size={isFloating ? 12 : 16} />
            </label>
            {/* Voice conversation — hands-free talk mode */}
            <button onClick={startVoiceMode} disabled={loading || transcribing}
              className={`relative rounded-xl flex-shrink-0 overflow-hidden active:scale-90 transition-transform disabled:opacity-40 ${isFloating ? 'px-2.5 py-2' : 'px-3.5 py-2.5'}`}
              style={{
                background: 'linear-gradient(135deg, #34d399 0%, #38bdf8 35%, #a78bfa 70%, #f472b6 100%)',
                boxShadow: '0 0 14px rgba(56,189,248,0.5), 0 0 28px rgba(167,139,250,0.25)',
              }}
              title="Talk to the AI — hands-free conversation">
              <span className="absolute inset-0 bg-white/20 animate-pulse rounded-xl" style={{ mixBlendMode: 'overlay' }} />
              <AudioLines size={isFloating ? 13 : 17} className="relative text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
            </button>
            <button onClick={() => sendMessage()} disabled={loading || (!input.trim() && !attachedImage)}
              className={`bg-[#C9A84C] text-black rounded-xl hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-30 flex-shrink-0 ${
                isFloating ? 'px-2.5 py-2' : 'px-3.5 py-2.5'
              }`}>
              <Send size={isFloating ? 12 : 14} />
            </button>
          </div>
        </div>
        )}
      </div>
    </>
  );
}
