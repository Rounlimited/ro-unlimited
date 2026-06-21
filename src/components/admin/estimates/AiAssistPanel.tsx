'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, Plus, Check, ChevronDown } from 'lucide-react';

interface LineItem {
  phase: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  markup_percent: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  items?: LineItem[] | null;
  assumptions?: string[] | null;
  suggestions?: string[] | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAddItems: (items: LineItem[]) => void;
  context: {
    division?: string;
    document_mode?: string;
    project_name?: string;
    existing_items?: any[];
  };
}

export default function AiAssistPanel({ open, onClose, onAddItems, context }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedSets, setAddedSets] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Welcome message
      setMessages([{
        role: 'assistant',
        content: 'What are you building? Describe the project and I\'ll help you put together the line items.\n\nFor example: "800 sqft patio build out, second floor, commercial" or "kitchen renovation, residential, gut and rebuild"',
      }]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/admin/estimates/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sorry, I hit an error: ${data.error}. Try again?`,
        }]);
      } else {
        // Clean the display content — remove JSON block from visible text
        let displayContent = data.content || '';
        displayContent = displayContent.replace(/```json[\s\S]*?```/g, '').trim();

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: displayContent,
          items: data.items,
          assumptions: data.assumptions,
          suggestions: data.suggestions,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Check your internet and try again.',
      }]);
    }

    setLoading(false);
  };

  const handleAddItems = (items: LineItem[], msgIdx: number) => {
    onAddItems(items);
    setAddedSets(prev => new Set([...prev, msgIdx]));
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-2xl pt-safe"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — sticky so X is always reachable */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0 sticky top-0 z-10 bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#C9A84C]" />
            <span className="text-[15px] font-semibold text-white">AI Estimate Assistant</span>
          </div>
          <button onClick={onClose} className="p-2.5 -mr-1 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors active:bg-white/20">
            <X size={22} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#C9A84C]/15 text-white'
                  : 'bg-[#111] border border-white/5 text-white/80'
              }`}>
                {/* Message text */}
                <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Generated items */}
                {msg.items && msg.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-[12px] text-[#C9A84C] font-semibold uppercase tracking-wider mb-2">
                      {msg.items.length} Line Items Generated
                    </div>

                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {msg.items.map((item, i) => (
                        <div key={i} className="bg-white/5 rounded-lg px-3 py-2 text-[13px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-white font-medium truncate">{item.description}</span>
                            <span className="text-[#C9A84C] font-semibold flex-shrink-0">
                              {fmt(item.quantity * item.unit_cost)}
                            </span>
                          </div>
                          <div className="text-white/30 text-[11px] mt-0.5">
                            {item.phase} | {item.quantity} {item.unit} @ {fmt(item.unit_cost)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10 text-[13px]">
                      <span className="text-white/40">Subtotal</span>
                      <span className="text-[#C9A84C] font-bold text-[15px]">
                        {fmt(msg.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0))}
                      </span>
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => handleAddItems(msg.items!, idx)}
                      disabled={addedSets.has(idx)}
                      className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                        addedSets.has(idx)
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90 active:scale-[0.98]'
                      }`}
                    >
                      {addedSets.has(idx) ? <><Check size={16} /> Added to Estimate</> : <><Plus size={16} /> Add All to Estimate</>}
                    </button>
                  </div>
                )}

                {/* Assumptions */}
                {msg.assumptions && msg.assumptions.length > 0 && (
                  <div className="mt-2 text-[12px] text-white/30">
                    <span className="font-semibold text-white/40">Assumptions: </span>
                    {msg.assumptions.join(' | ')}
                  </div>
                )}

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="block w-full text-left text-[12px] text-[#3b8dd4] hover:text-[#3b8dd4]/80 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#111] border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#C9A84C]" />
                <span className="text-[14px] text-white/40">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {[
              'Residential kitchen renovation',
              'Commercial office build-out',
              'Deck and patio addition',
              'Grading for new construction',
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                className="px-3 py-1.5 text-[12px] bg-white/5 text-white/40 rounded-full hover:bg-white/10 hover:text-white/60 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Describe the project or ask for changes..."
              className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder-white/25 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-[#C9A84C] text-black rounded-xl hover:bg-[#C9A84C]/90 transition-colors disabled:opacity-30 flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
