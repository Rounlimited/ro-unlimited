'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setUnread(0);
    }
  }, [open, minimized]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Auto-fetch project context if on an estimate page
      let projectContext = null;
      const estimateMatch = pathname?.match(/\/admin\/estimates\/([a-f0-9-]{36})/);
      if (estimateMatch) {
        try {
          const ctxRes = await fetch(`/api/admin/estimates/${estimateMatch[1]}`);
          if (ctxRes.ok) {
            const ctxData = await ctxRes.json();
            projectContext = { type: 'estimate', data: ctxData };
          }
        } catch {}
      }

      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          currentPage: pathname,
          projectContext,
        }),
      });

      const data = await res.json();
      const reply: Message = {
        role: 'assistant',
        content: data.content || data.error || 'Sorry, something went wrong.',
      };
      setMessages(prev => [...prev, reply]);
      if (minimized || !open) setUnread(prev => prev + 1);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }]);
    }

    setLoading(false);
  };

  // Simple markdown rendering (bold, bullets)
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (processed.startsWith('- ') || processed.startsWith('• ')) {
        processed = `<span class="text-[#C9A84C] mr-1">•</span>${processed.slice(2)}`;
        return <div key={i} className="flex items-start gap-0 pl-2 py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      if (!processed.trim()) return <div key={i} className="h-2" />;
      return <div key={i} className="py-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  // Don't show on login page
  if (pathname === '/admin/login') return null;

  // Bubble only
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[90] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #C9A84C, #D4772C)',
          boxShadow: '0 4px 24px rgba(201,168,76,0.4)',
        }}
      >
        <Sparkles size={24} className="text-black" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    );
  }

  // Minimized bar
  if (minimized) {
    return (
      <div
        className="fixed bottom-20 right-4 z-[90] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl cursor-pointer hover:scale-105 transition-all"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)', boxShadow: '0 4px 24px rgba(201,168,76,0.4)' }}
        onClick={() => setMinimized(false)}
      >
        <Sparkles size={18} className="text-black" />
        <span className="text-black text-[13px] font-semibold">RO Assistant</span>
        {unread > 0 && (
          <span className="w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </div>
    );
  }

  // Full chat panel
  return (
    <div className="fixed bottom-20 right-4 z-[90] w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.1)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0 bg-[#0f0f0f]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #D4772C)' }}>
            <Sparkles size={16} className="text-black" />
          </div>
          <div>
            <span className="text-[14px] font-semibold text-white block leading-tight">RO Assistant</span>
            <span className="text-[11px] text-green-400">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
            <p className="text-[14px] text-white/50 mb-1">How can I help?</p>
            <p className="text-[12px] text-white/25 mb-4">Ask about the app, construction codes, conversions, or your projects</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                'How do I create an estimate?',
                'Convert 10 cuyd to sqft at 4"',
                'SC permit requirements',
                "What's on my dashboard?",
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-2.5 py-1.5 text-[11px] bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white/60 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#C9A84C]/15 text-white rounded-br-md'
                : 'bg-[#111] border border-white/5 text-white/80 rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#111] border border-white/5 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#C9A84C]" />
              <span className="text-[13px] text-white/40">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-white/10 flex-shrink-0 bg-[#0f0f0f]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything..."
            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-3.5 py-2.5 bg-[#C9A84C] text-black rounded-xl hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-30 flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
