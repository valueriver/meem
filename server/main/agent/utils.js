const truncateToolResult = (content, { enabled = true, maxChars = 12e3 } = {}) => {
  const limit = Math.max(1e3, Math.min(5e4, Number(maxChars) || 12e3));
  const text = String(content ?? "");
  if (!enabled || text.length <= limit) {
    return { content: text, truncated: false, originalLength: text.length };
  }
  const head = Math.floor(limit * 0.7);
  const tail = limit - head;
  const clipped = `${text.slice(0, head)}
...[truncated ${text.length - limit} chars]...
${text.slice(-tail)}`;
  return { content: clipped, truncated: true, originalLength: text.length };
};
const parseBoundedInt = (name, value, min, max) => {
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    throw new Error(`Invalid ${name}: integer required`);
  }
  if (num < min || num > max) {
    throw new Error(`Invalid ${name}: must be between ${min} and ${max}`);
  }
  return num;
};
const normalizeChatOptions = (options = {}) => {
  return {
    maxRounds: parseBoundedInt("maxRounds", options.maxRounds, 1, 1e5),
    enableToolResultTruncate: options.enableToolResultTruncate !== false,
    toolResultMaxChars: parseBoundedInt("toolResultMaxChars", options.toolResultMaxChars, 1e3, 5e4)
  };
};
const normalizeAgentMessages = (messages = []) => {
  if (!Array.isArray(messages)) return [];
  const validRoles = /* @__PURE__ */ new Set(["system", "user", "assistant", "tool"]);
  const normalized = [];
  for (const item of messages) {
    if (!item || typeof item !== "object") continue;
    const role = String(item.role || "").trim();
    if (!validRoles.has(role)) continue;
    const msg = { role };
    if (role === "assistant" && Array.isArray(item.tool_calls)) {
      msg.content = item.content == null ? null : String(item.content);
      msg.tool_calls = item.tool_calls;
      if (typeof item.reasoning_content === "string" && item.reasoning_content.trim()) {
        msg.reasoning_content = item.reasoning_content;
      }
    } else {
      msg.content = item.content == null ? "" : String(item.content);
    }
    if (role === "tool" && item.tool_call_id) {
      msg.tool_call_id = String(item.tool_call_id);
    }
    if (role === "assistant" && item.name) msg.name = String(item.name);
    if (role === "tool" && item.name) msg.name = String(item.name);
    normalized.push(msg);
  }
  const toolMap = /* @__PURE__ */ new Map();
  for (const msg of normalized) {
    if (msg.role === "tool" && msg.tool_call_id) {
      toolMap.set(msg.tool_call_id, msg);
    }
  }
  const TOOL_MISSING = "Tool call result is missing. The system may have been interrupted, restarted, timed out, or failed for another unknown reason.";
  const out = [];
  for (const msg of normalized) {
    if (msg.role === "tool") continue;
    out.push(msg);
    if (msg.role === "assistant" && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const tcId = String(tc?.id || "").trim();
        if (!tcId) continue;
        const toolMsg = toolMap.get(tcId);
        if (toolMsg) {
          out.push(toolMsg);
          toolMap.delete(tcId);
        } else {
          out.push({ role: "tool", tool_call_id: tcId, content: TOOL_MISSING });
        }
      }
    }
  }
  let firstNonSystem = out.findIndex((m) => m.role !== "system");
  while (firstNonSystem >= 0 && out[firstNonSystem]?.role === "tool") {
    out.splice(firstNonSystem, 1);
    firstNonSystem = out.findIndex((m) => m.role !== "system");
  }
  return out;
};
export {
  normalizeAgentMessages,
  normalizeChatOptions,
  truncateToolResult
};
