'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Loader2, Sparkles, Minimize2, MessageSquare, Plus, Trash2, ChevronDown, Zap } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface Conversation { id: string; title: string; summary: string | null; token_estimate: number; compacted: boolean; created_at: string; updated_at: string; }

const TOKEN_COMPACT_THRESHOLD = 20000; // ~5K words — trigger compaction

export default function AiChatBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Thinking...');
  const [aiModel, setAiModel] = useState<'claude' | 'groq'>('claude');
  const [unread, setUnread] = useState(0);

  // Chat history
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState(0);
  const [compacting, setCompacting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight); }, [messages, loading]);
  useEffect(() => { if (open && !minimized) { setTimeout(() => inputRef.current?.focus(), 200); setUnread(0); } }, [open, minimized]);

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

    const lm = text.toLowerCase();
    if (lm.includes('search') || lm.includes('look up')) setLoadingStatus('Searching...');
    else if (lm.includes('list') || lm.includes('show') || lm.includes('pull up') || lm.includes('find')) setLoadingStatus('Querying database...');
    else if (lm.includes('create') || lm.includes('make') || lm.includes('new')) setLoadingStatus('Creating...');
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
      if (minimized || !open) setUnread(prev => prev + 1);

      // Auto-save
      const convId = activeConvId;
      if (convId) {
        // Auto-title from first user message
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

  // Markdown rendering
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (processed.startsWith('- ') || processed.startsWith('• ')) {
        processed = `<span style="color:#C9A84C;margin-right:4px">•</span>${processed.slice(2)}`;
        return <div key={i} className="flex items-start gap-0 pl-2 py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      if (!processed.trim()) return <div key={i} className="h-2" />;
      return <div key={i} className="py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  if (pathname === '/admin/login') return null;

  // ── Bubble (closed) ──
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[90] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)', boxShadow: '0 4px 24px rgba(201,168,76,0.4)' }}>
        <Sparkles size={24} className="text-black" />
        {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
      </button>
    );
  }

  // ── Minimized bar ──
  if (minimized) {
    return (
      <div className="fixed bottom-20 right-4 z-[90] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl cursor-pointer hover:scale-105 transition-all"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)', boxShadow: '0 4px 24px rgba(201,168,76,0.4)' }}
        onClick={() => setMinimized(false)}>
        <Sparkles size={18} className="text-black" />
        <span className="text-black text-[13px] font-semibold">RO Assistant</span>
        {unread > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
      </div>
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

  // ── Full chat panel ──
  return (
    <div className="fixed inset-3 sm:inset-4 sm:left-auto sm:w-[480px] sm:top-4 sm:bottom-20 z-[90] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.1)' }}>

      {showHistory && <HistoryPanel />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0 bg-[#0f0f0f]">
        <div className="flex items-center gap-2">
          {/* History toggle */}
          <button onClick={() => setShowHistory(!showHistory)} className="p-1.5 text-white/30 hover:text-[#C9A84C] hover:bg-white/5 rounded-lg transition-colors" title="Chat history">
            <MessageSquare size={18} />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}>
            <Sparkles size={16} className="text-black" />
          </div>
          <div>
            <span className="text-[15px] font-semibold text-white block leading-tight">RO Assistant</span>
            <span className="text-[11px] text-green-400">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Token indicator */}
          {tokenEstimate > 10000 && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tokenEstimate > TOKEN_COMPACT_THRESHOLD ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/20'}`}>
              {Math.round(tokenEstimate / 1000)}k
            </span>
          )}
          {/* Compact button — shows when approaching limit */}
          {tokenEstimate > TOKEN_COMPACT_THRESHOLD && (
            <button onClick={compactChat} disabled={compacting}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-[#D4772C]/15 text-[#D4772C] border border-[#D4772C]/30 hover:bg-[#D4772C]/25 transition-colors" title="Compact chat to save context">
              {compacting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Compact
            </button>
          )}
          <button onClick={() => setAiModel(prev => prev === 'claude' ? 'groq' : 'claude')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors border ${aiModel === 'claude' ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/30' : 'bg-green-500/15 text-green-400 border-green-500/30'}`} title="Switch AI model">
            {aiModel === 'claude' ? 'Claude' : 'Groq'}
          </button>
          <button onClick={startNewChat} className="p-2 text-white/20 hover:text-[#C9A84C] hover:bg-white/5 rounded-lg transition-colors" title="New chat">
            <Plus size={16} />
          </button>
          <button onClick={() => setMinimized(true)} className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Minimize2 size={16} />
          </button>
          <button onClick={() => setOpen(false)} className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Sparkles size={32} className="text-[#C9A84C]/30 mx-auto mb-3" />
            <p className="text-[16px] text-white/50 mb-1">How can I help?</p>
            <p className="text-[14px] text-white/25 mb-4">Ask about customers, estimates, codes, or your projects</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                "Pull up Sherry's estimate",
                'Show all unpaid estimates',
                'How do I send an estimate?',
                'SC permit requirements',
              ].map(q => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-3 py-2 text-[13px] bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white/60 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
              msg.role === 'user' ? 'bg-[#C9A84C]/15 text-white rounded-br-md' : 'bg-[#111] border border-white/5 text-white/80 rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#111] border border-white/5 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#C9A84C]" />
              <span className="text-[15px] text-white/40">{loadingStatus}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-white/10 flex-shrink-0 bg-[#0f0f0f]">
        <div className="flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything..." disabled={loading}
            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-[15px] placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 transition-colors" />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="px-3.5 py-2.5 bg-[#C9A84C] text-black rounded-xl hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-30 flex-shrink-0">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
