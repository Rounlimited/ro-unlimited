/**
 * ============================================================
 * STORAGE ABSTRACTION LAYER
 * ============================================================
 * Currently: Sanity Assets (free tier, ~20GB total)
 *
 * FUTURE SWAP → Backblaze B2:
 *   1. Create B2 bucket "rou-project-files"
 *   2. Set CORS on bucket for: https://[PRODUCTION_DOMAIN]
 *      (currently: https://rounlimited.com)
 *      (after domain transfer: https://[CLIENT_DOMAIN])
 *   3. Add env vars: B2_KEY_ID, B2_APP_KEY, B2_BUCKET_ID, B2_BUCKET_NAME
 *   4. Add Cloudflare subdomain: files.[CLIENT_DOMAIN] → B2 bucket
 *   5. Replace uploadToStorage() below with B2 pre-signed URL flow
 *   6. Update deleteFromStorage() to call B2 delete API
 *   No changes needed in any UI component or page.
 * ============================================================
 *
 * DOMAIN TRANSFER CHECKLIST (when client gets their domain):
 *   - Update NEXT_PUBLIC_SITE_URL in Vercel env vars
 *   - Update Sanity CORS origins in sanity.io/manage (project 3at2yyx0)
 *   - Update Supabase allowed URLs in supabase dashboard
 *   - Update B2 bucket CORS (when B2 is set up)
 *   - Update Cloudflare DNS to point new domain at Vercel
 * ============================================================
 */

export interface StorageUploadResult {
  /** Permanent asset ID — used as the key to reference/delete this file */
  assetId: string;
  /** Public URL to serve this file */
  url: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Storage provider used — useful for migration tracking */
  provider: 'sanity' | 'b2';
}

export type FileCategory =
  | 'photo'
  | 'video'
  | 'permit'
  | 'contract'
  | 'receipt'
  | 'drawing'
  | 'document'
  | 'other';

/**
 * Upload a file. Today this goes to Sanity Assets.
 * When switching to B2, only this function changes.
 */
export async function uploadToStorage(
  file: File,
  category: FileCategory = 'other'
): Promise<StorageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', category === 'video' ? 'video' : category === 'photo' ? 'image' : 'file');
  formData.append('category', category);

  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  return {
    assetId: data.assetId,
    url: data.url,
    filename: data.originalFilename || file.name,
    mimeType: data.mimeType || file.type,
    size: data.size || file.size,
    provider: 'sanity',
  };
}

/**
 * Returns accepted MIME types for a given category.
 * Used for file input accept= attributes.
 */
export function getAcceptTypes(category: FileCategory): string {
  switch (category) {
    case 'photo':    return 'image/jpeg,image/png,image/webp,image/heic';
    case 'video':    return 'video/mp4,video/quicktime,video/mov';
    case 'permit':
    case 'contract':
    case 'receipt':
    case 'drawing':
    case 'document': return 'application/pdf,image/jpeg,image/png';
    default:         return '*/*';
  }
}

/** Human-readable file size */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
