import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { codexEnv } from "./status.js";

const CODEX_DIR = path.join(os.homedir(), ".codex");

const runCmd = (cmd, args, opts = {}) =>
  new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(cmd, args, { shell: false, env: codexEnv(), ...opts });
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", () => resolve({ ok: false, stdout, stderr, code: -1 }));
    child.on("close", (code) => resolve({ ok: code === 0, stdout, stderr, code }));
    setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, opts.timeoutMs || 15000);
  });

const safeStat = (p) => { try { return fs.statSync(p); } catch { return null; } };

const readTextFile = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };

// ---------- History ----------
const getHistory = ({ limit = 300 } = {}) => {
  const p = path.join(CODEX_DIR, "history.jsonl");
  if (!fs.existsSync(p)) return { items: [], total: 0 };
  const raw = fs.readFileSync(p, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  const total = lines.length;
  const slice = lines.slice(-limit);
  const items = slice.map((line) => {
    try {
      const o = JSON.parse(line);
      return {
        display: o.text || "",
        timestamp: o.ts ? o.ts * 1000 : null,
        sessionId: o.session_id || ""
      };
    } catch { return null; }
  }).filter(Boolean).reverse();
  return { items, total };
};

// ---------- Account ----------
const getAccount = async () => {
  const res = await runCmd("codex", ["login", "status"]);
  if (!res.ok) return { available: false, error: res.stderr || "login status failed" };
  // codex writes the status line to stderr when stdin isn't a TTY
  const text = (res.stdout.trim() || res.stderr.trim());
  const loggedIn = /logged in/i.test(text) && !/not logged in/i.test(text);
  let method = "";
  const m = text.match(/using\s+(.+)$/i);
  if (m) method = m[1].trim();
  return { available: true, loggedIn, authMethod: method, raw: text, command: "codex login status" };
};

// ---------- Settings (config.toml, raw text) ----------
const getSettings = () => {
  const p = path.join(CODEX_DIR, "config.toml");
  if (!fs.existsSync(p)) return { available: false };
  const content = readTextFile(p);
  if (content == null) return { available: false };
  const stat = safeStat(p);
  return {
    available: true,
    path: p,
    content,
    size: stat?.size || 0,
    modified: stat?.mtime?.toISOString() || null
  };
};

// ---------- MCP ----------
const getMcp = async () => {
  const res = await runCmd("codex", ["mcp", "list"]);
  if (!res.ok) return { available: false, error: res.stderr || "mcp list failed" };
  const text = res.stdout;
  const lines = text.split("\n").filter((l) => l.trim());
  if (!lines.length) return { available: true, configured: [], empty: true };
  // First line is the header "Name  Command  Args  Env  Cwd  Status  Auth"
  const servers = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    servers.push({
      name: cells[0] || "",
      command: cells[1] || "",
      args: cells[2] || "",
      env: cells[3] || "",
      cwd: cells[4] || "",
      status: cells[5] || "",
      auth: cells[6] || ""
    });
  }
  return { available: true, configured: servers, empty: servers.length === 0 };
};

// ---------- Skills ----------
const scanSkillsDir = (baseDir, source) => {
  const out = [];
  if (!fs.existsSync(baseDir)) return out;
  for (const e of fs.readdirSync(baseDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const skillMd = path.join(baseDir, e.name, "SKILL.md");
    if (!fs.existsSync(skillMd)) continue;
    const raw = readTextFile(skillMd);
    let description = "";
    if (raw) {
      const fm = raw.match(/^---\s*\n([\s\S]*?)\n---/);
      if (fm) {
        const m = fm[1].match(/^description:\s*(.*)$/mi);
        if (m) description = m[1].trim().replace(/^["']|["']$/g, "");
      }
      if (!description) {
        const m2 = raw.split("\n").find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---"));
        if (m2) description = m2.slice(0, 200);
      }
    }
    out.push({ name: e.name, description, source, path: skillMd });
  }
  return out;
};

const getSkills = () => {
  const userSkills = scanSkillsDir(path.join(CODEX_DIR, "skills"), "user");
  const systemSkills = scanSkillsDir(path.join(CODEX_DIR, "skills", ".system"), "system");
  return { user: userSkills, system: systemSkills };
};

// ---------- Memory (AGENTS.md) ----------
const getMemory = () => {
  const p = path.join(CODEX_DIR, "AGENTS.md");
  if (!fs.existsSync(p)) return { dir: CODEX_DIR, files: [] };
  const stat = safeStat(p);
  const raw = readTextFile(p);
  if (raw == null) return { dir: CODEX_DIR, files: [] };
  const truncated = raw.length > 6000;
  return {
    dir: CODEX_DIR,
    files: [{
      name: "AGENTS.md",
      path: p,
      size: stat?.size || 0,
      modified: stat?.mtime?.toISOString() || null,
      content: truncated ? raw.slice(0, 6000) : raw,
      truncated
    }]
  };
};

// ---------- Projects / Sessions (browse ~/.codex/sessions + session_index) ----------
const SESSIONS_DIR = path.join(CODEX_DIR, "sessions");
const SESSION_INDEX = path.join(CODEX_DIR, "session_index.jsonl");

const readSessionIndex = () => {
  if (!fs.existsSync(SESSION_INDEX)) return {};
  const raw = readTextFile(SESSION_INDEX);
  if (!raw) return {};
  const map = {};
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (o.id) map[o.id] = { threadName: o.thread_name || "", updatedAt: o.updated_at || "" };
    } catch {}
  }
  return map;
};

// Level 1: years
const getProjects = () => {
  if (!fs.existsSync(SESSIONS_DIR)) return { projects: [] };
  const years = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .reverse();
  const projects = years.map((year) => {
    const ypath = path.join(SESSIONS_DIR, year);
    let count = 0;
    let latest = "";
    try {
      for (const m of fs.readdirSync(ypath)) {
        const mpath = path.join(ypath, m);
        if (!safeStat(mpath)?.isDirectory()) continue;
        for (const d of fs.readdirSync(mpath)) {
          const dpath = path.join(mpath, d);
          if (!safeStat(dpath)?.isDirectory()) continue;
          for (const f of fs.readdirSync(dpath)) {
            if (!f.endsWith(".jsonl")) continue;
            count += 1;
            const st = safeStat(path.join(dpath, f));
            if (st && (!latest || st.mtime.toISOString() > latest)) {
              latest = st.mtime.toISOString();
            }
          }
        }
      }
    } catch {}
    return { year, sessionCount: count, lastActivity: latest };
  });
  return { projects };
};

const SAFE_SEGMENT = /^[\w.-]+$/;

// Level 2/3: drill into sessions/<year>/<month>/<day>/
const getProjectDir = (segments) => {
  const parts = Array.isArray(segments) ? segments : [];
  if (!parts.length) return { ok: false, error: "empty path" };
  if (!parts.every((p) => SAFE_SEGMENT.test(p))) return { ok: false, error: "invalid segment" };
  const target = path.join(SESSIONS_DIR, ...parts);
  if (!target.startsWith(SESSIONS_DIR + path.sep)) return { ok: false, error: "path traversal" };
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return { ok: false, error: "not a directory" };
  }

  const index = readSessionIndex();
  const subdirs = [];
  const sessions = [];
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, e.name);
    const stat = safeStat(full);
    if (!stat) continue;
    if (e.isDirectory()) {
      subdirs.push({ name: e.name, modified: stat.mtime?.toISOString() || null });
    } else if (e.name.endsWith(".jsonl")) {
      // filename: rollout-YYYY-MM-DDTHH-MM-SS-<uuid>.jsonl
      const m = e.name.match(/rollout-.*?-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i);
      const uuid = m ? m[1] : e.name.replace(/\.jsonl$/, "");
      const meta = index[uuid];
      sessions.push({
        name: e.name,
        sessionId: uuid,
        threadName: meta?.threadName || "",
        modified: stat.mtime?.toISOString() || null,
        size: stat.size
      });
    }
  }
  subdirs.sort((a, b) => a.name.localeCompare(b.name));
  sessions.sort((a, b) => (b.modified || "").localeCompare(a.modified || ""));
  return { ok: true, segments: parts, subdirs, sessions };
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const getProjectFile = (segments) => {
  const parts = Array.isArray(segments) ? segments : [];
  if (!parts.length) return { ok: false, error: "empty path" };
  if (!parts.every((p) => SAFE_SEGMENT.test(p))) return { ok: false, error: "invalid segment" };
  const target = path.join(SESSIONS_DIR, ...parts);
  if (!target.startsWith(SESSIONS_DIR + path.sep)) return { ok: false, error: "path traversal" };
  const stat = safeStat(target);
  if (!stat || !stat.isFile()) return { ok: false, error: "not a file" };
  try {
    const readLen = Math.min(stat.size, MAX_FILE_BYTES);
    const fd = fs.openSync(target, "r");
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
  getHistory,
  getAccount,
  getSettings,
  getMcp,
  getSkills,
  getMemory,
  getProjects,
  getProjectDir,
  getProjectFile
};
