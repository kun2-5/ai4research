# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is **ResearchOS** — an AI-native research operating system. The `web/` directory contains a Next.js 15 full-stack application. The project is independent (not forked from the AGPL-licensed `claudecodeui/` reference directory in the repo root).

## Common Commands

All development commands run from the `web/` directory:

```bash
cd web
npm run dev        # Start dev server with Turbopack on localhost:3000
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

### Global Three-Column Layout

The root `layout.tsx` defines a persistent three-column shell that **every page inherits**:

- **Left**: `Sidebar` — collapsible navigation (client component, uses `usePathname` for active states)
- **Center**: `main` — page-specific content
- **Right**: `AICompanion` — chat panel (client component, toggleable)

This means all pages automatically get the sidebar and AI chat. If you need a page without this layout (e.g., a login page), create a route group like `(auth)/` with its own `layout.tsx`.

### Module Structure

| Route | Module | Status |
|-------|--------|--------|
| `/knowledge/*` | Knowledge Space | MVP — concepts, literature, concept detail |
| `/insights` | Insight Engine | Not implemented |
| `/lab` | LabBench | Not implemented |
| `/studio` | Scholar Studio | Not implemented |
| `/nexus` | Collaboration Network | Not implemented |

### Data Flow (Current)

```
wiki-data/ (synced from server /mnt/Data2/km/wiki)
    ↓ src/lib/wiki/reader.ts (fs-based parser)
    ├── Server Components (for read-only pages, e.g., knowledge landing)
    └── API Routes (for client components to fetch)
            ↓ fetch()
        Client Components (interactive pages with search/filter)
```

**Two patterns for data loading**, choose based on the page type:

1. **Server Component + direct reader call** — for pages without client interactivity. See `src/app/knowledge/page.tsx` for the pattern: import `getWikiStats()` / `getConcepts()` directly, no API route needed.

2. **Client Component + API fetch** — for pages with search/filter/state. See `src/app/knowledge/concepts/page.tsx` for the pattern: `useEffect` → `fetch("/api/concepts")`.

### Type System

Shared types in `src/types/index.ts`:
- `Concept` — wiki concept card (id, name, aliases, chineseEquivalent, description, relatedConcepts, linkedPapers)
- `Literatur` — paper entry with four-tier classification (`"Core" | "Important" | "Relevant" | "Peripheral"`)
- `ConceptDetail` — enriched concept with papers, timeline, controversies (from `reader.ts`)
- `ChatMessage` — AI companion message format

---

## Development Patterns (Templates for Team)

### Pattern A: Add a list page with client interactivity

Follow `src/app/knowledge/concepts/page.tsx`:
1. `"use client"` directive
2. `useState` + `useEffect` for data fetching from API route
3. Loading state with `<Loader2>` spinner
4. Empty state with friendly message
5. Grid rendering of cards

### Pattern B: Add a detail page (Server Component)

Follow `src/app/knowledge/concepts/[slug]/page.tsx`:
1. No `"use client"` — stays a Server Component
2. `export function generateStaticParams()` for static generation
3. Read data directly from `@/lib/wiki/reader`
4. `notFound()` if slug doesn't match
5. `params` is a Promise — use `await params`
6. Breadcrumb navigation back to list page

### Pattern C: Add an API route

Follow `src/app/api/concepts/route.ts`:
1. Create `src/app/api/<name>/route.ts`
2. Export `async function GET(request: Request)`
3. Call reader functions from `@/lib/wiki/reader`
4. Return `NextResponse.json(data)`
5. Use `request.url` + `new URL()` to parse query params

### Pattern D: Add a wiki reader function

Follow existing functions in `src/lib/wiki/reader.ts`:
1. Use `WIKI_DATA_PATH` config for path resolution
2. Parse files synchronously (Node.js `fs` module)
3. Return typed data matching `src/types/index.ts`
4. Handle edge cases: missing files, empty data, format variations

### Pattern E: Add a presentational card component

Follow `src/components/knowledge/ConceptCard.tsx`:
1. Receive typed props (no data fetching inside)
2. Use shadcn `<Card>` components
3. Wrap in `<Link>` if it navigates to a detail page
4. Handle optional fields with conditional rendering

---

## Phase 1 Remaining Tasks (for Team Members)

### 1. Literature Detail Page
**Route**: `/knowledge/literature/[slug]/page.tsx`
**Pattern**: Follow Pattern B (Concept Detail Page as template)
**Data**: Use `getLiteratureById(id)` from reader.ts
**Why this is next**: Completes the "list → detail" pattern, mirrors concept detail

### 2. AI Companion — Real API Integration
**Files**: `src/app/api/ai/chat/route.ts`, `src/components/ai-companion/AICompanion.tsx`
**Pattern**: Follow Pattern C for the API route
**Dependencies**: `@anthropic-ai/sdk` (already installed), `ANTHROPIC_API_KEY` env var
**Approach**:
1. Create streaming API route using Anthropic SDK
2. Build system prompt from wiki context (concepts + literature)
3. Replace `setTimeout` mock in AICompanion with real fetch
4. Render streaming response in chat UI

### 3. Knowledge Graph Visualization
**Route**: `/knowledge/graph/page.tsx`
**Library**: Install `cytoscape` and `react-cytoscapejs`
**Data**: Use `getConcepts()` and `getLiterature()` to build nodes/edges
**Approach**:
1. Build graph data: concepts as nodes, shared papers as edges
2. Interactive layout with Cytoscape.js
3. Click node → navigate to detail page
4. Color-code by tier / concept frequency

### 4. Database Setup (PostgreSQL + pgvector)
**Files**: New `src/lib/db/` directory with Drizzle schema
**Approach**:
1. Install `drizzle-orm`, `drizzle-kit`, `pg`
2. Define schema: concepts, literature, concepts_to_literature
3. Write import script: `scripts/import-wiki-to-db.ts`
4. Add API routes that query the database instead of reading files
5. Generate embeddings for semantic search

### 5. Semantic Search
**Route**: `GET /api/search?q=...`
**Approach**:
1. Embed query with embedding model
2. Cosine similarity search in pgvector
3. Return ranked results (concepts + literature)
4. Search UI component in knowledge space

---

## Wiki Data Reference

### File Locations

| Environment | Path | Set via |
|-------------|------|---------|
| Local dev | `../wiki-data/` (auto-detected) | `src/lib/wiki/config.ts` |
| Server | `/mnt/Data2/km/wiki/` | `WIKI_DATA_PATH` env var in `.env.local` |

### Key Data Files

| File | Content | Used by |
|------|---------|---------|
| `index.json` | 269 concepts with frequency, aliases, definitions | Reader fallback |
| `concepts/*.md` | 21 curated concept cards with frontmatter, papers, timeline | `getConcepts()`, `getConceptDetail()` |
| `index.md` | 150 papers with tier, title, year, concepts (April 25 build) | `getLiterature()` |
| `document_importance.json` | 36 paper scores (April 18 build, partial) | Literature enrichment |
| `.links/concept_index.json` | Concept-to-document mapping | `getConcepts()` linked papers |
| `.links/relationship_graph.json` | Document-to-document relationships | Future: knowledge graph |

### Reader Functions

```typescript
getConcepts()                    // → Concept[]          (21 curated concepts)
getConceptBySlug(slug)           // → Concept | null
getConceptDetail(slug)           // → ConceptDetail | null (with papers, timeline)
getLiterature(tier?)             // → Literature[]       (150 papers, optional filter)
getLiteratureById(id)            // → Literature | null
getWikiStats()                   // → { conceptCount, literatureCount, coreCount, ... }
```

---

## AI Integration (Planned)

`@anthropic-ai/sdk` is installed but not yet wired up. The `AICompanion` component in `src/components/ai-companion/AICompanion.tsx` currently simulates responses with `setTimeout`. The planned integration:

1. Create `src/app/api/ai/chat/route.ts` — streaming API route using Anthropic SDK
2. Wire `AICompanion` to call the API route instead of simulating
3. Pass wiki context as system prompt for RAG-style responses
