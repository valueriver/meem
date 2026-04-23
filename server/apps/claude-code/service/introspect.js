import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const CLAUDE_DIR = path.join(os.homedir(), ".claude");

const runCmd = (cmd, args, opts = {}) =>
  new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(cmd, args, { shell: false, ...opts });
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", () => resolve({ ok: false, stdout, stderr, code: -1 }));
    child.on("close", (code) => resolve({ ok: code === 0, stdout, stderr, code }));
    // safety timeout
    setTimeout(() => {
      try { child.kill("SIGKILL"); } catch {}
    }, opts.timeoutMs || 30000);
  });

const readJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};

const safeStat = (p) => {
  try { return fs.statSync(p); } catch { return null; }
};

// ---------- Stats ----------
const getStats = () => {
  const raw = readJson(path.join(CLAUDE_DIR, "stats-cache.json"));
  if (!raw) return { available: false };
  return { available: true, ...raw };
};

// ---------- History ----------
const getHistory = ({ limit = 200, offset = 0 } = {}) => {
  const p = path.join(CLAUDE_DIR, "history.jsonl");
  if (!fs.existsSync(p)) return { items: [], total: 0 };
  const raw = fs.readFileSync(p, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  const total = lines.length;
  // show most recent first
  const slice = lines.slice(-limit - offset, total - offset || undefined);
  const items = slice.map((line) => {
    try {
      const obj = JSON.parse(line);
      return {
        display: obj.display || "",
        timestamp: obj.timestamp,
        project: obj.project || "",
        sessionId: obj.sessionId || ""
      };
    } catch {
      return null;
    }
  }).filter(Boolean).reverse();
  return { items, total };
};

// ---------- Account ----------
const getAccount = async () => {
  const res = await runCmd("claude", ["auth", "status", "--json"]);
  if (!res.ok) return { available: false, error: res.stderr || "auth status failed" };
  try {
    return { available: true, ...JSON.parse(res.stdout) };
  } catch {
    return { available: false, error: "parse error", raw: res.stdout };
  }
};

// ---------- Settings ----------
const getSettings = () => {
  const p = path.join(CLAUDE_DIR, "settings.json");
  const raw = readJson(p);
  if (!raw) return { available: false };
  return { available: true, settings: raw };
};

// ---------- Agents ----------
const getAgents = async () => {
  const res = await runCmd("claude", ["agents"]);
  if (!res.ok) return { available: false, error: res.stderr };
  const text = res.stdout;
  const lines = text.split("\n").map((l) => l.trim());
  const agents = [];
  let currentGroup = null;
  for (const line of lines) {
    if (/^Built-in agents:/.test(line)) currentGroup = "built-in";
    else if (/^User agents:|^Project agents:/.test(line)) currentGroup = line.replace(":", "");
    else {
      // "  claude-code-guide · haiku"
      const m = line.match(/^([A-Za-z][\w-]*)\s*·\s*(.+)$/);
      if (m) agents.push({ name: m[1], model: m[2].trim(), group: currentGroup });
    }
  }
  const totalLine = lines.find((l) => /active agent/.test(l));
  return { available: true, total: totalLine || `${agents.length} agents`, agents };
};

// ---------- MCP ----------
const getMcp = async () => {
  const res = await runCmd("claude", ["mcp", "list"]);
  if (!res.ok) return { available: false, error: res.stderr };
  const text = res.stdout.trim();
  if (/No MCP servers configured/i.test(text)) {
    return { available: true, configured: [], empty: true };
  }
  // naive parse: lines like "  name: <url or cmd>"
  const configured = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([\w-]+):\s*(.+)$/);
    if (m) configured.push({ name: m[1], target: m[2].trim() });
  }
  return { available: true, configured, empty: configured.length === 0 };
};

// ---------- Plans ----------
const getPlans = () => {
  const dir = path.join(CLAUDE_DIR, "plans");
  if (!fs.existsSync(dir)) return { items: [] };
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"));
  const items = entries.map((e) => {
    const full = path.join(dir, e.name);
    const stat = safeStat(full);
    let preview = "";
    let title = e.name.replace(/\.md$/, "");
    try {
      const head = fs.readFileSync(full, "utf8").split("\n").slice(0, 8).join("\n");
      preview = head;
      const m = head.match(/^#\s+(.+)$/m);
      if (m) title = m[1].trim();
    } catch {}
    return {
      slug: e.name.replace(/\.md$/, ""),
      title,
      preview,
      sizeBytes: stat?.size || 0,
      modified: stat?.mtime?.toISOString() || null
    };
  }).sort((a, b) => (b.modified || "").localeCompare(a.modified || ""));
  return { items };
};

const getPlanContent = (slug) => {
  if (!slug || !/^[\w.-]+$/.test(slug)) {
    return { ok: false, error: "invalid slug" };
  }
  const full = path.join(CLAUDE_DIR, "plans", `${slug}.md`);
  if (!full.startsWith(path.join(CLAUDE_DIR, "plans") + path.sep)) {
    return { ok: false, error: "path traversal" };
  }
  if (!fs.existsSync(full)) return { ok: false, error: "not found" };
  try {
    const raw = fs.readFileSync(full, "utf8");
    const stat = fs.statSync(full);
    return {
      ok: true,
      slug,
      content: raw,
      size: stat.size,
      modified: stat.mtime?.toISOString() || null
    };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
};

// ---------- Skills ----------
const parseSkillFile = (filePath, source) => {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const fm = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    let name = path.basename(filePath, ".md");
    let description = "";
    if (fm) {
      for (const line of fm[1].split("\n")) {
        const m = line.match(/^(\w+):\s*(.*)$/);
        if (m) {
          const [, k, v] = m;
          if (k === "name") name = v.trim().replace(/^["']|["']$/g, "");
          if (k === "description") description = v.trim().replace(/^["']|["']$/g, "");
        }
      }
    }
    return { name, description, source, filePath };
  } catch {
    return null;
  }
};

const scanSkillsDir = (baseDir, source) => {
  const out = [];
  if (!fs.existsSync(baseDir)) return out;
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      const skillMd = path.join(baseDir, e.name, "SKILL.md");
      if (fs.existsSync(skillMd)) {
        const s = parseSkillFile(skillMd, source);
        if (s) out.push({ ...s, slug: e.name });
      }
    } else if (e.isFile() && e.name.endsWith(".md")) {
      const s = parseSkillFile(path.join(baseDir, e.name), source);
      if (s) out.push({ ...s, slug: e.name.replace(/\.md$/, "") });
    }
  }
  return out;
};

const getSkills = () => {
  const user = scanSkillsDir(path.join(CLAUDE_DIR, "skills"), "user");
  const plugins = [];
  const pluginRoot = path.join(CLAUDE_DIR, "plugins", "cache");
  if (fs.existsSync(pluginRoot)) {
    for (const mp of fs.readdirSync(pluginRoot)) {
      const mpDir = path.join(pluginRoot, mp);
      if (!safeStat(mpDir)?.isDirectory()) continue;
      for (const plugin of fs.readdirSync(mpDir)) {
        const plugDir = path.join(mpDir, plugin);
        if (!safeStat(plugDir)?.isDirectory()) continue;
        for (const ver of fs.readdirSync(plugDir)) {
          const skillsDir = path.join(plugDir, ver, "skills");
          const commandsDir = path.join(plugDir, ver, "commands");
          for (const d of [skillsDir, commandsDir]) {
            plugins.push(...scanSkillsDir(d, `${plugin}@${mp}`));
          }
        }
      }
    }
  }
  return { user, plugins };
};

// ---------- Plugins ----------
let pluginCache = { at: 0, data: null };
const getPlugins = async () => {
  const now = Date.now();
  if (pluginCache.data && now - pluginCache.at < 5 * 60 * 1000) {
    return pluginCache.data;
  }
  const res = await runCmd("claude", ["plugin", "list", "--json", "--available"], { timeoutMs: 45000 });
  if (!res.ok) return { ok: false, error: res.stderr || "plugin list failed", installed: [], marketplace: [] };
  try {
    const parsed = JSON.parse(res.stdout);
    const data = {
      ok: true,
      installed: parsed.installed || [],
      marketplace: parsed.available || []
    };
    pluginCache = { at: now, data };
    return data;
  } catch {
    return { ok: false, error: "parse error", installed: [], marketplace: [] };
  }
};

// ---------- Memory (CLAUDE.md / AGENTS.md) ----------
const MEMORY_FILENAMES = ["CLAUDE.md"];
const MEMORY_PREVIEW_BYTES = 6000;

const readMemoryFile = (fullPath, name) => {
  try {
    const stat = fs.statSync(fullPath);
    const raw = fs.readFileSync(fullPath, "utf8");
    const truncated = raw.length > MEMORY_PREVIEW_BYTES;
    return {
      name,
      path: fullPath,
      size: stat.size,
      modified: stat.mtime?.toISOString() || null,
      content: truncated ? raw.slice(0, MEMORY_PREVIEW_BYTES) : raw,
      truncated
    };
  } catch {
    return null;
  }
};

const getMemory = () => {
  const files = [];
  for (const name of MEMORY_FILENAMES) {
    const p = path.join(CLAUDE_DIR, name);
    if (fs.existsSync(p)) {
      const file = readMemoryFile(p, name);
      if (file) files.push(file);
    }
  }
  return { dir: CLAUDE_DIR, files };
};

// ---------- Projects (plain file-browser) ----------
const readSessionMeta = (filePath) => {
  const stat = safeStat(filePath);
  if (!stat) return null;
  const sessionId = path.basename(filePath).replace(/\.jsonl$/, "");
  let firstPrompt = "";
  let messageCount = 0;
  let firstTs = "";
  const lastTs = stat.mtime?.toISOString() || "";
  let model = "";
  let gitBranch = "";
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    messageCount = lines.filter((l) => {
      try { const o = JSON.parse(l); return o.type === "user" || o.type === "assistant"; } catch { return false; }
    }).length;
    for (const line of lines.slice(0, 20)) {
      try {
        const o = JSON.parse(line);
        if (!firstTs && o.timestamp) firstTs = o.timestamp;
        if (!gitBranch && o.gitBranch) gitBranch = o.gitBranch;
        if (o.type === "user" && o.message?.content && !firstPrompt) {
          const c = o.message.content;
          firstPrompt = typeof c === "string"
            ? c
            : Array.isArray(c) ? (c.find((b) => b.type === "text")?.text || "") : "";
        }
        if (o.type === "assistant" && o.message?.model && !model) model = o.message.model;
      } catch {}
    }
  } catch {}
  return {
    sessionId,
    firstPrompt: firstPrompt.slice(0, 160),
    messageCount,
    firstTs,
    lastTs,
    model,
    gitBranch,
    sizeBytes: stat.size
  };
};

const decodeDirName = (dirName) => "/" + dirName.replace(/^-/, "").replace(/-/g, "/");

const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects");

// Level 1: list of top-level encoded dirs with a quick count + latest activity.
const getProjects = () => {
  if (!fs.existsSync(PROJECTS_DIR)) return { projects: [] };
  const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory());

  const projects = [];
  for (const d of dirs) {
    const dir = path.join(PROJECTS_DIR, d.name);
    let sessionCount = 0;
    let subdirCount = 0;
    let lastActivity = "";
    let totalSize = 0;
    try {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        const stat = safeStat(full);
        if (!stat) continue;
        if (e.isDirectory()) subdirCount += 1;
        else if (e.name.endsWith(".jsonl")) {
          sessionCount += 1;
          totalSize += stat.size;
          const ts = stat.mtime?.toISOString() || "";
          if (ts > lastActivity) lastActivity = ts;
        }
      }
    } catch {}
    projects.push({
      dirName: d.name,
      cwd: decodeDirName(d.name),
      sessionCount,
      subdirCount,
      lastActivity,
      totalSize
    });
  }
  projects.sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || ""));
  return { projects };
};

const SAFE_PROJECT_SEGMENT = /^[\w.@-]+$/;

// Level 2: list everything inside one encoded project dir.
// `segments` is a relative path array (e.g. ["-Users-foo-bar"] or
// ["-Users-foo-bar", "88db1cb6-..."]).
const getProjectDir = (segments) => {
  const parts = Array.isArray(segments) ? segments : [];
  if (!parts.length) return { ok: false, error: "empty path" };
  if (!parts.every((p) => SAFE_PROJECT_SEGMENT.test(p))) {
    return { ok: false, error: "invalid path segment" };
  }
  const target = path.join(PROJECTS_DIR, ...parts);
  if (!target.startsWith(PROJECTS_DIR + path.sep) && target !== PROJECTS_DIR) {
    return { ok: false, error: "path traversal" };
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return { ok: false, error: "not a directory" };
  }

  const sessions = [];
  const files = [];
  const subdirs = [];
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, e.name);
    const stat = safeStat(full);
    if (!stat) continue;
    if (e.isDirectory()) {
      subdirs.push({ name: e.name, modified: stat.mtime?.toISOString() || null });
    } else if (e.name.endsWith(".jsonl")) {
      const meta = readSessionMeta(full);
      if (meta) sessions.push(meta);
    } else {
      files.push({ name: e.name, size: stat.size, modified: stat.mtime?.toISOString() || null });
    }
  }
  sessions.sort((a, b) => (b.lastTs || "").localeCompare(a.lastTs || ""));
  subdirs.sort((a, b) => a.name.localeCompare(b.name));

  return {
    ok: true,
    segments: parts,
    isRootProject: parts.length === 1,
    cwd: parts.length === 1 ? decodeDirName(parts[0]) : null,
    sessions,
    subdirs,
    files
  };
};

const MAX_PROJECT_FILE_BYTES = 2 * 1024 * 1024; // 2 MB display cap

// Read any file inside ~/.claude/projects/, with path guarding.
const getProjectFile = (segments) => {
  const parts = Array.isArray(segments) ? segments : [];
  if (!parts.length) return { ok: false, error: "empty path" };
  if (!parts.every((p) => SAFE_PROJECT_SEGMENT.test(p))) {
    return { ok: false, error: "invalid path segment" };
  }
  const target = path.join(PROJECTS_DIR, ...parts);
  if (!target.startsWith(PROJECTS_DIR + path.sep)) {
    return { ok: false, error: "path traversal" };
  }
  const stat = safeStat(target);
  if (!stat || !stat.isFile()) return { ok: false, error: "not a file" };

  try {
    const fd = fs.openSync(target, "r");
    const readLen = Math.min(stat.size, MAX_PROJECT_FILE_BYTES);
    const buf = Buffer.alloc(readLen);
    fs.readSync(fd, buf, 0, readLen, 0);
    fs.closeSync(fd);
    return {
      ok: true,
      name: parts[parts.length - 1],
      path: parts.join("/"),
      size: stat.size,
      modified: stat.mtime?.toISOString() || null,
      content: buf.toString("utf8"),
      truncated: stat.size > readLen
    };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
};

export {
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
};
