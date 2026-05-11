import { NextRequest } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { getConceptDetail, getLiterature } from "@/lib/wiki/reader";

export async function POST(request: NextRequest) {
  const { conceptSlug } = (await request.json()) as { conceptSlug: string };

  const concept = getConceptDetail(conceptSlug);
  if (!concept) {
    return new Response(JSON.stringify({ error: "Concept not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const literature = getLiterature();
  const relatedPapers = literature.filter(
    (l) => concept.linkedPapers.includes(l.path.replace(/\.md$/, ""))
  );

  const prompt = `你是一个科研分析助手。请对以下概念进行深度研究空白分析。

## 目标概念
- 名称：${concept.name}
- 中文：${concept.chineseEquivalent || "无"}
- 别名：${concept.aliases.join(", ")}
- 当前定义：${concept.description || "无详细定义"}
- 知识库中出现频率：${concept.frequency || "未知"} 次

## 相关知识库信息
你可以使用 Read 工具读取以下文件获取更多上下文：
- 概念卡片：wiki-data/concepts/${concept.name}.md
- 文献索引：wiki-data/index.md

## 分析要求
请严格按照以下结构输出，使用中文：

### 1. 研究现状
该概念当前的研究状态、代表性工作和方法

### 2. 关联热点
该概念与其他概念（${concept.relatedConcepts.slice(0, 10).join("、")}）的交叉情况和潜在连接

### 3. 研究空白
基于知识库内容，指出尚未充分探索的方向和潜在的研究机会

### 4. 建议方向
给研究人员的具体建议，2-3 个可操作的研究课题

请基于知识库中实际存在的数据分析。如果某些信息知识库中不完整，请诚实说明并建议补充方向。`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
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
            permissionMode: "bypassPermissions",
            maxTurns: 8,
            cwd: process.cwd(),
            settingSources: ["project"],
          },
        });

        for await (const message of q) {
          const msgType = (message as { type?: string }).type;

          if (msgType === "stream_event") {
            const event = (message as { event?: { type?: string; delta?: { type?: string; text?: string } } }).event;
            if (event?.type === "content_block_delta" && event.delta?.text) {
              emit("delta", { text: event.delta.text });
            }
          } else if (msgType === "assistant") {
            const msg = message as { message?: { content?: Array<{ type: string; text?: string; name?: string; input?: unknown }> } };
            if (msg.message?.content) {
              for (const block of msg.message.content) {
                if (block.type === "text" && block.text) {
                  emit("text", { text: block.text });
                } else if (block.type === "tool_use") {
                  emit("tool_call", { name: block.name, input: block.input });
                }
              }
            }
          } else if (msgType === "user") {
            const userMsg = message as { message?: { content?: Array<{ type: string; text?: string; tool_use_id?: string; content?: unknown }> } };
            if (userMsg.message?.content) {
              for (const block of userMsg.message.content) {
                if (block.type === "tool_result") {
                  const content = block.content;
                  const preview = typeof content === "string" ? content.slice(0, 300) : JSON.stringify(content).slice(0, 300);
                  emit("tool_result", { tool_use_id: block.tool_use_id, preview });
                }
              }
            }
          } else if (msgType === "result") {
            emit("done", {});
          }
        }
      } catch (err) {
        console.error("Insight Agent error:", err);
        emit("error", { message: (err as Error).message || "Analysis failed" });
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
