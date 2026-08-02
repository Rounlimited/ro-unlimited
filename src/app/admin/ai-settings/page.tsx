'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Sparkles, Brain, Volume2, BarChart3, Cpu, Loader2, Play,
  Trash2, Plus, RefreshCw, Zap, MessageSquare, AudioLines, Info,
} from 'lucide-react';

interface Memory { id: string; content: string; category: string; source: string; created_at: string; }
interface Conversation { id: string; title: string; token_estimate: number; compacted: boolean; updated_at: string; }

// Category → color coding (matches the widget's semantic colors)
const CATEGORY_STYLES: Record<string, { chip: string; dot: string; label: string }> = {
  preferences: { chip: 'bg-violet-500/15 text-violet-300 border-violet-400/30', dot: 'bg-violet-400', label: 'Preferences' },
  pricing: { chip: 'bg-amber-500/15 text-amber-300 border-amber-400/30', dot: 'bg-amber-400', label: 'Pricing' },
  customers: { chip: 'bg-blue-500/15 text-blue-300 border-blue-400/30', dot: 'bg-blue-400', label: 'Customers' },
  projects: { chip: 'bg-green-500/15 text-green-300 border-green-400/30', dot: 'bg-green-400', label: 'Projects' },
  general: { chip: 'bg-white/8 text-white/60 border-white/15', dot: 'bg-white/40', label: 'General' },
};
const catStyle = (c: string) => CATEGORY_STYLES[c] || CATEGORY_STYLES.general;

const VOICES: { id: string; name: string; desc: string }[] = [
  { id: 'andrew', name: 'Andrew', desc: 'Deep, confident — the default' },
  { id: 'brian', name: 'Brian', desc: 'Warm, friendly' },
  { id: 'guy', name: 'Guy', desc: 'Upbeat, energetic' },
  { id: 'ava', name: 'Ava', desc: 'Polished, professional' },
  { id: 'emma', name: 'Emma', desc: 'Friendly, easygoing' },
  { id: 'jenny', name: 'Jenny', desc: 'Classic assistant' },
];

const MODELS = [
  {
    id: 'grok', label: 'Smart', name: 'Grok 4.1 Fast', by: 'xAI', role: 'Primary',
    desc: 'The main brain. Handles estimates, customers, emails, live web search and all 40+ tools. Streams answers in real time.',
    cls: 'border-blue-400/30', chip: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
  },
  {
    id: 'claude', label: 'Claude', name: 'Claude Haiku 4.5', by: 'Anthropic', role: 'Backup',
    desc: 'Takes over automatically if the primary is down. Same tools, very reliable.',
    cls: 'border-[#C9A84C]/30', chip: 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40',
  },
  {
    id: 'groq', label: 'Fast', name: 'Llama 3.3 70B', by: 'Groq', role: 'Last resort',
    desc: 'Instant answers for general questions. No database access — for company data use Smart or Claude.',
    cls: 'border-green-400/30', chip: 'bg-green-500/15 text-green-300 border-green-400/30',
  },
];

export default function AiSettingsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultModel, setDefaultModel] = useState('grok');
  const [ttsVoice, setTtsVoice] = useState('andrew');
  const [autoRead, setAutoRead] = useState(false);
  const [bargeIn, setBargeIn] = useState(true);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [newMemory, setNewMemory] = useState('');
  const [newMemoryCat, setNewMemoryCat] = useState('general');
  const [savingMemory, setSavingMemory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const m = localStorage.getItem('ro-ai-model');
      if (m) setDefaultModel(m);
      const legacyMap: Record<string, string> = { troy: 'andrew', austin: 'brian', daniel: 'guy', autumn: 'ava', diana: 'emma', hannah: 'jenny' };
      const v = localStorage.getItem('ro-tts-voice');
      if (v) setTtsVoice(legacyMap[v] || v);
      setAutoRead(localStorage.getItem('ro-tts-autoread') === '1');
      setBargeIn(localStorage.getItem('ro-voice-bargein') !== '0');
    } catch {}
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [memRes, convRes] = await Promise.all([
        fetch('/api/admin/ai-memories'),
        fetch('/api/admin/ai-conversations'),
      ]);
      if (memRes.ok) setMemories(await memRes.json());
      if (convRes.ok) {
        const d = await convRes.json();
        setConversations(d.conversations || []);
      }
    } catch {}
    setLoading(false);
  };

  const pickModel = (id: string) => {
    setDefaultModel(id);
    try { localStorage.setItem('ro-ai-model', id); } catch {}
  };

  const pickVoice = (id: string) => {
    setTtsVoice(id);
    try { localStorage.setItem('ro-tts-voice', id); } catch {}
  };

  const toggleAutoRead = () => {
    setAutoRead(v => {
      try { localStorage.setItem('ro-tts-autoread', !v ? '1' : '0'); } catch {}
      return !v;
    });
  };

  const previewVoice = useCallback(async (id: string) => {
    if (previewing) return;
    setPreviewing(id);
    try {
      previewAudioRef.current?.pause();
      const res = await fetch('/api/admin/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Hi, I'm ${VOICES.find(v => v.id === id)?.name}. This is how I sound reading your estimates and answers.`, voice: id }),
      });
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        previewAudioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); setPreviewing(null); };
        audio.onerror = () => { URL.revokeObjectURL(url); setPreviewing(null); };
        await audio.play();
        return;
      }
    } catch {}
    setPreviewing(null);
  }, [previewing]);

  const addMemory = async () => {
    const content = newMemory.trim();
    if (!content || savingMemory) return;
    setSavingMemory(true);
    try {
      const res = await fetch('/api/admin/ai-memories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category: newMemoryCat, source: 'user' }),
      });
      if (res.ok) {
        setNewMemory('');
        await loadData();
      }
    } catch {}
    setSavingMemory(false);
  };

  const deleteMemory = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/ai-memories?id=${id}`, { method: 'DELETE' });
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch {}
    setDeletingId(null);
  };

  const totalTokens = conversations.reduce((s, c) => s + (c.token_estimate || 0), 0);
  const memByCat = memories.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  return (
    // AppShell's <main> is overflow-hidden — this page must scroll itself
    <div className="flex-1 min-h-0 h-full overflow-y-auto bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3.5">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}>
            <Sparkles size={18} className="text-black" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold leading-tight">AI Settings</h1>
            <p className="text-[12px] text-white/35 leading-tight">RO Assistant — models, voice, memory &amp; usage</p>
          </div>
          <button onClick={loadData} className="ml-auto p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors" title="Refresh">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-6 mt-5">

        {/* ── Models ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={16} className="text-blue-300" />
            <h2 className="text-[15px] font-bold">AI Models</h2>
          </div>
          <div className="space-y-2.5">
            {MODELS.map(m => (
              <button key={m.id} onClick={() => pickModel(m.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${defaultModel === m.id ? `${m.cls} bg-white/[0.04]` : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-[12px] font-bold border ${m.chip}`}>{m.label}</span>
                  <span className="text-[14px] font-semibold">{m.name}</span>
                  <span className="text-[12px] text-white/30">by {m.by}</span>
                  <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-white/25">{m.role}</span>
                  {defaultModel === m.id && (
                    <span className="text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 rounded-md px-1.5 py-0.5">DEFAULT</span>
                  )}
                </div>
                <p className="text-[13px] text-white/45 mt-2 leading-relaxed">{m.desc}</p>
              </button>
            ))}
          </div>
          <p className="text-[12px] text-white/25 mt-2 flex items-start gap-1.5">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            Tap a model to make it the default for new chats. If it ever fails, the assistant automatically falls back down this list.
          </p>
        </section>

        {/* ── Voice & speech ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AudioLines size={16} className="text-pink-300" />
            <h2 className="text-[15px] font-bold">Voice &amp; Speech</h2>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] divide-y divide-white/6">
            {/* Auto-read toggle */}
            <button onClick={toggleAutoRead} className="w-full flex items-center gap-3 px-4 py-4">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${autoRead ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-white/5 text-white/40'}`}>
                <Volume2 size={19} />
              </span>
              <span className="text-left flex-1">
                <span className="block text-[15px] font-semibold">Read replies aloud</span>
                <span className="block text-[12px] text-white/35">Speak every AI answer in regular chat</span>
              </span>
              <span className={`w-12 h-7 rounded-full relative transition-colors flex-shrink-0 ${autoRead ? 'bg-[#C9A84C]' : 'bg-white/15'}`}>
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${autoRead ? 'left-[26px]' : 'left-1'}`} />
              </span>
            </button>
            {/* Barge-in toggle */}
            <button onClick={() => setBargeIn(v => {
              try { localStorage.setItem('ro-voice-bargein', !v ? '1' : '0'); } catch {}
              return !v;
            })} className="w-full flex items-center gap-3 px-4 py-4">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bargeIn ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-white/40'}`}>
                <MessageSquare size={19} />
              </span>
              <span className="text-left flex-1">
                <span className="block text-[15px] font-semibold">Interrupt by talking</span>
                <span className="block text-[12px] text-white/35">
                  {bargeIn ? 'Just start talking to cut the AI off mid-sentence' : 'Off — tap the orb to interrupt instead'}
                </span>
              </span>
              <span className={`w-12 h-7 rounded-full relative transition-colors flex-shrink-0 ${bargeIn ? 'bg-green-500' : 'bg-white/15'}`}>
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${bargeIn ? 'left-[26px]' : 'left-1'}`} />
              </span>
            </button>
            {/* Voice picker */}
            <div className="px-4 py-4">
              <p className="text-[13px] font-semibold text-white/60 mb-3">Assistant voice — tap ▶ to hear a sample</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VOICES.map(v => (
                  <div key={v.id}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all cursor-pointer ${ttsVoice === v.id ? 'border-[#C9A84C]/50 bg-[#C9A84C]/8' : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                    onClick={() => pickVoice(v.id)}>
                    <button onClick={(e) => { e.stopPropagation(); previewVoice(v.id); }}
                      className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center flex-shrink-0 transition-colors">
                      {previewing === v.id ? <Loader2 size={15} className="animate-spin text-[#C9A84C]" /> : <Play size={15} className="text-white/70 ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold leading-tight">{v.name}</p>
                      <p className="text-[11px] text-white/35 leading-tight mt-0.5">{v.desc}</p>
                    </div>
                    {ttsVoice === v.id && <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] flex-shrink-0" />}
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-white/25 mt-3">
                Natural Microsoft neural voices. Used for voice conversations and read-aloud replies.
              </p>
            </div>
          </div>
        </section>

        {/* ── Memory ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-violet-300" />
            <h2 className="text-[15px] font-bold">Memory</h2>
            <span className="text-[12px] text-white/30">{memories.length} saved</span>
            <div className="ml-auto flex gap-1.5">
              {Object.entries(memByCat).map(([cat, n]) => (
                <span key={cat} className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${catStyle(cat).chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${catStyle(cat).dot}`} />{n}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
            {/* Add memory */}
            <div className="p-3.5 border-b border-white/6">
              <div className="flex gap-2">
                <input value={newMemory} onChange={e => setNewMemory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMemory()}
                  placeholder="Teach the AI something to remember…"
                  className="flex-1 bg-[#161616] border border-white/10 rounded-xl px-3.5 py-2.5 text-[14px] placeholder-white/25 focus:outline-none focus:border-violet-400/50" />
                <select value={newMemoryCat} onChange={e => setNewMemoryCat(e.target.value)}
                  className="bg-[#161616] border border-white/10 rounded-xl px-2 py-2.5 text-[13px] text-white/70 focus:outline-none">
                  {Object.entries(CATEGORY_STYLES).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
                </select>
                <button onClick={addMemory} disabled={!newMemory.trim() || savingMemory}
                  className="px-3.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-400/30 disabled:opacity-30 hover:bg-violet-500/30 transition-colors">
                  {savingMemory ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              </div>
            </div>
            {/* Memory list */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
              {loading && memories.length === 0 && (
                <div className="p-6 text-center text-white/30 text-[13px]"><Loader2 size={18} className="animate-spin mx-auto mb-2" />Loading…</div>
              )}
              {!loading && memories.length === 0 && (
                <div className="p-6 text-center text-white/30 text-[13px]">No memories yet — the AI saves important facts here as you work, or add one above.</div>
              )}
              {memories.map(m => (
                <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${catStyle(m.category).chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${catStyle(m.category).dot}`} />
                    {catStyle(m.category).label}
                  </span>
                  <p className="flex-1 text-[13px] text-white/70 leading-relaxed">{m.content}</p>
                  <button onClick={() => deleteMemory(m.id)} disabled={deletingId === m.id}
                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                    {deletingId === m.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Usage & stats ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-green-300" />
            <h2 className="text-[15px] font-bold">Usage &amp; Stats</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { icon: MessageSquare, label: 'Conversations', value: String(conversations.length), cls: 'text-blue-300' },
              { icon: Zap, label: 'Words stored', value: totalTokens > 1000 ? `${Math.round(totalTokens / 1000)}k` : String(totalTokens), cls: 'text-amber-300' },
              { icon: Brain, label: 'Memories', value: String(memories.length), cls: 'text-violet-300' },
              { icon: Sparkles, label: 'Compacted chats', value: String(conversations.filter(c => c.compacted).length), cls: 'text-green-300' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 text-center">
                <s.icon size={17} className={`mx-auto mb-1.5 ${s.cls}`} />
                <p className="text-[20px] font-bold leading-none">{s.value}</p>
                <p className="text-[11px] text-white/35 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── System ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-white/40" />
            <h2 className="text-[15px] font-bold">System</h2>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] divide-y divide-white/6 text-[13px]">
            {[
              ['Speech recognition', 'Whisper Large v3 Turbo (Groq) — what you say in voice mode'],
              ['Text-to-speech', 'Microsoft neural voices — natural speech, with automatic backups'],
              ['Web search', 'Brave Search with live results'],
              ['Tools', '40+ actions: estimates, customers, emails, tasks, schedules, weather'],
              ['Memory recall', 'Preferences & pricing always on; other memories matched to your question'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 px-4 py-3">
                <span className="w-36 flex-shrink-0 font-semibold text-white/50">{k}</span>
                <span className="text-white/40 leading-relaxed">{v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
