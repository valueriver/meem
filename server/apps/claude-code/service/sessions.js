import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  insertConversation,
  getConversationBySessionId,
  listConversations,
  deleteConversationBySessionId
} from "../repository/conversations.js";
import { listEvents } from "../repository/events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..", "..", "..");
const WORKSPACE_ROOT = path.join(ROOT_DIR, "files", "workspaces", "claude-code");
const CLAUDE_DIR = path.join(os.homedir(), ".claude");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CWD_POINTER = ".aios-cwd";

const expandHome = (p) => {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
};

const ensureWorkspace = (sessionId, realCwd) => {
  const sessionDir = path.join(WORKSPACE_ROOT, sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });
  if (realCwd && realCwd !== sessionDir) {
    fs.writeFileSync(path.join(sessionDir, CWD_POINTER), realCwd + "\n", "utf8");
  }
  return sessionDir;
};

const toSessionShape = (row) => ({
  sessionId: row.sessionId,
  cwd: row.cwd,
  permissionMode: row.permissionMode || "default",
  title: row.title,
  messageCount: row.messageCount,
  createdAt: row.createdAt,
  lastTs: row.updatedAt,
  updatedAt: row.updatedAt,
  started: row.messageCount > 0
});

const listSessionsFromDb = () => {
  return listConversations().map(toSessionShape);
};

const VALID_PERMISSION_MODES = new Set(["acceptEdits", "auto", "bypassPermissions", "default", "dontAsk", "plan"]);

const createSession = ({ cwd, permissionMode } = {}) => {
  const sessionId = randomUUID();
  let targetCwd;
  const normalizedPermissionMode = VALID_PERMISSION_MODES.has(permissionMode) ? permissionMode : "default";
  const trimmed = typeof cwd === "string" ? expandHome(cwd.trim()) : "";
  if (trimmed) {
    if (!path.isAbsolute(trimmed)) return { error: "cwd 必须是绝对路径" };
    targetCwd = path.resolve(trimmed);
    try {
      if (!fs.existsSync(targetCwd)) fs.mkdirSync(targetCwd, { recursive: true });
      else if (!fs.statSync(targetCwd).isDirectory()) return { error: "cwd 存在但不是目录" };
    } catch (err) {
      return { error: err?.message || "无法访问该目录" };
    }
  } else {
    targetCwd = path.join(WORKSPACE_ROOT, sessionId);
  }
  ensureWorkspace(sessionId, targetCwd);
  insertConversation({ sessionId, cwd: targetCwd, permissionMode: normalizedPermissionMode, title: "" });
  return toSessionShape(getConversationBySessionId(sessionId));
};

const deleteSession = (sessionId) => {
  if (!UUID_RE.test(sessionId)) return { ok: false, error: "invalid session id" };
  const sessionDir = path.join(WORKSPACE_ROOT, sessionId);
  if (!sessionDir.startsWith(WORKSPACE_ROOT + path.sep)) return { ok: false, error: "path traversal" };
  try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
  deleteConversationBySessionId(sessionId);
  return { ok: true };
};

const getSession = (sessionId) => {
  if (!UUID_RE.test(sessionId)) return null;
  const row = getConversationBySessionId(sessionId);
  if (!row) return null;
  return toSessionShape(row);
};

// Internal helper — returns the conversation row id (numeric PK) plus real cwd.
// Used by the API layer when persisting events during streaming.
const getConversationContext = (sessionId) => {
  const row = getConversationBySessionId(sessionId);
  if (!row) return null;
  return { id: row.id, sessionId: row.sessionId, cwd: row.cwd, permissionMode: row.permissionMode || "default", started: row.messageCount > 0 };
};

// Replay events from DB into the UI-renderable shape:
//   { role: 'user', content } — for user turns (synthetic events we stored)
//   { role: 'assistant', meta: { events: [...] } } — for one assistant turn
// The events for a single assistant turn can span multiple claude events
// (assistant text, tool_use, and corresponding user/tool_result replies).
const getMessages = (sessionId) => {
  const row = getConversationBySessionId(sessionId);
  if (!row) return { items: [] };
  const events = listEvents(row.id);

  const items = [];
  let assistantEvents = [];
  let assistantId = 0;
  const flushAssistant = () => {
    if (!assistantEvents.length) return;
    items.push({
      id: `a-${row.id}-${assistantId}`,
      role: "assistant",
      content: "",
      meta: { events: assistantEvents }
    });
    assistantId += 1;
    assistantEvents = [];
  };

  for (const ev of events) {
    const p = ev.payload;
    if (!p) continue;
    // A "user" event we synthesized (our own user turn text)
    if (ev.kind === "user_turn") {
      flushAssistant();
      items.push({
        id: `u-${row.id}-${ev.seq}`,
        role: "user",
        content: (p.message?.content) || ""
      });
      continue;
    }
    // A raw claude stream event
    if (p.type === "user" && p.message?.content) {
      // tool_result entries — attach to the current assistant turn
      const c = p.message.content;
      const onlyToolResults = Array.isArray(c) && c.every((b) => b?.type === "tool_result");
      if (onlyToolResults) {
        assistantEvents.push(p);
        continue;
      }
      // user text message echoed by replay — treat as user turn boundary
      flushAssistant();
      let text = "";
      if (typeof c === "string") text = c;
      else if (Array.isArray(c)) text = c.find((b) => b.type === "text")?.text || "";
      items.push({
        id: `u-${row.id}-${ev.seq}`,
        role: "user",
        content: text
      });
    } else if (p.type === "assistant") {
      assistantEvents.push(p);
    } else if (p.type === "system" || p.type === "result") {
      // keep with current assistant group (or ignore)
      assistantEvents.push(p);
    }
  }
  flushAssistant();
  return { items };
};

export {
  createSession,
  deleteSession,
  getSession,
  getMessages,
  listSessionsFromDb as listSessions,
  getConversationContext
};
