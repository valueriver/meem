const buildLlmHeaders = (provider, apiUrl, apiKey) => {
  const headers = { "Content-Type": "application/json" };
  if (provider === "claude") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  if (apiUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "http://localhost:3000";
    headers["X-Title"] = "aios";
  }
  return headers;
};

export {
  buildLlmHeaders
};
