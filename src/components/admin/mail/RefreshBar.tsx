'use client'

import { Loader2, RefreshCw, WifiOff } from 'lucide-react'

/**
 * Thin status strip for lists that render from the device's saved copy.
 *   refreshing → "Updating…"
 *   error      → "Couldn't refresh — showing saved copy" + Retry
 * Nothing is rendered when the data is fresh and idle.
 */
export default function RefreshBar({
  refreshing, error, savedAt, onRetry,
}: { refreshing: boolean; error: string | null; savedAt: number | null; onRetry: () => void }) {
  if (!refreshing && !error) return null
  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 text-[15px] ${error ? 'text-mail-warn' : 'text-mail-muted'}`} role="status">
      {error ? <WifiOff size={16} /> : <Loader2 size={16} className="animate-spin" />}
      <span className="flex-1 truncate">
        {error ? `Couldn't refresh. Showing ${savedAt ? `the copy from ${ago(savedAt)}` : 'the saved copy'}` : 'Updating…'}
      </span>
      {error && (
        <button onClick={onRetry} className="flex items-center gap-1.5 min-h-[44px] px-3 font-bold text-mail-gold">
          <RefreshCw size={15} /> Retry
        </button>
      )}
    </div>
  )
}

function ago(t: number) {
  const m = Math.floor((Date.now() - t) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  if (m < 1440) return `${Math.floor(m / 60)} h ago`
  return `${Math.floor(m / 1440)} days ago`
}
