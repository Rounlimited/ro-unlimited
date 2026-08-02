'use client';

// Upgrade Proposal template renderer — excavation cut-away design.
// Layout/brand lives here; content JSON drives everything.

import { useMemo, useState } from 'react';
import type {
  ProposalContent, ProposalSection, QuotesSection,
  CardsSection, PhasesSection, ApproveSection,
} from '@/lib/proposals/types';

/* Inline rich text: **bold**, ==orange highlight== */
function rich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+==)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('==')) return <span key={i} className="hl">{p.slice(2, -2)}</span>;
    return <span key={i}>{p}</span>;
  });
}

interface Props {
  content: ProposalContent;
  token?: string;           // present on the live share page; absent in preview
  initialApproved?: boolean;
}

export default function ProposalRenderer({ content, token, initialApproved }: Props) {
  const c = content;
  return (
    <div className={`prop-root${token ? '' : ' preview'}`}>
      <ProposalStyles />
      <div className="rail"><span className="depth-tag">{c.brandFrom?.toUpperCase() || 'NEXAVISION'}</span></div>
      <main>
        <header className="hero">
          <div className="brandline">
            <span>{c.brandFrom}</span><span>{c.preparedFor}</span>
          </div>
          <h1 className="display">
            {c.heroLines.map((line, i) => (
              <span key={i} className={i === c.heroLines.length - 1 ? 'buried' : undefined}>
                {line}{i < c.heroLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="sub">{c.heroSub}</p>
          <div className="grade-line">
            <span>{c.gradeLeft || '▼ Existing grade'}</span>
            <span>{c.gradeRight || 'Scroll down to dig in'}</span>
          </div>
        </header>

        {c.sections.map((s, i) => (
          <Section key={i} section={s} token={token} initialApproved={initialApproved}
            footerLeft={c.footerLeft || c.brandFrom} footerRight={c.footerRight || ''} />
        ))}
      </main>
    </div>
  );
}

function Section(props: {
  section: ProposalSection; token?: string; initialApproved?: boolean;
  footerLeft: string; footerRight: string;
}) {
  const s = props.section;
  if (s.kind === 'quotes') return <Quotes s={s} />;
  if (s.kind === 'cards') return <Cards s={s} />;
  if (s.kind === 'phases') return <Phases s={s} />;
  if (s.kind === 'approve') return <Approve s={s} {...props} />;
  return null;
}

function Quotes({ s }: { s: QuotesSection }) {
  return (
    <section>
      <div className="depth-mark">{s.depth}</div>
      <h2 className="display">{s.title}</h2>
      {s.intro && <p className="dim">{rich(s.intro)}</p>}
      {(s.quotes || []).map((q, i) => (
        <div className="quote-card" key={i}>
          <span className="who">{q.who}</span>
          <p>&ldquo;{q.text}&rdquo;</p>
        </div>
      ))}
      {(s.paragraphs || []).map((p, i) => (
        <p key={i} className={i > 0 ? 'dim' : undefined}>{rich(p)}</p>
      ))}
    </section>
  );
}

function Cards({ s }: { s: CardsSection }) {
  return (
    <section>
      <div className="depth-mark">{s.depth}</div>
      <h2 className="display">{s.title}</h2>
      {s.intro && <p className="dim">{rich(s.intro)}</p>}
      {s.cards.map((card, i) => (
        <div key={i} className={`div-card${card.lead ? ' lead' : ''}${card.demoted ? ' demote' : ''}`}>
          <span className="tag">{card.tag}</span>
          <h3>{card.title}</h3>
          <p>{rich(card.body)}</p>
          {card.items && card.items.length > 0 && (
            <ul>{card.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
          )}
        </div>
      ))}
      {s.footnote && <p style={{ marginTop: 24 }}>{rich(s.footnote)}</p>}
      {s.licenses && s.licenses.length > 0 && (
        <div className="licenses">
          {s.licenses.map((l, i) => (
            <div className="lic" key={i}>
              <span className="dot" />{l.label}<span className="num">{l.num}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Phases({ s }: { s: PhasesSection }) {
  return (
    <section>
      <div className="depth-mark">{s.depth}</div>
      <h2 className="display">{s.title}</h2>
      {s.intro && <p className="dim">{rich(s.intro)}</p>}
      {s.phases.map((p) => (
        <div className="phase" key={p.n}>
          <div className="ph-n">{p.n}</div>
          <div>
            <h3>{p.title}</h3>
            <p>{rich(p.body)}</p>
            {p.note && <span className="ph-t">{p.note}</span>}
          </div>
        </div>
      ))}
    </section>
  );
}

function Approve({ s, token, initialApproved, footerLeft, footerRight }: {
  s: ApproveSection; token?: string; initialApproved?: boolean;
  footerLeft: string; footerRight: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'approved' | 'sent' | null>(initialApproved ? 'approved' : null);
  const [err, setErr] = useState('');
  const questions = s.questions || [];
  const hasAnswers = useMemo(() => Object.values(answers).some(v => v?.trim()), [answers]);

  async function post(type: 'approval' | 'comment' | 'answers') {
    if (!token) { setErr('Preview mode — responses are disabled.'); return; }
    setBusy(true); setErr('');
    try {
      // Send any filled answers/comment along with an approval in one entry
      const payload: Record<string, unknown> = { type };
      if (comment.trim()) payload.comment = comment.trim();
      if (hasAnswers) payload.answers = answers;
      const res = await fetch(`/api/proposal/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setDone(type === 'approval' ? 'approved' : 'sent');
      if (type !== 'approval') { setComment(''); }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong — try again.');
    } finally { setBusy(false); }
  }

  return (
    <section className="approve">
      <div className="depth-mark">{s.depth}</div>
      <h2 className="display">{s.title}</h2>
      {s.intro && <p className="dim">{rich(s.intro)}</p>}
      {s.asks && s.asks.length > 0 && (
        <p style={{ marginTop: 14 }}>
          {s.asks.map((a, i) => (
            <span key={i}><strong>{i + 1}.</strong> {rich(a)}<br /></span>
          ))}
        </p>
      )}

      {questions.length > 0 && (
        <div className="q-block">
          {questions.map((q) => (
            <div className="q" key={q.id}>
              <p className="q-label">{q.question}</p>
              {q.type === 'choice' && q.options ? (
                <div className="q-opts">
                  {q.options.map((opt) => (
                    <button key={opt} type="button" disabled={busy || done === 'approved'}
                      className={`q-opt${answers[q.id] === opt ? ' sel' : ''}`}
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea className="q-text" rows={2} value={answers[q.id] || ''}
                  disabled={busy || done === 'approved'}
                  placeholder="Type your answer…"
                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
      )}

      {s.allowComment !== false && done !== 'approved' && (
        <textarea className="q-text" rows={3} value={comment} disabled={busy}
          placeholder="Questions or changes? Drop a note here…"
          onChange={e => setComment(e.target.value)} style={{ marginTop: 18 }} />
      )}

      {done === 'approved' ? (
        <div className="approved-banner">
          <span className="check">✓</span> Approved — we&apos;re breaking ground. You&apos;ll hear from us shortly.
        </div>
      ) : (
        <>
          <button className="btn btn-go" disabled={busy} onClick={() => post('approval')}>
            {busy ? 'Sending…' : (s.approveLabel || 'Approve this plan')}
          </button>
          {(questions.length > 0 || s.allowComment !== false) && (
            <button className="btn btn-talk" disabled={busy || (!comment.trim() && !hasAnswers)}
              onClick={() => post(hasAnswers ? 'answers' : 'comment')}>
              Send feedback without approving
            </button>
          )}
        </>
      )}
      {done === 'sent' && <p className="sent-note">Got it — your feedback is in.</p>}
      {err && <p className="err-note">{err}</p>}

      <div className="foot"><span>{footerLeft}</span><span>{footerRight}</span></div>
    </section>
  );
}

function ProposalStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.prop-root{
  --bedrock:#0D1524; --navy:#1B2A4A; --orange:#D4772C; --soil:#A8916C;
  --paper:#F2EFE9; --pdim:rgba(242,239,233,.62); --pline:rgba(242,239,233,.14);
  background:var(--bedrock); color:var(--paper);
  font-family:Inter,system-ui,sans-serif; font-size:16px; line-height:1.65;
  min-height:100vh; position:relative; -webkit-font-smoothing:antialiased;
}
.prop-root.preview .rail{position:absolute}
.prop-root.preview .hero{min-height:70vh}
.prop-root.preview .depth-tag{position:absolute;top:14px}
.prop-root *{margin:0;padding:0;box-sizing:border-box}
.prop-root .display{font-family:Anton,sans-serif;letter-spacing:.01em;text-transform:uppercase;line-height:1.04;font-weight:400}
.prop-root .rail{position:fixed;left:0;top:0;bottom:0;width:44px;border-right:1px solid var(--pline);background:linear-gradient(180deg,rgba(13,21,36,.9),rgba(13,21,36,.7));z-index:50;pointer-events:none}
.prop-root .rail::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:1px;background:repeating-linear-gradient(180deg,var(--orange) 0 10px,transparent 10px 22px);opacity:.5}
.prop-root .depth-tag{position:sticky;top:14px;display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:var(--orange);writing-mode:vertical-rl;margin-left:15px;letter-spacing:.14em}
.prop-root main{margin-left:44px}
.prop-root section{padding:64px 22px 72px;border-bottom:1px solid var(--pline);position:relative}
.prop-root .depth-mark{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:var(--orange);letter-spacing:.22em;text-transform:uppercase;display:flex;align-items:center;gap:10px;margin-bottom:22px}
.prop-root .depth-mark::after{content:"";height:1px;flex:1;background:var(--pline)}
.prop-root h2.display{font-size:clamp(30px,7.5vw,46px);margin-bottom:18px}
.prop-root p{max-width:36em}
.prop-root p+p{margin-top:14px}
.prop-root .dim{color:var(--pdim)}
.prop-root strong{color:var(--paper);font-weight:600}
.prop-root .hl{color:var(--orange);font-weight:600}
.prop-root .hero{min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:26px 22px 46px;border-bottom:2px solid var(--orange);background:linear-gradient(180deg,rgba(13,21,36,0) 40%,rgba(13,21,36,.55)),linear-gradient(180deg,#16233C 0%,#101A2E 55%,var(--bedrock) 100%);overflow:hidden;position:relative}
.prop-root .brandline{display:flex;justify-content:space-between;align-items:center;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.18em;color:var(--pdim);text-transform:uppercase;position:absolute;top:22px;left:22px;right:22px}
.prop-root .hero h1{font-size:clamp(52px,15vw,120px);animation:prise .9s cubic-bezier(.2,.8,.2,1) both .15s}
.prop-root .hero h1 .buried{display:inline-block;color:transparent;-webkit-text-stroke:1.5px var(--soil);animation:psink 1.1s cubic-bezier(.2,.8,.2,1) both .5s}
.prop-root .hero .sub{margin-top:20px;max-width:30em;color:var(--pdim);font-size:15px;animation:prise .9s cubic-bezier(.2,.8,.2,1) both .55s}
.prop-root .grade-line{margin-top:34px;padding-top:14px;border-top:2px solid var(--paper);display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.2em;color:var(--soil);text-transform:uppercase;animation:prise .9s both .7s}
@keyframes prise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes psink{from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.prop-root *{animation:none!important;transition:none!important}}
.prop-root .quote-card{border-left:3px solid var(--orange);background:rgba(27,42,74,.5);padding:18px 18px 18px 20px;border-radius:0 8px 8px 0;margin:22px 0}
.prop-root .quote-card .who{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--orange);letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px;display:block}
.prop-root .quote-card p{font-size:15px;color:var(--pdim)}
.prop-root .div-card{border:1px solid var(--pline);border-radius:10px;padding:20px;margin-top:16px;background:rgba(27,42,74,.35)}
.prop-root .div-card.lead{border-color:var(--orange);background:linear-gradient(180deg,rgba(212,119,44,.12),rgba(27,42,74,.35))}
.prop-root .div-card .tag{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--orange);margin-bottom:8px;display:block}
.prop-root .div-card h3{font-family:Anton,sans-serif;font-weight:400;font-size:22px;text-transform:uppercase;letter-spacing:.02em;margin-bottom:8px}
.prop-root .div-card p{font-size:14.5px;color:var(--pdim)}
.prop-root .div-card ul{margin:10px 0 0;padding-left:0;list-style:none}
.prop-root .div-card li{font-size:14px;color:var(--pdim);padding:7px 0;border-top:1px dashed var(--pline);display:flex;gap:10px;align-items:baseline}
.prop-root .div-card li::before{content:"—";color:var(--orange);flex:0 0 auto}
.prop-root .demote{opacity:.75}
.prop-root .demote h3{color:var(--soil)}
.prop-root .licenses{display:flex;flex-direction:column;gap:10px;margin-top:20px}
.prop-root .lic{display:flex;align-items:center;gap:12px;border:1px dashed rgba(212,119,44,.5);border-radius:8px;padding:12px 14px;font-family:'IBM Plex Mono',monospace;font-size:12.5px}
.prop-root .lic .dot{width:8px;height:8px;border-radius:50%;background:var(--orange);flex:0 0 auto}
.prop-root .lic .num{margin-left:auto;color:var(--pdim);font-size:11px}
.prop-root .phase{display:flex;gap:16px;padding:16px 0;border-top:1px solid var(--pline)}
.prop-root .phase .ph-n{font-family:Anton,sans-serif;font-size:26px;color:var(--orange);flex:0 0 44px;line-height:1}
.prop-root .phase h3{font-size:16px;font-weight:700;margin-bottom:4px}
.prop-root .phase p{font-size:14px;color:var(--pdim)}
.prop-root .phase .ph-t{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--soil);margin-top:6px;display:block}
.prop-root .approve{border-bottom:none;background:linear-gradient(180deg,var(--bedrock),#111E36 70%);padding-bottom:96px}
.prop-root .btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:18px;border-radius:10px;margin-top:14px;font-family:Anton,sans-serif;font-size:18px;letter-spacing:.04em;text-transform:uppercase;border:none;cursor:pointer;transition:transform .15s;background:transparent}
.prop-root .btn:active{transform:scale(.98)}
.prop-root .btn:disabled{opacity:.5;cursor:default}
.prop-root .btn-go{background:var(--orange);color:var(--bedrock)}
.prop-root .btn-talk{border:1.5px solid var(--paper);color:var(--paper)}
.prop-root .q-block{margin-top:26px;display:flex;flex-direction:column;gap:20px}
.prop-root .q-label{font-size:15px;font-weight:600;margin-bottom:10px}
.prop-root .q-opts{display:flex;flex-wrap:wrap;gap:8px}
.prop-root .q-opt{padding:10px 16px;border-radius:999px;border:1.5px solid var(--pline);background:rgba(27,42,74,.35);color:var(--pdim);font-family:Inter,sans-serif;font-size:14px;cursor:pointer;transition:all .15s}
.prop-root .q-opt.sel{border-color:var(--orange);color:var(--paper);background:rgba(212,119,44,.18)}
.prop-root .q-text{width:100%;background:rgba(27,42,74,.4);border:1px solid var(--pline);border-radius:10px;padding:12px 14px;color:var(--paper);font-family:Inter,sans-serif;font-size:14.5px;resize:vertical}
.prop-root .q-text:focus{outline:2px solid var(--orange);outline-offset:1px}
.prop-root .approved-banner{margin-top:22px;padding:18px;border-radius:10px;border:1.5px solid #3FA46A;background:rgba(63,164,106,.12);color:#B9E5CB;font-weight:600;display:flex;gap:12px;align-items:center}
.prop-root .approved-banner .check{font-size:22px;color:#3FA46A}
.prop-root .sent-note{margin-top:12px;color:#B9E5CB;font-size:14px}
.prop-root .err-note{margin-top:12px;color:#E58B8B;font-size:14px}
.prop-root .foot{margin-top:44px;padding-top:18px;border-top:1px solid var(--pline);font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--pdim);display:flex;justify-content:space-between}
@media(min-width:760px){.prop-root main{max-width:720px;margin:0 auto 0 44px;padding-left:24px}.prop-root section{padding:80px 32px 88px}}
` }} />
  );
}
