import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Concept } from "@/types";
import { BookOpen, Network } from "lucide-react";

interface ConceptCardProps {
  concept: Concept;
}

export default function ConceptCard({ concept }: ConceptCardProps) {
  return (
    <Link href={`/knowledge/concepts/${concept.id}`}>
    <Card className="group hover:shadow-md transition-shadow cursor-pointer border hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {concept.name}
          </CardTitle>
          {concept.chineseEquivalent && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {concept.chineseEquivalent}
            </Badge>
          )}
        </div>
        {concept.aliases.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {concept.aliases.join(" · ")}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {concept.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {concept.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Network className="h-3.5 w-3.5" />
            {concept.relatedConcepts.length} 相关概念
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {concept.linkedPapers.length} 篇文献
          </span>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
