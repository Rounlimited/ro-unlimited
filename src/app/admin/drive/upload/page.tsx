'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ShareTargetPage() {
  const [status, setStatus] = useState<'uploading' | 'done' | 'error'>('uploading');
  const [message, setMessage] = useState('Receiving shared files...');
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const processSharedFiles = async () => {
      try {
        // Get user email
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          setStatus('error');
          setMessage('Not logged in');
          return;
        }

        // The service worker should have cached the shared files
        // Check if we have files from the share target
        const cache = await caches.open('ro-share-target');
        const requests = await cache.keys();

        if (requests.length === 0) {
          setStatus('error');
          setMessage('No files received. Try sharing again.');
          return;
        }

        let uploaded = 0;
        const UPLOAD_BASE = process.env.NEXT_PUBLIC_TELEGRAM_UPLOAD_URL || '';
        const BOT_TOKEN = '8749047502:AAGIy6qsa_6R81FW88XX1REn3MBTc8NJ7dc';
        const CHAT_ID = '8195603202';

        for (const request of requests) {
          const response = await cache.match(request);
          if (!response) continue;

          const formData = await response.formData();
          const files = formData.getAll('files');

          for (const file of files) {
            if (!(file instanceof File)) continue;
            setMessage(`Uploading ${file.name}...`);

            const tgForm = new FormData();
            tgForm.append('chat_id', CHAT_ID);
            tgForm.append('document', file, file.name);
            tgForm.append('caption', `${user.email} | / | ${file.name}`);

            let tgData;
            if (UPLOAD_BASE && file.size > 4 * 1024 * 1024) {
              const res = await fetch(`${UPLOAD_BASE}/bot${BOT_TOKEN}/sendDocument`, {
                method: 'POST', body: tgForm,
              });
              tgData = await res.json();
            } else {
              const smallForm = new FormData();
              smallForm.append('file', file);
              smallForm.append('user_email', user.email);
              smallForm.append('folder', '/');
              const res = await fetch('/api/admin/drive', { method: 'POST', body: smallForm });
              tgData = { ok: true, result: { document: await res.json() } };
              if (tgData.result.document.file) {
                uploaded++;
                continue;
              }
            }

            if (tgData.ok && tgData.result?.document) {
              const doc = tgData.result.document;
              await fetch('/api/admin/drive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'save_metadata',
                  user_email: user.email,
                  filename: doc.file_name || file.name,
                  original_filename: file.name,
                  mime_type: doc.mime_type || file.type,
                  file_size: doc.file_size || file.size,
                  telegram_file_id: doc.file_id,
                  folder: '/',
                }),
              });
              uploaded++;
            }
          }
        }

        // Clear the cache
        await caches.delete('ro-share-target');

        setCount(uploaded);
        setStatus(uploaded > 0 ? 'done' : 'error');
        setMessage(uploaded > 0 ? `${uploaded} file${uploaded > 1 ? 's' : ''} uploaded to RO Drive` : 'No files uploaded');
      } catch (err) {
        setStatus('error');
        setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    processSharedFiles();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {status === 'uploading' && (
          <>
            <Loader2 size={48} className="text-[#3b8dd4] animate-spin mx-auto mb-4" />
            <p className="text-white text-[18px] font-semibold mb-2">Uploading</p>
            <p className="text-white/40 text-[15px]">{message}</p>
          </>
        )}
        {status === 'done' && (
          <>
            <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
            <p className="text-white text-[18px] font-semibold mb-2">Done!</p>
            <p className="text-white/40 text-[15px] mb-6">{message}</p>
            <Link href="/admin/drive" className="px-6 py-3 bg-[#3b8dd4] text-white font-bold text-[15px] rounded-xl">
              Open RO Drive
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-white text-[18px] font-semibold mb-2">Upload Failed</p>
            <p className="text-white/40 text-[15px] mb-6">{message}</p>
            <Link href="/admin/drive" className="px-6 py-3 bg-white/10 text-white font-bold text-[15px] rounded-xl">
              Go to RO Drive
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
