@AGENTS.md
# Contextree — agents.md

## What this is
A hierarchical AI context manager. Users create branches that contain 
context (markdown) and files. Branches can be nested infinitely. Chats 
inherit all context from every ancestor branch up to the root. Think 
of it as a tree where context flows downward — a chat inside "Work › dbt migration" 
automatically has context from both "Work" and "dbt migration".

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui (Radix + Nova preset)
- Zustand for state management (persisted to localStorage)
- Supabase for auth + database (Postgres + RLS)
- Vercel AI SDK compatible, but currently using direct API calls
- AES-256 encryption for API keys via crypto-js

## Terminology
- Branch: a context node in the tree (previously called "Project")
- Chat: a conversation inside a branch (previously called "Conversation")
- Context: markdown text attached to a branch, inherited by all descendants
- Layer: one branch's contribution to the full context chain

## Core concept
The most important file is lib/context-builder.ts. It walks up the 
branch tree from a chat's parent branch to the root, collects every 
context layer and file, and assembles them into a single string injected 
as the system prompt on every message. The AI never "remembers" between 
chats — context is re-injected fresh every time.

## Project structure
- app/ — Next.js pages and API routes
- app/api/chat/route.ts — handles AI API calls server-side
- app/api/keys/route.ts — handles encrypted API key storage
- app/api/extract-text/route.ts — extracts text from uploaded files
- app/auth/ — login, signup, callback pages
- components/sidebar/ — collapsible tree navigation
- components/branch-view/ — branch detail, context editor, files, chats grid
- components/chat-view/ — chat interface with streaming
- components/home-view.tsx — home screen with starred and recent chats
- components/app-shell.tsx — main layout, mounts after hydration
- store/index.ts — Zustand store, all app state
- lib/context-builder.ts — core logic, builds context chains
- lib/encryption.ts — AES-256 encrypt/decrypt for API keys
- lib/supabase.ts — browser Supabase client
- lib/supabase-server.ts — server-side Supabase client
- types/index.ts — all shared TypeScript types

## Key rules
- API keys are encrypted before storage, never returned to client
- All AI API calls happen in app/api/chat/route.ts server-side only
- Every database query scoped to authenticated user via Supabase RLS
- Context chain always assembled root-first, chat's branch last
- No business logic in components — components call store actions only
- CSS variables defined in app/globals.css — use var(--bg-primary) etc.
- Dark theme by default, no light mode yet

## CSS variables (globals.css)
- Backgrounds: --bg-primary, --bg-secondary, --bg-elevated, --bg-hover
- Borders: --border-subtle, --border-default, --border-emphasis
- Text: --text-primary, --text-secondary, --text-muted, --text-faint
- Accent: --accent, --accent-hover, --accent-subtle, --accent-border
- Semantic: --danger, --success
- Fonts: --font-serif (Georgia), --font-mono (Geist Mono)

## Design
- Dark theme, sophisticated and minimal
- Serif italic font (Georgia) for titles and the logo
- Purple accent (#8B7FE8) used sparingly — active states, CTAs only
- Sidebar is resizable, tree collapses/expands like VSCode
- Top bar on chats has: star, rename, delete actions
- Context chips below chat topbar show the full branch chain

## Current state (as of April 2026)
- Auth working (Supabase email/password)
- Branch tree working with localStorage persistence
- Context inheritance working and verified
- File uploads working (PDF, md, txt, docx)
- Streaming chat working with Anthropic, OpenAI
- API key management working with encryption
- Styling: dark theme implemented, some CSS variable inconsistencies remain
- Not yet built: light/dark toggle, rate limiting, archive branches, README, Vercel deploy

## Models supported
- claude-sonnet-4-6, claude-opus-4-6, claude-opus-4-7, claude-haiku-4-5
- gpt-4o, gpt-4o-mini, o3, o4-mini
- gemini-2.0-flash, gemini-2.5-pro