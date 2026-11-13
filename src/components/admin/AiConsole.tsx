'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './ai-console.css';

/**
 * Nexa AI module — the full-screen assistant. Opens from the AI button in the
 * header. Same layout as the Nexa AI app: chats on the left, the conversation
 * in the middle, a model picker with "Hosted" and "On the rack" tabs.
 *
 * It talks to the same /api/admin/ai-chat route (and the same saved chats) as
 * the older assistant, so every tool the assistant already has works here.
 */

type Msg = { role: 'user' | 'assistant'; content: string; imagePreview?: string };
type Conv = { id: string; title: string; updated_at?: string; locked?: boolean };
type PinSheet = { mode: 'unlock' | 'set' | 'change'; then?: (pin: string) => void };
type Model = { key: string; label: string; short: string; group: string; best: string; price_in: number; price_out: number };
type Catalog = {
  hostedReady: boolean; defaultModel: string; models: Model[];
  rack: { configured: boolean; online: boolean; models: any[] };
  month: { charged_usd: number; messages: number };
  user?: { email: string | null };
};

const STARTERS: { t: string; s: string; q: string }[] = [
  { t: 'Today', s: 'What needs my attention', q: 'Give me my daily briefing.' },
  { t: 'Money owed', s: 'Who owes us and how much', q: 'Who owes us money right now?' },
  { t: 'Open estimates', s: 'What is waiting on a customer', q: 'Which estimates are still waiting on the customer?' },
  { t: 'Schedule', s: 'The next three weeks', q: 'What is on the schedule for the next three weeks?' },
];

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

// ── Small, safe markdown renderer (no HTML injection) ──
function inline(text: string, kp: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0]; const k = `${kp}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok)!;
      out.push(<a key={k} href={mm[2]} target={mm[2].startsWith('/') ? undefined : '_blank'} rel="noreferrer">{mm[1]}</a>);
    } else out.push(<a key={k} href={tok} target="_blank" rel="noreferrer">{tok}</a>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0; let k = 0;
  const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.trim().startsWith('```')) {
      const buf: string[] = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={k++}><code>{buf.join('\n')}</code></pre>);
      continue;
    }
    if (isRow(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const cells = (r: string) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(l); i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isRow(lines[i])) rows.push(cells(lines[i++]));
      blocks.push(
        <div className="nxa-tw" key={k++}><table>
          <thead><tr>{head.map((h, j) => <th key={j}>{inline(h, `h${j}`)}</th>)}</tr></thead>
          <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `c${ri}-${j}`)}</td>)}</tr>)}</tbody>
        </table></div>,
      );
      continue;
    }
    const h = /^#{1,6}\s+(.*)$/.exec(l);
    if (h) { blocks.push(<h4 key={k++}>{inline(h[1], 'hd')}</h4>); i++; continue; }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(l)) {
      const ordered = /^\s*\d+[.)]\s+/.test(l);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*•]|\d+[.)])\s+/, ''));
      const lis = items.map((it, j) => <li key={j}>{inline(it, `l${j}`)}</li>);
      blocks.push(ordered ? <ol key={k++}>{lis}</ol> : <ul key={k++}>{lis}</ul>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('```') && !/^#{1,6}\s/.test(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i]) && !isRow(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={k++}>{para.map((pl, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(pl, `p${j}`)}</React.Fragment>)}</p>);
  }
  return <>{blocks}</>;
}

// Shrink a photo in the browser before upload (same limits as the Nexa AI app)
function compressImage(file: File): Promise<{ base64: string; mimeType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1280; const sc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(url);
      resolve({ base64: data.split(',')[1], mimeType: 'image/jpeg', preview: data });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

export default function AiConsole() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState(false);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [q, setQ] = useState('');
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [cat, setCat] = useState<Catalog | null>(null);
  const [model, setModel] = useState<string>('');
  const [picker, setPicker] = useState<null | 'hosted' | 'rack'>(null);
  const [menu, setMenu] = useState(false);
  const [att, setAtt] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [toast, setToast] = useState('');
  const [rec, setRec] = useState(false);
  // PIN-locked chats: the PIN stays in memory only, until "Lock my chats now" or a page reload
  const [pin, setPin] = useState('');
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  const [pinSheet, setPinSheet] = useState<PinSheet | null>(null);
  const [pinA, setPinA] = useState(''); const [pinB, setPinB] = useState(''); const [pinC, setPinC] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [curLocked, setCurLocked] = useState(false);
  const pinRef = useRef(''); pinRef.current = pin;
  const feedRef = useRef<HTMLDivElement>(null);
  const inpRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<any>(null);
  const convIdRef = useRef<string | null>(null);
  convIdRef.current = convId;

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2600); };

  // Header AI button opens the console
  useEffect(() => {
    const onClick = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.('#ai-bubble-header-btn');
      if (el) setOpen(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const loadConvs = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/ai-conversations');
      if (r.ok) setConvs((await r.json()).conversations || []);
    } catch { /* offline */ }
  }, []);

  const loadCat = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/ai-models');
      if (!r.ok) return;
      const d: Catalog = await r.json();
      setCat(d);
      setModel((cur) => {
        const saved = cur || ls.get('nxa-model') || '';
        return d.models.some((m) => m.key === saved) ? saved : d.defaultModel;
      });
    } catch { /* offline */ }
  }, []);

  const convApi = (body: any) => fetch('/api/admin/ai-conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  useEffect(() => {
    if (!open || pinSet !== null) return;
    convApi({ action: 'pin_status' }).then((r) => r.json()).then((d) => setPinSet(!!d.set)).catch(() => {});
  }, [open, pinSet]);

  const askPin = (mode: PinSheet['mode'], then?: (pin: string) => void) => { setPinA(''); setPinB(''); setPinC(''); setPinErr(''); setPinSheet({ mode, then }); };

  const submitPin = async () => {
    if (!pinSheet) return;
    setPinErr('');
    const ok = (v: string) => /^\d{4,12}$/.test(v);
    if (pinSheet.mode === 'unlock') {
      if (!ok(pinA)) return setPinErr('Enter your PIN (4 to 12 digits).');
      const r = await convApi({ action: 'pin_check', pin: pinA });
      if (!r.ok) return setPinErr('That PIN is not right.');
      setPin(pinA); const then = pinSheet.then; setPinSheet(null); then?.(pinA);
      return;
    }
    if (!ok(pinA)) return setPinErr('Use 4 to 12 digits.');
    if (pinA !== pinB) return setPinErr('The two PINs do not match.');
    const r = await convApi({ action: 'pin_set', pin: pinA, current: pinSheet.mode === 'change' ? pinC : undefined });
    if (!r.ok) { const d = await r.json().catch(() => ({})); return setPinErr(d.error || 'Could not save the PIN.'); }
    setPin(pinA); setPinSet(true); const then = pinSheet.then; setPinSheet(null); say('PIN saved'); then?.(pinA);
  };

  // Run something that needs the PIN: reuse the one in memory, else ask (or set one first)
  const withPin = (fn: (pin: string) => void) => {
    if (pinRef.current) return fn(pinRef.current);
    askPin(pinSet ? 'unlock' : 'set', fn);
  };

  const toggleLock = () => {
    setMenu(false);
    if (!convId) return say('Send a message first, then lock the chat.');
    const id = convId; const on = !curLocked;
    withPin(async (p) => {
      const r = await convApi({ action: 'lock', id, on, pin: p });
      if (!r.ok) return say('Could not change the lock');
      setCurLocked(on); loadConvs(); say(on ? 'Chat locked with your PIN' : 'Lock removed');
    });
  };

  const lockNow = () => {
    setMenu(false); setPin('');
    if (curLocked) { setMsgs([]); setConvId(null); setCurLocked(false); }
    say('Locked chats are closed');
  };

  useEffect(() => { if (open) { loadConvs(); loadCat(); setTimeout(() => inpRef.current?.focus(), 250); } }, [open, loadConvs, loadCat]);
  useEffect(() => { if (model) ls.set('nxa-model', model); }, [model]);
  // Keep the page behind from scrolling while the console is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const scrollEnd = () => requestAnimationFrame(() => { const f = feedRef.current; if (f) f.scrollTop = f.scrollHeight; });

  const openConv = async (id: string, usePin?: string) => {
    setSide(false);
    try {
      const r = await convApi({ action: 'load', id, pin: usePin || pinRef.current || undefined });
      if (r.status === 423) { if (usePin || pinRef.current) setPin(''); return askPin(pinSet === false ? 'set' : 'unlock', (p) => openConv(id, p)); }
      if (!r.ok) return say('Could not open that chat');
      const d = await r.json();
      setMsgs(d.conversation.messages || []); setConvId(id); setCurLocked(!!d.conversation.locked); scrollEnd();
    } catch { say('Could not open that chat'); }
  };

  const newChat = () => { setMsgs([]); setConvId(null); setCurLocked(false); setSide(false); setTimeout(() => inpRef.current?.focus(), 100); };

  const delConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    await fetch('/api/admin/ai-conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }).catch(() => {});
    if (convIdRef.current === id) { setMsgs([]); setConvId(null); }
    loadConvs();
  };

  const compact = async () => {
    setMenu(false);
    if (!convId) return;
    say('Shortening the chat…');
    try {
      const r = await fetch('/api/admin/ai-conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'compact', id: convId }) });
      if (r.ok) { const d = await r.json(); setMsgs(d.messages || []); say('Chat shortened'); } else say('Could not shorten the chat');
    } catch { say('Could not shorten the chat'); }
  };

  const classic = () => { setMenu(false); setOpen(false); window.dispatchEvent(new Event('ro-ai-classic')); };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if ((!text && !att) || busy) return;
    let id = convId;
    if (!id) {
      try {
        const r = await fetch('/api/admin/ai-conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', title: (text || 'Photo').slice(0, 60) }) });
        if (r.ok) { id = (await r.json()).conversation.id; setConvId(id); }
      } catch { /* keep going unsaved */ }
    }
    const userMsg: Msg = { role: 'user', content: text || 'Look at this photo.', imagePreview: att?.preview };
    const base = [...msgs, userMsg];
    setMsgs([...base, { role: 'assistant', content: '' }]);
    setInput(''); const image = att; setAtt(null);
    setBusy(true); setStatus('Thinking…'); scrollEnd();
    if (inpRef.current) inpRef.current.style.height = 'auto';

    const ctl = new AbortController(); abortRef.current = ctl;
    let reply = ''; let actions: any[] | undefined;
    try {
      let projectContext = null;
      const em = pathname?.match(/\/admin\/estimates\/([a-f0-9-]{36})/);
      if (em) { try { const c = await fetch(`/api/admin/estimates/${em[1]}`); if (c.ok) projectContext = { type: 'estimate', data: await c.json() }; } catch { /* no context */ } }
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({
          messages: base.map((m) => ({ role: m.role, content: m.content })),
          currentPage: pathname, projectContext, stream: true, model,
          imageData: image ? { base64: image.base64, mimeType: image.mimeType } : undefined,
        }),
      });
      if (res.headers.get('content-type')?.includes('ndjson') && res.body) {
        const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.type === 'delta' && evt.text) { reply += evt.text; setStatus(''); const snap = reply; setMsgs([...base, { role: 'assistant', content: snap }]); }
              else if (evt.type === 'status' && evt.label) setStatus(evt.label);
              else if (evt.type === 'done') actions = evt.actions;
              else if (evt.type === 'error') reply = reply || evt.error || 'Sorry, something went wrong.';
            } catch { /* skip a bad line */ }
          }
        }
      } else {
        const d = await res.json();
        reply = d.content || d.error || 'Sorry, something went wrong.'; actions = d.actions;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') reply = reply ? reply + '\n\n(Stopped.)' : '(Stopped.)';
      else reply = reply || 'Connection problem. Try again.';
    }
    if (!reply) reply = 'Sorry, something went wrong.';
    const final: Msg[] = [...base, { role: 'assistant', content: reply }];
    setMsgs(final); setBusy(false); setStatus(''); abortRef.current = null;
    if (id) {
      fetch('/api/admin/ai-conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', id, messages: final, pin: curLocked ? pinRef.current : undefined, title: base.length <= 1 ? (text || 'Photo').slice(0, 60) : undefined }) })
        .then(() => { loadConvs(); loadCat(); }).catch(() => {});
    }
    const nav = actions?.find((a) => a.type === 'navigate' && a.path);
    if (nav) { say(`Opening ${nav.description || nav.path}…`); setTimeout(() => { router.push(nav.path); setOpen(false); }, 700); }
  };

  const stop = () => abortRef.current?.abort();

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return say('Photos only for now');
    try { setAtt(await compressImage(f)); } catch { say('Could not read that photo'); }
  };

  const SR: any = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const mic = () => {
    if (rec) { recRef.current?.stop(); return; }
    if (!SR) return;
    const r = new SR(); r.lang = 'en-US'; r.interimResults = false;
    r.onresult = (ev: any) => { const t = Array.from(ev.results).map((x: any) => x[0].transcript).join(' '); setInput((v) => (v ? v + ' ' : '') + t); };
    r.onend = () => setRec(false); r.onerror = () => setRec(false);
    recRef.current = r; setRec(true); r.start();
  };

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); say('Copied'); } catch { say('Could not copy'); } };

  if (!open) return null;

  const cur = cat?.models.find((m) => m.key === model);
  const title = convs.find((c) => c.id === convId)?.title || 'New chat';
  const shown = q.trim() ? convs.filter((c) => (c.title || '').toLowerCase().includes(q.trim().toLowerCase())) : convs;
  const lastIsEmptyAssistant = busy && msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant' && !msgs[msgs.length - 1].content;

  return (
    <div className="nxa" role="dialog" aria-label="Assistant">
      <div className="nxa-aurora"><i /><i /><i /><i /><i /></div><div className="nxa-grid" /><div className="nxa-grain" />

      {side && <div className="nxa-sidescrim" onClick={() => setSide(false)} />}
      <aside className={'nxa-side' + (side ? ' open' : '')}>
        <div className="nxa-brand">
          <div className="nxa-logo">RO</div>
          <div><div className="nxa-bt">RO Assistant</div><div className="nxa-bs">Nexa AI</div></div>
        </div>
        <button className="nxa-new" onClick={newChat}>+&nbsp; New chat</button>
        <input className="nxa-search" placeholder="Search chats…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="nxa-chats">
          {shown.map((c) => (
            <div key={c.id} className={'nxa-chat' + (c.id === convId ? ' on' : '')} onClick={() => openConv(c.id)}>
              <div className="t">
                <div className="nm">{c.locked ? '🔒 ' : ''}{c.title || 'Chat'}</div>
                {c.updated_at && <div className="mt">{new Date(c.updated_at).toLocaleDateString()}</div>}
              </div>
              <button className="del" aria-label="Delete chat" onClick={(e) => delConv(c.id, e)}>✕</button>
            </div>
          ))}
          {shown.length === 0 && <div className="nxa-usage" style={{ padding: 10 }}>No chats yet.</div>}
        </div>
        <div className="nxa-foot">
          {cat?.user?.email && <div className="nxa-usage"><span>Signed in</span><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.user.email}</b></div>}
          {cat && <div className="nxa-usage"><span>Used this month</span><b>${cat.month.charged_usd.toFixed(2)} · {cat.month.messages} messages</b></div>}
          <div className="nxa-frow">
            <button className="nxa-mini" onClick={() => { setSide(false); setPicker('hosted'); }}>⚡&nbsp; Models</button>
            <button className="nxa-mini" onClick={() => setOpen(false)}>✕&nbsp; Close</button>
          </div>
        </div>
      </aside>

      <main className="nxa-main">
        <header className="nxa-top">
          <button className="nxa-icon nxa-menub" aria-label="Chats" onClick={() => setSide(true)}>☰</button>
          <div className="nxa-title"><b>{title}</b><span>{cur ? cur.label : 'Assistant'}</span></div>
          <button className="nxa-pill" onClick={() => setPicker('hosted')} title="Choose the AI model">⚡ <span className="l">{cur?.label || 'Model'}</span><span className="s">{cur?.short || 'Model'}</span></button>
          <button className="nxa-icon" aria-label="More" onClick={() => setMenu((v) => !v)}>⋮</button>
          <button className="nxa-icon" aria-label="Close assistant" onClick={() => setOpen(false)}>✕</button>
        </header>
        {menu && (
          <div className="nxa-menu" onMouseLeave={() => setMenu(false)}>
            <button onClick={() => { setMenu(false); newChat(); }}>New chat</button>
            <button onClick={compact} disabled={!convId}>Shorten this chat (saves cost)</button>
            <button onClick={toggleLock}>{curLocked ? 'Take the PIN lock off this chat' : 'Lock this chat with a PIN'}</button>
            {pin && <button onClick={lockNow}>Close my locked chats now</button>}
            <button onClick={() => { setMenu(false); askPin(pinSet ? 'change' : 'set'); }}>{pinSet ? 'Change my PIN' : 'Set a PIN'}</button>
            <button onClick={classic}>Voice mode (classic assistant)</button>
            <button onClick={() => { setMenu(false); setOpen(false); router.push('/admin/ai-settings'); }}>AI settings</button>
          </div>
        )}

        <div className="nxa-feed" ref={feedRef} onClick={() => menu && setMenu(false)}>
          <div className="nxa-wrap">
            {msgs.length === 0 ? (
              <div className="nxa-hero">
                <h1>How can I help?</h1>
                <p>Ask about jobs, estimates, invoices, the schedule, or anything else.</p>
                <div className="nxa-cards">
                  {STARTERS.map((s) => <button key={s.t} className="nxa-card" onClick={() => send(s.q)}><b>{s.t}</b><span>{s.s}</span></button>)}
                </div>
              </div>
            ) : msgs.map((m, i) => {
              const live = busy && i === msgs.length - 1 && m.role === 'assistant';
              if (live && !m.content) return null;
              return (
                <React.Fragment key={i}>
                  <div className={'nxa-msg ' + (m.role === 'user' ? 'u' : 'a')}>
                    <div className="nxa-av">{m.role === 'user' ? 'You' : 'RO'}</div>
                    <div className="nxa-bub">
                      {m.imagePreview && <img className="att" src={m.imagePreview} alt="Attached photo" />}
                      {m.role === 'user' ? m.content : <Markdown text={m.content} />}
                      {live && <span className="nxa-cursor" />}
                    </div>
                  </div>
                  {m.role === 'assistant' && !live && m.content && (
                    <div className="nxa-acts"><button onClick={() => copy(m.content)}>Copy</button></div>
                  )}
                </React.Fragment>
              );
            })}
            {busy && (lastIsEmptyAssistant || status) && (
              <div className="nxa-status"><span className="nxa-spin" />{status || 'Thinking…'}</div>
            )}
          </div>
        </div>

        <div className="nxa-dock">
          {att && (
            <div className="nxa-attchip"><img src={att.preview} alt="" /><span>Photo attached</span><button aria-label="Remove photo" onClick={() => setAtt(null)}>✕</button></div>
          )}
          <div className="nxa-composer">
            <button className="nxa-att" aria-label="Attach a photo" onClick={() => fileRef.current?.click()}>📎</button>
            <textarea ref={inpRef} rows={1} placeholder="Message the assistant…" value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(180, e.target.scrollHeight) + 'px'; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); send(); } }} />
            {SR && <button className={'nxa-att' + (rec ? ' rec' : '')} aria-label="Speak" onClick={mic}>🎤</button>}
            {busy
              ? <button className="nxa-send stop" aria-label="Stop" onClick={stop}>■</button>
              : <button className="nxa-send" aria-label="Send" disabled={!input.trim() && !att} onClick={() => send()}>➤</button>}
          </div>
          <div className="nxa-hint">Enter to send · Shift+Enter for a new line</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
        </div>
      </main>

      {picker && (
        <>
          <div className="nxa-scrim" onClick={() => setPicker(null)} />
          <div className="nxa-sheet">
            <h3>Choose the AI</h3>
            <div className="sub">Prices are per 1 million words-pieces in / out. A normal question costs well under a cent on Fast.</div>
            <div className="nxa-tabs">
              <button className={'nxa-tab' + (picker === 'hosted' ? ' on' : '')} onClick={() => setPicker('hosted')}>Hosted</button>
              <button className={'nxa-tab' + (picker === 'rack' ? ' on' : '')} onClick={() => setPicker('rack')}>On the rack</button>
            </div>
            {picker === 'hosted' ? (
              <>
                {!cat && <div className="nxa-rackstat">Loading…</div>}
                {cat && !cat.hostedReady && <div className="nxa-rackstat">Hosted models are not set up yet.</div>}
                {cat && (['recommended', 'more'] as const).map((g) => (
                  <React.Fragment key={g}>
                    <div className="nxa-grp">{g === 'recommended' ? 'Recommended' : 'More models'}</div>
                    {cat.models.filter((m) => m.group === g).map((m) => (
                      <button key={m.key} className={'nxa-mrow' + (m.key === model ? ' on' : '')} onClick={() => { setModel(m.key); setPicker(null); }}>
                        <div className="ic">⚡</div>
                        <div className="tx"><b>{m.label}</b><span>{m.best}</span></div>
                        <div className="pr">${m.price_in.toFixed(2)}<br />${m.price_out.toFixed(2)}</div>
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </>
            ) : (
              <div className="nxa-rackstat">
                {!cat?.rack.configured ? (
                  <><span className="nxa-dot" /><b>Not connected yet.</b><br />The rack&rsquo;s own models will show here once the rack link is set up. The hosted models do not need the rack and keep working if it is off.</>
                ) : cat.rack.online ? (
                  <><span className="nxa-dot on" /><b>Rack is online.</b><br />{cat.rack.models.length} models found. Chatting with them from here is the next step.</>
                ) : (
                  <><span className="nxa-dot" /><b>Rack is offline.</b><br />Use a hosted model for now. They do not depend on the rack.</>
                )}
              </div>
            )}
            <button className="nxa-btn" onClick={() => setPicker(null)}>Close</button>
          </div>
        </>
      )}
      {pinSheet && (
        <>
          <div className="nxa-scrim" onClick={() => setPinSheet(null)} />
          <div className="nxa-sheet">
            <h3>{pinSheet.mode === 'unlock' ? 'Enter your PIN' : pinSheet.mode === 'change' ? 'Change your PIN' : 'Set a PIN'}</h3>
            <div className="sub">
              {pinSheet.mode === 'unlock'
                ? 'This opens your locked chats until you close them or reload the page.'
                : 'A locked chat can only be opened with this PIN. If you forget it, locked chats cannot be recovered. There is no reset.'}
            </div>
            {pinSheet.mode === 'change' && <input className="nxa-search" style={{ marginBottom: 8 }} type="password" inputMode="numeric" autoComplete="off" placeholder="Current PIN" value={pinC} onChange={(e) => setPinC(e.target.value.replace(/\D/g, ''))} />}
            <input className="nxa-search" type="password" inputMode="numeric" autoComplete="off" autoFocus placeholder={pinSheet.mode === 'unlock' ? 'PIN' : 'New PIN (4 to 12 digits)'} value={pinA}
              onChange={(e) => setPinA(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter') submitPin(); }} />
            {pinSheet.mode !== 'unlock' && <input className="nxa-search" style={{ marginTop: 8 }} type="password" inputMode="numeric" autoComplete="off" placeholder="New PIN again" value={pinB}
              onChange={(e) => setPinB(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter') submitPin(); }} />}
            {pinErr && <div style={{ color: 'var(--bad)', fontSize: 15, marginTop: 10 }}>{pinErr}</div>}
            <button className="nxa-btn" style={{ background: 'var(--grad)', color: '#04121f', border: 0 }} onClick={submitPin}>{pinSheet.mode === 'unlock' ? 'Unlock' : 'Save PIN'}</button>
            <button className="nxa-btn" onClick={() => setPinSheet(null)}>Cancel</button>
          </div>
        </>
      )}
      {toast && <div className="nxa-toast">{toast}</div>}
    </div>
  );
}
