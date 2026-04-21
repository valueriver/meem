import { buildLlmHeaders } from "./common.js";
import { parseJson } from "../../shared/json/parse.js";

const ensureToolCall = (toolCalls, index) => {
  if (!toolCalls[index]) {
    toolCalls[index] = {
      id: "",
      type: "function",
      function: { name: "", arguments: "" }
    };
  }
  return toolCalls[index];
};

const parseOpenAiDelta = (json, state, onDelta) => {
  const choice = json?.choices?.[0];
  if (!choice) return;
  const delta = choice.delta || {};
  const text = typeof delta.content === "string" ? delta.content : "";
  if (text) {
    state.content += text;
    onDelta?.(text);
  }
  if (Array.isArray(delta.tool_calls)) {
    for (const tc of delta.tool_calls) {
      const idx = Number(tc?.index || 0);
      const target = ensureToolCall(state.toolCalls, idx);
      if (tc?.id) target.id = tc.id;
      if (tc?.type) target.type = tc.type;
      if (tc?.function?.name) target.function.name += tc.function.name;
      if (tc?.function?.arguments) target.function.arguments += tc.function.arguments;
    }
  }
};

const callLlmStream = async (provider, apiUrl, apiKey, payload, { signal, onDelta } = {}) => {
  const streamPayload = { ...payload, stream: true };
  const state = { content: "", toolCalls: [] };
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: buildLlmHeaders(provider, apiUrl, apiKey),
      body: JSON.stringify(streamPayload),
      signal
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM ${res.status}: ${text}`);
    }
    if (!res.body) throw new Error("LLM stream body is empty");
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep = buffer.indexOf("\n\n");
      while (sep >= 0) {
        const event = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        sep = buffer.indexOf("\n\n");
        const lines = event.split("\n").map((line) => line.trim()).filter(Boolean);
        const dataLines = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
        if (!dataLines.length) continue;
        const raw = dataLines.join("\n");
        if (!raw || raw === "[DONE]") continue;
        const json = parseJson(raw, "llm.stream.chunk");
        parseOpenAiDelta(json, state, onDelta);
      }
    }
    if (state.toolCalls.length > 0) {
      return {
        role: "assistant",
        content: state.content || null,
        tool_calls: state.toolCalls.filter(Boolean)
      };
    }
    return { role: "assistant", content: state.content };
  } catch (error) {
    throw error;
  }
};

export {
  callLlmStream
};
