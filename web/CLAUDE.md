# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Repository Overview

This is **ResearchOS** — an AI-native research operating system. The `web/` directory contains a Next.js 16 full-stack application.

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
│       ├── page.tsx          # Landing (4 cards)
│       ├── concepts/         # Concept list + detail
│       ├── literature/       # Literature list
│       └── graph/            # Knowledge graph visualization
├── api/                      # API routes (no layout inheritance)
│   ├── ai/
│   │   ├── agent/            # Main chat (SSE)
│   │   ├── insight/          # Concept research gap (SSE)
│   │   └── sessions/         # Chat session management
│   ├── concepts/             # GET wiki concepts
│   ├── literature/           # GET wiki literature
│   ├── graph/                # GET graph nodes/edges
│   └── stats/                # GET wiki statistics
└── claude/                   # Deleted in refactor
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
| `/knowledge/*` | Knowledge Space | ✅ Complete: concepts (21), literature (150), graph |
| `/insights` | Insight Engine | Not implemented |
| `/lab` | LabBench | Not implemented |
| `/studio` | Scholar Studio | Not implemented |
| `/nexus` | Collaboration Network | Not implemented |

## Data Flow

```
wiki-data/ (synced from server /mnt/Data2/km/wiki)
    ↓ src/lib/wiki/reader.ts (fs-based parser, 7 exported functions)
    ├── Server Components (for read-only pages, e.g. concept detail)
    └── API Routes (for client components to fetch)
            ↓ fetch() or SSE
        Client Components (interactive pages with search/filter)
```

**Two patterns for data loading:**
1. **Server Component + direct reader call** — no client interactivity. See `src/app/(main)/knowledge/concepts/[slug]/page.tsx`
2. **Client Component + API fetch** — search/filter/state. See `src/app/(main)/knowledge/literature/page.tsx`

## AI Integration

AI is powered by `@anthropic-ai/claude-agent-sdk` via the `query()` async generator.

### API Routes

| Route | File | Purpose |
|-------|------|---------|
| `POST /api/ai/agent` | `api/ai/agent/route.ts` | Main chat — AICompanion uses this |
| `POST /api/ai/insight` | `api/ai/insight/route.ts` | Concept research gap analysis |
| `GET /api/ai/sessions` | `api/ai/sessions/route.ts` | Chat session management |
| `GET /api/concepts` | `api/concepts/route.ts` | Wiki concepts data |
| `GET /api/literature` | `api/literature/route.ts` | Wiki literature data |
| `GET /api/graph` | `api/graph/route.ts` | Graph nodes/edges data |
| `GET /api/stats` | `api/stats/route.ts` | Wiki statistics |

### Claude Code Configuration

Web Claude Code reads from project-level `.claude/settings.json` (NOT developer's `~/.claude/`). This is configured via `settingSources: ['project']` in the Agent SDK options.

To add skills, plugins, or change permissions, edit `.claude/settings.json` — no code changes needed.

### Claude Code Executable

The bundled Claude binary in node_modules is musl-linked and fails on glibc systems. AI routes use `pathToClaudeCodeExecutable: "/usr/local/bin/claude"` (system binary) instead.

## Development Patterns

### Pattern A: List page with client interactivity
See `src/app/(main)/knowledge/literature/page.tsx`
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
See `src/app/api/graph/route.ts`
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
- `GraphNode` / `GraphEdge` — knowledge graph elements
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
| `document_importance.json` | 36 paper scores | Literature enrichment |
| `.links/concept_index.json` | Concept-to-document mapping | `getConcepts()` |
| `.links/relationship_graph.json` | Document-to-document relationships | Graph edges |

### Reader Functions (`src/lib/wiki/reader.ts`)

```typescript
getConcepts()                    // → Concept[]          (21 curated concepts)
getConceptBySlug(slug)           // → Concept | null
getConceptDetail(slug)           // → ConceptDetail | null (papers, timeline, controversies)
getLiterature(tier?)             // → Literature[]       (150 papers, optional filter)
getLiteratureById(id)            // → Literature | null
getWikiStats()                   // → { conceptCount, literatureCount, coreCount, ... }
```

## Knowledge Graph Design

See `docs/knowledge-graph-design.md` for complete documentation.

**Summary:**
- Single network view (cose layout), no mode switching
- 21 concept nodes (blue, size ∝ paperCount) + ~95 paper nodes (tier-colored, 6px)
- Double-click any node → spotlight (neighbors highlighted, others dimmed)
- Search panel: multi-keyword AND search across 6 fields, results list with keyword highlighting
- Tier filter buttons in header
- Zoom sensitivity: 3.0, button step: 1.8x, range: 0.05x–8x

## Environment Variables

```
ANTHROPIC_API_KEY=sk-...         # API key (required)
ANTHROPIC_BASE_URL=https://...   # Optional: custom endpoint
ANTHROPIC_MODEL=model-name       # Optional: model override
WIKI_DATA_PATH=/path/to/wiki     # Server deployment only
```

## Key Reference Documents

- `docs/knowledge-graph-design.md` — Knowledge graph architecture and design decisions
- `AGENTS.md` — Next.js version differences (breaking changes from training data)
- `.claude/settings.json` — Claude Code project configuration (permissions, skills, plugins)
