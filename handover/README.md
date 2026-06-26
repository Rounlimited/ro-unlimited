# RO Unlimited — Handover Documentation

These 10 chapters are the authoritative owner/technical handover for the RO Unlimited website + admin platform. They mirror the owner's Google **NotebookLM** notebook ("RO Unlimited Website Owner Manual", id `8dbd855d-59d5-49f8-8bd5-480a4fbe07fa`). Each file is standalone and can be re-imported as a separate NotebookLM source.

| # | File | Covers |
|---|------|--------|
| 01 | `01-owner-overview.md` | Owner overview, who's who, live URLs, master account, manual map |
| 02 | `02-architecture-stack.md` | Full stack, build config gotchas, repo structure, hosting/DNS, deploy model |
| 03 | `03-public-site-services.md` | Every public page; the data-driven RO Services system; how to add a service |
| 04 | `04-admin-app.md` | Every admin page/feature, auth & roles, PWA |
| 05 | `05-built-in-ai.md` | The in-app AI assistant: models, ~35 tools, voice, briefing, how to extend |
| 06 | `06-ro-drive-oracle.md` | RO Drive (Telegram + Oracle), native Android app, WebDAV, certs, known issues |
| 07 | `07-integrations-data.md` | Supabase tables, Sanity, Resend, push, cron, env-var reference |
| 08 | `08-credentials-vault.md` | Every secret & account (CONFIDENTIAL — owner only) |
| 09 | `09-operations-handover.md` | Deploy/rollback, maintenance mode, day-1, changing dev teams, security |
| 10 | `10-ai-dev-handoff.md` | Use Claude Code + the bootstrap JSON; connect this manual to Claude |

> ⚠️ Chapter 08 contains live secrets. This `handover/` folder is committed for the owner's convenience; treat the repo as private. Secrets also live in `.env.local` (gitignored).
