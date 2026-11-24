# Project memory

## Product intent & audience

- PharmaRCA: AI-assisted Root Cause Analysis tool for pharmaceutical deviation/incident management
- Audience: pharmaceutical quality, compliance, and CAPA professionals
- Core workflow: ingest incident input (pasted text, email, or PDF) → AI analysis → human review/edit → save

## Brand personality & voice

- Professional, clinical, compliance-oriented tone
- Precision and auditability emphasized over casual/marketplace language

## Visual design & UX direction

- AI panel accepts pasted incident reports, emails, or PDF uploads
- Analysis output is structured and editable before saving: deviation extraction, 5 Whys, Fishbone, root causes, evidence gaps, CAPA recommendations
- Review-first UX: AI proposes, human approves/edits — no auto-save of AI output

## Decisions, constraints & rationale

- Backend AI via Groq; model switched from `llama-3.3-70b-versatile` (deprecated for free/developer tiers on 2026-08-16) to `openai/gpt-oss-120b` (Groq-recommended replacement)
- Edge functions run on Deno; `GROQ_API_KEY` read via `Deno.env.get("GROQ_API_KEY")`
- LangGraph-style multi-step workflow on backend (extract → 5 Whys → Fishbone → root causes → evidence gaps → CAPA)
- API key configured as edge function secret; no client-side key exposure
- Edge function cleanup: removed unused `createClient` import
- Stack: Vite + React, Tailwind, lucide-react, `@/` path alias

## Open questions & assumptions

- Backend/edge-function host assumed (Supabase-style Deno edge functions) — not yet confirmed
- PDF text extraction mechanism not specified
- Persistence layer and RCA record schema not yet documented
- Groq model availability may change again; monitor deprecation notices