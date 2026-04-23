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
const WORKSPACE_ROOT = path.join(ROOT_DIR, "files", "workspaces", "codex");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const THREAD_FILE = ".aios-codex-thread";
const CWD_POINTER = ".aios-cwd";
const VALID_PERMISSION_MODES = new Set(["workspaceWrite", "readOnly", "fullAuto", "neverAsk", "dangerFullAccess", "bypassPermissions"]);

const expandHome = (p) => {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
};

const resolveRealCwd = (sessionDir) => {
  const pointer = path.join(sessionDir, CWD_POINTER);
  try {
    if (fs.existsSync(pointer)) {
      const raw = fs.readFileSync(pointer, "utf8").trim();
      if (raw) return raw;
    }
  } catch {}
  return sessionDir;
};

// thread-id storage always in the session registry dir, not the real cwd
const sessionRegistryDir = (sessionId) => path.join(WORKSPACE_ROOT, sessionId);

const readThreadId = (cwdOrRegistry) => {
  // Accept either the real cwd (old callers) or the registry dir.
  // Prefer the registry dir where we actually write the pointer.
  const candidates = [cwdOrRegistry];
  const maybeUuid = path.basename(cwdOrRegistry);
  if (UUID_RE.test(maybeUuid)) candidates.push(cwdOrRegistry);
  for (const c of candidates) {
    try {
      const f = path.join(c, THREAD_FILE);
      if (fs.existsSync(f)) return fs.readFileSync(f, "utf8").trim();
    } catch {}
  }
  return "";
};

const writeThreadId = (sessionDirOrCwd, id) => {
  try { fs.writeFileSync(path.join(sessionDirOrCwd, THREAD_FILE), id + "\n", "utf8"); } catch {}
};

const extractText = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((item) => item?.type === "text" && typeof item.text === "string")
      .map((item) => item.text)
      .join(" ")
      .trim();
  }
  return "";
};

const toSessionShape = (row) => ({
  sessionId: row.sessionId,
  cwd: row.cwd,
  permissionMode: row.permissionMode || "workspaceWrite",
  title: row.title,
  messageCount: row.messageCount,
  createdAt: row.createdAt,
  lastTs: row.updatedAt,
  updatedAt: row.updatedAt
});

const parseSessionMeta = (sessionId, cwd, registryDir) => {
  const regDir = registryDir || sessionRegistryDir(sessionId);
  const threadId = readThreadId(regDir) || readThreadId(cwd);
  const row = getConversationBySessionId(sessionId);
  return {
    sessionId,
    cwd,
    registryDir: regDir,
    threadId,
    started: Boolean(threadId),
    permissionMode: row?.permissionMode || "workspaceWrite",
    title: row?.title || "",
    messageCount: row?.messageCount || 0,
    createdAt: row?.createdAt || "",
    lastTs: row?.updatedAt || "",
    updatedAt: row?.updatedAt || ""
  };
};

const listSessions = () => {
  return listConversations().map((row) => {
    const sessionDir = sessionRegistryDir(row.sessionId);
    return {
      ...toSessionShape(row),
      registryDir: sessionDir,
      threadId: readThreadId(sessionDir),
      started: row.messageCount > 0
    };
  });
};

const createSession = ({ cwd, permissionMode } = {}) => {
  const sessionId = randomUUID();
  const sessionDir = sessionRegistryDir(sessionId);
  let targetCwd;
  const normalizedPermissionMode = VALID_PERMISSION_MODES.has(permissionMode) ? permissionMode : "workspaceWrite";
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
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(path.join(sessionDir, CWD_POINTER), targetCwd + "\n", "utf8");
  } else {
    targetCwd = sessionDir;
    fs.mkdirSync(targetCwd, { recursive: true });
  }
  insertConversation({ sessionId, cwd: targetCwd, permissionMode: normalizedPermissionMode, title: "" });
  return parseSessionMeta(sessionId, targetCwd, sessionDir);
};

const deleteSession = (sessionId) => {
  if (!UUID_RE.test(sessionId)) return { ok: false, error: "invalid session id" };
  const sessionDir = sessionRegistryDir(sessionId);
  if (!sessionDir.startsWith(WORKSPACE_ROOT + path.sep)) return { ok: false, error: "path traversal" };
  try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
  deleteConversationBySessionId(sessionId);
  return { ok: true };
};

const getSession = (sessionId) => {
  if (!UUID_RE.test(sessionId)) return null;
  const row = getConversationBySessionId(sessionId);
  if (!row) return null;
  const sessionDir = sessionRegistryDir(sessionId);
  if (!fs.existsSync(sessionDir)) return null;
  const cwd = resolveRealCwd(sessionDir);
  return parseSessionMeta(sessionId, cwd, sessionDir);
};

const getConversationContext = (sessionId) => {
  const row = getConversationBySessionId(sessionId);
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.sessionId,
    cwd: row.cwd,
    permissionMode: row.permissionMode || "workspaceWrite",
    started: row.messageCount > 0
  };
};

const getMessages = (sessionId) => {
  if (!UUID_RE.test(sessionId)) return { items: [] };
  const row = getConversationBySessionId(sessionId);
  if (!row) return { items: [] };
  const events = listEvents(row.id);
  const items = [];
  let assistantEvents = [];
  let assistantId = 0;

  const flushAssistant = () => {
    if (!assistantEvents.length) return;
    items.push({
      id: `a-${sessionId}-${assistantId}`,
      role: "assistant",
      content: "",
      meta: { events: assistantEvents }
    });
    assistantId += 1;
    assistantEvents = [];
  };

  for (const ev of events) {
    const payload = ev.payload;
    if (!payload) continue;
    if (ev.kind === "user_turn") {
      flushAssistant();
      const content = typeof payload.message === "string"
        ? payload.message
        : extractText(payload.message?.content) || "";
      items.push({
        id: `u-${sessionId}-${items.length}`,
        role: "user",
        content
      });
      continue;
    }

    if (ev.kind === "codex_event") {
      if (payload.type === "user" && payload.message?.content) {
        const blocks = payload.message.content;
        const onlyToolResults = Array.isArray(blocks) && blocks.every((b) => b?.type === "tool_result");
        if (onlyToolResults) {
          assistantEvents.push(payload);
          continue;
        }
        flushAssistant();
        const text = typeof payload.message.content === "string"
          ? payload.message.content
          : Array.isArray(payload.message.content)
            ? payload.message.content.find((b) => b?.type === "text")?.text || ""
            : "";
        items.push({
          id: `u-${sessionId}-${items.length}`,
          role: "user",
          content: text
        });
        continue;
      }

      if (payload.type === "assistant" || payload.type === "system" || payload.type === "result") {
        assistantEvents.push(payload);
      }
    }
  }

  flushAssistant();
  return { items };
};

export {
  listSessions,
  createSession,
  deleteSession,
  getSession,
  getConversationContext,
  getMessages,
  writeThreadId,
  readThreadId
};
