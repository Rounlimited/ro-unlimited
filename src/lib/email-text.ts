// Turns one of our HTML emails into plain words, keeping every web link.
// Used when an email is forwarded from the inbox: the forward is typed text,
// and the button in the original must not be lost on the way.
// No imports on purpose, so the inbox screen can use it too.

const decode = (s: string) => s
  .replace(/&nbsp;/gi, ' ').replace(/&middot;/gi, '·').replace(/&mdash;/gi, '—').replace(/&ndash;/gi, '–')
  .replace(/&rsquo;|&#39;|&apos;/gi, "'").replace(/&ldquo;|&rdquo;|&quot;/gi, '"')
  .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&');

/** The part of a branded RO email that was written for the reader (no header, greeting line or footer). */
function messagePart(html: string): string {
  const start = html.indexOf('class="body-text"');
  if (start < 0) return html;
  const open = html.indexOf('>', start);
  // the gold divider that follows the message in buildEmailHtml
  const divider = html.indexOf('style="margin:0 0 24px;"', open);
  const end = divider > 0 ? html.lastIndexOf('</div>', divider) : -1;
  return open > 0 && end > open ? html.slice(open + 1, end) : html;
}

export function emailHtmlToText(html: string): string {
  if (!html) return '';
  let s = messagePart(html)
    .replace(/<(style|script|head|title)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  // a link becomes "its words: the address" so the address survives as text
  s = s.replace(/<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_m, _q, href: string, inner: string) => {
    const label = decode(inner.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    const url = decode(href).trim();
    if (!/^https?:\/\//i.test(url)) return label;
    if (!label || label === url) return ` ${url} `;
    return `${label}: ${url} `;
  });
  s = s
    .replace(/\s*\n\s*/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|table|blockquote)>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' ')
    .replace(/<[^>]+>/g, '');
  return decode(s)
    .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
