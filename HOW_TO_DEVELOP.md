# ResearchOS 开发指南：如何利用 Claude Code 构建新功能

## 1. 核心原理

ResearchOS 的 AI 能力基于 `@anthropic-ai/claude-agent-sdk` 的 `query()` 函数。

```
query() 是一个异步生成器（async generator）

  前端按钮 → fetch POST /api/ai/xxx → query({ prompt, options })
                                            ↓
                           Agent 自动循环（最多 maxTurns 轮）:
                           ┌──────────────────────────────────────┐
                           │ 1. 模型决定下一步做什么                  │
                           │ 2. 如果是文字输出 → yield stream_event  │
                           │ 3. 如果需要读文件 → 执行 Read → yield   │
                           │ 4. 如果需要搜索 → 执行 Grep → yield     │
                           │ 5. 重复直到任务完成                     │
                           └──────────────────────────────────────┘
                                            ↓
                           SSE 流式返回前端 → 实时渲染
```

**关键特性：**
- Agent 有完整的工具集：Read、Write、Edit、Bash、Grep、Glob、WebSearch、WebFetch
- Agent 自己决定用什么工具、按什么顺序
- 每一步都实时推给前端，不是黑盒
- 支持 `maxTurns` 限制最大轮次，防止无限循环

## 2. 开发一个新 AI 功能的完整流程

以「文献综述生成」为例，假设我们要在文献详情页加一个按钮，点击后 AI 自动生成该文献的研究综述。

### Step 1: 创建 API Route

文件：`src/app/api/ai/review/route.ts`

```typescript
import { NextRequest } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";

export async function POST(request: NextRequest) {
  const { paperId } = await request.json();

  // 构建 prompt — 这是 AI 收到的指令
  const prompt = `你是一个科研综述助手。请对文献 "${paperId}" 进行综述。

请使用 Read 工具读取文献相关文件，然后按以下结构输出：
### 1. 核心贡献
### 2. 方法概述
### 3. 与相关工作的关系
### 4. 局限性

用中文回答。`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 辅助函数：发送 SSE 事件
      function emit(type: string, data: Record<string, unknown> = {}) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
        );
      }

      try {
        const q = query({
          prompt,
          options: {
            model: process.env.ANTHROPIC_MODEL || "deepseek-v4-pro[1m]",
            permissionMode: "bypassPermissions",  // 或 "default" 需要审批
            maxTurns: 10,
            cwd: process.cwd(),
          },
        });

        // 遍历 Agent 的每一步输出
        for await (const message of q) {
          const type = (message as { type?: string }).type;

          if (type === "stream_event") {
            // 流式文字 delta
            const event = (message as any).event;
            if (event?.delta?.text) {
              emit("delta", { text: event.delta.text });
            }
          } else if (type === "assistant") {
            // Agent 的完整回复（含工具调用计划或最终文字）
            const content = (message as any).message?.content || [];
            for (const block of content) {
              if (block.type === "text") {
                emit("text", { text: block.text });
              } else if (block.type === "tool_use") {
                // 工具调用事件
                emit("tool_call", { name: block.name, input: block.input });
              }
            }
          } else if (type === "user") {
            // 工具执行结果
            const content = (message as any).message?.content || [];
            for (const block of content) {
              if (block.type === "tool_result") {
                const preview = JSON.stringify(block.content).slice(0, 500);
                emit("tool_result", { tool_use_id: block.tool_use_id, preview });
              }
            }
          } else if (type === "result") {
            emit("done", {});
          }
        }
      } catch (err) {
        emit("error", { message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Step 2: 创建前端组件

文件：`src/components/knowledge/ReviewButton.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Wrench, Check } from "lucide-react";

interface ToolStep {
  name: string;
  result?: string;
  done: boolean;
}

export default function ReviewButton({ paperId }: { paperId: string }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [tools, setTools] = useState<ToolStep[]>([]);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setText("");
    setTools([]);
    setError("");

    const res = await fetch("/api/ai/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const line of decoder.decode(value).split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = JSON.parse(line.slice(6));

        switch (data.type) {
          case "delta":
            setText((t) => t + data.text);
            break;
          case "text":
            setText((t) => t + "\n\n" + data.text);
            break;
          case "tool_call":
            setTools((prev) => [...prev, { name: data.name, done: false }]);
            break;
          case "tool_result":
            setTools((prev) =>
              prev.map((t, i) =>
                i === prev.length - 1 ? { ...t, done: true, result: data.preview } : t
              )
            );
            break;
          case "error":
            setError(data.message);
            break;
        }
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <Button onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <FileText />}
        {loading ? "生成中..." : "生成综述"}
      </Button>

      {tools.length > 0 && (
        <div className="my-2 space-y-1">
          {tools.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              {t.done ? <Check className="text-green-500 h-3 w-3" /> : <Wrench className="animate-spin h-3 w-3" />}
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      )}

      {(text || error) && (
        <Card className="mt-4">
          <CardContent className="py-3">
            {error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : (
              <div className="prose prose-sm max-w-none text-sm">
                {text.split("\n").map((line, i) => (
                  <p key={i}>{line || " "}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Step 3: 嵌入到页面中

在目标页面（如文献详情页）导入并使用：

```tsx
import ReviewButton from "@/components/knowledge/ReviewButton";

// 在页面 JSX 中：
<ReviewButton paperId={paper.id} />
```

**完成。** 整个流程：创建 API route（30 行）+ 创建组件（80 行）+ 页面嵌入（1 行）。

## 3. 事件类型速查表

Agent SDK 的 `query()` 返回以下事件类型，前端需要处理：

| 事件类型 | 含义 | 前端展示 |
|---------|------|---------|
| `stream_event` | 流式文字片段 | 追加到文本 buffer，实时显示 |
| `assistant` / `text` | Agent 的完整文字回复 | 追加到消息内容 |
| `assistant` / `tool_use` | Agent 要调用工具 | 显示工具调用卡片（名称+输入参数） |
| `user` / `tool_result` | 工具执行完成 | 显示执行结果摘要，卡片变绿 |
| `system` / `init` | Agent 初始化 | 可选：显示会话 ID |
| `result` | Agent 任务完成 | 停止 loading，标记完成 |
| `error` | 出错 | 显示错误信息 |

## 4. query() 配置项说明

```typescript
query({
  prompt: string,           // 给 AI 的任务描述
  options: {
    model: string,           // 模型名，默认读 ANTHROPIC_MODEL 环境变量
    cwd: string,             // 工作目录，工具的默认路径
    maxTurns: number,        // 最大工具调用轮次，防止无限循环（建议 5-15）
    permissionMode:          // 权限模式
      | "default"            //   需要用户逐次审批（最安全）
      | "acceptEdits"        //   自动批准编辑，其他需审批
      | "bypassPermissions", //   跳过所有审批（开发阶段用）
    allowedTools: string[],  // 白名单：只允许这些工具
    // 例如: ["Read", "Grep", "Glob", "WebSearch", "WebFetch"]
    disallowedTools: string[], // 黑名单：禁止这些工具
    // 例如: ["Write", "Bash", "Edit"]
  },
})
```

## 5. 安全模型

不同场景用不同的权限配置：

| 场景 | permissionMode | 说明 |
|------|---------------|------|
| 只读分析（推荐用于展示类功能） | `bypassPermissions` + `allowedTools: ["Read","Grep","Glob","WebSearch","WebFetch"]` | 不能改文件，安全 |
| 可编辑内容 | `acceptEdits` + `allowedTools: ["Read","Write","Edit",...]` | 编辑自动批准，其他需审批 |
| 完整开发模式 | `bypassPermissions` 或不限制工具 | 完全自主，仅限 Shell 模式 |

**推荐默认做法**：所有面向用户的按钮功能，用 `bypassPermissions` + `allowedTools` 白名单。只有开发者 Shell 模式才放开全部工具。

## 6. 开发新功能的标准模板

```typescript
// ── API Route 模板 ───────────────────────────
// src/app/api/ai/<功能名>/route.ts

import { NextRequest } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";

export async function POST(request: NextRequest) {
  const { /* 前端传来的参数 */ } = await request.json();

  // 1. 构建 prompt
  const prompt = `你是一个 xxx 助手。请对 ... 进行 ... 分析。`;

  // 2. 调用 Agent SDK
  const q = query({
    prompt,
    options: {
      model: process.env.ANTHROPIC_MODEL || "deepseek-v4-pro[1m]",
      permissionMode: "bypassPermissions",
      maxTurns: 10,
      cwd: process.cwd(),
      allowedTools: ["Read", "Grep", "Glob", "WebSearch", "WebFetch"],
    },
  });

  // 3. 流式返回 SSE（标准模板，复制即可）
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function emit(type: string, data: Record<string, unknown> = {}) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
      }
      try {
        for await (const message of q) {
          const type = (message as any).type;
          if (type === "stream_event") {
            const text = (message as any).event?.delta?.text;
            if (text) emit("delta", { text });
          } else if (type === "assistant") {
            for (const block of (message as any).message?.content || []) {
              if (block.type === "text") emit("text", { text: block.text });
              if (block.type === "tool_use") emit("tool_call", { name: block.name, input: block.input });
            }
          } else if (type === "user") {
            for (const block of (message as any).message?.content || []) {
              if (block.type === "tool_result") {
                emit("tool_result", { preview: JSON.stringify(block.content).slice(0, 500) });
              }
            }
          } else if (type === "result") {
            emit("done", {});
          }
        }
      } catch (err) {
        emit("error", { message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
```

## 7. 现有功能速查

| 功能 | API Route | 前端组件 | 类型 |
|------|-----------|---------|------|
| AI 聊天（右侧面板） | `/api/ai/agent` | `AICompanion.tsx` | 通用对话 |
| 概念研究空白分析 | `/api/ai/insight` | `ConceptInsight.tsx` | 按钮触发 |

## 8. 后续可以添加的功能示例

| 功能 | prompt 思路 | 适合谁做 |
|------|-----------|---------|
| 文献综述生成 | "对这篇文献进行综述，分析其贡献和局限" | 前端：抄 ConceptInsight 模板 |
| 概念关系发现 | "分析这些概念之间是否存在隐藏的关联" | 前端：抄 ConceptInsight 模板 |
| 研究趋势报告 | "搜索网络 + 知识库，总结该领域最近的研究趋势" | 前端+后端各 50 行 |
| 论文推荐 | "根据用户兴趣概念，在知识库中推荐最相关的文献" | 需先有数据库 |
| 跨领域灵感 | "在知识库中寻找可以迁移到另一领域的方法" | 后端 prompt 设计 |
| 自动标注新论文 | "读取这篇论文，提取概念、分级、生成摘要" | 需处理 PDF |
