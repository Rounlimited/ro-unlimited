'use client';

import { useState } from 'react';
import { Star, MessageCircle, Send, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Mid-job feedback on the customer's living project page:
 *   - a one-tap pulse ("how's this feeling so far?") re-asked weekly
 *   - a note pinned to whichever part of the job it's about
 *   - an optional any-time star rating
 * Which pieces show is JR's per-job call (feedback_enabled / reviews_enabled).
 * Everything lands in his Job Room — nothing here is public.
 */

const PULSE_QUESTION = 'How is this project feeling so far?';
const PULSE_CHOICES = ['Couldn’t be happier', 'Going fine', 'I have a concern'];
const SECTIONS = ['General', 'Progress', 'Photos', 'Documents', 'Billing', 'Schedule'];

const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* fine */ } };

export default function CustomerFeedbackCard({ token, feedbackEnabled, reviewsEnabled }: {
  token: string; feedbackEnabled: boolean; reviewsEnabled: boolean;
}) {
  // Pulse re-asks after a week, not every visit.
  const [pulseDone, setPulseDone] = useState(() => {
    const at = lsGet('ro-pulse-' + token);
    return !!at && Date.now() - Number(at) < 7 * 86400000;
  });
  const [pulsePick, setPulsePick] = useState('');
  const [concernText, setConcernText] = useState('');
  const [concernOpen, setConcernOpen] = useState(false);

  const [noteOpen, setNoteOpen] = useState(false);
  const [section, setSection] = useState('General');
  const [noteText, setNoteText] = useState('');
  const [noteSent, setNoteSent] = useState(false);

  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewDone, setReviewDone] = useState(() => !!lsGet('ro-midreview-' + token));

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const post = async (payload: any) => {
    const res = await fetch('/api/estimate/' + token + '/job-feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (d.error) throw new Error(d.error);
  };

  const sendPulse = async (choice: string) => {
    setPulsePick(choice); setError(null);
    const concern = /concern/i.test(choice);
    if (concern) { setConcernOpen(true); return; }
    setBusy('pulse');
    try {
      await post({ kind: 'pulse', question: PULSE_QUESTION, answer: choice });
      lsSet('ro-pulse-' + token, String(Date.now()));
      setPulseDone(true);
    } catch (e: any) { setError(e.message); }
    setBusy(null);
  };

  const sendConcern = async () => {
    setBusy('pulse'); setError(null);
    try {
      await post({ kind: 'pulse', question: PULSE_QUESTION, answer: pulsePick, body: concernText.trim() });
      lsSet('ro-pulse-' + token, String(Date.now()));
      setPulseDone(true); setConcernOpen(false);
    } catch (e: any) { setError(e.message); }
    setBusy(null);
  };

  const sendNote = async () => {
    if (!noteText.trim()) return;
    setBusy('note'); setError(null);
    try {
      await post({ kind: 'comment', section: section.toLowerCase(), body: noteText.trim() });
      setNoteSent(true); setNoteText(''); setNoteOpen(false);
      setTimeout(() => setNoteSent(false), 4000);
    } catch (e: any) { setError(e.message); }
    setBusy(null);
  };

  const sendReview = async () => {
    if (!stars) { setError('Tap a star rating first'); return; }
    setBusy('review'); setError(null);
    try {
      await post({ kind: 'review', rating: stars, body: reviewText.trim() });
      lsSet('ro-midreview-' + token, String(stars));
      setReviewDone(true);
    } catch (e: any) { setError(e.message); }
    setBusy(null);
  };

  if (!feedbackEnabled && !reviewsEnabled) return null;

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
      <p className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: '#8a6d20' }}>
        Your Two Cents
      </p>
      <p className="text-[15px] text-[#6b7280] mb-4">Goes straight to the owner — never posted anywhere.</p>

      {/* ── Pulse ── */}
      {feedbackEnabled && !pulseDone && !concernOpen && (
        <div className="mb-5">
          <p className="text-[17px] font-semibold text-[#2a2a2a] mb-2.5">{PULSE_QUESTION}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            {PULSE_CHOICES.map((c) => (
              <button key={c} onClick={() => sendPulse(c)} disabled={busy !== null}
                className="flex-1 min-h-[52px] px-4 rounded-xl text-[16px] font-semibold border active:scale-[0.98] disabled:opacity-50 text-[#2a2a2a]"
                style={{ borderColor: '#e8e2d2', background: '#fdfbf5' }}>
                {busy === 'pulse' && pulsePick === c ? <Loader2 size={17} className="animate-spin mx-auto" /> : c}
              </button>
            ))}
          </div>
        </div>
      )}
      {feedbackEnabled && concernOpen && !pulseDone && (
        <div className="mb-5">
          <p className="text-[17px] font-semibold text-[#2a2a2a] mb-2">What&rsquo;s on your mind?</p>
          <textarea value={concernText} onChange={(e) => setConcernText(e.target.value)} rows={3}
            placeholder="Tell us straight — the owner reads this today."
            className="w-full rounded-xl border p-3 text-[16px] text-[#2a2a2a] focus:outline-none"
            style={{ borderColor: '#e8e2d2', background: '#fdfbf5' }} />
          <button onClick={sendConcern} disabled={busy !== null || !concernText.trim()}
            className="mt-2 inline-flex items-center gap-2 min-h-[52px] px-6 rounded-xl text-black text-[16px] font-bold active:scale-[0.98] disabled:opacity-50"
            style={{ background: '#C9A84C' }}>
            {busy === 'pulse' ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />} Send to the Owner
          </button>
        </div>
      )}
      {feedbackEnabled && pulseDone && (
        <p className="text-[16px] text-[#187a4b] mb-5 flex items-center gap-2">
          <CheckCircle2 size={18} /> Thanks — the owner sees this.
        </p>
      )}

      {/* ── Section note ── */}
      {feedbackEnabled && (
        <div className="mb-5">
          {!noteOpen ? (
            <button onClick={() => setNoteOpen(true)}
              className="inline-flex items-center gap-2 min-h-[52px] px-5 rounded-xl text-[16px] font-semibold border active:scale-[0.98] text-[#2a2a2a]"
              style={{ borderColor: '#e8e2d2', background: '#fdfbf5' }}>
              <MessageCircle size={18} style={{ color: '#8a6d20' }} />
              {noteSent ? 'Note sent — thank you' : 'Leave a note about the job'}
            </button>
          ) : (
            <div>
              <p className="text-[16px] font-semibold text-[#2a2a2a] mb-2">What&rsquo;s it about?</p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {SECTIONS.map((s) => (
                  <button key={s} onClick={() => setSection(s)}
                    className="min-h-[44px] px-4 rounded-full text-[15px] font-semibold border active:scale-95"
                    style={section === s
                      ? { background: '#C9A84C', color: '#000', borderColor: '#C9A84C' }
                      : { background: '#fdfbf5', color: '#6b7280', borderColor: '#e8e2d2' }}>
                    {s}
                  </button>
                ))}
              </div>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3}
                placeholder="Anything at all — a question, a worry, something you noticed…"
                className="w-full rounded-xl border p-3 text-[16px] text-[#2a2a2a] focus:outline-none"
                style={{ borderColor: '#e8e2d2', background: '#fdfbf5' }} />
              <div className="flex gap-2 mt-2">
                <button onClick={sendNote} disabled={busy !== null || !noteText.trim()}
                  className="inline-flex items-center gap-2 min-h-[52px] px-6 rounded-xl text-black text-[16px] font-bold active:scale-[0.98] disabled:opacity-50"
                  style={{ background: '#C9A84C' }}>
                  {busy === 'note' ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />} Send
                </button>
                <button onClick={() => setNoteOpen(false)} className="min-h-[52px] px-4 rounded-xl text-[16px] text-[#6b7280]">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Any-time stars ── */}
      {reviewsEnabled && (
        reviewDone ? (
          <p className="text-[16px] text-[#187a4b] flex items-center gap-2">
            <CheckCircle2 size={18} /> Thanks for the rating.
          </p>
        ) : (
          <div className="pt-4" style={{ borderTop: feedbackEnabled ? '1px solid #f0ece2' : 'none' }}>
            <p className="text-[16px] font-semibold text-[#2a2a2a] mb-1.5">Rate us so far — any time, change it later</p>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setStars(i)} aria-label={i + ' stars'}
                  className="p-1 active:scale-90 transition-transform">
                  <Star size={30} className={i <= stars ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-gray-200'} />
                </button>
              ))}
            </div>
            {stars > 0 && (
              <div>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={2}
                  placeholder="Anything you want the owner to know (optional)"
                  className="w-full rounded-xl border p-3 text-[16px] text-[#2a2a2a] focus:outline-none mb-2"
                  style={{ borderColor: '#e8e2d2', background: '#fdfbf5' }} />
                <button onClick={sendReview} disabled={busy !== null}
                  className="inline-flex items-center gap-2 min-h-[52px] px-6 rounded-xl text-black text-[16px] font-bold active:scale-[0.98] disabled:opacity-50"
                  style={{ background: '#C9A84C' }}>
                  {busy === 'review' ? <Loader2 size={17} className="animate-spin" /> : <Star size={17} />} Send Rating
                </button>
              </div>
            )}
          </div>
        )
      )}

      {error && <p className="text-[15px] mt-3" style={{ color: '#b4231f' }}>{error}</p>}
    </section>
  );
}
