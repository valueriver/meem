const buildLlmHeaders = (apiKey, apiUrl) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };
  if (String(apiUrl || "").includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "agent-cli";
  }
  return headers;
};

const normalizeUsage = (usage) => {
  if (!usage || typeof usage !== "object") return null;

  const promptTokens = Math.max(0, Number(usage.prompt_tokens) || 0);
  const completionTokens = Math.max(0, Number(usage.completion_tokens) || 0);
  const totalTokens = Math.max(
    0,
    Number(usage.total_tokens) || promptTokens + completionTokens
  );
  const cachedPromptTokens = Math.max(
    0,
    Number(usage.prompt_tokens_details?.cached_tokens) || 0
  );

  return {
    promptTokens,
    cachedPromptTokens,
    completionTokens,
    totalTokens
  };
};

export { buildLlmHeaders, normalizeUsage };
