import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Network, FileText } from "lucide-react";
import { getWikiStats, getConcepts } from "@/lib/wiki/reader";

export default function KnowledgeSpacePage() {
  const stats = getWikiStats();
  const concepts = getConcepts();

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">知识空间</h1>
        <p className="text-muted-foreground text-lg">
          探索 AI × 地球科学领域的结构化知识网络
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/knowledge/concepts">
          <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>概念卡片</CardTitle>
              <CardDescription>
                浏览 {concepts.length} 个核心概念，查看定义、别名和相关关系
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                浏览概念 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/knowledge/literature">
          <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>文献库</CardTitle>
              <CardDescription>
                按分级浏览 {stats.literatureCount} 篇收录文献，从核心到边缘
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                浏览文献 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full opacity-60">
          <CardHeader>
            <Network className="h-10 w-10 text-muted-foreground mb-2" />
            <CardTitle>知识图谱</CardTitle>
            <CardDescription>
              交互式可视化概念与文献的关系网络（开发中）
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
