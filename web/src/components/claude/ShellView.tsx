"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

export default function ShellView() {
  const termRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [error, setError] = useState("");

  useEffect(() => {
    let ws: WebSocket | null = null;
    let term: any = null;
    let fitAddon: any = null;

    async function init() {
      try {
        const [{ Terminal }, { FitAddon }] = await Promise.all([
          import("xterm"),
          import("@xterm/addon-fit"),
        ]);

        // Import CSS
        await import("xterm/css/xterm.css");

        term = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: {
            background: "#1e1e1e",
            foreground: "#d4d4d4",
            cursor: "#ffffff",
            selectionBackground: "#264f78",
            black: "#000000",
            red: "#cd3131",
            green: "#0dbc79",
            yellow: "#e5e510",
            blue: "#2472c8",
            magenta: "#bc3fbc",
            cyan: "#11a8cd",
            white: "#e5e5e5",
            brightBlack: "#666666",
            brightRed: "#f14c4c",
            brightGreen: "#23d18b",
            brightYellow: "#f5f543",
            brightBlue: "#3b8eea",
            brightMagenta: "#d670d6",
            brightCyan: "#29b8db",
            brightWhite: "#ffffff",
          },
        });

        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        if (termRef.current) {
          term.open(termRef.current);
          fitAddon.fit();
        }

        // Connect to shell WebSocket
        ws = new WebSocket("ws://localhost:3002");

        ws.onopen = () => setStatus("connected");

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "output" && term) {
              term.write(msg.data);
            }
          } catch {
            if (term) term.write(event.data);
          }
        };

        ws.onerror = () => {
          setStatus("error");
          setError("无法连接到 Shell 服务 (端口 3002)");
        };

        ws.onclose = () => {
          if (term) term.write("\r\n\x1b[31m[连接已断开]\x1b[0m\r\n");
        };

        // Forward terminal input to WebSocket
        term.onData((data: string) => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "input", data }));
          }
        });

        // Handle resize
        const handleResize = () => {
          if (fitAddon && term) {
            fitAddon.fit();
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "resize",
                  cols: term.cols,
                  rows: term.rows,
                })
              );
            }
          }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
      } catch (err) {
        setStatus("error");
        setError((err as Error).message);
      }
    }

    init();

    return () => {
      term?.dispose();
      ws?.close();
    };
  }, []);

  return (
    <div className="h-full relative bg-[#1e1e1e]">
      {/* Terminal container */}
      <div ref={termRef} className="h-full" />

      {/* Connection overlay */}
      {status === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]/90">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-400" />
            <p className="text-gray-400 text-sm">正在连接 Shell...</p>
            <p className="text-gray-500 text-xs mt-1">
              请确保 Shell 服务已启动: npx tsx server/shell-ws.ts
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]/90">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-2">
              启动 Shell 服务: <code className="bg-gray-800 px-1 rounded">npm run shell</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
