import { NextResponse } from "next/server";
import { getConcepts, getLiterature, getConceptDetail } from "@/lib/wiki/reader";
import fs from "fs";
import path from "path";
import { WIKI_DATA_PATH } from "@/lib/wiki/config";

interface GraphNode {
  id: string;
  label: string;
  type: "concept" | "paper";
  tier?: string;
  year?: number;
  paperCount?: number;
  // Extra details for tooltip/panel
  description?: string;
  chineseEquivalent?: string;
  aliases?: string[];
  authors?: string[];
  abstract?: string;
  concepts?: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength?: number;
}

interface GraphData {
  nodes: Array<{ data: GraphNode }>;
  edges: Array<{ data: GraphEdge }>;
  stats: { conceptCount: number; paperCount: number; edgeCount: number };
}

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tierParam = searchParams.get("tier");
  const tiers = tierParam
    ? tierParam.split(",")
    : ["Core", "Important", "Relevant", "Peripheral"];

  const concepts = getConcepts();
  const literature = getLiterature();

  const nodes: GraphData["nodes"] = [];
  const edges: GraphData["edges"] = [];

  // ── Concept nodes with rich details ──
  for (const c of concepts) {
    const detail = getConceptDetail(c.id);
    nodes.push({
      data: {
        id: `c-${c.id}`,
        label: c.chineseEquivalent
          ? `${c.name} (${c.chineseEquivalent})`
          : c.name,
        type: "concept",
        paperCount: c.linkedPapers.length,
        description: c.description,
        chineseEquivalent: c.chineseEquivalent,
        aliases: c.aliases,
        // Also include paper titles from detail
        ...detail?.frequency ? { frequency: detail.frequency } : {},
      },
    });
  }

  // ── Paper nodes (filtered by tier, only connected) ──
  const allowedTiers = new Set(tiers);
  const paperMap = new Map<string, (typeof literature)[0]>();
  const titleToPaper = new Map<string, (typeof literature)[0]>();
  for (const p of literature) {
    paperMap.set(p.id, p);
    titleToPaper.set(p.title.toLowerCase().trim(), p);
    const pathWithoutExt = p.path.replace(/\.md$/, "").toLowerCase().trim();
    titleToPaper.set(pathWithoutExt, p);
  }

  const connectedPaperIds = new Set<string>();

  // ── Concept-Concept edges ──
  for (const c of concepts) {
    for (const relatedName of c.relatedConcepts) {
      const related = concepts.find(
        (rc) =>
          rc.name.toLowerCase() === relatedName.toLowerCase() ||
          rc.chineseEquivalent?.toLowerCase() === relatedName.toLowerCase()
      );
      if (related) {
        const source = `c-${c.id}`;
        const target = `c-${related.id}`;
        const edgeId =
          source < target ? `${source}--${target}` : `${target}--${source}`;
        if (!edges.some((e) => e.data.source + "--" + e.data.target === edgeId)) {
          edges.push({
            data: { source, target, type: "related_concept" },
          });
        }
      }
    }
  }

  // ── Concept-Paper edges ──
  for (const c of concepts) {
    for (const paperPath of c.linkedPapers) {
      const paperId = paperPath.toLowerCase().trim();
      const paper =
        paperMap.get(paperId) ??
        literature.find(
          (p) =>
            p.path.toLowerCase().replace(/\.md$/, "") === paperId ||
            p.title.toLowerCase().trim() === paperId
        );
      if (paper && allowedTiers.has(paper.tier)) {
        connectedPaperIds.add(paper.id);
        edges.push({
          data: {
            source: `c-${c.id}`,
            target: `p-${paper.id}`,
            type: "mentions",
          },
        });
      }
    }
  }

  // ── Paper nodes with rich details ──
  for (const p of literature) {
    if (connectedPaperIds.has(p.id) && allowedTiers.has(p.tier)) {
      nodes.push({
        data: {
          id: `p-${p.id}`,
          label: p.title,
          type: "paper",
          tier: p.tier,
          year: p.year,
          authors: p.authors,
          abstract: p.abstract,
          concepts: p.concepts,
        },
      });
    }
  }

  // ── Paper-Paper edges (filtered) ──
  const relGraph = readJSON(".links/relationship_graph.json") as Record<
    string,
    Array<{
      doc_id: string;
      relation_types: string[];
      shared_concepts: string[];
      strength: number;
      contradiction_flag: boolean;
    }>
  > | null;

  if (relGraph) {
    for (const [sourceKey, relations] of Object.entries(relGraph)) {
      const sourcePaper =
        titleToPaper.get(sourceKey.toLowerCase().trim()) ??
        titleToPaper.get(
          sourceKey.toLowerCase().replace(/\.md$/, "").trim()
        );

      if (
        !sourcePaper ||
        !connectedPaperIds.has(sourcePaper.id) ||
        !allowedTiers.has(sourcePaper.tier)
      )
        continue;

      const topRelations = relations
        .filter((r) => r.strength >= 0.25)
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 3);

      for (const rel of topRelations) {
        const targetPaper =
          titleToPaper.get(rel.doc_id.toLowerCase().trim()) ??
          titleToPaper.get(
            rel.doc_id.toLowerCase().replace(/\.md$/, "").trim()
          );

        if (
          !targetPaper ||
          !connectedPaperIds.has(targetPaper.id) ||
          !allowedTiers.has(targetPaper.tier)
        )
          continue;

        edges.push({
          data: {
            source: `p-${sourcePaper.id}`,
            target: `p-${targetPaper.id}`,
            type: rel.relation_types.join(","),
            strength: rel.strength,
          },
        });
      }
    }
  }

  return NextResponse.json({
    nodes,
    edges,
    stats: {
      conceptCount: nodes.filter((n) => n.data.type === "concept").length,
      paperCount: nodes.filter((n) => n.data.type === "paper").length,
      edgeCount: edges.length,
    },
  });
}
