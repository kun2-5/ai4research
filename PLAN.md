# AI4Research Platform — Implementation Plan

## Product Vision
Build an AI-native research operating system (ResearchOS) that empowers scientists across all
disciplines to discover knowledge, design experiments, analyze data, write papers, and collaborate
— all in one unified environment powered by AI.

## Technical Decision: Independent Development (Not Forking CloudCLI UI)

**Rationale:**
- CloudCLI UI is AGPL-3.0 licensed. Forking it would require open-sourcing all modifications
- Independent development gives us full control over licensing (MIT/Apache recommended)
- We can adopt a more modern architecture (Next.js App Router, Server Components)
- Codebase will be purpose-built for research workflows, not adapted from a CLI wrapper

**Reference Value of CloudCLI UI:** We study its architecture patterns (WebSocket communication,
component organization, session management) but do not copy code.

---

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 15 (App Router) | Full-stack React, SSR/SSG, API routes, best DX |
| Language | TypeScript | Type safety across frontend and backend |
| Styling | Tailwind CSS 4 | Utility-first, rapid UI development |
| Components | shadcn/ui | High-quality, accessible, customizable components |
| Database | PostgreSQL + Drizzle ORM | Reliable, scalable, type-safe queries |
| Vector DB | pgvector (PostgreSQL extension) | Semantic search over documents |
| Graph | Cytoscape.js (frontend) | Interactive knowledge graph visualization |
| AI | Claude API (Anthropic SDK) | Best reasoning for research tasks |
| Real-time | Server-Sent Events (SSE) | Streaming AI responses, simpler than WebSocket for MVP |
| Auth | NextAuth.js | Flexible authentication (OAuth, credentials) |
| State | Zustand | Lightweight global state management |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 15 App                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Knowledge  │  │  Insight   │  │  Scholar   │  │  Nexus    │  │
│  │   Space    │  │  Engine    │  │  Studio    │  │ (future)  │  │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              AI Companion Panel (Persistent)               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
│  ├── /api/knowledge/*    (wiki import, concept CRUD)            │
│  ├── /api/ai/*           (Claude streaming, research tasks)     │
│  ├── /api/search/*       (full-text + semantic search)          │
│  └── /api/graph/*        (knowledge graph queries)              │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PostgreSQL  │  │   pgvector   │  │   File Storage       │   │
│  │  (relations) │  │  (embeddings)│  │   (PDFs, datasets)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase Roadmap

### Phase 0: Foundation (Week 1)
- [x] Initialize git repository
- [ ] Scaffold Next.js 15 project with all dependencies
- [ ] Set up project folder structure (five subsystems)
- [ ] Configure Tailwind + shadcn/ui
- [ ] Set up database schema (Drizzle migrations)
- [ ] Create base layout and navigation shell

### Phase 1: MVP — Knowledge Space (Weeks 2-4)
**Goal: Turn the existing wiki into an interactive web platform**

- [ ] Build wiki import pipeline (read /mnt/Data2/km/wiki files)
- [ ] Parse index.json, concept_rel.json, document_importance.json
- [ ] Ingest concept cards (Markdown → database)
- [ ] Generate embeddings for semantic search (pgvector)
- [ ] **UI — Concept Browser**: Grid/list view of all 21 concepts with bilingual display
- [ ] **UI — Literature Browser**: Filter by tier (Core/Important/Relevant/Peripheral)
- [ ] **UI — Concept Detail**: Individual concept page with related concepts, linked papers
- [ ] **UI — Knowledge Graph**: Interactive visualization (Cytoscape.js) showing concept relationships
- [ ] **AI — RAG Q&A**: Chat interface that answers questions using the wiki as knowledge base

### Phase 2: Insight Engine (Weeks 5-8)
**Goal: AI actively helps discover research opportunities**

- [ ] Literature gap analysis (identify under-explored concept connections)
- [ ] Cross-domain inspiration matcher
- [ ] arXiv / Semantic Scholar integration for new paper alerts
- [ ] Auto-generated concept evolution timelines
- [ ] Research question suggestion engine

### Phase 3: LabBench + Scholar Studio (Months 3-4)
**Goal: Close the loop from idea → experiment → paper**

- [ ] Jupyter notebook integration (via iframe or Thebe)
- [ ] Experiment tracking (MLflow-style but simpler)
- [ ] Data visualization pipeline
- [ ] AI-assisted paper writing (LaTeX template + AI co-writing)
- [ ] Citation management and auto-formatting

### Phase 4: Nexus Collaboration (Months 5-6)
**Goal: Enable team-based research**

- [ ] Multi-user project spaces
- [ ] Real-time collaborative editing
- [ ] Comment and annotation system
- [ ] Expert matchmaking (based on research interests)
- [ ] Public project showcase pages

---

## MVP Success Criteria (Phase 1)

1. A user can open the web app and see all 21 concept cards from the wiki
2. A user can browse the 150 papers by tier (Core/Important/Relevant/Peripheral)
3. A user can click a concept and see its definition, aliases, related concepts, and linked papers
4. A user can see an interactive graph of concept relationships
5. A user can ask the AI "What is SatMamba?" and get an accurate answer based on the wiki
6. A user can ask "What are the research gaps in remote sensing foundation models?" and get an insightful response

---

## File Structure (Target)

```
ai4research/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Main layout with sidebar
│   │   ├── knowledge/            # Knowledge Space routes
│   │   │   ├── concepts/         # Concept browser
│   │   │   ├── literature/       # Literature browser
│   │   │   └── graph/            # Knowledge graph visualization
│   │   ├── insights/             # Insight Engine (Phase 2)
│   │   ├── lab/                  # LabBench (Phase 3)
│   │   ├── studio/               # Scholar Studio (Phase 3)
│   │   └── nexus/                # Collaboration (Phase 4)
│   ├── api/                      # API routes
│   │   ├── knowledge/
│   │   ├── ai/
│   │   ├── search/
│   │   └── graph/
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Dashboard home
├── components/                   # Shared UI components
│   ├── ui/                       # shadcn/ui components
│   ├── ai-companion/             # AI chat panel
│   ├── knowledge/                # Knowledge Space components
│   ├── layout/                   # Navigation, sidebar, header
│   └── graph/                    # Graph visualization components
├── lib/                          # Utilities and configurations
│   ├── db/                       # Drizzle ORM setup
│   ├── ai/                       # Claude SDK integration
│   ├── embeddings/               # Vector embedding utilities
│   └── wiki/                     # Wiki import pipeline
├── types/                        # TypeScript type definitions
├── public/                       # Static assets
├── scripts/                      # Data import scripts
├── drizzle/                      # Database migrations
├── .env.example                  # Environment variables template
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables (Phase 1)

```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai4research

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Optional: for external APIs (Phase 2+)
SEMANTIC_SCHOLAR_API_KEY=
ARXIV_API_KEY=
```

---

## Notes

- **Wiki Access**: The wiki is at `/mnt/Data2/km/wiki`. We need to resolve read permissions
  for the import pipeline. May need to run import scripts with appropriate privileges or
  request access from the sysadmin.
- ** AGPL Avoidance**: We reference CloudCLI UI's patterns but write all code from scratch.
  No code is copied from the AGPL project.
- **Scalability**: PostgreSQL + pgvector can handle 10K-100K documents easily. If we grow
  beyond that, we can migrate to dedicated vector DB (Pinecone, Weaviate) later.
