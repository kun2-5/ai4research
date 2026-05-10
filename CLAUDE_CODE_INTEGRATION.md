# Claude Code Integration Status & Plan

## Current State: Chat API (已完成)

```
AICompanion (React) → fetch /api/ai/chat → @anthropic-ai/sdk → DeepSeek
```

| 能力 | 状态 |
|------|------|
| 流式对话 (SSE) | ✅ 已实现 |
| Wiki RAG (知识库注入) | ✅ 已实现 |
| 工具调用 (读写文件/执行命令) | ❌ 未实现 |
| 会话管理 | ❌ 未实现 |
| 权限控制 | ❌ 未实现 |
| 多轮 agentic workflow | ❌ 未实现 |

**本质**：目前只是一个「知道 wiki 内容的聊天机器人」，不是 Claude Code agent。

---

## 目标：Claude Code Agent 集成

### 什么是 Claude Code Agent

Claude Code 不只是聊天。它通过 `@anthropic-ai/claude-agent-sdk` 提供了完整的 agent 能力：

| 能力 | 说明 | ResearchOS 用途 |
|------|------|----------------|
| 文件读写 | 读取/修改项目文件 | 读取知识库，生成实验代码 |
| Shell 执行 | 运行任意命令 | 跑 Python/R 数据分析脚本 |
| 工具调用 | AI 主动选择工具完成任务 | 搜索文献、分析数据、生成图表 |
| 权限管理 | 用户审批敏感操作 | 在 UI 中确认是否允许 AI 执行 |
| 会话持久化 | 跨轮记忆上下文 | 持续的研究对话，不丢失上下文 |
| MCP 协议 | 扩展第三方工具 | 接入 arXiv API、Semantic Scholar 等 |

### 参考架构：claudecodeui

claudecodeui（`/home/kun14/ai4research/claudecodeui/`）是 Claude Code 的 Web 前端，它使用 `@anthropic-ai/claude-agent-sdk` 的 `query()` 函数驱动 agent。核心流程：

```
User (Browser)
    ↓ WebSocket
Chat WebSocket Handler (server/modules/websocket/services/chat-websocket.service.ts)
    ↓ query()
@anthropic-ai/claude-agent-sdk (server/claude-sdk.js)
    ↓ async generator
Claude API → Tool calls → File ops → Shell exec → Result
    ↓ stream events
WebSocket → Frontend renders in real-time
```

关键文件：

| 文件 | 作用 |
|------|------|
| `server/claude-sdk.js` | SDK 封装：创建 query、处理流式事件、tool permission callback |
| `server/modules/websocket/services/chat-websocket.service.ts` | WebSocket 消息路由 |
| `server/modules/websocket/services/websocket-writer.service.ts` | 连接抽象：支持重连时切换底层 socket |
| `src/contexts/WebSocketContext.tsx` | 前端 WebSocket 管理 |
| `src/components/chat/hooks/useChatRealtimeHandlers.ts` | 前端消息处理：stream_delta、permission_request 等 |

### 我们的集成路径

我们不 fork claudecodeui 的 UI，但复用它的 agent 通信模式：

```
                        当前                       →        目标
┌─────────────────────────────────────────────────────────────────────┐
│ AICompanion (React)                                                │
│   fetch POST /api/ai/chat                                          │
│   SSE streaming (text delta / done)                                 │
│   → 只有纯文本对话                                                   │
│                                                                     │
│                          ↓ 升级为                                    │
│                                                                     │
│ AICompanion (React)                                                │
│   WebSocket / SSE to /api/ai/agent                                  │
│   Events: stream_delta, tool_call, permission_request, tool_result  │
│   UI: 文本 + 工具调用卡片 + 审批按钮                                   │
│   → Agent 可以读文件、跑代码、写结果                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 实施步骤

### Step 1: 安装 Agent SDK

```bash
cd web
npm install @anthropic-ai/claude-agent-sdk
```

### Step 2: 创建 Agent API Route

新建 `src/app/api/ai/chat/route.ts` 的升级版，替换 `@anthropic-ai/sdk` 为 `@anthropic-ai/claude-agent-sdk`：

```typescript
// src/app/api/ai/agent/route.ts (伪代码)
import { query } from "@anthropic-ai/claude-agent-sdk";

// Agent query：自动获得工具调用能力
const q = query({
  prompt: userMessage,
  options: {
    cwd: process.cwd(),
    permissionMode: "acceptEdits", // 或 "default" 需要用户确认
    model: process.env.ANTHROPIC_MODEL,
    allowedTools: ["Read", "Write", "Bash", "WebSearch"],
    systemPrompt: buildSystemPrompt(),  // wiki RAG 上下文
  },
});

// 流式处理 agent 事件
for await (const message of q) {
  // message.type 包含: stream_event, tool_use, tool_result, assistant, user
  // 通过 SSE 转发到前端
}
```

### Step 3: 升级 AICompanion UI

当前 AICompanion 只处理 `delta` 和 `done` 事件。需要新增处理：

| 新事件类型 | UI 表现 |
|-----------|---------|
| `tool_call` | 显示工具调用卡片："正在读取文件..." |
| `tool_result` | 显示执行结果或摘要 |
| `permission_request` | 显示确认按钮："允许 AI 执行命令？[批准] [拒绝]" |
| `error` | 显示错误信息 |

消息气泡也需要支持多种 content 类型（不只是纯文本）。

### Step 4: 通信协议选择

两种方案：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **SSE (推荐)** | 简单，Next.js 原生支持，无需额外依赖 | 单向（需配合 POST 发送消息） |
| **WebSocket** | 双向实时，claudecodeui 用的就是这个 | 需要 ws 库，Next.js 中配置较复杂 |

**推荐先用 SSE**：前端 POST 发消息，SSE 流接收 agent 事件。和当前代码改动最小。

### Step 5: Tool Permissions 集成

Agent SDK 的 `canUseTool` 回调可以拦截工具调用：

```typescript
const q = query({
  // ...
  hooks: {
    canUseTool: async (toolName, input) => {
      // 发送 permission_request 到前端
      // 等待用户点击 [批准] 或 [拒绝]
      // 返回 { behavior: "allow" } 或 { behavior: "deny" }
    },
  },
});
```

前端通过单独的 API endpoint (`/api/ai/approve`) 来回应权限请求。

---

## 前置条件

| 条件 | 状态 |
|------|------|
| Anthropic API Key | ⚠️ 当前使用 DeepSeek 兼容接口，Agent SDK 的工具调用能力**可能不完全兼容** |
| `@anthropic-ai/claude-agent-sdk` | ❌ 未安装 |
| 项目工作目录配置 | ✅ wiki-data/ 已就绪 |

**关键风险**：DeepSeek 的 Anthropic 兼容接口可能不支持 Agent SDK 的全部功能（工具调用、文件操作等）。如果发现不兼容，需要：
- 方案 A：获取真正的 Anthropic API Key
- 方案 B：用 `@anthropic-ai/sdk` + 手动实现工具调用循环（退而求其次）

---

## 建议的下一步

1. **先验证 Agent SDK 兼容性**：安装 SDK，写一个最小测试脚本，看 DeepSeek 接口是否支持 tool use
2. **如果不兼容**：先用 `@anthropic-ai/sdk`（已跑通）+ 自己实现简单的 tool calling 循环
3. **如果兼容**：按 Step 2-5 直接集成 Agent SDK
