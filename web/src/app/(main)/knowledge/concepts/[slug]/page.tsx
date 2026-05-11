import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getConceptDetail, getConcepts } from "@/lib/wiki/reader";
import { ArrowLeft, BookOpen, Calendar, Hash, Users } from "lucide-react";
import ConceptInsight from "@/components/knowledge/ConceptInsight";

// For static generation — list all concept slugs
export function generateStaticParams() {
  return getConcepts().map((c) => ({ slug: c.id }));
}

export default async function ConceptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concept = getConceptDetail(slug);
  if (!concept) notFound();

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Breadcrumb */}
      <Link
        href="/knowledge/concepts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回概念列表
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-3">
          <h1 className="text-2xl font-bold tracking-tight">{concept.name}</h1>
          {concept.chineseEquivalent && (
            <Badge variant="secondary" className="text-sm mt-1">
              {concept.chineseEquivalent}
            </Badge>
          )}
        </div>

        {concept.aliases.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {concept.aliases.map((a) => (
              <Badge key={a} variant="outline" className="text-xs">
                {a}
              </Badge>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {concept.frequency !== undefined && (
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              文献中提及 {concept.frequency} 次
            </span>
          )}
          {concept.firstSeen && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              首次出现: {concept.firstSeen}
            </span>
          )}
          {concept.lastUpdated && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              更新于: {concept.lastUpdated}
            </span>
          )}
        </div>
      </div>

      {/* AI Insight */}
      <div className="mb-8">
        <ConceptInsight conceptSlug={slug} conceptName={concept.name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Definition */}
          {concept.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">定义</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {concept.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Linked Papers */}
          {concept.papers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  相关论文 ({concept.papers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {concept.papers.map((paper, i) => (
                  <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                    <h4 className="font-medium text-sm mb-1">
                      {paper.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-1">
                      {paper.year}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {paper.tldr}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {concept.timeline.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">发展时间线</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 border-l-2 border-muted">
                  {concept.timeline.map((entry) => (
                    <div key={entry.year} className="mb-4 last:mb-0 relative">
                      <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-primary mt-1" />
                      <span className="text-sm font-semibold">{entry.year}</span>
                      <ul className="mt-1 space-y-1">
                        {entry.items.map((item) => (
                          <li key={item.filename} className="text-xs text-muted-foreground">
                            {item.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controversies */}
          {concept.controversies.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">争议与对比</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {concept.controversies.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{c.left.title}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-medium">{c.right.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      — {c.reason}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — Related Concepts */}
        <div className="space-y-6">
          {concept.relatedConcepts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  相关概念
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {concept.relatedConcepts.map((rc) => {
                    const conceptSlug = rc
                      .toLowerCase()
                      .replace(/[^a-z0-9一-鿿]+/g, "-")
                      .replace(/^-|-$/g, "");
                    const exists = getConcepts().some((c) => c.id === conceptSlug);
                    return exists ? (
                      <Link key={rc} href={`/knowledge/concepts/${conceptSlug}`}>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {rc}
                        </Badge>
                      </Link>
                    ) : (
                      <Badge key={rc} variant="outline" className="text-xs">
                        {rc}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {concept.linkedPapers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  关联文献 ({concept.linkedPapers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  该概念在 {concept.linkedPapers.length} 篇文献中被提及。
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
