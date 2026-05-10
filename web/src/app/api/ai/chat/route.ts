import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getConcepts, getLiterature, getWikiStats } from "@/lib/wiki/reader";

function buildSystemPrompt(): string {
  const stats = getWikiStats();
  const concepts = getConcepts();
  const literature = getLiterature();

  const conceptList = concepts
    .map((c) => `- ${c.name}${c.chineseEquivalent ? ` (${c.chineseEquivalent})` : ""}`)
    .join("\n");

  // Include Core + Important paper titles for RAG context
  const corePapers = literature.filter((l) => l.tier === "Core");
  const importantPapers = literature.filter((l) => l.tier === "Important");

  const coreList = corePapers
    .map((p) => `- ${p.title} (${p.year ?? "?"}) [Core]`)
    .join("\n");
  const importantList = importantPapers
    .map((p) => `- ${p.title} (${p.year ?? "?"}) [Important]`)
    .join("\n");

  return `你是 ResearchOS 的 AI 研究伙伴，专注于 AI × 地球科学交叉领域。

## 知识库概况
- 收录文献：${stats.literatureCount} 篇（Core ${stats.coreCount} / Important ${stats.importantCount} / Relevant ${stats.relevantCount} / Peripheral ${stats.peripheralCount}）
- 核心概念：${stats.conceptCount} 个

## 核心概念
${conceptList}

## 核心文献 (Core)
${coreList}

## 重要文献 (Important)
${importantList}

## 回答要求
- 基于上述知识库内容回答，引用具体概念和文献名称
- 如果知识库中没有相关信息，诚实说明
- 使用中文回答，概念名称保留英文
- 回答简洁、有依据，适合科研人员阅读`;
}

export async function POST(request: NextRequest) {
  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!messages?.length) {
    return new Response("Missing messages", { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY not configured", { status: 500 });
  }

  const client = new Anthropic({
    apiKey,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
  });

  const systemPrompt = buildSystemPrompt();

  try {
    const stream = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      stream: true,
    });

    // SSE streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "delta", text })}\n\n`)
            );
          }
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("AI Chat error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "AI request failed" }),
      { status: err.status || 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
