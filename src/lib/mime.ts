// Map a filename's extension to a concrete MIME type.
// Telegram's CDN serves files as application/octet-stream, which makes Android's
// URLUtil.guessFileName rewrite the saved extension to ".bin". Sending a Content-Type
// that matches the filename's extension keeps the real extension.
const EXT_MIME: Record<string, string> = {
  // images
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', heic: 'image/heic',
  heif: 'image/heif', tif: 'image/tiff', tiff: 'image/tiff', ico: 'image/x-icon',
  // video
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska',
  avi: 'video/x-msvideo', m4v: 'video/x-m4v', '3gp': 'video/3gpp',
  // audio
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
  aac: 'audio/aac', flac: 'audio/flac',
  // documents
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain', csv: 'text/csv', rtf: 'application/rtf', json: 'application/json',
  // archives
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar', gz: 'application/gzip',
  // design
  eps: 'application/postscript', ai: 'application/postscript', psd: 'image/vnd.adobe.photoshop',
};

/** Returns a concrete MIME type for the filename's extension, or null if unknown. */
export function mimeFromFilename(name: string | null | undefined): string | null {
  if (!name) return null;
  const dot = name.lastIndexOf('.');
  if (dot < 0) return null;
  return EXT_MIME[name.slice(dot + 1).toLowerCase()] || null;
}
