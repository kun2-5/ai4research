"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Send,
  Bot,
  User,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Plus,
  History,
} from "lucide-react";
import type { ChatMessage } from "@/types";
import ToolCallCard, { type ToolCall } from "./ToolCallCard";

const SESSION_KEY = "researchos_session_id";
const WELCOME = "你好！我是 AI 研究伙伴。我可以帮你探索知识库中的概念和文献，回答研究问题。\n\n试试问我：\n• 什么是 ClimaX？\n• 对比 ClimaX 和 SatMamba\n• 分析 Foundation Model 的研究趋势";

export default function AICompanion() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; name: string; messageCount: number }>>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [ready, setReady] = useState(false);
  const [toolCalls, setToolCalls] = useState<Record<string, ToolCall[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Init: load last session, or show welcome
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setReady(true);
      }
    }, 3000);

    (async () => {
      let savedId: string | null = null;
      try {
        savedId = localStorage.getItem(SESSION_KEY);
      } catch { /* localStorage may be disabled */ }
      fetchSessions();
      if (savedId) {
        await loadSessionMessages(savedId);
      } else {
        setMessages([{ id: "welcome", role: "assistant", content: WELCOME, timestamp: new Date() }]);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/ai/sessions");
      if (res.ok) setSessions((await res.json()).sessions || []);
    } catch { /* ignore */ }
  };

  const loadSessionMessages = async (id: string) => {
    setReady(false);
    try {
      const res = await fetch(`/api/ai/sessions?id=${id}`);
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      if (data.messages?.length > 0) {
        setMessages(
          data.messages.map((m: { role: string; content: string }, i: number) => ({
            id: `s-${i}`,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(),
          }))
        );
        setSessionId(id);
        setReady(true);
        return;
      }
    } catch { /* ignore */ }
    // Session not found or empty — clear stale localStorage and show welcome
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setSessionId(null);
    setMessages([{ id: "welcome", role: "assistant", content: WELCOME, timestamp: new Date() }]);
    setReady(true);
  };

  const switchSession = (id: string) => {
    if (id === sessionId) { setShowSessions(false); return; }
    try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
    setToolCalls({});
    setShowSessions(false);
    loadSessionMessages(id);
  };

  const newSession = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setSessionId(null);
    setToolCalls({});
    setShowSessions(false);
    setMessages([{ id: "welcome", role: "assistant", content: "新会话已开始。有什么研究问题我可以帮你的？", timestamp: new Date() }]);
    setReady(true);
    fetchSessions();
  };

  // Auto-scroll
  useEffect(() => {
    if (!scrollRef.current) return;
    const vp = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
    if (vp) vp.scrollTop = vp.scrollHeight;
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

        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          let data: any;
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          switch (data.type) {
            case "delta":
              aiContent += data.text || "";
              setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: aiContent } : m)));
              break;

            case "text":
              aiContent = aiContent ? aiContent + "\n\n" + (data.text || "") : (data.text || "");
              setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: aiContent } : m)));
              break;

            case "system":
              // SDK auto-generated session ID — save it
              if (data.session_id) {
                try { localStorage.setItem(SESSION_KEY, data.session_id); } catch { /* ignore */ }
                if (!sessionId) setSessionId(data.session_id);
              }
              break;

            case "tool_call": {
              const tc: ToolCall = {
                id: `t${currentToolCalls.length}`,
                name: data.name || "unknown",
                input: data.input,
                done: false,
              };
              currentToolCalls = [...currentToolCalls, tc];
              setToolCalls((prev) => ({ ...prev, [aiId]: currentToolCalls }));
              break;
            }

            case "tool_result":
              currentToolCalls = currentToolCalls.map((t, i) =>
                i === currentToolCalls.length - 1 ? { ...t, done: true, result: data.preview } : t
              );
              setToolCalls((prev) => ({ ...prev, [aiId]: currentToolCalls }));
              break;

            case "done":
              break;

            case "error":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId ? { ...m, content: aiContent || `错误: ${data.message || "未知错误"}` } : m
                )
              );
              break;
          }
        }
      }

      fetchSessions();
    } catch (err) {
      const fallbackIdx = messages.findIndex((m) => m.content === "");
      if (fallbackIdx >= 0) {
        // Remove empty placeholder on error
        setMessages((prev) =>
          prev
            .filter((m) => m.content !== "")
            .concat({
              id: (Date.now() + 2).toString(),
              role: "assistant",
              content: "抱歉，AI Agent 暂时不可用，请稍后重试。",
              timestamp: new Date(),
            })
        );
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "抱歉，AI Agent 暂时不可用，请稍后重试。",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
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
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-3 gap-1 shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-sm truncate">AI Agent</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={newSession} title="新建会话">
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setShowSessions(!showSessions); fetchSessions(); }}
              title="历史会话"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Session list */}
        {showSessions && (
          <div className="border-b max-h-48 overflow-y-auto shrink-0">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">暂无历史会话</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-l-2",
                    s.id === sessionId ? "border-primary bg-primary/5" : "border-transparent"
                  )}
                >
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-muted-foreground">{s.messageCount} 条消息</p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {!ready ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-muted-foreground animate-pulse">加载中...</span>
            </div>
          ) : (
            <ScrollArea className="h-full px-4 py-4" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
                  const msgTools = toolCalls[msg.id] || [];
                  return (
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
                            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                            msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
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
                      {msgTools.length > 0 && (
                        <div className="ml-11 mt-1.5 space-y-1">
                          {msgTools.map((tc) => (
                            <ToolCallCard key={tc.id} tool={tc} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4 shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder="输入研究问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[52px] resize-none"
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
        </div>
      </div>
    </>
  );
}
