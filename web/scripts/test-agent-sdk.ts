/**
 * Quick test: does @anthropic-ai/claude-agent-sdk work with DeepSeek?
 * Run: npx tsx scripts/test-agent-sdk.ts
 */
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("Testing Claude Agent SDK with DeepSeek endpoint...");
  console.log("Base URL:", process.env.ANTHROPIC_BASE_URL);
  console.log("Model:", process.env.ANTHROPIC_MODEL);

  try {
    const q = query({
      prompt: "Say hello and tell me what tools you have available.",
      options: {
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        permissionMode: "bypassPermissions",
        maxTurns: 1,
      },
    });

    console.log("Streaming response:");
    for await (const message of q) {
      const type = (message as { type?: string }).type;
      if (type === "stream_event") {
        const event = message as { event?: { type?: string; delta?: { type?: string; text?: string } } };
        if (event.event?.type === "content_block_delta" && event.event.delta?.text) {
          process.stdout.write(event.event.delta.text);
        }
      } else if (type === "assistant") {
        const msg = message as { message?: { content?: Array<{ type: string; text?: string }> } };
        for (const block of msg.message?.content ?? []) {
          if (block.type === "text" && block.text) {
            console.log("\n[Final] ", block.text);
          }
        }
      } else {
        console.log(`\n[Event: ${type}]`);
      }
    }
    console.log("\n✅ Agent SDK works with DeepSeek!");
  } catch (err) {
    console.error("\n❌ Agent SDK failed:", (err as Error).message);
  }
}

main();
