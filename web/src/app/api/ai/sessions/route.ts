import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const PROJECT_PATH = process.cwd();
const SESSIONS_DIR = path.join(
  os.homedir(),
  ".claude/projects",
  sanitizePath(PROJECT_PATH)
);

function sanitizePath(p: string): string {
  return p.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}

interface SessionInfo {
  id: string;
  name: string;
  messageCount: number;
  updatedAt: string;
}

// GET /api/ai/sessions — list all sessions
// GET /api/ai/sessions?id=xxx — get messages for a session
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (sessionId) {
    // Return messages for a specific session
    const filepath = path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ messages: [] });
    }

    const lines = fs
      .readFileSync(filepath, "utf-8")
      .split("\n")
      .filter(Boolean);
    const messages = lines
      .map((line) => {
        try {
          const entry = JSON.parse(line);
          // Extract assistant/user messages from SDK format
          if (entry.message?.role === "user" || entry.message?.role === "assistant") {
            const content = entry.message.content;
            if (Array.isArray(content)) {
              const textBlocks = content
                .filter((b: { type: string }) => b.type === "text")
                .map((b: { text: string }) => b.text)
                .join("\n");
              return { role: entry.message.role, content: textBlocks };
            }
            return { role: entry.message.role, content: String(content || "") };
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({ messages });
  }

  // List all sessions
  if (!fs.existsSync(SESSIONS_DIR)) {
    return NextResponse.json({ sessions: [] });
  }

  const files = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".jsonl"));
  const sessions: SessionInfo[] = files
    .map((file) => {
      const id = file.replace(".jsonl", "");
      const filepath = path.join(SESSIONS_DIR, file);
      const stat = fs.statSync(filepath);
      const content = fs.readFileSync(filepath, "utf-8");
      const lines = content.split("\n").filter(Boolean);

      // Try to get the first user message as session name
      let name = "新会话";
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.message?.role === "user") {
            const text = typeof entry.message.content === "string"
              ? entry.message.content
              : entry.message.content?.[0]?.text || "";
            name = text.slice(0, 40);
            break;
          }
        } catch { /* skip */ }
      }

      return { id, name, messageCount: lines.length, updatedAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json({ sessions });
}

// POST /api/ai/sessions — create/rename/delete
export async function POST(request: NextRequest) {
  const { action, sessionId, name } = await request.json();

  if (action === "rename") {
    return NextResponse.json({ ok: true });
  }

  if (action === "delete" && sessionId) {
    const filepath = path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
