import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockConcepts, mockLiterature, tierLabels } from "@/lib/data/mock";
import {
  BookOpen,
  Lightbulb,
  FlaskConical,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const corePapers = mockLiterature.filter((p) => p.tier === "Core");
  const conceptCount = mockConcepts.length;
  const paperCount = mockLiterature.length;
  const importantCount = mockLiterature.filter(
    (p) => p.tier === "Important"
  ).length;

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          欢迎回到 ResearchOS
        </h1>
        <p className="text-muted-foreground text-lg">
          你的 AI 原生科研操作系统 — 探索知识，发现洞见，创造未来
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>知识库概念</CardDescription>
            <CardTitle className="text-3xl">{conceptCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              涵盖 AI × 地球科学核心领域
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>收录文献</CardDescription>
            <CardTitle className="text-3xl">{paperCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              分级管理，从核心到边缘
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>核心文献</CardDescription>
            <CardTitle className="text-3xl">{corePapers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              领域奠基性工作
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>重要贡献</CardDescription>
            <CardTitle className="text-3xl">{importantCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              值得深入阅读的研究
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Modules */}
      <h2 className="text-xl font-semibold mb-4">快速访问</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/knowledge/concepts">
          <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <BookOpen className="h-8 w-8 text-primary" />
                <Badge>MVP</Badge>
              </div>
              <CardTitle className="mt-4">知识空间</CardTitle>
              <CardDescription>
                浏览概念卡片、文献库和知识图谱
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                进入 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
              <Badge variant="secondary">Soon</Badge>
            </div>
            <CardTitle className="mt-4">洞察引擎</CardTitle>
            <CardDescription>
              AI 主动发现研究空白和跨领域灵感
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="h-full opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <FlaskConical className="h-8 w-8 text-muted-foreground" />
              <Badge variant="secondary">Soon</Badge>
            </div>
            <CardTitle className="mt-4">实验台</CardTitle>
            <CardDescription>
              代码实验、数据处理和结果可视化
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Core Literature Spotlight */}
      <h2 className="text-xl font-semibold mb-4">核心文献速览</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {corePapers.map((paper) => (
          <Card key={paper.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{paper.title}</CardTitle>
                <Badge className="bg-red-100 text-red-800 border-red-200 shrink-0">
                  {tierLabels[paper.tier]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {paper.abstract}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Companion CTA */}
      <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI 研究伙伴已就绪</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          右侧的 AI 面板已经可以使用。尝试问它关于知识库中任何概念或文献的问题。
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "什么是 ClimaX？",
            "SatMamba 和 ClimaX 有什么区别？",
            "遥感领域有哪些研究空白？",
          ].map((q) => (
            <Badge
              key={q}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {q}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
