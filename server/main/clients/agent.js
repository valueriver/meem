const AGENT_PORT = Number(process.env.ROAM_AGENT_PORT || process.env.AGENT_PORT || 9507);
const AGENT_ORIGIN = process.env.ROAM_AGENT_ORIGIN || `http://127.0.0.1:${AGENT_PORT}`;

const stripHopHeaders = (headers = {}) => {
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (["host", "connection", "upgrade", "proxy-connection", "keep-alive", "transfer-encoding", "te", "trailer"].includes(lower)) {
      continue;
    }
    if (Array.isArray(value)) out[key] = value.join(", ");
    else if (typeof value === "string") out[key] = value;
  }
  return out;
};

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const agentUrl = (path) => `${AGENT_ORIGIN}${path}`;

const requestAgentJson = async (path, { method = "GET", body, headers = {} } = {}) => {
  const response = await fetch(agentUrl(path), {
    method,
    headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `agent ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

const proxyAgentRequest = async (req, res, pathAndSearch) => {
  const method = req.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  const upstream = await fetch(agentUrl(pathAndSearch), {
    method,
    headers: stripHopHeaders(req.headers),
    body: hasBody ? await readRawBody(req) : undefined
  });
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "content-encoding") res.setHeader(key, value);
  });
  res.writeHead(upstream.status);
  if (upstream.body) {
    for await (const chunk of upstream.body) res.write(chunk);
  }
  res.end();
};

export {
  AGENT_ORIGIN,
  proxyAgentRequest,
  requestAgentJson
};
