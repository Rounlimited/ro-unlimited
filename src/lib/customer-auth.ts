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

async function createSession(email: string, ua?: string | null): Promise<string> {
  const session = crypto.randomBytes(32).toString('hex');
  await createAdminClient().from('customer_sessions').insert({ token: session, email: norm(email), expires_at: new Date(Date.now() + 90 * 86400000).toISOString(), last_seen_at: new Date().toISOString(), ua: (ua || '').slice(0, 300) });
  return session;
}

/** Turn a one-time link into a session. Returns the session token or null. */
export async function redeemLogin(token: string, ua?: string | null): Promise<{ session: string; email: string } | null> {
  const supabase = createAdminClient();
  const { data: row } = await supabase.from('customer_logins').select('id, email, expires_at, used_at').eq('token', token).maybeSingle();
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return null;
  await supabase.from('customer_logins').update({ used_at: new Date().toISOString() }).eq('id', row.id);
  return { session: await createSession(row.email, ua), email: row.email };
}

/* ── Password sign-in: so a customer can log in on the site without opening email ──
   scrypt (Node built-in), per-user salt. The email link stays as the first-time
   door and the "forgot password" path. 8 wrong tries locks the account 15 min. */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }).toString('hex');
  return `scrypt$${salt}$${hash}`;
}
function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = String(stored || '').split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  const want = Buffer.from(hash, 'hex');
  return test.length === want.length && crypto.timingSafeEqual(test, want);
}
export function passwordProblem(pw: string): string | null {
  if (!pw || pw.length < 8) return 'Use at least 8 characters.';
  if (pw.length > 200) return 'That is too long.';
  return null;
}
export async function hasPassword(email: string): Promise<boolean> {
  const { data } = await createAdminClient().from('customer_accounts').select('email').eq('email', norm(email)).maybeSingle();
  return !!data;
}
export async function setPassword(email: string, password: string): Promise<{ ok: true } | { error: string }> {
  const bad = passwordProblem(password); if (bad) return { error: bad };
  await createAdminClient().from('customer_accounts').upsert({ email: norm(email), password_hash: hashPassword(password), password_set_at: new Date().toISOString(), failed_attempts: 0, locked_until: null }, { onConflict: 'email' });
  return { ok: true };
}
export async function loginWithPassword(emailRaw: string, password: string, ua?: string | null): Promise<{ session: string; email: string } | { error: string }> {
  const email = norm(emailRaw);
  const generic = { error: 'Wrong email or password. You can also have a sign-in link emailed to you.' };
  if (!email || !password) return generic;
  const supabase = createAdminClient();
  const { data: acct } = await supabase.from('customer_accounts').select('password_hash, failed_attempts, locked_until').eq('email', email).maybeSingle();
  if (!acct) return generic;
  if (acct.locked_until && new Date(acct.locked_until) > new Date()) return { error: 'Too many tries. Wait 15 minutes, or have a sign-in link emailed to you.' };
  if (!verifyPassword(password, acct.password_hash)) {
    const n = (acct.failed_attempts || 0) + 1;
    await supabase.from('customer_accounts').update({ failed_attempts: n, locked_until: n >= 8 ? new Date(Date.now() + 15 * 60000).toISOString() : null }).eq('email', email);
    return generic;
  }
  if (acct.failed_attempts) await supabase.from('customer_accounts').update({ failed_attempts: 0, locked_until: null }).eq('email', email);
  return { session: await createSession(email, ua), email };
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
