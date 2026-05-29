import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tierColors, tierLabels } from "@/lib/constants";
import type { Literature } from "@/types";
import { Users, Calendar, FileText } from "lucide-react";

interface LiteratureCardProps {
  paper: Literature;
}

export default function LiteratureCard({ paper }: LiteratureCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow border hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
            {paper.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${tierColors[paper.tier]}`}
          >
            {tierLabels[paper.tier]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {paper.abstract && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {paper.abstract}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {paper.authors && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {paper.authors.join(", ")}
            </span>
          )}
          {paper.year && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {paper.year}
            </span>
          )}
        </div>
        {paper.concepts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {paper.concepts.map((conceptId) => (
              <Badge
                key={conceptId}
                variant="secondary"
                className="text-[10px] cursor-pointer hover:bg-secondary/80"
              >
                {conceptId}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
