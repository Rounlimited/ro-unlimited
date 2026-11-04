/**
 * Safari 12 (macOS Sierra, the newest Safari it gets) doesn't know the
 * Unicode *emoji* property escapes (\p{Emoji}, \p{EMod}, \p{RI}). Two
 * libraries use them and throw on load, which shows "a client-side exception
 * has occurred". Caught by the /api/client-error logger, 2026-11-04.
 *
 *  - gsap/SplitText builds `new RegExp("\\p{RI}…\\p{Emoji}…", "gu")` at module
 *    load. GSAP loads in the root layout, so EVERY page died.
 *  - linkifyjs (rich-text link detection on estimates / inbox / leads) has
 *    `/\p{L}/u` and `/\p{Emoji}/u` literals; a bad literal fails the whole file.
 *
 * Each one is wrapped in try/catch. Modern browsers get the exact original
 * regex. Old Safari gets a plain equivalent: one-character splitting for
 * SplitText (letter animations still play), and BMP letter / emoji ranges
 * for linkify (links still detect).
 */
module.exports = function (source) {
  let out = source;

  // gsap/SplitText
  out = out.replace(/_emojiSafeRegEx\s*=\s*new RegExp\(("(?:[^"\\]|\\.)*"),\s*"gu"\)/, (_m, pattern) =>
    '_emojiSafeRegEx = (function () { try { return new RegExp(' + pattern + ', "gu"); } catch (e) { return /[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\s\\S]/g; } })()');

  // linkifyjs
  const FALLBACK = {
    L: '/[A-Za-z\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u0370-\\u03FF\\u0400-\\u052F\\u0590-\\u05FF\\u0600-\\u06FF\\u0900-\\u0DFF\\u0E00-\\u0EFF\\u1000-\\u109F\\u10A0-\\u10FF\\u1100-\\u11FF\\u1E00-\\u1FFF\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uAC00-\\uD7AF]/',
    Emoji: '/[\\u00A9\\u00AE\\u203C-\\u3299]|[\\uD83C-\\uD83E][\\uDC00-\\uDFFF]/',
  };
  out = out.replace(/\/\\p\{(L|Emoji)\}\/u/g, (_m, prop) =>
    '(function () { try { return new RegExp("\\\\p{' + prop + '}", "u"); } catch (e) { return ' + FALLBACK[prop] + '; } })()');

  return out;
};
