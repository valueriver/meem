import { tools } from "./tools.js";
import { runTools } from "./runner.js";
import { callLlmStream } from "./lm/client.js";
import {
  extractMemo,
  extractSummary,
  normalizeAgentMessages,
  normalizeChatOptions,
} from "./utils.js";

const chat = async (messages, {
  apiUrl,
  apiKey,
  model,
  onEvent = () => {},
  signal,
  maxRounds = 50,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12000
} = {}) => {
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars });
  const workMessages = normalizeAgentMessages(messages);
  let round = 0;

  while (round++ < opts.maxRounds) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const payload = { model, messages: workMessages, tools };
    const message = await callLlmStream(apiUrl, apiKey, payload, {
      signal,
      onDelta: (delta) => {
        if (delta) onEvent({ type: "delta", delta });
      }
    });
    if (message.usage) {
      onEvent({ type: "usage", usage: message.usage });
    }

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        role: "assistant",
        content: message.content ?? null,
        tool_calls: message.tool_calls,
        ...(message.usage ? { usage: message.usage } : {})
      };
      if (typeof message.reasoning_content === "string" && message.reasoning_content.trim()) {
        assistantMsg.reasoning_content = message.reasoning_content;
      }
      workMessages.push(assistantMsg);
      onEvent({ type: "assistant_tool_calls", message: assistantMsg, usage: message.usage });
      for (const toolCall of message.tool_calls) {
        onEvent({ type: "tool_call", toolCall });
      }
      const toolMessages = await runTools(message.tool_calls, {
        signal,
        enableToolResultTruncate: opts.enableToolResultTruncate,
        toolResultMaxChars: opts.toolResultMaxChars
      });
      for (const toolMessage of toolMessages) {
        workMessages.push(toolMessage);
        onEvent({ type: "tool_result", message: toolMessage });
      }
      continue;
    }

    const text = message.content ?? "";
    const memo = extractMemo(text);
    const summary = extractSummary(text);
    const replyMsg = {
      role: "assistant",
      content: text,
      ...(memo ? { memo } : {}),
      ...(summary ? { summary } : {}),
      ...(message.usage ? { usage: message.usage } : {})
    };
    workMessages.push(replyMsg);
    onEvent({ type: "done", message: replyMsg, text, usage: message.usage });
    return { text, messages: workMessages };
  }

  const text = "(达到最大轮次限制)";
  const replyMsg = { role: "assistant", content: text };
  workMessages.push(replyMsg);
  onEvent({ type: "done", message: replyMsg, text });
  return { text, messages: workMessages };
};

export { chat };
