import crypto from 'crypto';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { buildEmailHtml, getFromHeader, DEFAULT_FROM_EMAIL, fetchEmailAccounts, logEmail } from '@/lib/email';

/**
 * Customer sign-in for the portal (rounlimited.com/my) — passwordless.
 *
 * Deliberately NOT Supabase Auth: the admin gate treats every Supabase user
 * as staff (roleOf() defaults to 'admin'), so customers get their own two
 * tiny tables: a one-time login link (30 min) that becomes a 90-day session
 * cookie. A customer "is" an email address; every estimate whose customer
 * row carries that email is theirs.
 */
export const CUSTOMER_COOKIE = 'ro_customer';
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const norm = (e: string) => String(e || '').trim().toLowerCase();

export type CustomerPrefs = { channel: 'email' | 'sms' | 'both'; frequency: 'every' | 'weekly' | 'needed' };

/** Send a sign-in link if we know the email. Always "ok" to the caller — never confirm whether an address exists. */
export async function requestLoginLink(emailRaw: string, next?: string | null): Promise<{ ok: true; known: boolean }> {
  const email = norm(emailRaw);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: true, known: false };
  const supabase = createAdminClient();
  const { data: cust } = await supabase.from('customers').select('id, first_name, company_name').ilike('email', email).limit(1).maybeSingle();
  if (!cust) return { ok: true, known: false };

  const token = crypto.randomBytes(24).toString('hex');
  await supabase.from('customer_logins').insert({ email, token, expires_at: new Date(Date.now() + 30 * 60000).toISOString() });
  const link = `${SITE()}/api/my/go/${token}${next ? '?next=' + encodeURIComponent(next) : ''}`;
  const name = cust.first_name || cust.company_name || 'there';
  const subject = 'Your RO Unlimited sign-in link';
  const bodyHtml = `
    <p style="margin:0 0 16px">Hi ${esc(name)},</p>
    <p style="margin:0 0 20px">Tap the button to open your projects. The link works for 30 minutes and signs you in on this device for 90 days.</p>
    <p style="margin:0 0 28px"><a href="${link}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:bold;font-size:16px">Open My Projects</a></p>
    <p style="margin:0;color:#666;font-size:14px">Didn't ask for this? Ignore it — nothing happens unless the link is opened.</p>`;
  try {
    await fetchEmailAccounts();
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: getFromHeader(DEFAULT_FROM_EMAIL), to: email, subject, html: buildEmailHtml(name, bodyHtml, subject, DEFAULT_FROM_EMAIL) });
    await logEmail({ direction: 'outbound', to_email: email, from_email: DEFAULT_FROM_EMAIL, subject, body_text: 'Sign-in link for the customer portal', folder: 'sent' }).catch(() => {});
  } catch (e) { console.error('[customer-auth] login email failed', e); }
  return { ok: true, known: true };
}

/** Turn a one-time link into a session. Returns the session token or null. */
export async function redeemLogin(token: string, ua?: string | null): Promise<{ session: string; email: string } | null> {
  const supabase = createAdminClient();
  const { data: row } = await supabase.from('customer_logins').select('id, email, expires_at, used_at').eq('token', token).maybeSingle();
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return null;
  await supabase.from('customer_logins').update({ used_at: new Date().toISOString() }).eq('id', row.id);
  const session = crypto.randomBytes(32).toString('hex');
  await supabase.from('customer_sessions').insert({ token: session, email: row.email, expires_at: new Date(Date.now() + 90 * 86400000).toISOString(), last_seen_at: new Date().toISOString(), ua: (ua || '').slice(0, 300) });
  return { session, email: row.email };
}

export function sessionCookie(token: string | null): string {
  const base = `${CUSTOMER_COOKIE}=${token || ''}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  return token ? `${base}; Max-Age=${90 * 86400}` : `${base}; Max-Age=0`;
}

/** The signed-in customer for this request (route handlers), or null. */
export async function getCustomerSession(): Promise<{ email: string; token: string } | null> {
  let token: string | undefined;
  try { token = cookies().get(CUSTOMER_COOKIE)?.value; } catch { return null; }
  if (!token) return null;
  const supabase = createAdminClient();
  const { data } = await supabase.from('customer_sessions').select('token, email, expires_at, last_seen_at').eq('token', token).maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  if (!data.last_seen_at || Date.now() - new Date(data.last_seen_at).getTime() > 3600000) {
    await supabase.from('customer_sessions').update({ last_seen_at: new Date().toISOString() }).eq('token', token);
  }
  return { email: data.email, token };
}

export async function endSession(token: string) {
  await createAdminClient().from('customer_sessions').delete().eq('token', token);
}

export async function getCustomerPrefs(email: string): Promise<CustomerPrefs> {
  const { data } = await createAdminClient().from('customer_prefs').select('channel, frequency').ilike('email', norm(email)).maybeSingle();
  return { channel: (data?.channel as any) || 'email', frequency: (data?.frequency as any) || 'every' };
}

export async function setCustomerPrefs(email: string, prefs: Partial<CustomerPrefs>) {
  const clean: any = { email: norm(email), updated_at: new Date().toISOString() };
  if (prefs.channel && ['email', 'sms', 'both'].includes(prefs.channel)) clean.channel = prefs.channel;
  if (prefs.frequency && ['every', 'weekly', 'needed'].includes(prefs.frequency)) clean.frequency = prefs.frequency;
  await createAdminClient().from('customer_prefs').upsert(clean, { onConflict: 'email' });
}

/**
 * Does this customer want this email?
 *  needed = answers to their questions, requests from RO, approvals — always.
 *  update = the quick "here's what happened today" sends.
 *  weekly = the scheduled progress report.
 */
export async function shouldEmailCustomer(email: string | null | undefined, kind: 'needed' | 'update' | 'weekly'): Promise<boolean> {
  if (!email) return false;
  const p = await getCustomerPrefs(email);
  if (p.frequency === 'needed') return kind === 'needed';
  if (p.frequency === 'weekly') return kind !== 'update';
  return true;
}
