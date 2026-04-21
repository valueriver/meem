import { tools } from "./tools.js";
import { runTools } from "./runner.js";
import { callLlmStream } from "../llm/stream.js";
import { normalizeAgentMessages, normalizeChatOptions } from "./utils.js";
const chat = async (messages, {
  provider,
  apiUrl,
  apiKey,
  model,
  send = (_message) => {
  },
  signal,
  maxRounds = 50,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12e3
} = {}) => {
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars });
  const workMessages = normalizeAgentMessages(messages);
  let round = 0;
  while (round++ < opts.maxRounds) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const payload = { model, messages: workMessages, tools };
    const message = await callLlmStream(provider, apiUrl, apiKey, payload, {
      signal,
      onDelta: (delta) => {
        if (delta) send({ type: "delta", delta });
      }
    });
    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        role: "assistant",
        content: message.content ?? null,
        tool_calls: message.tool_calls
      };
      workMessages.push(assistantMsg);
      send({ type: "assistant_tool_calls", message: assistantMsg });
      for (const toolCall of message.tool_calls) {
        send({ type: "tool_call", toolCall });
      }
      const toolMessages = await runTools(message.tool_calls, {
        enableToolResultTruncate: opts.enableToolResultTruncate,
        toolResultMaxChars: opts.toolResultMaxChars
      });
      for (const tm of toolMessages) {
        workMessages.push(tm);
        send({ type: "tool_result", message: tm });
      }
      continue;
    }
    const text = message.content ?? "";
    const replyMsg = { role: "assistant", content: text };
    send({ type: "done", message: replyMsg });
    return text;
  }
  send({ type: "done", message: { role: "assistant", content: "(达到最大轮次限制)" } });
  return "(达到最大轮次限制)";
};
export {
  chat
};
