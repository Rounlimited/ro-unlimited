# RO Unlimited — Owner Manual & Technical Handover
## Chapter 8 — Credentials & Access Vault (POINTER — secrets intentionally NOT in git)

> 🔐 The **full credential vault with real secret values is kept in these places only:**
> 1. The owner-only Google **NotebookLM** notebook ("RO Unlimited Website Owner Manual", id `8dbd855d-59d5-49f8-8bd5-480a4fbe07fa`), Chapter 8.
> 2. The repo's **`.env.local`** (gitignored — never committed).
> 3. **`handover/ro-unlimited-credentials.zip`** — an **AES‑256 password‑protected** archive committed to this repo, containing `ROU_CREDENTIALS.md` + `.env.local`. The encryption is opaque to git/GitHub secret scanning, so the blob is safe to store here; it can only be opened with the **owner's vault password** (NOT stored anywhere in the repo). Open it with **7‑Zip** or **WinRAR** (Windows Explorer's built‑in unzip cannot open AES/password zips). On Windows: `& "C:\Program Files\7-Zip\7z.exe" x handover\ro-unlimited-credentials.zip -p<password>`.
>
> Raw secrets are deliberately **excluded from the plaintext of this committed file** so they never enter git history. This file lists *what exists and where to get it*; for the actual values, open the NotebookLM manual, `.env.local`, or the encrypted zip above.

### Accounts & where the secrets live
| Service | What you need | Source of the value |
|---|---|---|
| Master Google account | `rounlimitedco@gmail.com` (logs into GitHub/Vercel/Sanity/Supabase/GoDaddy/Oracle) | password manager |
| Admin users (Supabase) | `rounlimitedco@gmail.com` (admin), `admin@nexavisiongroup.com` (super_admin) | NotebookLM Ch 8.2 |
| GitHub | account `Rounlimited`, repo `Rounlimited/ro-unlimited`, a Personal Access Token | NotebookLM Ch 8.3 |
| Vercel (RO-own) | team `rounlimiteds-projects`/`team_r4Z6lWU4vIqkjE1TtMKg4pjc`, project `ro-unlimited`/`prj_IAbUrfvGyPPd0Qw8qpL0ffeuZTIH`, API token | NotebookLM Ch 8.4 |
| Sanity | project `3at2yyx0`, dataset `production`, API token (read+write; maybe read-only) | NotebookLM Ch 8.5 / `.env.local` |
| Supabase (RO-own LIVE) | ref `ocizuduhqsmewcmtilae`, anon + service-role keys, mgmt PAT (DDL) | NotebookLM Ch 8.6 / `.env.local` |
| Domain / DNS | GoDaddy (`rounlimited.com`) + Cloudflare (acct `info.mw48@gmail.com`, zone `fdc34df2…`, global key, tunnel `ro-storage`) | NotebookLM Ch 8.7 |
| Resend (email) | API key, webhook secret, `EMAIL_FORWARD_TO=build@rounlimited.com` | NotebookLM Ch 8.8 / `.env.local` |
| AI providers | Anthropic, Groq, xAI Grok, Brave (NexaVision shared), RentCast, Tavily | NotebookLM Ch 8.9 / `.env.local` |
| Push (VAPID) | public + private VAPID keys, `PUSH_SECRET` | NotebookLM Ch 8.10 / `.env.local` |
| Telegram (RO Drive) | bot token (`Nexavisiongroup_bot`), storage chat id, API url, file server | NotebookLM Ch 8.11 / `.env.local` |
| Oracle Cloud (OCI) | IP `129.80.43.28`, SSH key `oracle_ssh_key2`, OCI user/tenancy/fingerprint/secret, API key pem | NotebookLM Ch 8.12 |
| WebDAV | `dav.rounlimited.com`, user `admin`, password | NotebookLM Ch 8.13 |
| Firebase | project `ro-unlimited`, service-account JSON, api key, sender/app ids | NotebookLM Ch 8.14 |
| Native Android signing | keystore `twa/ro-admin.keystore`, alias `ro-admin`, password | NotebookLM Ch 8.15 |

To run locally: copy the `.env.local` block from **NotebookLM Chapter 8.16** into `C:\websites\rounlimited\git\.env.local`.
