# RO Unlimited — Owner Manual & Technical Handover
## Chapter 10 — AI Dev Handoff: Take Over with Claude Code

### 10.1 The recommended way to maintain and edit this site
This platform was built and is maintained with **Claude Code** — Anthropic's agentic coding tool that reads/edits the whole codebase, runs commands, manages git, and deploys. **A new developer or AI agent taking over should use Claude Code.**

**Subscription needed:**
- **Minimum: Claude Pro** (Claude Code is included with Pro).
- **Recommended: Claude Max.** For a codebase this size (public site + admin platform + built-in AI + Telegram/Oracle infra + native app), Max is strongly recommended — much higher usage limits and access to the most capable model (Claude Opus). Pro works for small edits but hits limits quickly.

### 10.2 Bring Claude up to speed with this manual (any one works; A or B best)
- **A — MCP connector:** install `notebooklm-mcp-cli` and add it to Claude Code (`claude mcp add notebooklm -- npx -y notebooklm-mcp-cli`), authenticate to the Google account that owns the notebook, then Claude can `notebook_query` these chapters live.
- **B — Repo + CLAUDE.md:** these chapters are committed in the repo's `handover/` folder with a top-level `CLAUDE.md`. Claude Code auto-loads `CLAUDE.md` every session, so it starts already knowing the architecture, deploy steps, conventions, and where credentials live.
- **C — Paste the bootstrap JSON (10.4)** as your first message, then say: "Read the repo + handover chapters and confirm the architecture before changing anything."

### 10.3 First session checklist
1. Start Claude Code in `C:\websites\rounlimited\git`.
2. Feed it the bootstrap JSON (10.4) and/or connect the notebook (10.2).
3. Confirm: stack, the single RO-owned Vercel deploy model, where env/credentials live (Ch 8), known issues (Ch 9.7).
4. Make a tiny change → `git push origin master` → confirm auto-deploy.

### 10.4 Bootstrap JSON (paste into Claude to orient instantly)
```json
{
  "project": "RO Unlimited — Next.js public site + admin business platform",
  "repo": "github.com/Rounlimited/ro-unlimited (master) at C:\\websites\\rounlimited\\git",
  "install": "npm install (.npmrc legacy-peer-deps=true)",
  "dev": "npx next dev -p 3100 -H 0.0.0.0",
  "deploy": "git push origin master -> single RO Vercel project auto-deploys (~2 min); no NexaVision dependency",
  "stack": "Next.js 14, React 18, TS, Tailwind, GSAP; Supabase ocizuduhqsmewcmtilae; Sanity 3at2yyx0; Cloudflare->Vercel; GoDaddy domain",
  "subsystems": ["public site src/app", "services src/lib/*-data.ts + ServicePageTemplate/SubServicePage", "admin src/app/admin", "built-in AI src/app/api/admin/ai-chat", "RO Drive Telegram+Oracle src/app/api/admin/drive", "native app native-app/"],
  "credentials": "handover/08-credentials-vault.md + .env.local (never commit .env.local)",
  "known_issues": ["RO Drive >20MB download (Oracle missing --local)", "Sanity write token maybe read-only", "/api/admin/* not all auth-gated"],
  "docs": "Full detail in handover/01..10 and NotebookLM notebook 8dbd855d-59d5-49f8-8bd5-480a4fbe07fa",
  "tooling": "Use Claude Code; Claude Pro min, Max recommended for this size"
}
```

### 10.5 The loop
A new dev opens this manual → reads this chapter → uses **Claude Code** (Pro min, Max recommended) → feeds it the bootstrap JSON and/or connects the notebook via `notebooklm-mcp-cli` → Claude has the full manual and can read/edit/deploy. The JSON points to the chapters for detail; the chapters point to the JSON for fast bring-up.
