import { buildLlmHeaders, normalizeUsage } from "./common.js";

const callLlmRegular = async (apiUrl, apiKey, payload, { signal } = {}) => {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: buildLlmHeaders(apiKey, apiUrl),
    body: JSON.stringify(payload),
    signal
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text}`);
  }

  const json = await res.json();
  const message = json?.choices?.[0]?.message;
  if (!message) {
    throw new Error("LLM response missing choices[0].message");
  }

  return {
    role: "assistant",
    content: message.content ?? "",
    tool_calls: Array.isArray(message.tool_calls) ? message.tool_calls : undefined,
    usage: normalizeUsage(json?.usage)
  };
};

export { callLlmRegular };
