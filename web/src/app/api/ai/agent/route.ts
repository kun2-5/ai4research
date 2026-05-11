import { NextRequest } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { getConcepts, getLiterature, getWikiStats } from "@/lib/wiki/reader";

function buildAgentPrompt(userMessage: string): string {
  const stats = getWikiStats();
  const concepts = getConcepts();
  const literature = getLiterature();

  const conceptList = concepts
    .map((c) => `- ${c.name}${c.chineseEquivalent ? ` (${c.chineseEquivalent})` : ""}`)
    .join("\n");

  const corePapers = literature
    .filter((l) => l.tier === "Core")
    .map((p) => `- ${p.title} (${p.year ?? "?"}) [Core]`)
    .join("\n");
  const importantPapers = literature
    .filter((l) => l.tier === "Important")
    .map((p) => `- ${p.title} (${p.year ?? "?"}) [Important]`)
    .join("\n");

  return `你是一个 AI 研究伙伴，正在嵌入到 ResearchOS 中。你可以访问以下知识库：

## 知识库概况
- 文献：${stats.literatureCount} 篇 (Core ${stats.coreCount} / Important ${stats.importantCount} / Relevant ${stats.relevantCount} / Peripheral ${stats.peripheralCount})
- 概念：${stats.conceptCount} 个

## 核心概念
${conceptList}

## 核心文献
${corePapers}

## 重要文献
${importantPapers}

## 当前用户问题
${userMessage}

请用中文回答，引用知识库中的具体概念和文献名称。如果知识库没有相关信息，诚实说明。你可以使用文件系统工具来探索知识库的更详细内容（concepts/*.md 文件在 wiki-data/concepts/ 目录下，文献索引在 wiki-data/index.md）。`;
}

export async function POST(request: NextRequest) {
  const { messages } = (await request.json()) as {
    messages: { role: string; content: string }[];
  };

  if (!messages?.length) {
    return new Response("Missing messages", { status: 400 });
  }

  const lastMessage = messages[messages.length - 1]!;
  const prompt = buildAgentPrompt(lastMessage.content);

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
            maxTurns: 10,
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
            const msg = message as {
              message?: { content?: Array<{ type: string; text?: string; name?: string; input?: unknown }> };
            };
            if (msg.message?.content) {
              for (const block of msg.message.content) {
                if (block.type === "text" && block.text) {
                  emit("text", { text: block.text });
                } else if (block.type === "tool_use") {
                  emit("tool_call", {
                    name: block.name,
                    input: block.input,
                  });
                }
              }
            }
          } else if (msgType === "user") {
            const userMsg = message as {
              message?: { content?: Array<{ type: string; text?: string; tool_use_id?: string; content?: unknown }> };
            };
            if (userMsg.message?.content) {
              for (const block of userMsg.message.content) {
                if (block.type === "tool_result") {
                  const content = block.content;
                  const preview =
                    typeof content === "string"
                      ? content.slice(0, 500)
                      : JSON.stringify(content).slice(0, 500);
                  emit("tool_result", { tool_use_id: block.tool_use_id, preview });
                }
              }
            }
          } else if (msgType === "system") {
            // initialization event, can include session info
            const sysMsg = message as { subtype?: string; session_id?: string };
            emit("system", { subtype: sysMsg.subtype, session_id: sysMsg.session_id });
          } else if (msgType === "result") {
            const resultMsg = message as {
              result?: string;
              num_turns?: number;
            };
            emit("done", {
              result: resultMsg.result,
              num_turns: resultMsg.num_turns,
            });
          }
        }
      } catch (err) {
        console.error("Agent error:", err);
        emit("error", { message: (err as Error).message || "Agent request failed" });
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
