"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Send,
  Bot,
  User,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Wrench,
  Check,
} from "lucide-react";
import type { ChatMessage } from "@/types";

interface ToolCall {
  id: string;
  name: string;
  input?: unknown;
  resultPreview?: string;
  completed: boolean;
}

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "你好！我是你的 AI 研究伙伴，现在已接入 Claude Agent SDK。我可以帮你探索知识库中的概念和文献，回答研究问题，还能使用工具读取文件、搜索网络。\n\n试试问我：\n• 什么是 ClimaX？\n• 对比 ClimaX 和 SatMamba\n• 阅读 Remote Sensing 的概念卡片\n\n你想了解什么？",
    timestamp: new Date(),
  },
];

export default function AICompanion() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolCalls, setToolCalls] = useState<Record<string, ToolCall[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const vp = scrollRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLElement | null;
      if (vp) vp.scrollTop = vp.scrollHeight;
    }
  }, [messages, toolCalls]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const history = newMessages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok) throw new Error(await response.text());

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      const aiId = (Date.now() + 1).toString();
      let aiContent = "";
      let currentToolCalls: ToolCall[] = [];

      setMessages((prev) => [
        ...prev,
        { id: aiId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data: { type: string; text?: string; name?: string; input?: unknown; preview?: string; tool_use_id?: string; result?: string; num_turns?: number };
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          switch (data.type) {
            case "delta":
              // Streaming text from agent thinking
              aiContent += data.text || "";
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, content: aiContent } : m))
              );
              break;

            case "text":
              // Final assistant response — replace or append
              aiContent = aiContent ? aiContent + "\n\n" + (data.text || "") : (data.text || "");
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, content: aiContent } : m))
              );
              break;

            case "tool_call": {
              const tc: ToolCall = {
                id: `tool-${Date.now()}-${currentToolCalls.length}`,
                name: data.name || "unknown",
                input: data.input,
                completed: false,
              };
              currentToolCalls = [...currentToolCalls, tc];
              setToolCalls((prev) => ({ ...prev, [aiId]: currentToolCalls }));
              break;
            }

            case "tool_result": {
              currentToolCalls = currentToolCalls.map((tc) =>
                tc.completed
                  ? tc
                  : { ...tc, completed: true, resultPreview: data.preview }
              );
              setToolCalls((prev) => ({ ...prev, [aiId]: currentToolCalls }));
              break;
            }

            case "done":
              // Agent finished
              break;

            case "error":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? { ...m, content: m.content || `错误: ${data.text || "未知错误"}` }
                    : m
                )
              );
              break;
          }
        }
      }
    } catch (err) {
      console.error("Agent error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "抱歉，AI Agent 暂时不可用，请稍后重试。",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <PanelRightOpen className="h-5 w-5" />
        </Button>
      )}

      <div
        className={cn(
          "flex flex-col border-l bg-background transition-all duration-300 ease-in-out",
          isOpen ? "w-96 opacity-100" : "w-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Agent</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const msgTools = toolCalls[msg.id] || [];
              return (
                <div key={msg.id}>
                  <div
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.content ? (
                        msg.content.split("\n").map((line, i) => (
                          <p key={i} className={i > 0 ? "mt-2" : ""}>
                            {line}
                          </p>
                        ))
                      ) : (
                        <span className="animate-pulse">...</span>
                      )}
                    </div>
                  </div>

                  {/* Tool call indicators */}
                  {msgTools.length > 0 && (
                    <div className="ml-11 mt-1.5 space-y-1">
                      {msgTools.map((tc) => (
                        <div
                          key={tc.id}
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                        >
                          {tc.completed ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Wrench className="h-3 w-3 animate-spin" />
                          )}
                          <span className="font-medium">{tc.name}</span>
                          {tc.resultPreview && (
                            <span className="truncate max-w-[200px]">
                              — {tc.resultPreview}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && !messages.some((m) => m.content === "") && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm">
                  <span className="animate-pulse">Agent 启动中...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="输入你的研究问题，Agent 可以使用工具..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="shrink-0 self-end"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            Claude Agent SDK — 可使用工具、读写文件
          </p>
        </div>
      </div>
    </>
  );
}
