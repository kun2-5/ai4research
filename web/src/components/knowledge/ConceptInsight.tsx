"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  conceptSlug: string;
  conceptName: string;
}

export default function ConceptInsight({ conceptSlug, conceptName }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    setToolsUsed([]);
    setError(null);
    setExpanded(true);

    try {
      const res = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptSlug }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data: { type: string; text?: string; name?: string };
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          switch (data.type) {
            case "delta":
            case "text":
              text += data.text || "";
              setResult(text);
              break;
            case "tool_call":
              setToolsUsed((prev) => [...prev, data.name || "unknown"]);
              break;
            case "error":
              setError(data.text || "Analysis failed");
              break;
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            AI 研究洞察
          </CardTitle>
          <div className="flex items-center gap-2">
            {result && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              size="sm"
              onClick={analyze}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" />
                  分析「{conceptName}」的研究空白
                </>
              )}
            </Button>
          </div>
        </div>
        {toolsUsed.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            使用了 {toolsUsed.length} 个工具：{toolsUsed.join("、")}
          </p>
        )}
      </CardHeader>

      {expanded && (result || error) && (
        <CardContent>
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : result ? (
            <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed">
              {result.split("\n").map((line, i) => {
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={i} className="text-base font-semibold mt-4 mb-2 text-primary">
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("## ")) {
                  return (
                    <h2 key={i} className="text-lg font-bold mt-5 mb-2">
                      {line.replace("## ", "")}
                    </h2>
                  );
                }
                return (
                  <p key={i} className={line ? "mb-1" : "mb-2"}>
                    {line || " "}
                  </p>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
