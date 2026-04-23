import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const MEMORY_FILES = new Set(["CLAUDE.md"]);
const MAX_MEMORY_BYTES = 1024 * 1024; // 1 MB
const MAX_SETTINGS_BYTES = 200 * 1024; // 200 KB

const atomicWrite = (targetPath, content) => {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, targetPath);
};

const saveMemoryFile = ({ name, content }) => {
  if (!MEMORY_FILES.has(name)) {
    return { ok: false, error: `filename not allowed: ${name}` };
  }
  const str = typeof content === "string" ? content : "";
  if (Buffer.byteLength(str, "utf8") > MAX_MEMORY_BYTES) {
    return { ok: false, error: "content exceeds 1 MB" };
  }
  const full = path.join(CLAUDE_DIR, name);
  try {
    atomicWrite(full, str);
    const stat = fs.statSync(full);
    return { ok: true, path: full, size: stat.size, modified: stat.mtime?.toISOString() };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
};

const saveSettings = ({ content }) => {
  const str = typeof content === "string" ? content : "";
  if (Buffer.byteLength(str, "utf8") > MAX_SETTINGS_BYTES) {
    return { ok: false, error: "settings exceeds 200 KB" };
  }
  let parsed;
  try {
    parsed = JSON.parse(str);
  } catch (err) {
    return { ok: false, error: `invalid JSON: ${err?.message || String(err)}` };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "settings must be a JSON object" };
  }
  const full = path.join(CLAUDE_DIR, "settings.json");
  try {
    atomicWrite(full, JSON.stringify(parsed, null, 2) + "\n");
    const stat = fs.statSync(full);
    return { ok: true, path: full, size: stat.size, modified: stat.mtime?.toISOString() };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
};

export { saveMemoryFile, saveSettings };
