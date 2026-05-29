"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Search, X, ZoomIn, ZoomOut, Maximize2, RotateCcw,
  Network, Loader2, Globe, Target, FileText, Lightbulb,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: "concept" | "paper";
  tier?: string;
  year?: number;
  paperCount?: number;
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

interface SearchResult {
  node: GraphNode;
  matchedFields: string[];
  snippet: string;
  score: number;
}

type SearchFilter = "all" | "concept" | "paper";

// ─── Constants ─────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  Core: "#dc2626", Important: "#ea580c", Relevant: "#ca8a04", Peripheral: "#6b7280",
};

const TIER_BG: Record<string, string> = {
  Core: "bg-red-50 text-red-700 border-red-200",
  Important: "bg-orange-50 text-orange-700 border-orange-200",
  Relevant: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Peripheral: "bg-gray-50 text-gray-700 border-gray-200",
};

const FIELD_LABELS: Record<string, string> = {
  label: "名称",
  description: "描述",
  aliases: "别名",
  chineseEquivalent: "中文",
  authors: "作者",
  concepts: "概念",
};

// ─── Helpers ───────────────────────────────────────────────

function getEdgeClass(type: string): string {
  if (type === "related_concept") return "related_concept";
  if (type === "mentions") return "mentions";
  return "paper_paper";
}

function buildElements(data: GraphData): Array<{ data: any; classes?: string }> {
  const el: Array<{ data: any; classes?: string }> = [];
  for (const n of data.nodes) el.push({ data: n.data, classes: n.data.type });
  for (const e of data.edges) el.push({ data: e.data, classes: getEdgeClass(e.data.type) });
  return el;
}

function makeSnippet(text: string, keywords: string[], maxLen = 55): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  let bestPos = -1, bestScore = -1;
  for (const kw of keywords) {
    const pos = lower.indexOf(kw);
    if (pos !== -1) {
      const score = keywords.filter((k) => lower.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        bestPos = pos;
      }
    }
  }
  if (bestPos === -1) return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
  const start = Math.max(0, bestPos - 18);
  const end = Math.min(text.length, bestPos + maxLen);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}

function highlightText(text: string, keywords: string[]): React.ReactNode {
  if (!keywords.length) return text;
  const pattern = keywords
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter(Boolean)
    .join("|");
  if (!pattern) return text;
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  return parts.map((part, i) =>
    keywords.some((k) => part.toLowerCase() === k.toLowerCase()) ? (
      <mark key={i} className="bg-yellow-200 rounded px-0.5 text-inherit">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function performSearch(
  query: string,
  filter: SearchFilter,
  data: GraphData
): SearchResult[] {
  const raw = query.trim();
  if (!raw) return [];
  const keywords = raw.toLowerCase().split(/\s+/).filter(Boolean);
  if (!keywords.length) return [];

  const results: SearchResult[] = [];

  for (const n of data.nodes) {
    const node = n.data;
    if (filter !== "all" && node.type !== filter) continue;

    const fields: Record<string, string> = {
      label: node.label,
      description: node.description || "",
      aliases: (node.aliases || []).join(" "),
      chineseEquivalent: node.chineseEquivalent || "",
      authors: (node.authors || []).join(" "),
      concepts: (node.concepts || []).join(" "),
    };

    // AND logic: each keyword must match at least one field
    const kwMatchedFields: Record<string, string[]> = {};
    let allMatch = true;
    for (const kw of keywords) {
      const fList: string[] = [];
      for (const [fn, text] of Object.entries(fields)) {
        if (text.toLowerCase().includes(kw)) fList.push(fn);
      }
      if (!fList.length) {
        allMatch = false;
        break;
      }
      kwMatchedFields[kw] = fList;
    }
    if (!allMatch) continue;

    const matchedFields = Array.from(new Set(Object.values(kwMatchedFields).flat()));

    // Pick best snippet
    let bestSnippet = "",
      bestScore = -1;
    for (const [fn, text] of Object.entries(fields)) {
      if (!matchedFields.includes(fn)) continue;
      const snippet = makeSnippet(text, keywords);
      const score =
        matchedFields.length * 100 +
        (fn === "label" ? 50 : 0) +
        (fn === "description" ? 20 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestSnippet = snippet;
      }
    }

    results.push({
      node,
      matchedFields,
      snippet: bestSnippet || node.label,
      score:
        matchedFields.length * 100 +
        (node.type === "concept" ? 50 : 0) +
        (matchedFields.includes("label") ? 30 : 0),
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

const COSE_CONFIG = {
  name: "cose",
  padding: 30,
  animate: true,
  animationDuration: 1000,
  nodeRepulsion: 15000,
  idealEdgeLength: 120,
  edgeElasticity: 100,
  nestingFactor: 1.5,
  gravity: 1.8,
  numIter: 2000,
  initialTemp: 300,
  coolingFactor: 0.95,
  minTemp: 1.0,
};

// ─── Component ─────────────────────────────────────────────

export default function KnowledgeGraph() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [search, setSearch] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [layouting, setLayouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<string[]>(["Core", "Important", "Relevant"]);

  const searchKeywords = useMemo(() => {
    return search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  }, [search]);

  // ── Fetch data ──
  useEffect(() => {
    setLoading(true);
    fetch(`/api/graph?tier=${encodeURIComponent(tiers.join(","))}`)
      .then((r) => r.json())
      .then((d: GraphData) => {
        setGraphData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "加载失败");
        setLoading(false);
      });
  }, [tiers]);

  // ── Init cytoscape ──
  useEffect(() => {
    if (!containerRef.current || !graphData) return;
    if (cyRef.current) return;

    let destroyed = false;

    const initCy = async () => {
      const cytoscape = (await import("cytoscape")).default;
      if (destroyed) return;

      const cy = cytoscape({
        container: containerRef.current,
        elements: [],
        style: [
          {
            selector: "node.concept",
            style: {
              "background-color": "#3b82f6",
              "background-opacity": 0.9,
              "border-color": "#1e40af",
              "border-width": 2.5,
              width: "mapData(paperCount, 1, 30, 40, 70)",
              height: "mapData(paperCount, 1, 30, 40, 70)",
              label: "data(label)",
              "font-size": "13px",
              "font-weight": "bold",
              color: "#1e293b",
              "text-background-color": "rgba(255,255,255,0.95)",
              "text-background-opacity": 1,
              "text-background-padding": "4px 8px",
              "text-background-shape": "roundrectangle",
              "text-valign": "bottom",
              "text-margin-y": 10,
              "text-wrap": "wrap",
              "text-max-width": "120px",
            } as any,
          },
          {
            selector: "node.paper",
            style: {
              "background-color": (ele: any) =>
                TIER_COLORS[ele.data("tier")] || "#9ca3af",
              "border-color": "#fff",
              "border-width": 1.5,
              width: 6,
              height: 6,
              label: "data(label)",
              "font-size": "9px",
              color: "#374151",
              "text-opacity": 0,
              "text-background-color": "rgba(255,255,255,0.9)",
              "text-background-opacity": 1,
              "text-background-padding": "2px 5px",
              "text-background-shape": "roundrectangle",
              "text-valign": "bottom",
              "text-margin-y": 5,
            } as any,
          },
          {
            selector: "node.paper.hover",
            style: {
              width: 12,
              height: 12,
              "border-width": 2,
              "text-opacity": 1,
              "z-index": 100,
            } as any,
          },
          {
            selector: "node.paper:selected",
            style: {
              width: 12,
              height: 12,
              "text-opacity": 1,
              "z-index": 100,
            } as any,
          },
          {
            selector: "edge",
            style: { "curve-style": "bezier", "target-arrow-shape": "none" },
          },
          {
            selector: "edge.related_concept",
            style: {
              "line-color": "#94a3b8",
              "line-style": "dashed",
              width: 1.5,
              opacity: 0.4,
            },
          },
          {
            selector: "edge.mentions",
            style: { "line-color": "#bfdbfe", width: 0.6, opacity: 0.2 },
          },
          {
            selector: "edge.paper_paper",
            style: { "line-color": "#fde68a", width: 0.5, opacity: 0.12 },
          },
          {
            selector: ":selected",
            style: { "border-width": 3, "border-color": "#f59e0b" } as any,
          },
          {
            selector: ".search-match",
            style: {
              "overlay-padding": 10,
              "overlay-color": "#3b82f6",
              "overlay-opacity": 0.35,
            } as any,
          },
          {
            selector: ".search-dimmed",
            style: { opacity: 0.18 },
          },
          {
            selector: ".dimmed",
            style: { opacity: 0.06 },
          },
          {
            selector: ".highlighted",
            style: { opacity: 1, "z-index": 100 },
          },
        ],
        minZoom: 0.05,
        maxZoom: 8,
        wheelSensitivity: 3.0,
      });

      cyRef.current = cy;

      // Click to select
      cy.on("tap", "node", (evt: any) => {
        const data = evt.target.data() as GraphNode;
        setSelectedNode(data);
        setSearch("");
        setSearchResults([]);
        cy.nodes().removeClass("search-match search-dimmed");
        cy.elements().removeClass("dimmed highlighted");
      });

      // Double-click to spotlight
      cy.on("dbltap", "node", (evt: any) => {
        const node = evt.target;
        const data = node.data() as GraphNode;
        setSelectedNode(data);
        setSearch("");
        setSearchResults([]);
        cy.nodes().removeClass("search-match search-dimmed");

        const neighborhood = node.neighborhood().add(node);
        cy.elements().addClass("dimmed");
        neighborhood.removeClass("dimmed").addClass("highlighted");

        cy.animate({
          fit: { eles: neighborhood, padding: 60 },
          duration: 400,
          easing: "ease-in-out-cubic",
        });
      });

      // Click background to clear
      cy.on("tap", (evt: any) => {
        if (evt.target === cy) {
          setSelectedNode(null);
          setSearch("");
          setSearchResults([]);
          cy.nodes().removeClass("search-match search-dimmed");
          cy.elements().removeClass("dimmed highlighted");
        }
      });

      // Hover tooltip
      cy.on("mouseover", "node", (evt: any) => {
        const node = evt.target;
        const e = evt.originalEvent;
        node.addClass("hover");
        setHoveredNode(node.data());
        setTooltipPos({ x: e.clientX + 12, y: e.clientY - 12 });
      });

      cy.on("mouseout", "node", (evt: any) => {
        evt.target.removeClass("hover");
        setHoveredNode(null);
      });

      cy.on("layoutstart", () => setLayouting(true));
      cy.on("layoutstop", () => {
        setLayouting(false);
        cy.fit(undefined, 40);
      });

      const elements = buildElements(graphData);
      cy.add(elements);
      cy.layout(COSE_CONFIG).run();
    };

    initCy();

    return () => {
      destroyed = true;
      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch {}
        cyRef.current = null;
      }
    };
  }, [graphData]);

  // ── Search engine ──
  useEffect(() => {
    if (!graphData) return;
    const results = performSearch(search, searchFilter, graphData);
    setSearchResults(results);

    if (!cyRef.current) return;
    const cy = cyRef.current;

    // Clear previous search styles
    cy.nodes().removeClass("search-match search-dimmed");
    cy.elements().removeClass("dimmed highlighted");

    if (!search.trim()) return;

    // Apply search-match (overlay glow) to matched nodes, search-dimmed to others
    const matchedIds = new Set(results.map((r) => r.node.id));
    cy.nodes().forEach((ele: any) => {
      if (matchedIds.has(ele.data("id"))) {
        ele.addClass("search-match");
      } else {
        ele.addClass("search-dimmed");
      }
    });
  }, [search, searchFilter, graphData]);

  // ── Resize ──
  useEffect(() => {
    if (!wrapperRef.current || !cyRef.current) return;
    const ro = new ResizeObserver(() => cyRef.current?.resize());
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Controls ──
  const zoomIn = useCallback(() => {
    cyRef.current?.zoom(cyRef.current.zoom() * 1.8);
  }, []);
  const zoomOut = useCallback(() => {
    cyRef.current?.zoom(cyRef.current.zoom() / 1.8);
  }, []);
  const fit = useCallback(() => {
    cyRef.current?.fit(undefined, 40);
  }, []);
  const relayout = useCallback(() => {
    cyRef.current?.layout(COSE_CONFIG).run();
  }, []);

  const focusOnNode = useCallback((nodeId: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(nodeId);
    if (!node || node.length === 0) return;

    const neighborhood = node.neighborhood().add(node);
    cy.nodes().removeClass("search-match search-dimmed");
    cy.elements().addClass("dimmed");
    neighborhood.removeClass("dimmed").addClass("highlighted");

    cy.animate({
      fit: { eles: neighborhood, padding: 60 },
      duration: 400,
      easing: "ease-in-out-cubic",
    });
  }, []);

  const clearSearch = () => {
    setSearch("");
    setSearchResults([]);
    if (cyRef.current) {
      cyRef.current.nodes().removeClass("search-match search-dimmed");
      cyRef.current.elements().removeClass("dimmed highlighted");
    }
  };

  const toggleTier = (t: string) => {
    setTiers((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  };

  const showSearchPanel = searchResults.length > 0;
  const showDetailPanel = selectedNode && !showSearchPanel;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b bg-background px-4 py-2.5 flex items-center gap-3 z-10">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">知识图谱</span>
        </div>
        {graphData && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {graphData.stats.conceptCount} 概念 · {graphData.stats.paperCount} 文献
            · {graphData.stats.edgeCount} 关系
          </span>
        )}
        <div className="flex-1" />
        <div className="hidden md:flex items-center gap-1">
          {["Core", "Important", "Relevant", "Peripheral"].map((t) => (
            <button
              key={t}
              onClick={() => toggleTier(t)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border transition-opacity",
                tiers.includes(t)
                  ? TIER_BG[t]
                  : "opacity-30 hover:opacity-60 border-transparent"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas + overlays */}
      <div ref={wrapperRef} className="flex-1 relative bg-slate-50">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-50">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">正在构建知识图谱...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-50">
            <div className="text-center text-destructive">
              <p className="font-medium">加载失败</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Layout computing overlay */}
        {layouting && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-white/90 backdrop-blur rounded-lg px-4 py-2 shadow-sm flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在计算布局...
            </div>
          </div>
        )}

        {/* Search box */}
        {!loading && !error && (
          <div className="absolute top-4 right-4 z-10 w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索名称、描述、作者..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10 bg-white/90 backdrop-blur shadow-sm h-9 text-sm"
              />
              {search && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Zoom controls */}
        {!loading && !error && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/90 backdrop-blur shadow-sm h-8 w-8"
              onClick={zoomIn}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/90 backdrop-blur shadow-sm h-8 w-8"
              onClick={zoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/90 backdrop-blur shadow-sm h-8 w-8"
              onClick={fit}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            {selectedNode && (
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 backdrop-blur shadow-sm h-8 w-8 text-primary"
                onClick={() => focusOnNode(selectedNode.id)}
                title="聚焦到选中节点"
              >
                <Target className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/90 backdrop-blur shadow-sm h-8 w-8"
              onClick={relayout}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Legend */}
        {!loading && !error && (
          <div className="absolute bottom-4 right-4 z-10">
            <Card className="bg-white/90 backdrop-blur shadow-sm w-44">
              <CardHeader className="py-2.5 pb-1.5">
                <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
                  <Globe className="h-3 w-3" /> 图例
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-2.5 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600" />
                  <span>概念节点</span>
                </div>
                {Object.entries(TIER_COLORS).map(([tier, color]) => (
                  <div key={tier} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full border border-gray-500"
                      style={{ backgroundColor: color }}
                    />
                    <span>{tier}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-border space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-px border-t border-dashed border-slate-400" />
                    <span>概念关联</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-px border-t border-blue-200" />
                    <span>概念-文献</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-px border-t border-amber-200" />
                    <span>文献关联</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tooltip */}
        {hoveredNode && (
          <div
            className="fixed z-50 bg-white shadow-lg rounded-lg p-3 text-sm pointer-events-none border"
            style={{ left: tooltipPos.x, top: tooltipPos.y, maxWidth: 300 }}
          >
            <p className="font-medium text-foreground mb-1">{hoveredNode.label}</p>
            {hoveredNode.type === "concept" ? (
              <>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 mb-1"
                >
                  概念
                </Badge>
                {hoveredNode.paperCount !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    关联文献 {hoveredNode.paperCount} 篇
                  </p>
                )}
                {hoveredNode.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {hoveredNode.description}
                  </p>
                )}
              </>
            ) : (
              <>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] mb-1", TIER_BG[hoveredNode.tier || ""])}
                >
                  {hoveredNode.tier}
                </Badge>
                {hoveredNode.year && (
                  <span className="text-xs text-muted-foreground ml-1">{hoveredNode.year}</span>
                )}
                {hoveredNode.authors && hoveredNode.authors.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {hoveredNode.authors.join(", ")}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Search Results Panel ─── */}
        {showSearchPanel && (
          <div className="absolute top-14 right-4 z-20 w-80 max-h-[calc(100%-5rem)] flex flex-col">
            <Card className="bg-white/95 backdrop-blur shadow-lg flex flex-col max-h-full">
              <CardHeader className="pb-2 pt-3 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <Search className="h-3 w-3" />
                    搜索结果
                    <span className="text-muted-foreground font-normal">({searchResults.length})</span>
                  </CardTitle>
                  <button
                    onClick={clearSearch}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {([
                    { key: "all", label: "全部" },
                    { key: "concept", label: "概念" },
                    { key: "paper", label: "文献" },
                  ] as { key: SearchFilter; label: string }[]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSearchFilter(key)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                        searchFilter === key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3 overflow-y-auto">
                <div className="space-y-1.5">
                  {searchResults.map((result, idx) => (
                    <button
                      key={result.node.id + idx}
                      onClick={() => {
                        setSelectedNode(result.node);
                        focusOnNode(result.node.id);
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">
                          {result.node.type === "concept" ? (
                            <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" style={{ color: TIER_COLORS[result.node.tier || ""] || "#9ca3af" }} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">
                            {highlightText(result.node.label, searchKeywords)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.matchedFields.slice(0, 3).map((f) => (
                              <span
                                key={f}
                                className="text-[10px] px-1 py-0 rounded bg-slate-100 text-slate-600"
                              >
                                {FIELD_LABELS[f] || f}
                              </span>
                            ))}
                          </div>
                          {result.snippet && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                              {highlightText(result.snippet, searchKeywords)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Detail Panel ─── */}
        {showDetailPanel && (
          <div className="absolute top-14 right-4 z-20 w-72">
            <Card className="bg-white/95 backdrop-blur shadow-lg">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight">
                    {selectedNode.label}
                  </CardTitle>
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      cyRef.current?.nodes().removeClass("search-match search-dimmed");
                      cyRef.current?.elements().removeClass("dimmed highlighted");
                    }}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {selectedNode.type === "concept" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                    >
                      概念
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", TIER_BG[selectedNode.tier || ""])}
                    >
                      {selectedNode.tier}
                    </Badge>
                  )}
                  {selectedNode.year && (
                    <span className="text-[10px] text-muted-foreground">{selectedNode.year}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-xs space-y-3 pb-4">
                {selectedNode.description && (
                  <p className="text-muted-foreground leading-relaxed">{selectedNode.description}</p>
                )}
                {selectedNode.aliases && selectedNode.aliases.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">别名</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.aliases.map((a) => (
                        <Badge key={a} variant="secondary" className="text-[10px]">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedNode.authors && selectedNode.authors.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">作者</p>
                    <p className="text-muted-foreground">{selectedNode.authors.join(", ")}</p>
                  </div>
                )}
                {selectedNode.abstract && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">摘要</p>
                    <p className="text-muted-foreground line-clamp-4">{selectedNode.abstract}</p>
                  </div>
                )}
                {selectedNode.paperCount !== undefined && (
                  <p className="text-muted-foreground">
                    关联文献 {selectedNode.paperCount} 篇
                  </p>
                )}
                {selectedNode.concepts && selectedNode.concepts.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">相关概念</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.concepts.map((c) => (
                        <Badge key={c} variant="secondary" className="text-[10px]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-1 text-xs"
                  onClick={() => focusOnNode(selectedNode.id)}
                >
                  <Target className="h-3 w-3 mr-1.5" /> 聚焦到节点
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
