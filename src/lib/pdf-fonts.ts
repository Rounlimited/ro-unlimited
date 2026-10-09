import { Font } from '@react-pdf/renderer';

/**
 * One embedded body font for every PDF we generate.
 *
 * The built-in "Helvetica" is never embedded — the viewer has to supply it.
 * Chrome, Adobe and phones do; Messenger's web preview (and a few others)
 * substitute a font with a different character map, and every regular-weight
 * line turns into symbols while bold survives. A customer got exactly that.
 * Embedding a real TTF makes the document identical everywhere.
 *
 * Files live in public/fonts and are fetched by URL at render time (same
 * approach as the logo) so serverless bundling never has to find them.
 */
// PDF_ASSET_BASE is read at runtime (NEXT_PUBLIC_* is inlined at build), so a
// local `next start` can point at itself for the font files.
const SITE = process.env.PDF_ASSET_BASE || process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';

export const PDF_FONT = 'Inter';

let registered = false;
export function registerPdfFonts() {
  if (registered) return;
  registered = true;
  Font.register({
    family: PDF_FONT,
    fonts: [
      { src: `${SITE}/fonts/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${SITE}/fonts/Inter-Bold.ttf`, fontWeight: 700 },
      { src: `${SITE}/fonts/Inter-Italic.ttf`, fontWeight: 400, fontStyle: 'italic' },
    ],
  });
  // No mid-word hyphenation — "con-struc-tion" breaks read as garbled.
  Font.registerHyphenationCallback((word) => [word]);
}

registerPdfFonts();
