"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ToolCallCard, { type ToolCall } from "./ToolCallCard";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools: ToolCall[];
}

export default function ChatView({ sessionId }: { sessionId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      tools: [],
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      const aiId = (Date.now() + 1).toString();
      let aiText = "";
      let aiTools: ToolCall[] = [];

      setMessages((prev) => [...prev, { id: aiId, role: "assistant", content: "", tools: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          let data: any;
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          switch (data.type) {
            case "delta":
              aiText += data.text || "";
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, content: aiText } : m))
              );
              break;

            case "text":
              aiText = aiText ? aiText + "\n\n" + (data.text || "") : (data.text || "");
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, content: aiText } : m))
              );
              break;

            case "tool_call": {
              const tc: ToolCall = {
                id: `t${aiTools.length}`,
                name: data.name || "unknown",
                input: data.input,
                result: undefined,
                done: false,
              };
              aiTools = [...aiTools, tc];
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, tools: [...aiTools] } : m))
              );
              break;
            }

            case "tool_result": {
              aiTools = aiTools.map((t, i) =>
                i === aiTools.length - 1
                  ? { ...t, done: true, result: data.preview }
                  : t
              );
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, tools: [...aiTools] } : m))
              );
              break;
            }

            case "done":
              break;

            case "error":
              aiText = aiText || `Error: ${data.message}`;
              setMessages((prev) =>
                prev.map((m) => (m.id === aiId ? { ...m, content: aiText } : m))
              );
              break;
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `错误: ${(err as Error).message}`,
          tools: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Claude Code 工作区 — 开始一个新的研究对话</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {msg.content ? (
                  msg.content.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line || " "}</p>
                  ))
                ) : (
                  <span className="animate-pulse text-muted-foreground">...</span>
                )}
              </div>
            </div>

            {/* Tool call cards — shown below assistant messages */}
            {msg.tools.length > 0 && (
              <div className="ml-11 mt-2 space-y-1.5">
                {msg.tools.map((tool) => (
                  <ToolCallCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              Agent 思考中...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="输入研究问题，Agent 会使用工具来回答..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-[52px] resize-none"
            disabled={loading}
          />
          <Button size="icon" className="shrink-0 self-end" onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
