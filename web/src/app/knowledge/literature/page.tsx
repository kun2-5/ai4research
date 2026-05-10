"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LiteratureCard from "@/components/knowledge/LiteratureCard";
import { mockLiterature, tierColors, tierLabels } from "@/lib/data/mock";
import type { Literature } from "@/types";
import { Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type TierFilter = Literature["tier"] | "All";

export default function LiteraturePage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("All");

  const filtered = mockLiterature.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.abstract?.toLowerCase().includes(search.toLowerCase()) ||
      p.authors?.some((a) =>
        a.toLowerCase().includes(search.toLowerCase())
      );
    const matchesTier = tierFilter === "All" || p.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const tiers: TierFilter[] = ["All", "Core", "Important", "Relevant", "Peripheral"];

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">文献库</h1>
        </div>
        <p className="text-muted-foreground">
          收录 {mockLiterature.length} 篇文献，按重要性四级分级
        </p>
      </div>

      {/* Tier Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tiers.map((tier) => (
          <Badge
            key={tier}
            variant={tierFilter === tier ? "default" : "outline"}
            className={cn(
              "cursor-pointer text-xs",
              tier !== "All" && tierFilter === tier && tierColors[tier]
            )}
            onClick={() => setTierFilter(tier)}
          >
            {tier === "All" ? "全部" : tierLabels[tier]}
            {tier !== "All" && (
              <span className="ml-1 opacity-70">
                ({mockLiterature.filter((p) => p.tier === tier).length})
              </span>
            )}
          </Badge>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索标题、作者或摘要..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          未找到匹配的文献
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((paper) => (
            <LiteratureCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}
