# RO Unlimited — Owner Manual & Technical Handover
## Chapter 6 — RO Drive & the Oracle Cloud Infrastructure

### 6.1 Big picture
"RO Drive" (`/admin/drive`) is the team's file storage. Files are stored via a **Telegram bot** (free blob store); only **metadata** lives in Supabase. To beat Telegram's limits, RO runs a **self-hosted Telegram Bot API server on an Oracle Cloud VM**. A native Android app gives a Drive-style upload/download experience. The most custom, least-obvious part of the platform.

### 6.2 The Oracle Cloud server
- VM: OCI AMD instance, public IP **`129.80.43.28`**, region `us-ashburn-1`. OCI account under `rounlimitedco@gmail.com` (creds in Chapter 8).
- SSH: `ssh -i C:\websites\rounlimited\oracle_ssh_key2 ubuntu@129.80.43.28` — use **`oracle_ssh_key2`** (the older `oracle_ssh_key` does NOT work). `sudo -n` works (passwordless).
- Docker: `telegram-bot-api` :8081 (raises upload to 2 GB), `rodrive-webdav` :8085 (WsgiDAV).
- nginx fronts both with Let's Encrypt: `upload.rounlimited.com` → :8081, `dav.rounlimited.com` → :8085. Cloudflare tunnel `ro-storage` (id `aea938be-…`) → :8081 as `storage.rounlimited.com`.

### 6.3 Upload flow
- Web (`src/app/admin/drive/page.tsx` doUpload): **>512 KB** upload directly browser→`upload.rounlimited.com/bot<TOKEN>/sendDocument`; **≤512 KB** via Vercel `/api/admin/drive`. Telegram `file_id` + metadata saved to Supabase `user_files`.
- Native app (`UploadActivity.java`): uploads via `https://upload.rounlimited.com/bot<token>/sendDocument`, then POSTs metadata to `/api/admin/drive` (`action=save_metadata`).
- Tables: `user_files`, `user_folders`, `file_shares`, `folder_shares`, `user_shares`.

### 6.4 Download flow (and the filename fixes)
- `get_download_url` (`/api/admin/drive`) calls Telegram `getFile` on **api.telegram.org** and returns a URL; downloads stream through **`/api/admin/drive/file?download=1&filename=…&url=…`**.
- The proxy sets **`Content-Disposition: attachment`** + a correct **`Content-Type`** from the file extension (`src/lib/mime.ts`) — both required (Telegram serves octet-stream; Android `URLUtil` otherwise rewrites the extension to `.bin`, and its Content-Disposition parser needs the bare `filename="…"` form).
- Public share links stream via `/api/shared/[token]/file` and `/api/shared/folder/[token]/file?download=1` with the same headers.
- Client trigger differs by platform (`handleDownload`): Android native app → `location.href` (its WebView DownloadListener catches it); iOS/desktop → fetch blob + object-URL (never navigates — avoids iOS standalone white-screen).

### 6.5 Native Android app
- Package `com.rounlimited.admin`, project `C:\websites\rounlimited\native-app\`. A WebView app loading `https://rounlimited.com/admin` (website deploys reach it live).
- Injects `window.RONative` (`isNativeApp()`, `openUploader()`, `saveEmail()`, `speak()`/`stopSpeaking()`).
- `MainActivity.java` sets `WebView.setDownloadListener` (v1.2.1) → Android DownloadManager (uses Content-Disposition for the name); without it the WebView ignores downloads.
- `UploadActivity.java` is the native uploader; it declares `configChanges` (v1.2.2) so the picker doesn't recreate the activity (fixed a duplicate-file bug).
- Build/sign: keystore `C:\websites\rounlimited\twa\ro-admin.keystore`, alias `ro-admin`, password *(see Credentials Vault — NotebookLM Ch 8.15)*. `cd native-app && ./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release.apk` (same key = in-place update). Distribute by hosting at `https://rounlimited.com/<file>.apk` (copy also at `I:/My Drive/ro-admin.apk`).

### 6.6 WebDAV mount
`https://dav.rounlimited.com/` · user `admin` · password *(see Credentials Vault — NotebookLM Ch 8.13)* · WsgiDAV on :8085 (Let's Encrypt). Windows: `rclone mount rodrive: R: --vfs-cache-mode full --vfs-cache-max-size 1G`. Helper `C:\websites\rounlimited\tools\Mount-RODrive.bat`; source `C:\websites\rounlimited\webdav\rodrive_webdav.py`.

### 6.7 Known issues & gotchas
- ⚠️ **Files >20 MB can't be downloaded.** Oracle `telegram-bot-api` runs **without `--local`**, so files are relayed to Telegram's cloud where `getFile` caps at 20 MB ("file is too big"); `/var/lib/telegram-bot-api` is empty. Fix: add `--local` to the container + serve via the Oracle file server (:8082/:8085) + re-upload existing large files. Small files unaffected.
- ⚠️ **TLS auto-renewal:** `upload.rounlimited.com` once expired because certbot used the `standalone` authenticator (needs port 80, held by nginx). Fixed 2026-06-25 by switching to the **nginx** authenticator (`certbot certonly --nginx -d upload.rounlimited.com --cert-name upload.rounlimited.com -n` → `systemctl reload nginx`). Both certs now auto-renew. Lapse symptom: "upload failed" on Android while `http://129.80.43.28:8081` still works.
- Diagnose: `curl https://upload.rounlimited.com/bot<token>/getMe` (cert) vs `curl http://129.80.43.28:8081/bot<token>/getMe` (raw).
