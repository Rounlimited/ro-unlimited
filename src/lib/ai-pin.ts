import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * PIN-locked chats (Nexa AI module). A locked chat's messages are stored
 * encrypted with a key made from the owner's PIN, so nobody can read them
 * without it: not another admin, not the developer account, not someone
 * looking at the database. There is no reset: a forgotten PIN means the
 * locked chats cannot be opened again.
 *
 * Per-user verifier lives in app_settings under `ai_pin:<user_id>`:
 *   { salt: hex, check: blob }   (check = the word below, encrypted)
 */
const CHECK_WORD = 'nexa-secret-ok';
export const pinKeyName = (userId: string) => `ai_pin:${userId}`;

export function validPin(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4,12}$/.test(pin);
}

export function deriveKey(pin: string, saltHex: string): Buffer {
  return scryptSync(pin, Buffer.from(saltHex, 'hex'), 32, { N: 16384, r: 8, p: 1 });
}

export function encrypt(key: Buffer, plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv.toString('base64'), c.getAuthTag().toString('base64'), ct.toString('base64')].join('.');
}

export function decrypt(key: Buffer, blob: string): string | null {
  try {
    const [iv, tag, ct] = blob.split('.').map((p) => Buffer.from(p, 'base64'));
    const d = createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
  } catch { return null; }
}

export function newVerifier(pin: string): { salt: string; check: string } {
  const salt = randomBytes(16).toString('hex');
  return { salt, check: encrypt(deriveKey(pin, salt), CHECK_WORD) };
}

/** Returns the key when the PIN is right, null when it is wrong. */
export function keyIfPinRight(pin: string, v: { salt: string; check: string }): Buffer | null {
  const key = deriveKey(pin, v.salt);
  const got = decrypt(key, v.check);
  if (!got) return null;
  const a = Buffer.from(got); const b = Buffer.from(CHECK_WORD);
  return a.length === b.length && timingSafeEqual(a, b) ? key : null;
}
