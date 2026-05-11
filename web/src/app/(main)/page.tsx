import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWikiStats, getLiterature } from "@/lib/wiki/reader";
import {
  BookOpen,
  Lightbulb,
  FlaskConical,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Circle,
  Construction,
  FileText,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

// ─── Module status definitions ──────────────────────────

interface ModuleStatus {
  icon: React.ReactNode;
  name: string;
  route: string;
  status: "done" | "in-progress" | "planned";
  description: string;
  tasks: { label: string; done: boolean }[];
}

function getModuleStatus(): ModuleStatus[] {
  return [
    {
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      name: "知识空间 (Knowledge Space)",
      route: "/knowledge",
      status: "in-progress",
      description: "AI × 地球科学 结构化知识库",
      tasks: [
        { label: "概念列表 + 双语检索", done: true },
        { label: "概念详情页 + AI 洞察", done: true },
        { label: "文献库 + 四级分级过滤", done: true },
        { label: "文献详情页", done: false },
        { label: "知识图谱可视化 (Cytoscape.js)", done: false },
      ],
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      name: "AI Agent 集成",
      route: "",
      status: "in-progress",
      description: "Claude Agent SDK 驱动的智能研究助手",
      tasks: [
        { label: "AI 聊天面板 + 流式 SSE", done: true },
        { label: "Wiki RAG 知识库注入", done: true },
        { label: "Agent SDK 工具调用", done: true },
        { label: "概念研究空白分析", done: true },
        { label: "多轮 Agent 工作流", done: false },
      ],
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-muted-foreground" />,
      name: "洞察引擎 (Insight Engine)",
      route: "/insights",
      status: "planned",
      description: "AI 主动发现研究机会与交叉灵感",
      tasks: [
        { label: "文献空白分析", done: false },
        { label: "跨领域灵感匹配", done: false },
        { label: "arXiv / Semantic Scholar 集成", done: false },
      ],
    },
    {
      icon: <FlaskConical className="h-6 w-6 text-muted-foreground" />,
      name: "实验台 (LabBench)",
      route: "/lab",
      status: "planned",
      description: "代码实验、数据处理、可视化",
      tasks: [
        { label: "Jupyter Notebook 集成", done: false },
        { label: "AI 辅助代码生成", done: false },
        { label: "实验追踪与结果对比", done: false },
      ],
    },
    {
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      name: "Nexus 协作",
      route: "/nexus",
      status: "planned",
      description: "多用户研究协作空间",
      tasks: [
        { label: "项目空间 + 权限", done: false },
        { label: "实时协作编辑", done: false },
        { label: "专家匹配", done: false },
      ],
    },
  ];
}

// ─── Page ───────────────────────────────────────────────

export default function DashboardPage() {
  const stats = getWikiStats();
  const corePapers = getLiterature("Core");
  const modules = getModuleStatus();

  const totalTasks = modules.reduce((s, m) => s + m.tasks.length, 0);
  const doneTasks = modules.reduce(
    (s, m) => s + m.tasks.filter((t) => t.done).length,
    0
  );

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          ResearchOS — AI 原生科研操作系统
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl">
          基于 Claude Agent SDK 构建的下一代研究平台。探索知识、发现洞见、设计实验、撰写论文。
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Phase 1 MVP — 知识空间 + AI Agent</p>
                <p className="text-sm text-muted-foreground">
                  整体进度：{doneTasks}/{totalTasks} 任务完成
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.round((doneTasks / totalTasks) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {Math.round((doneTasks / totalTasks) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Status Grid */}
      <h2 className="text-lg font-semibold mb-4">模块开发状态</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {modules.map((mod) => (
          <Card
            key={mod.name}
            className={mod.status === "planned" ? "opacity-60" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                {mod.icon}
                <Badge
                  variant={
                    mod.status === "done"
                      ? "default"
                      : mod.status === "in-progress"
                        ? "default"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {mod.status === "done"
                    ? "已完成"
                    : mod.status === "in-progress"
                      ? "进行中"
                      : "计划中"}
                </Badge>
              </div>
              <CardTitle className="text-base">
                {mod.route ? (
                  <Link
                    href={mod.route}
                    className="hover:text-primary transition-colors"
                  >
                    {mod.name}
                  </Link>
                ) : (
                  mod.name
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {mod.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {mod.tasks.map((task) => (
                  <li
                    key={task.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    {task.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={
                        task.done ? "" : "text-muted-foreground"
                      }
                    >
                      {task.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Knowledge Base Stats */}
      <h2 className="text-lg font-semibold mb-4">知识库概况</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-2xl">{stats.conceptCount}</CardTitle>
            <CardDescription className="text-xs">核心概念</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-2xl">{stats.literatureCount}</CardTitle>
            <CardDescription className="text-xs">收录文献</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-2xl">{stats.coreCount}</CardTitle>
            <CardDescription className="text-xs">核心文献</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-2xl">{stats.importantCount}</CardTitle>
            <CardDescription className="text-xs">重要贡献</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Developer Quick Start */}
      <h2 className="text-lg font-semibold mb-4">开发者快速入门</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <ExternalLink className="h-5 w-5 text-primary mb-1" />
            <p className="font-medium">1. 克隆仓库</p>
            <p className="text-xs text-muted-foreground">
              git clone + npm install
            </p>
            <p className="text-xs text-muted-foreground">
              同步 wiki-data/ 到本地
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <FileText className="h-5 w-5 text-primary mb-1" />
            <p className="font-medium">2. 阅读开发文档</p>
            <p className="text-xs text-muted-foreground">
              CLAUDE.md — 架构、模式、任务拆分
            </p>
            <Link href="https://github.com/kun2-5/ai4research/blob/main/CLAUDE.md">
              <Button variant="link" size="sm" className="p-0 h-auto">
                在 GitHub 查看 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-sm space-y-2">
            <Construction className="h-5 w-5 text-primary mb-1" />
            <p className="font-medium">3. 认领任务开发</p>
            <p className="text-xs text-muted-foreground">
              5 种开发模式 (Pattern A-E)
            </p>
            <p className="text-xs text-muted-foreground">
              照着概念详情页模板做新功能
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <h2 className="text-lg font-semibold mb-4">快速访问</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        <Link href="/knowledge/concepts">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader className="pb-2">
              <BookOpen className="h-5 w-5 text-primary mb-1" />
              <CardTitle className="text-sm">概念卡片</CardTitle>
              <CardDescription className="text-xs">
                {stats.conceptCount} 个核心概念
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/knowledge/literature">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader className="pb-2">
              <FileText className="h-5 w-5 text-primary mb-1" />
              <CardTitle className="text-sm">文献库</CardTitle>
              <CardDescription className="text-xs">
                {stats.literatureCount} 篇分级文献
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/knowledge/concepts/foundation-model">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader className="pb-2">
              <Sparkles className="h-5 w-5 text-primary mb-1" />
              <CardTitle className="text-sm">AI 洞察演示</CardTitle>
              <CardDescription className="text-xs">
                概念研究空白分析
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="https://github.com/kun2-5/ai4research" target="_blank">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader className="pb-2">
              <ExternalLink className="h-5 w-5 text-primary mb-1" />
              <CardTitle className="text-sm">GitHub</CardTitle>
              <CardDescription className="text-xs">
                源码 + 文档
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Core Literature */}
      <h2 className="text-lg font-semibold mb-4">核心文献 ({corePapers.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {corePapers.map((paper) => (
          <Card key={paper.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{paper.title}</CardTitle>
              <CardDescription className="text-xs">
                {paper.year} · {paper.concepts.slice(0, 5).join(", ")}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
