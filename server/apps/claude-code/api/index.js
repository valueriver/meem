import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { getClaudeStatus } from "../service/status.js";
import { runClaude } from "../service/runClaude.js";
import {
  listSessions,
  createSession,
  deleteSession,
  getSession,
  getMessages,
  getConversationContext
} from "../service/sessions.js";
import { appendEvent } from "../repository/events.js";
import { touchConversation, setConversationTitleIfEmpty, updateConversationPermissionMode } from "../repository/conversations.js";
import {
  getStats,
  getHistory,
  getAccount,
  getSettings,
  getAgents,
  getMcp,
  getPlans,
  getPlanContent,
  getSkills,
  getPlugins,
  getProjects,
  getProjectDir,
  getProjectFile,
  getMemory
} from "../service/introspect.js";
import { saveMemoryFile, saveSettings } from "../service/editor.js";

const handleClaudeCodeApi = async (req, res, path) => {
  if (path === "/apps/claude-code/status" && req.method === "GET") {
    return json(res, await getClaudeStatus());
  }

  // ---- Chat: conversations ----
  if (path === "/apps/claude-code/conversations" && req.method === "GET") {
    return json(res, { items: listSessions() });
  }
  if (path === "/apps/claude-code/conversations/create" && req.method === "POST") {
    const body = await readBody(req);
    const result = createSession({ cwd: body.cwd, permissionMode: body.permissionMode });
    if (result?.error) return json(res, { error: result.error }, 400);
    return json(res, { item: result });
  }
  if (path === "/apps/claude-code/conversations/delete" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.id) return json(res, { error: "id required" }, 400);
    const r = deleteSession(String(body.id));
    return json(res, r, r.ok ? 200 : 400);
  }

  // ---- Chat: messages ----
  if (path === "/apps/claude-code/messages" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sid = url.searchParams.get("conversationId");
    if (!sid) return json(res, { error: "conversationId required" }, 400);
    return json(res, getMessages(String(sid)));
  }

  // ---- Chat: send (streamed) ----
  if (path === "/apps/claude-code/send" && req.method === "POST") {
    return handleSend(req, res);
  }

  // ---- Introspection ----
  if (path === "/apps/claude-code/stats" && req.method === "GET") {
    return json(res, getStats());
  }
  if (path === "/apps/claude-code/history" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get("limit") || 200);
    const offset = Number(url.searchParams.get("offset") || 0);
    return json(res, getHistory({ limit, offset }));
  }
  if (path === "/apps/claude-code/account" && req.method === "GET") {
    return json(res, await getAccount());
  }
  if (path === "/apps/claude-code/settings" && req.method === "GET") {
    return json(res, getSettings());
  }
  if (path === "/apps/claude-code/agents" && req.method === "GET") {
    return json(res, await getAgents());
  }
  if (path === "/apps/claude-code/mcp" && req.method === "GET") {
    return json(res, await getMcp());
  }
  if (path === "/apps/claude-code/plans" && req.method === "GET") {
    return json(res, getPlans());
  }
  if (path === "/apps/claude-code/plans/file" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const slug = url.searchParams.get("slug") || "";
    const data = getPlanContent(slug);
    return json(res, data, data.ok ? 200 : 400);
  }
  if (path === "/apps/claude-code/skills" && req.method === "GET") {
    return json(res, getSkills());
  }
  if (path === "/apps/claude-code/plugins" && req.method === "GET") {
    return json(res, await getPlugins());
  }
  if (path === "/apps/claude-code/projects" && req.method === "GET") {
    return json(res, getProjects());
  }
  if (path === "/apps/claude-code/projects/dir" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const raw = url.searchParams.get("path") || "";
    const segments = raw.split("/").filter(Boolean);
    const data = getProjectDir(segments);
    return json(res, data, data.ok ? 200 : 400);
  }
  if (path === "/apps/claude-code/projects/file" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const raw = url.searchParams.get("path") || "";
    const segments = raw.split("/").filter(Boolean);
    const data = getProjectFile(segments);
    return json(res, data, data.ok ? 200 : 400);
  }
  if (path === "/apps/claude-code/memory" && req.method === "GET") {
    return json(res, getMemory());
  }
  if (path === "/apps/claude-code/memory/save" && req.method === "POST") {
    const body = await readBody(req);
    const result = saveMemoryFile({ name: body.name, content: body.content });
    return json(res, result, result.ok ? 200 : 400);
  }
  if (path === "/apps/claude-code/settings/save" && req.method === "POST") {
    const body = await readBody(req);
    const result = saveSettings({ content: body.content });
    return json(res, result, result.ok ? 200 : 400);
  }

  return false;
};

const handleSend = async (req, res) => {
  const body = await readBody(req);
  const sid = String(body.conversationId || "").trim();
  const message = String(body.message || "").trim();
  const requestedPermissionMode = String(body.permissionMode || "").trim();
  const effectivePermissionMode = requestedPermissionMode || "default";
  if (!sid || !message) {
    return json(res, { error: "conversationId and message required" }, 400);
  }
  const sess = getSession(sid);
  if (!sess) return json(res, { error: "conversation not found" }, 404);
  const ctx = getConversationContext(sid);
  if (!ctx) return json(res, { error: "conversation not found" }, 404);

  updateConversationPermissionMode(ctx.id, effectivePermissionMode);

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    Connection: "keep-alive"
  });

  const write = (obj) => {
    if (res.writableEnded) return;
    res.write(JSON.stringify(obj) + "\n");
  };

  // 1. Persist the user turn as a synthetic event before claude starts
  appendEvent(ctx.id, "user_turn", {
    type: "user",
    message: { role: "user", content: message }
  });
  // Use first user prompt as title if not set
  setConversationTitleIfEmpty(ctx.id, message.slice(0, 80));

  let eventCount = 1; // the user_turn we just wrote
  const onEvent = (evt) => {
    try { appendEvent(ctx.id, "claude_event", evt); eventCount += 1; } catch {}
    write({ type: "event", payload: evt });
  };
  const onDone = () => {
    touchConversation(ctx.id, eventCount);
    write({ type: "done" });
    res.end();
  };
  const onError = (err) => {
    touchConversation(ctx.id, eventCount);
    write({ type: "error", message: err?.message || String(err) });
    res.end();
  };

  runClaude({
    sessionId: sess.sessionId,
    started: Boolean(ctx.started),
    cwd: sess.cwd,
    permissionMode: effectivePermissionMode,
    prompt: message,
    onEvent,
    onDone,
    onError
  });
};

export { handleClaudeCodeApi };
