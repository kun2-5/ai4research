# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is **ResearchOS** — an AI-native research operating system. The `web/` directory contains a Next.js 15 full-stack application. The project is independent (not forked from the AGPL-licensed `claudecodeui/` reference directory in the repo root).

## Common Commands

All commands run from the `web/` directory:

```bash
cd web
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build
npm run lint       # ESLint
npm run start      # Production server (run after build)
```

To add shadcn/ui components:
```bash
cd web
npx shadcn@latest add <component-name>
```

## Architecture

### Route Groups

Root `layout.tsx` provides `<html>`, `<body>`, and fonts only. Everything else is in route groups:

```
src/app/
├── layout.tsx               # Root: html + body + fonts
├── (main)/
│   ├── layout.tsx            # Three-column: Sidebar + content + AIAgent
│   ├── page.tsx              # Dashboard
│   └── knowledge/            # Knowledge Space
├── api/                      # API routes (no layout inheritance)
└── claude/                   # Deleted — removed in refactor
```

To create a page WITHOUT the three-column layout, add a sibling route group next to `(main)/` with its own `layout.tsx`.

### Three-Column Layout

Defined in `src/app/(main)/layout.tsx`:
- **Left**: Sidebar — collapsible nav (client component)
- **Center**: main — page content
- **Right**: AICompanion — Claude Agent SDK powered panel (client component, SSE streaming)

### Module Status

| Route | Module | Status |
|-------|--------|--------|
| `/knowledge/*` | Knowledge Space | ✅ 21 concepts, 150 papers, concept detail + AI insight |
| `/insights` | Insight Engine | Not implemented |
| `/lab` | LabBench | Not implemented |
| `/studio` | Scholar Studio | Not implemented |
| `/nexus` | Collaboration Network | Not implemented |

## Data Flow

```
wiki-data/ (synced from server /mnt/Data2/km/wiki)
    ↓ src/lib/wiki/reader.ts (fs-based parser, 7 exported functions)
    ├── Server Components (for read-only pages, e.g. knowledge landing)
    └── API Routes (for client components to fetch)
            ↓ fetch() or SSE
        Client Components (interactive pages with search/filter)
```

**Two patterns for data loading:**
1. **Server Component + direct reader call** — no client interactivity. See `src/app/(main)/knowledge/page.tsx`
2. **Client Component + API fetch** — search/filter/state. See `src/app/(main)/knowledge/concepts/page.tsx`

## AI Integration (Current)

AI is powered by `@anthropic-ai/claude-agent-sdk` via the `query()` async generator.

### API Routes

| Route | File | Purpose |
|-------|------|---------|
| `POST /api/ai/agent` | `api/ai/agent/route.ts` | Main chat — AICompanion uses this |
| `POST /api/ai/insight` | `api/ai/insight/route.ts` | Concept research gap analysis |
| `GET /api/concepts` | `api/concepts/route.ts` | Wiki concepts data |
| `GET /api/literature` | `api/literature/route.ts` | Wiki literature data |
| `GET /api/stats` | `api/stats/route.ts` | Wiki statistics |

### Claude Code Configuration

Web Claude Code reads from project-level `.claude/settings.json` (NOT developer's `~/.claude/`). This is configured via `settingSources: ['project']` in the Agent SDK options.

To add skills, plugins, or change permissions, edit `.claude/settings.json` — no code changes needed.

### How to add a new AI-powered feature

See `HOW_TO_DEVELOP.md` for the complete guide. TL;DR:
1. Create `/api/ai/<name>/route.ts` — call `query()` with a specialized prompt, stream SSE
2. Create a React component that fetches the API and renders the stream
3. Embed the component in a page

## Development Patterns

### Pattern A: List page with client interactivity
See `src/app/(main)/knowledge/concepts/page.tsx`
1. `"use client"` directive
2. `useState` + `useEffect` for data fetching from API route
3. Loading state (`<Loader2>` spinner), empty state, error state
4. Grid rendering of cards

### Pattern B: Detail page (Server Component)
See `src/app/(main)/knowledge/concepts/[slug]/page.tsx`
1. No `"use client"` — Server Component
2. `generateStaticParams()` for static generation
3. Read data from `@/lib/wiki/reader`
4. `notFound()` if slug doesn't match
5. `params` is a Promise — `await params`

### Pattern C: API route
See `src/app/api/concepts/route.ts`
1. Export `async function GET(request)` or `POST`
2. Call reader functions or Agent SDK
3. Return `NextResponse.json()` or SSE stream

### Pattern D: AI feature (button-triggered)
See `src/components/knowledge/ConceptInsight.tsx`
1. Client component with button + loading/result/error states
2. `fetch("/api/ai/xxx", { method: "POST" })`
3. Read SSE stream, update UI progressively
4. Display tool calls with `ToolCallCard` component

### Pattern E: Presentational card
See `src/components/knowledge/ConceptCard.tsx`
1. Receive typed props (no data fetching inside)
2. Use shadcn `<Card>` components
3. Wrap in `<Link>` if navigating to detail page

## Type System

`src/types/index.ts`:
- `Concept` — concept card (id, name, aliases, chineseEquivalent, description, relatedConcepts, linkedPapers)
- `Literature` — paper with tier (`"Core" | "Important" | "Relevant" | "Peripheral"`)
- `ConceptDetail` — enriched concept with papers, timeline, controversies
- `ChatMessage` — AI companion message format

## Wiki Data Reference

### Path Configuration

| Environment | Path | Set via |
|-------------|------|---------|
| Local dev | `../wiki-data/` (auto-detected) | `src/lib/wiki/config.ts` |
| Server | `/mnt/Data2/km/wiki/` | `WIKI_DATA_PATH` env var |

### Key Data Files

| File | Content | Used by |
|------|---------|---------|
| `index.json` | 269 concepts with frequency, aliases, definitions | Reader fallback |
| `concepts/*.md` | 21 curated concept cards | `getConcepts()`, `getConceptDetail()` |
| `index.md` | 150 papers with tier, title, year, concepts | `getLiterature()` |
| `document_importance.json` | 36 paper scores (partial, April 18 build) | Literature enrichment |
| `.links/concept_index.json` | Concept-to-document mapping | `getConcepts()` |
| `.links/relationship_graph.json` | Document-to-document relationships | Future: knowledge graph |

### Reader Functions (`src/lib/wiki/reader.ts`)

```typescript
getConcepts()                    // → Concept[]          (21 curated concepts)
getConceptBySlug(slug)           // → Concept | null
getConceptDetail(slug)           // → ConceptDetail | null (papers, timeline, controversies)
getLiterature(tier?)             // → Literature[]       (150 papers, optional filter)
getLiteratureById(id)            // → Literature | null
getWikiStats()                   // → { conceptCount, literatureCount, coreCount, ... }
```

## Phase 1 Remaining Tasks (for Team Members)

### 1. Literature Detail Page
**Route**: `/knowledge/literature/[slug]/page.tsx`
**Pattern**: Follow Pattern B (Concept Detail Page as template)
**Data**: Use `getLiteratureById(id)` from reader.ts, enrich with concept_rel.json relationships

### 2. Knowledge Graph Visualization
**Route**: `/knowledge/graph/page.tsx`
**Library**: `cytoscape` and `react-cytoscapejs` already installed
**Data**: Use `getConcepts()` and `getLiterature()` to build nodes/edges
**Approach**: Concepts as nodes, shared papers as edges, color-code by tier

### 3. Database Setup (PostgreSQL + pgvector)
**Files**: New `src/lib/db/` directory with Drizzle schema
**Approach**: Install `drizzle-orm`, `drizzle-kit`, `pg`, define schema, write import script from wiki-data

### 4. Semantic Search
**Route**: `GET /api/search?q=...`
**Approach**: Embed query, cosine similarity in pgvector, ranked results UI

## Environment Variables

```
ANTHROPIC_API_KEY=sk-...         # API key (required)
ANTHROPIC_BASE_URL=https://...   # Optional: custom endpoint
ANTHROPIC_MODEL=model-name       # Optional: model override
WIKI_DATA_PATH=/path/to/wiki     # Server deployment only
```

## Key Reference Documents

- `HOW_TO_DEVELOP.md` — Complete guide for building AI features with Agent SDK
- `PLAN.md` — Original product blueprint and phase roadmap
- `.claude/settings.json` — Claude Code project configuration (permissions, skills, plugins)
