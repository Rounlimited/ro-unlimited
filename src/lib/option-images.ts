/**
 * Option image library — curated, eye-verified stock photos (hosted on the
 * Sanity CDN) that option presets use as default choice images, and that the
 * builder's image picker offers as a "Library" alongside Upload.
 *
 * Every image has a `key` (stable id a preset choice points at via
 * `image_key`) and `tags` for search. Multiple images may share a subject —
 * the first match for a key is the default; the rest are alternates.
 */

export interface OptionImage {
  key: string;          // e.g. 'roof-shingle-charcoal'
  url: string;          // Sanity CDN URL
  label: string;        // human label shown in the picker
  tags: string[];       // search terms: 'roof', 'shingle', 'charcoal', 'dark'
  division?: string;    // preset division this belongs to (for filtering)
}

// Filled by the sourcing pass (Pexels → verified → Sanity). Keep keys stable.
export const OPTION_IMAGES: OptionImage[] = [];

/** Default image for a preset choice key (first match), or null. */
export function imageForKey(key?: string | null): string | null {
  if (!key) return null;
  const hit = OPTION_IMAGES.find((im) => im.key === key);
  return hit ? hit.url : null;
}

/** Library search — matches key, label, tags, division. */
export function searchImages(q: string, division?: string): OptionImage[] {
  const needle = q.trim().toLowerCase();
  return OPTION_IMAGES.filter((im) => {
    if (division && im.division && im.division !== division) return false;
    if (!needle) return true;
    return (im.key + ' ' + im.label + ' ' + im.tags.join(' ') + ' ' + (im.division || '')).toLowerCase().includes(needle);
  });
}

/** Suggestions for a choice label — tokenized match against tags/labels. */
export function suggestImages(choiceLabel: string, groupLabel?: string, limit = 12): OptionImage[] {
  const tokens = (choiceLabel + ' ' + (groupLabel || ''))
    .toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  if (!tokens.length) return OPTION_IMAGES.slice(0, limit);
  const scored = OPTION_IMAGES.map((im) => {
    const hay = (im.key + ' ' + im.label + ' ' + im.tags.join(' ')).toLowerCase();
    const score = tokens.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
    return { im, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.im);
}
