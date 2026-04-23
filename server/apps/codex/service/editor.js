import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CODEX_DIR = path.join(os.homedir(), ".codex");
const MEMORY_FILES = new Set(["AGENTS.md"]);
const MAX_MEMORY_BYTES = 1024 * 1024;
const MAX_CONFIG_BYTES = 200 * 1024;

const atomicWrite = (target, content) => {
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, target);
};

const saveMemoryFile = ({ name, content }) => {
  if (!MEMORY_FILES.has(name)) return { ok: false, error: `filename not allowed: ${name}` };
  const str = typeof content === "string" ? content : "";
  if (Buffer.byteLength(str, "utf8") > MAX_MEMORY_BYTES) return { ok: false, error: "content exceeds 1 MB" };
  const full = path.join(CODEX_DIR, name);
  try {
    atomicWrite(full, str);
    const stat = fs.statSync(full);
    return { ok: true, path: full, size: stat.size, modified: stat.mtime?.toISOString() };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
};

// config.toml is plain text — validate size only. We don't parse TOML; user is
// responsible for correctness (codex will reject invalid TOML on next launch).
const saveSettings = ({ content }) => {
  const str = typeof content === "string" ? content : "";
  if (Buffer.byteLength(str, "utf8") > MAX_CONFIG_BYTES) return { ok: false, error: "config exceeds 200 KB" };
  const full = path.join(CODEX_DIR, "config.toml");
  try {
    atomicWrite(full, str);
    const stat = fs.statSync(full);
    return { ok: true, path: full, size: stat.size, modified: stat.mtime?.toISOString() };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
};

export { saveMemoryFile, saveSettings };
