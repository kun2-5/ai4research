/**
 * WebSocket server for Claude Code shell terminal.
 * Run with: npx tsx server/shell-ws.ts
 * Connects to xterm.js in the /claude page Shell tab.
 */
import { WebSocketServer } from "ws";
import * as pty from "node-pty";
import { createServer } from "http";

const PORT = 3002;
const SHELL = process.env.SHELL || "/bin/bash";

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("[shell-ws] Client connected, spawning shell...");

  const term = pty.spawn(SHELL, [], {
    name: "xterm-256color",
    cols: 120,
    rows: 40,
    cwd: process.env.CLAUDE_CODE_PROJECT_CWD || process.cwd(),
    env: {
      ...process.env,
      TERM: "xterm-256color",
    },
  });

  // PTY output → WebSocket
  term.onData((data: string) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "output", data }));
    }
  });

  // WebSocket input → PTY
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "input") {
        term.write(msg.data);
      } else if (msg.type === "resize") {
        term.resize(msg.cols, msg.rows);
      }
    } catch {
      // Raw input
      term.write(raw.toString());
    }
  });

  ws.on("close", () => {
    console.log("[shell-ws] Client disconnected, killing shell");
    term.kill();
  });

  ws.on("error", () => {
    term.kill();
  });

  // Send initial welcome
  ws.send(
    JSON.stringify({
      type: "output",
      data: "\x1b[1;32mResearchOS Claude Shell\x1b[0m\r\nType \x1b[1;33mclaude\x1b[0m to start.\r\n\r\n",
    })
  );
});

server.listen(PORT, () => {
  console.log(`[shell-ws] WebSocket shell server on ws://localhost:${PORT}`);
});
