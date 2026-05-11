"use client";

import { useState, useCallback } from "react";
import { MessageSquare, Terminal, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChatView from "@/components/claude/ChatView";
import ShellView from "@/components/claude/ShellView";
import SessionSidebar from "@/components/claude/SessionSidebar";

type Tab = "chat" | "shell";

export default function ClaudeWorkspacePage() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveTab("chat");
  }, []);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-muted/30 transition-all duration-200",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        )}
      >
        <SessionSidebar
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={() => setActiveSessionId(null)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with tabs */}
        <div className="flex items-center border-b bg-background px-4 h-12 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          <div className="w-px h-5 bg-border mx-2" />

          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "chat"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>

          <button
            onClick={() => setActiveTab("shell")}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "shell"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Terminal className="h-4 w-4" />
            Shell
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" ? (
            <ChatView sessionId={activeSessionId} />
          ) : (
            <ShellView />
          )}
        </div>
      </div>
    </div>
  );
}
