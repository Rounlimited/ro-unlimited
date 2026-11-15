// Who in RO's admin can open NexaBooks, and as what.
// Client-safe (no server imports): the drawer and side bar use it to hide the entry.
//
// Only owner-level people (RO's `admin` role) get in, as NexaBooks `owner`: an owner can
// activate the subscription and change its settings, so nobody else gets that power.
// `roleOf()` treats a user with no role metadata as 'admin' (the legacy owner account),
// and the client checks below mirror that. super_admin (the NexaVision developer) and
// employees are left out on purpose.
import type { NexaBooksRole } from './token';

export const NEXABOOKS_ROLE_MAP: Record<string, NexaBooksRole | undefined> = {
  admin: 'owner',
};

/** `role` is the user's role as roleOf() reports it ('admin' when unset). */
export function nexaBooksRoleFor(role: string | null | undefined): NexaBooksRole | null {
  return NEXABOOKS_ROLE_MAP[role || 'admin'] ?? null;
}

/** Client-side check from Supabase user_metadata.role (missing = admin, like roleOf). */
export function canSeeNexaBooks(metadataRole: string | null | undefined): boolean {
  return nexaBooksRoleFor(metadataRole) !== null;
}
