import { buildLlmHeaders } from "../common.js";
import { parseJson } from "../../../shared/json/parse.js";
import { geminiParser } from "./parsers/gemini.js";
import { kimiParser } from "./parsers/kimi.js";
import { openaiParser } from "./parsers/openai.js";

const pickParser = (provider, apiUrl) => {
  const url = String(apiUrl || "");
  if (provider === "kimi" || url.includes("moonshot.cn") || url.includes("kimi.com")) {
    return kimiParser;
  }
  if (provider === "gemini" || url.includes("/gemini/")) {
    return geminiParser;
  }
  return openaiParser;
};

const callLlmStream = async (provider, apiUrl, apiKey, payload, { signal, onDelta } = {}) => {
  const parser = pickParser(provider, apiUrl);
  const streamPayload = { ...payload, stream: true };
  const state = parser.createState();
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
        parser.parseChunk(json, state, onDelta);
      }
    }
    return parser.toMessage(state, { provider, apiUrl });
  } catch (error) {
    throw error;
  }
};

export { callLlmStream };
