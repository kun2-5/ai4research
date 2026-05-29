# ResearchOS

AI-native research operating system. A Next.js full-stack application for managing research knowledge, literature, and AI-powered insights.

## Tech Stack

- **Framework**: Next.js 16.2.6 + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Visualization**: Cytoscape.js 3.33.3 (knowledge graph)
- **AI**: @anthropic-ai/claude-agent-sdk (SSE streaming)
- **Data**: wiki-data (file-based, synced from external wiki repo)

## Quick Start

```bash
cd web
npm install
npm run dev      # localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root: html + body + fonts
│   │   ├── (main)/
│   │   │   ├── layout.tsx          # Three-column: Sidebar + content + AICompanion
│   │   │   ├── page.tsx            # Dashboard
│   │   │   └── knowledge/
│   │   │       ├── page.tsx        # Knowledge Space landing
│   │   │       ├── concepts/
│   │   │       │   ├── page.tsx    # Concept list (client)
│   │   │       │   └── [slug]/     # Concept detail (server)
│   │   │       ├── literature/
│   │   │       │   └── page.tsx    # Literature list (client)
│   │   │       └── graph/
│   │   │           └── page.tsx    # Knowledge graph (client)
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── agent/          # Main chat (SSE)
│   │       │   ├── insight/        # Concept gap analysis (SSE)
│   │       │   └── sessions/       # Chat sessions
│   │       ├── concepts/           # Wiki concepts data
│   │       ├── literature/         # Wiki literature data
│   │       ├── graph/              # Graph nodes/edges data
│   │       └── stats/              # Wiki statistics
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   ├── ai-companion/
│   │   └── knowledge/
│   │       ├── ConceptCard.tsx
│   │       ├── ConceptInsight.tsx
│   │       ├── KnowledgeGraph.tsx   # Interactive cytoscape graph
│   │       └── LiteratureCard.tsx
│   ├── lib/
│   │   ├── wiki/
│   │   │   ├── config.ts            # WIKI_DATA_PATH resolution
│   │   │   └── reader.ts            # 7 exported data functions
│   │   ├── constants.ts             # Tier colors/labels
│   │   └── utils.ts
│   └── types/index.ts
├── docs/
│   └── knowledge-graph-design.md    # Graph architecture doc
├── .claude/
│   └── settings.json                # Claude Code project config
└── CLAUDE.md                        # Dev guide for Claude Code
```

## Module Status

| Route | Module | Status |
|-------|--------|--------|
| `/knowledge/*` | Knowledge Space | ✅ Concepts, Literature, Graph |
| `/insights` | Insight Engine | Not implemented |
| `/lab` | LabBench | Not implemented |
| `/studio` | Scholar Studio | Not implemented |
| `/nexus` | Collaboration Network | Not implemented |

## Data Flow

```
wiki-data/ (synced from server /mnt/Data2/km/wiki)
    ↓ src/lib/wiki/reader.ts (fs-based parser)
    ├── Server Components (read-only pages)
    └── API Routes → fetch() → Client Components
```

## Environment Variables

```
ANTHROPIC_API_KEY=sk-...         # Required
ANTHROPIC_BASE_URL=https://...   # Optional: custom endpoint
ANTHROPIC_MODEL=model-name       # Optional: model override
WIKI_DATA_PATH=/path/to/wiki     # Server deployment only
```

## Adding shadcn/ui Components

```bash
cd web
npx shadcn@latest add <component-name>
```
