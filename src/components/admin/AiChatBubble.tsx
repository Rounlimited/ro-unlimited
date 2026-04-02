'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Send, Loader2, Sparkles, Minimize2, MessageSquare, Plus, Trash2, Zap, Move, Maximize2, Shrink, Mic, MicOff, Volume2, VolumeX, Camera, MapPin } from 'lucide-react';

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
  const [aiModel, setAiModel] = useState<'grok' | 'claude' | 'groq'>('grok');
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Chat history
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState(0);
  const [compacting, setCompacting] = useState(false);

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
  const sendMessageRef = useRef<() => void>(() => {});

  // TTS (SpeechSynthesis)
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const speakingRef = useRef(false);

  const speakText = useCallback((text: string) => {
    if (!speakEnabled || typeof window === 'undefined') return;
    // Strip markdown for clean speech
    const clean = text
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

  // ── Load conversation list ──
  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/admin/ai-conversations');
    if (res.ok) { const data = await res.json(); setConversations(data.conversations || []); }
  }, []);
  useEffect(() => { if (open) fetchConversations(); }, [open, fetchConversations]);

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
    }
    setShowHistory(false);
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

  // ── Send message ──
  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !attachedImage) || loading) return;

    // Create conversation if none active
    if (!activeConvId) {
      const res = await fetch('/api/admin/ai-conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title: (text || 'Image analysis').slice(0, 60) }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConvId(data.conversation.id);
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
          imageData: imageToSend ? { base64: imageToSend.base64, mimeType: imageToSend.mimeType } : undefined,
        }),
      });

      const data = await res.json();
      const replyText = data.content || data.error || 'Sorry, something went wrong.';
      const reply: Message = { role: 'assistant', content: replyText };
      const finalMessages = [...newMessages, reply];
      setMessages(finalMessages);
      if (displayMode === 'minimized' || !open) setUnread(prev => prev + 1);

      // Speak the response if TTS is enabled
      speakText(replyText);

      // Handle navigation actions
      if (data.actions) {
        handleActions(data.actions);
      }

      // Auto-save
      const convId = activeConvId;
      if (convId) {
        const title = newMessages.length <= 1 ? text.slice(0, 60) : undefined;
        await fetch('/api/admin/ai-conversations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', id: convId, messages: finalMessages, title }),
        }).then(r => r.json()).then(d => setTokenEstimate(d.token_estimate || 0));
        fetchConversations();
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }

    setLoading(false);
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

  // Markdown rendering
  const renderContent = (text: string) => {
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
      <button onClick={startNewChat} className="flex items-center gap-2 mx-3 mt-3 mb-2 px-4 py-2.5 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl text-[#C9A84C] text-[14px] font-semibold hover:bg-[#C9A84C]/15 transition-colors">
        <Plus size={16} /> New Chat
      </button>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {conversations.length === 0 ? (
          <p className="text-center text-white/20 text-[14px] py-8">No saved chats yet</p>
        ) : conversations.map(conv => (
          <button key={conv.id} onClick={() => loadConversation(conv.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors mb-1 ${activeConvId === conv.id ? 'bg-[#C9A84C]/10' : 'hover:bg-white/5'}`}>
            <MessageSquare size={16} className={activeConvId === conv.id ? 'text-[#C9A84C]' : 'text-white/20'} />
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] truncate ${activeConvId === conv.id ? 'text-[#C9A84C] font-semibold' : 'text-white/60'}`}>{conv.title}</p>
              <p className="text-[11px] text-white/20">{new Date(conv.updated_at).toLocaleDateString()}</p>
            </div>
            <button onClick={(e) => deleteConversation(conv.id, e)} className="p-1 text-white/10 hover:text-red-400 transition-colors shrink-0">
              <Trash2 size={14} />
            </button>
          </button>
        ))}
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
              {!isFloating && <span className="text-[11px] text-green-400">Online</span>}
            </div>
            {isFloating && (
              <Move size={12} className="text-white/20 ml-1" />
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {/* Token indicator */}
            {tokenEstimate > 10000 && !isFloating && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tokenEstimate > TOKEN_COMPACT_THRESHOLD ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/20'}`}>
                {Math.round(tokenEstimate / 1000)}k
              </span>
            )}
            {/* Compact button */}
            {tokenEstimate > TOKEN_COMPACT_THRESHOLD && !isFloating && (
              <button onClick={compactChat} disabled={compacting}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-[#D4772C]/15 text-[#D4772C] border border-[#D4772C]/30 hover:bg-[#D4772C]/25 transition-colors" title="Compact chat to save context">
                {compacting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                Compact
              </button>
            )}
            {/* Model switch */}
            {!isFloating && (
              <button onClick={() => setAiModel(prev => prev === 'grok' ? 'claude' : prev === 'claude' ? 'groq' : 'grok')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors border ${aiModel === 'grok' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : aiModel === 'claude' ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30' : 'bg-green-500/15 text-green-400 border-green-500/30'}`} title="Switch AI model">
                {aiModel === 'grok' ? 'Grok' : aiModel === 'claude' ? 'Claude' : 'Groq'}
              </button>
            )}
            {/* TTS toggle */}
            {!isFloating && (
              <button onClick={() => { if (speakEnabled) stopSpeaking(); setSpeakEnabled(prev => !prev); }}
                className={`p-1.5 rounded-lg transition-colors ${speakEnabled ? 'text-[#C9A84C] bg-[#C9A84C]/10' : 'text-white/20 hover:text-white hover:bg-white/10'}`}
                title={speakEnabled ? 'Voice responses on (click to mute)' : 'Voice responses off (click to enable)'}>
                {speakEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            )}
            {/* New chat */}
            <button onClick={startNewChat} className="p-1.5 text-white/20 hover:text-[#C9A84C] hover:bg-white/5 rounded-lg transition-colors" title="New chat">
              <Plus size={isFloating ? 14 : 16} />
            </button>
            {/* Fullscreen toggle */}
            {!isFloating && (
              <button onClick={() => setDisplayMode(isFullscreen ? 'full' : 'fullscreen')} className="p-1.5 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title={isFullscreen ? 'Exit full screen' : 'Full screen'}>
                {isFullscreen ? <Shrink size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
            {/* Float toggle */}
            {!isFullscreen && (
              <button onClick={() => setDisplayMode(isFloating ? 'full' : 'floating')} className="p-1.5 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title={isFloating ? 'Expand panel' : 'Floating window'}>
                <Move size={isFloating ? 14 : 16} />
              </button>
            )}
            {/* Minimize */}
            {!isFullscreen && (
              <button onClick={() => setDisplayMode('minimized')} className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Minimize">
                <Minimize2 size={isFloating ? 14 : 16} />
              </button>
            )}
            {/* Close */}
            <button onClick={() => setOpen(false)} className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Close">
              <X size={isFloating ? 14 : 16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto space-y-2 ${isFloating ? 'p-2' : isFullscreen ? 'p-6 max-w-4xl mx-auto w-full' : 'p-3 space-y-3'}`}>
          {messages.length === 0 && (
            <div className={`text-center ${isFloating ? 'py-4' : 'py-6'}`}>
              <Sparkles size={isFloating ? 24 : 32} className="text-[#C9A84C]/30 mx-auto mb-2" />
              <p className={`text-white/50 mb-1 ${isFloating ? 'text-[14px]' : 'text-[16px]'}`}>How can I help?</p>
              <p className={`text-white/25 mb-3 ${isFloating ? 'text-[12px]' : 'text-[14px]'}`}>Ask about customers, estimates, codes, or your projects</p>
              {!isFloating && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    "Pull up Sherry's estimate",
                    'Show all unpaid estimates',
                    'Create a new customer',
                    'Take me to estimates',
                    'SC permit requirements',
                  ].map(q => (
                    <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="px-3 py-2 text-[13px] bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white/60 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {isFloating && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {[
                    "Sherry's estimate",
                    'New customer',
                    'Go to estimates',
                  ].map(q => (
                    <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                      className="px-2 py-1.5 text-[12px] bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white/60 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className={`bg-[#111] border border-white/5 rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-2 ${isFloating ? 'text-[13px]' : 'text-[15px]'}`}>
                <Loader2 size={isFloating ? 14 : 16} className="animate-spin text-[#C9A84C]" />
                <span className="text-white/40">{loadingStatus}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
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
            {/* Voice button */}
            <button onClick={toggleVoice} disabled={loading || transcribing}
              className={`rounded-xl transition-colors flex-shrink-0 ${
                listening ? 'bg-red-500 text-white animate-pulse' :
                transcribing ? 'bg-[#C9A84C]/20 text-[#C9A84C]' :
                'bg-white/5 text-white/40 hover:text-[#C9A84C] hover:bg-white/10'
              } ${isFloating ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
              title={listening ? 'Tap to stop & send' : transcribing ? 'Transcribing...' : 'Voice input'}>
              {transcribing ? <Loader2 size={isFloating ? 12 : 16} className="animate-spin" /> :
               listening ? <MicOff size={isFloating ? 12 : 16} /> :
               <Mic size={isFloating ? 12 : 16} />}
            </button>
            <button onClick={sendMessage} disabled={loading || (!input.trim() && !attachedImage)}
              className={`bg-[#C9A84C] text-black rounded-xl hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-30 flex-shrink-0 ${
                isFloating ? 'px-2.5 py-2' : 'px-3.5 py-2.5'
              }`}>
              <Send size={isFloating ? 12 : 14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
