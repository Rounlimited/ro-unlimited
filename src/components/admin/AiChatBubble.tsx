'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Send, Loader2, Sparkles, Minimize2, MessageSquare, Plus, Trash2, Zap, Move, Maximize2, Shrink, Mic, MicOff } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }
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
  const [aiModel, setAiModel] = useState<'claude' | 'groq'>('claude');
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Chat history
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState(0);
  const [compacting, setCompacting] = useState(false);

  // Voice input
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setToast('Voice input not supported in this browser'); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onend = () => { setListening(false); };
    recognition.onerror = () => { setListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
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
    if (!text || loading) return;

    // Create conversation if none active
    if (!activeConvId) {
      const res = await fetch('/api/admin/ai-conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title: text.slice(0, 60) }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConvId(data.conversation.id);
        fetchConversations();
      }
    }

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Smart loading status
    const lm = text.toLowerCase();
    if (lm.includes('search') || lm.includes('look up') || lm.includes('find')) setLoadingStatus('Querying database...');
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
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), currentPage: pathname, projectContext, useModel: aiModel }),
      });

      const data = await res.json();
      const reply: Message = { role: 'assistant', content: data.content || data.error || 'Sorry, something went wrong.' };
      const finalMessages = [...newMessages, reply];
      setMessages(finalMessages);
      if (displayMode === 'minimized' || !open) setUnread(prev => prev + 1);

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

  // Markdown rendering
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (processed.startsWith('- ') || processed.startsWith('* ')) {
        processed = `<span style="color:#C9A84C;margin-right:4px">&#8226;</span>${processed.slice(2)}`;
        return <div key={i} className="flex items-start gap-0 pl-2 py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      if (!processed.trim()) return <div key={i} className="h-2" />;
      return <div key={i} className="py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
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

  // ── Pull-tab (closed) — always docked to right edge ──
  if (!open) {
    return (
      <>
        <ToastNotification />
        <button onClick={() => { setOpen(true); setDisplayMode('full'); }}
          className="fixed top-3 right-3 z-[90] group transition-all active:scale-95">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2a6aaa, #3b8dd4)', boxShadow: '0 2px 12px rgba(59,141,212,0.3)' }}>
            <Sparkles size={15} className="text-white group-hover:scale-110 transition-transform" />
          </div>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg">
              {unread}
            </span>
          )}
        </button>
      </>
    );
  }

  // ── Minimized bar ──
  if (displayMode === 'minimized') {
    return (
      <>
        <ToastNotification />
        <div className="fixed top-3 right-14 z-[90] flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-2xl cursor-pointer hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)', boxShadow: '0 2px 16px rgba(201,168,76,0.3)' }}
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
        className: 'fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col overflow-hidden',
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
      className: 'fixed inset-3 sm:inset-4 sm:left-auto sm:w-[480px] sm:top-4 sm:bottom-20 z-[90] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden',
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
              <button onClick={() => setAiModel(prev => prev === 'claude' ? 'groq' : 'claude')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors border ${aiModel === 'claude' ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30' : 'bg-green-500/15 text-green-400 border-green-500/30'}`} title="Switch AI model">
                {aiModel === 'claude' ? 'Claude' : 'Groq'}
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
        <div className={`border-t border-white/10 flex-shrink-0 bg-[#0f0f0f] ${isFloating ? 'px-2 py-2' : isFullscreen ? 'px-6 py-3 max-w-4xl mx-auto w-full' : 'px-3 py-2.5'}`}>
          <div className="flex gap-2">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={listening ? 'Listening...' : 'Ask anything...'} disabled={loading}
              className={`flex-1 bg-[#1a1a1a] border rounded-xl px-3 text-white placeholder-white/25 focus:outline-none transition-colors ${
                listening ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-[#C9A84C]/50'
              } ${isFloating ? 'py-2 text-[13px]' : isFullscreen ? 'py-3 text-[16px] px-4' : 'py-3 text-[15px] px-4'}`} />
            <button onClick={toggleVoice} disabled={loading}
              className={`rounded-xl transition-colors flex-shrink-0 ${
                listening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/40 hover:text-[#C9A84C] hover:bg-white/10'
              } ${isFloating ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
              title={listening ? 'Stop listening' : 'Voice input'}>
              {listening ? <MicOff size={isFloating ? 12 : 16} /> : <Mic size={isFloating ? 12 : 16} />}
            </button>
            <button onClick={sendMessage} disabled={loading || !input.trim()}
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
