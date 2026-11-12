'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { MessageSquare, QrCode, Copy } from 'lucide-react';

/**
 * Two more ways to ask for a Google review: tap to text the link from the
 * phone's own messages app, or show the QR code on the phone so the customer
 * can scan it right there. Same tracked link as the email, same honest ask:
 * no star rating mentioned, no incentive.
 */
export default function ReviewShare({ token, phone, firstName, project }: {
  token: string | null | undefined; phone?: string | null; firstName?: string | null; project?: string | null;
}) {
  const [qr, setQr] = useState('');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = token ? `${typeof window !== 'undefined' ? window.location.origin : 'https://rounlimited.com'}/api/review/go?t=${token}` : '';

  useEffect(() => {
    if (!open || !link) return;
    QRCode.toDataURL(link, { width: 640, margin: 2 }).then(setQr).catch(() => setQr(''));
  }, [open, link]);

  if (!link) return null;
  const msg = `Hi ${firstName || 'there'}, thank you for choosing RO Unlimited${project ? ` for ${project}` : ''}. If you have a minute, would you share your honest experience in a Google review? ${link}`;
  const digits = (phone || '').replace(/[^\d+]/g, '');
  const sms = `sms:${digits}?&body=${encodeURIComponent(msg)}`;
  const copy = async () => { try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } };
  const btn = 'flex-1 min-h-[54px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]';
  const style = { background: 'rgba(245,184,61,0.12)', color: '#F5B83D', border: '1px solid rgba(245,184,61,0.4)' };

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        {digits ? (
          <a href={sms} className={btn} style={style}><MessageSquare size={18} /> Text the review link</a>
        ) : (
          <button onClick={copy} className={btn} style={style}><Copy size={18} /> {copied ? 'Copied' : 'Copy text message'}</button>
        )}
        <button onClick={() => setOpen(!open)} className={btn} style={style}><QrCode size={18} /> {open ? 'Hide QR code' : 'Show QR code'}</button>
      </div>
      {!digits && <p className="text-[14px] text-white/45 mt-1.5 text-center">No phone number on this customer, so copy the message and paste it into any chat.</p>}
      {open && (
        <div className="mt-3 rounded-xl bg-white p-4 text-center">
          {qr ? <img src={qr} alt="QR code for the Google review page" className="mx-auto w-full max-w-[320px]" /> : <p className="text-black py-10">Making the code…</p>}
          <p className="text-black text-[16px] font-semibold mt-2">Scan with your phone camera to leave a Google review</p>
        </div>
      )}
    </div>
  );
}
