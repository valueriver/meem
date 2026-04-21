import * as functions from "./functions.js";
import { truncateToolResult } from "./utils.js";
const runTools = async (toolCalls, { enableToolResultTruncate = true, toolResultMaxChars = 12e3 } = {}) => {
  const results = await Promise.all(toolCalls.map(async (tc) => {
    const name = tc.function.name;
    const args = JSON.parse(tc.function.arguments || "{}");
    let content;
    try {
      const fn = functions[name];
      if (!fn) throw new Error(`未知工具: ${name}`);
      content = await fn(args);
    } catch (e) {
      content = `tool error: ${e.message}`;
    }
    const text = typeof content === "string" ? content : JSON.stringify(content);
    const trimmed = truncateToolResult(text, {
      enabled: enableToolResultTruncate,
      maxChars: toolResultMaxChars
    });
    return {
      role: "tool",
      tool_call_id: tc.id,
      content: trimmed.content
    };
  }));
  return results;
};
export {
  runTools
};
