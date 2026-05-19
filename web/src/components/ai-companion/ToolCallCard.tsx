"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Wrench, Check, FileText, Search, Globe, Terminal, Folder } from "lucide-react";

export interface ToolCall {
  id: string;
  name: string;
  input?: unknown;
  result?: string;
  done: boolean;
}

const toolIcons: Record<string, React.ReactNode> = {
  Read: <FileText className="h-3.5 w-3.5" />,
  Write: <FileText className="h-3.5 w-3.5" />,
  Edit: <FileText className="h-3.5 w-3.5" />,
  Grep: <Search className="h-3.5 w-3.5" />,
  Glob: <Search className="h-3.5 w-3.5" />,
  WebSearch: <Globe className="h-3.5 w-3.5" />,
  WebFetch: <Globe className="h-3.5 w-3.5" />,
  Bash: <Terminal className="h-3.5 w-3.5" />,
};

export default function ToolCallCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const icon = toolIcons[tool.name] || <Wrench className="h-3.5 w-3.5" />;

  return (
    <div className="border rounded-lg bg-background/50 text-xs overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left"
      >
        {tool.done ? (
          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
        ) : (
          <Wrench className="h-3.5 w-3.5 animate-spin shrink-0" />
        )}
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <span className="font-medium">{tool.name}</span>
        {tool.input != null && (
          <span className="text-muted-foreground truncate">
            {typeof tool.input === "object"
              ? (tool.input as Record<string, unknown>).file_path as string
                || (tool.input as Record<string, unknown>).pattern as string
                || JSON.stringify(tool.input).slice(0, 60)
              : String(tool.input).slice(0, 60)}
          </span>
        )}
        <span className="flex-1" />
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-3 py-2 space-y-2 bg-muted/20">
          {tool.input != null && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">输入参数</p>
              <pre className="text-[11px] bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}
          {tool.result && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">执行结果</p>
              <pre className="text-[11px] bg-muted rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {tool.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
