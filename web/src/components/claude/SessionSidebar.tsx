"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Folder, ChevronRight, ChevronDown } from "lucide-react";

interface SessionInfo {
  id: string;
  name: string;
}

interface Props {
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export default function SessionSidebar({ activeSessionId, onSelectSession, onNewSession }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  // In the future, fetch sessions from API
  // For now, local state for demo
  const projectName = "ai4research";

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="px-3 py-3 border-b">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full text-left"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold truncate">{projectName}</span>
        </button>
      </div>

      {/* Sessions */}
      {expanded && (
        <>
          <div className="px-3 py-2">
            <button
              onClick={onNewSession}
              className="flex items-center gap-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              新建会话
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                暂无历史会话。发送第一条消息开始。
              </p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                    activeSessionId === session.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{session.name}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
