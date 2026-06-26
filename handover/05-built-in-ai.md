# RO Unlimited — Owner Manual & Technical Handover
## Chapter 5 — The Built-in AI Assistant

### 5.1 What it is
Every admin page has a built-in AI assistant. It is context-aware (knows the current page + open estimate), holds multi-turn conversations with persistent memory, and can both **read** the database and **take actions** (create customers/estimates, add line items, send emails, manage tasks, navigate the UI). The most powerful, least-obvious feature in the app.

### 5.2 Where it lives
- UI: `src/components/admin/AiChatBubble.tsx` (~870 lines) — chat panel (full / floating / fullscreen / minimized).
- Core API: `src/app/api/admin/ai-chat/route.ts` (~1000+ lines) — LLM + tool execution.
- Estimate helper: `src/components/admin/estimates/AiAssistPanel.tsx` + `src/app/api/admin/estimates/ai-assist/route.ts`.
- Supporting APIs: `ai-conversations` (history + compaction), `ai-memories`, `briefing`, `transcribe`.

### 5.3 Models (multi-provider, user-switchable)
- **Anthropic Claude** (`@anthropic-ai/sdk`, e.g. claude-haiku-4-5) — primary chat + compaction. `ANTHROPIC_API_KEY`.
- **Groq** (Llama 3.3 70B) — fast fallback + estimate line-item generator (`/api/admin/estimates/ai-assist`); also Whisper transcription. `GROQ_API_KEY`.
- **xAI Grok** — alternative chat. `GROK_API_KEY`.
- AiChatBubble header has a model-selector (grok/claude/groq) at runtime.

### 5.4 What the AI can DO — ~35 tools (Claude native tool-use)
Only the relevant subset is sent per message (saves tokens); web search, property lookup, memory always available.
- **Read:** search_customers, search_estimates, get_estimate_details, search_employees, search_vendors, get_activity_log, search_cost_library, list_tasks, get_daily_briefing, search_templates, search_disclaimers, web_search, property_lookup, save_memory/forget_memory.
- **Write:** create_customer, update_customer, create_estimate, update_estimate, add_line_items, update_line_items, delete_line_items, update_estimate_status, send_estimate (Resend + PDF), generate_share_link, duplicate_estimate (auto -R1/-R2), check_estimate_pricing, compose_email, create_task/update_task/complete_task/snooze_task/delete_task, navigate.
- **External:** web_search = **Brave Search** (LLM-context endpoint) + DuckDuckGo fallback (`BRAVE_SEARCH_API_KEY`); property_lookup = Nominatim geocode + FEMA flood zone + OSM Overpass (lot size, sqft, year, flood zone, satellite map) (+ `RENTCAST_API_KEY`).

### 5.5 What the AI knows
System prompt = current page + open estimate + user memories + tool schemas + an embedded **South Carolina construction pricing reference** + estimate standards (phase names, units, categories).

### 5.6 Conversations & memory
- `ai_conversations` (Supabase): threads; auto-compacted with Claude Haiku past ~20k tokens (summary + last 4 msgs).
- `ai_memories` (Supabase): persistent facts ("always 15% markup on commercial"); categories general/pricing/preferences/projects/codes/materials; loaded into the prompt each request.

### 5.7 Voice, photos, speech, maps
Voice: MediaRecorder → `/api/admin/transcribe` → Groq Whisper. Photo attach: canvas-compressed ≤1024px JPEG. TTS: Android `window.RONative.speak()`, else Web Speech API. Maps: Google Maps URL → 3×3 satellite tile grid.

### 5.8 Daily briefing
`/api/admin/briefing` + `/api/cron/daily-briefing`: last-7-days summary — unread emails, sent >3d w/o response, recently viewed (hot leads), drafts, pipeline $ and won $. Surfaced via the dashboard bell + `get_daily_briefing` tool + a Vercel cron push (Chapter 7).

### 5.9 How to extend the AI
1. Add a tool definition (name/description/input schema) to the read/write tool list in `ai-chat/route.ts`.
2. Implement its handler in the tool-execution switch.
3. Add domain context to the system prompt if needed.
4. Test from the UI.

### 5.10 Example prompts
"Pull up Sherry's estimate" · "Show all unpaid estimates" · "Create customer John Smith, residential" · "Permit cost for SC commercial drywall?" · "Look up 123 Main St, Greenville SC" · "Send John the patio estimate" · "Remind me about the Johnson permit Tuesday 9am" · "Morning briefing".
