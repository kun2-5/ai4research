import fs from "fs";
import path from "path";
import { WIKI_DATA_PATH } from "./config";
import type { Concept, Literature } from "@/types";

// ─── Helpers ──────────────────────────────────────────────

function readJSON(filename: string): unknown {
  const filepath = path.join(WIKI_DATA_PATH, filename);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Parse concept markdown frontmatter ────────────────────

function parseFrontmatter(md: string): Record<string, unknown> | null {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const result: Record<string, unknown> = {};
  for (const line of match[1]!.split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)/);
    if (kv) {
      const key = kv[1]!;
      let value: unknown = kv[2]!.trim();
      // Parse JSON arrays
      if (typeof value === "string" && value.startsWith("[")) {
        try { value = JSON.parse(value); } catch { /* keep as string */ }
      }
      // Unquote strings
      if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }
  return result;
}

// ─── Concepts (driven by concept .md cards) ─────────────────

export function getConcepts(): Concept[] {
  const conceptsDir = path.join(WIKI_DATA_PATH, "concepts");
  if (!fs.existsSync(conceptsDir)) return [];

  const indexData = readJSON("index.json") as Record<string, Record<string, unknown>> | null;
  const conceptIndex = (readJSON(".links/concept_index.json") ?? {}) as Record<string, string[]>;

  // Build a case-insensitive lookup for index.json
  const indexLookup = new Map<string, [string, Record<string, unknown>]>();
  if (indexData) {
    for (const [key, value] of Object.entries(indexData)) {
      indexLookup.set(key.toLowerCase(), [key, value]);
    }
  }

  const files = fs.readdirSync(conceptsDir).filter((f) => f.endsWith(".md"));

  return files
    .map((file) => {
      const conceptName = file.replace(/\.md$/, "");
      const md = fs.readFileSync(path.join(conceptsDir, file), "utf-8");
      const fm = parseFrontmatter(md);

      // Try to find matching entry in index.json (case-insensitive)
      const canonicalName =
        (fm?.concept as string) ?? conceptName;
      const indexEntry = indexLookup.get(canonicalName.toLowerCase());

      const linkedPapers =
        (conceptIndex[canonicalName] ?? conceptIndex[conceptName] ?? [])
          .map((f: string) => f.replace(/\.md$/, ""));

      const aliases = (fm?.aliases as string[]) ?? [];
      const chineseEquivalent = (fm?.chinese as string) ?? undefined;
      const relatedConcepts = (fm?.related_concepts as string[]) ?? [];

      // Description from index.json or markdown
      let description: string | undefined;
      if (indexEntry?.[1]?.definition) {
        description = indexEntry[1].definition as string;
      } else {
        const defMatch = md.match(/##\s*定义\s*\n(?:>.*\n)*>?\s*([\s\S]*?)(?=\n##|$)/);
        if (defMatch) {
          const def = defMatch[1]!.trim();
          if (def && !def.includes("定义待 LLM 综合生成")) {
            description = def.replace(/^>\s*/gm, "").trim();
          }
        }
      }

      return {
        id: slugify(conceptName),
        name: canonicalName,
        aliases,
        chineseEquivalent,
        description,
        relatedConcepts,
        linkedPapers,
      } satisfies Concept;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getConceptBySlug(slug: string): Concept | null {
  return getConcepts().find((c) => c.id === slug) ?? null;
}

// ─── Concept Detail (full data from .md card) ───────────────

interface PaperRef {
  filename: string;
  title: string;
  year: number;
  tldr: string;
}

interface TimelineItem {
  year: number;
  items: Array<{ filename: string; title: string }>;
}

interface Controversy {
  left: { filename: string; title: string };
  right: { filename: string; title: string };
  reason: string;
}

export interface ConceptDetail extends Concept {
  frequency?: number;
  firstSeen?: number;
  lastUpdated?: string;
  papers: PaperRef[];
  timeline: TimelineItem[];
  controversies: Controversy[];
}

export function getConceptDetail(slug: string): ConceptDetail | null {
  const base = getConceptBySlug(slug);
  if (!base) return null;

  const conceptsDir = path.join(WIKI_DATA_PATH, "concepts");
  // Find the .md file matching this concept name
  const files = fs.readdirSync(conceptsDir).filter((f) => f.endsWith(".md"));
  const mdFile = files.find((f) => slugify(f.replace(/\.md$/, "")) === slug);

  if (!mdFile) {
    return { ...base, papers: [], timeline: [], controversies: [] };
  }

  const md = fs.readFileSync(path.join(conceptsDir, mdFile), "utf-8");
  const fm = parseFrontmatter(md);

  // Parse papers
  const papers: PaperRef[] = [];
  const papersSection = md.match(/##\s*相关论文\s*\n([\s\S]*?)(?=\n##|$)/);
  if (papersSection) {
    const paperRe =
      /\[\[([^\]]+)\]\]\s*—\s*\*(.+?)\*\s*\((\d{4})\)\s*\n\s*>\s*([^\n]+)/g;
    let m: RegExpExecArray | null;
    while ((m = paperRe.exec(papersSection[1]!)) !== null) {
      papers.push({
        filename: m[1]!,
        title: m[2]!.trim(),
        year: parseInt(m[3]!, 10),
        tldr: m[4]!.trim(),
      });
    }
  }

  // Parse timeline
  const timeline: TimelineItem[] = [];
  const timelineSection = md.match(/##\s*时间线\s*\n([\s\S]*?)(?=\n##|$)/);
  if (timelineSection) {
    const timeRe =
      /-\s*\*\*(\d{4})\*\*:\s*(.+)/g;
    let m: RegExpExecArray | null;
    while ((m = timeRe.exec(timelineSection[1]!)) !== null) {
      const year = parseInt(m[1]!, 10);
      const itemsStr = m[2]!;
      const items: Array<{ filename: string; title: string }> = [];
      const itemRe = /\[\[([^|]+)\|([^\]]+)\]\]/g;
      let im: RegExpExecArray | null;
      while ((im = itemRe.exec(itemsStr)) !== null) {
        items.push({ filename: im[1]!, title: im[2]!.trim() });
      }
      if (items.length > 0) {
        timeline.push({ year, items });
      }
    }
  }

  // Parse controversies
  const controversies: Controversy[] = [];
  const controSection = md.match(/##\s*争议与对比\s*\n([\s\S]*?)(?=\n##|$)/);
  if (controSection) {
    const controRe =
      /\[\[([^|]+)\|([^\]]+)\]\]\s*vs\s*\[\[([^|]+)\|([^\]]+)\]\]\s*—\s*(.+)/g;
    let m: RegExpExecArray | null;
    while ((m = controRe.exec(controSection[1]!)) !== null) {
      controversies.push({
        left: { filename: m[1]!, title: m[2]!.trim() },
        right: { filename: m[3]!, title: m[4]!.trim() },
        reason: m[5]!.trim(),
      });
    }
  }

  return {
    ...base,
    frequency: fm?.frequency as number | undefined,
    firstSeen: fm?.first_seen as number | undefined,
    lastUpdated: fm?.last_updated as string | undefined,
    papers,
    timeline: timeline.sort((a, b) => a.year - b.year),
    controversies,
  };
}

// ─── Literature (driven by index.md, enriched by importance) ─

interface IndexEntry {
  title: string;
  year: number | null;
  concepts: string[];
}

function parseIndexMd(): Map<string, IndexEntry> {
  const filepath = path.join(WIKI_DATA_PATH, "index.md");
  if (!fs.existsSync(filepath)) return new Map();

  const content = fs.readFileSync(filepath, "utf-8");
  const map = new Map<string, IndexEntry>();

  // Process line by line to avoid \s* crossing newlines
  const re =
    /\[\[([^\]]+)\]\]\s*—\s*\*(.+?)\*\s*\((\d{4})\)\s*—\s*score:\s*[\d.]+\s*(?:—\s*concepts:\s*(.*))?/;

  for (const line of content.split("\n")) {
    const match = line.match(re);
    if (!match) continue;

    const filename = match[1]!.replace(/\.md$/, "");
    const title = match[2]!.trim();
    const year = parseInt(match[3]!, 10);
    const conceptsStr = match[4]?.trim() ?? "";
    const concepts = conceptsStr
      ? conceptsStr.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    map.set(filename, { title, year: isNaN(year) ? null : year, concepts });
  }

  return map;
}

// Extract tier from index.md section headings
function parseIndexMdTiers(): Map<string, string> {
  const filepath = path.join(WIKI_DATA_PATH, "index.md");
  if (!fs.existsSync(filepath)) return new Map();

  const content = fs.readFileSync(filepath, "utf-8");
  const map = new Map<string, string>();

  const sectionRe = /## (Core|Important|Relevant|Peripheral) Documents\n\n([\s\S]*?)(?=\n## |\n## All|$)/g;
  const linkRe = /\[\[([^\]]+)\]\]/g;

  let sectionMatch: RegExpExecArray | null;
  while ((sectionMatch = sectionRe.exec(content)) !== null) {
    const tier = sectionMatch[1]!;
    const section = sectionMatch[2]!;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkRe.exec(section)) !== null) {
      const filename = linkMatch[1]!.replace(/\.md$/, "");
      map.set(filename, tier);
    }
  }

  return map;
}

interface DocImportance {
  overall_score: number;
  tier: string;
  key_contributions?: string[];
  rank: number;
}

export function getLiterature(tierFilter?: string): Literature[] {
  const indexMap = parseIndexMd(); // 150 docs from index.md
  const tierMap = parseIndexMdTiers(); // tier from section heading
  const importanceData = readJSON("document_importance.json") as Record<string, DocImportance> | null;

  let results: Literature[] = [];

  for (const [id, entry] of indexMap) {
    const imp = importanceData?.[id] ?? importanceData?.[`${id}.md`];
    // index.md section headings are the authoritative tier source (April 25 build)
    const tier = tierMap.get(id) ?? imp?.tier ?? "Relevant";
    const tierLabel =
      tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

    results.push({
      id: slugify(id),
      title: entry.title,
      year: entry.year,
      tier: tierLabel as Literature["tier"],
      abstract: undefined,
      concepts: entry.concepts.length > 0 ? entry.concepts : (imp?.key_contributions ?? []),
      path: `${id}.md`,
    });
  }

  if (tierFilter) {
    results = results.filter((r) => r.tier.toLowerCase() === tierFilter.toLowerCase());
  }

  return results.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}

export function getLiteratureById(id: string): Literature | null {
  return getLiterature().find((l) => l.id === id) ?? null;
}

// ─── Stats ────────────────────────────────────────────────

export function getWikiStats() {
  const literature = getLiterature();
  return {
    conceptCount: getConcepts().length,
    literatureCount: literature.length,
    coreCount: literature.filter((l) => l.tier === "Core").length,
    importantCount: literature.filter((l) => l.tier === "Important").length,
    relevantCount: literature.filter((l) => l.tier === "Relevant").length,
    peripheralCount: literature.filter((l) => l.tier === "Peripheral").length,
  };
}
