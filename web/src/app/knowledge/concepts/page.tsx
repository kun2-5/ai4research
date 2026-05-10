"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ConceptCard from "@/components/knowledge/ConceptCard";
import { mockConcepts } from "@/lib/data/mock";
import { Search, BookOpen } from "lucide-react";

export default function ConceptsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockConcepts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.chineseEquivalent?.toLowerCase().includes(q) ||
      c.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">概念卡片</h1>
        </div>
        <p className="text-muted-foreground">
          已抽取 {mockConcepts.length} 个核心概念，支持中英双语检索
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索概念名称、中文或别名..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          未找到匹配的概念
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
        </div>
      )}
    </div>
  );
}
