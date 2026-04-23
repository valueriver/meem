import { createReadStream } from "fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = resolve(__dirname, "..", "..", "..");
const FILES_DIR = join(WORKSPACE_DIR, "files");
const HOME_DIR = homedir();

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_BYTES = 1024 * 1024;
const TEXT_EXT = new Set([".txt", ".md", ".json", ".csv", ".log", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".vue", ".css", ".html", ".xml", ".yml", ".yaml", ".toml"]);
const WRITABLE_EXT = new Set([".txt", ".md", ".json", ".csv", ".log", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".vue", ".css", ".html", ".xml", ".yml", ".yaml", ".toml"]);
const UPLOADABLE_EXT = new Set([".txt", ".md", ".pdf", ".doc", ".docx", ".json", ".csv", ".png", ".jpg", ".jpeg", ".webp", ".log", ".pptx", ".xlsx"]);
const MIME_MAP = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".json": "application/json",
  ".csv": "text/csv",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".log": "text/plain",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

const toUnix = (value = "") => String(value).replace(/\\/g, "/");
const safeName = (name = "file") => {
  const normalized = String(name || "file")
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
  const trimmed = normalized.replace(/^\.+/, "").slice(0, 120);
  return trimmed || "file";
};

const resolveBase = (root = "", base = "") => {
  const kind = String(root || "").trim();
  if (kind === "files") return resolve(FILES_DIR);
  if (kind === "workspace") return resolve(WORKSPACE_DIR);
  if (kind === "home") return resolve(HOME_DIR);
  if (kind === "absolute") {
    const value = String(base || "").trim();
    if (!value) return null;
    return resolve(value);
  }
  return null;
};

const safeTarget = ({ root = "", base = "", path = "" }) => {
  const resolvedBase = resolveBase(root, base);
  if (!resolvedBase) return null;
  const target = String(path || "").trim() ? resolve(resolvedBase, String(path || "").trim()) : resolvedBase;
  const rel = relative(resolvedBase, target);
  if (rel === ".." || rel.startsWith("../")) return null;
  return { base: resolvedBase, target };
};

const relPath = (base, target) => {
  const rel = relative(base, target);
  return rel ? toUnix(rel) : "";
};

const isProbablyText = (buffer) => {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13) continue;
    if (byte >= 32 && byte <= 126) continue;
    if (byte >= 128) continue;
    suspicious += 1;
    if (suspicious > 8) return false;
  }
  return true;
};

const listEntries = async ({ root = "", base = "", path = "", includeHidden = false }) => {
  const resolved = safeTarget({ root, base, path });
  if (!resolved) return { status: 400, message: "invalid path" };
  const { base: rootDir, target } = resolved;
  let entries;
  try {
    entries = await readdir(target, { withFileTypes: true });
  } catch {
    return { status: 404, message: "directory not found" };
  }

  const items = [];
  for (const entry of entries) {
    if (!includeHidden && entry.name.startsWith(".")) continue;
    const itemPath = join(target, entry.name);
    try {
      const entryStat = await stat(itemPath);
      items.push({
        name: entry.name,
        type: entry.isDirectory() ? "dir" : "file",
        path: relPath(rootDir, itemPath),
        ext: entry.isDirectory() ? "" : extname(entry.name).toLowerCase(),
        size: entry.isDirectory() ? 0 : entryStat.size,
        modified: entryStat.mtime.toISOString()
      });
    } catch {}
  }

  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    success: true,
    root,
    base: toUnix(rootDir),
    path: relPath(rootDir, target),
    rootName: basename(rootDir) || toUnix(rootDir),
    data: items
  };
};

const readTextEntry = async ({ root = "", base = "", path = "" }) => {
  const resolved = safeTarget({ root, base, path });
  if (!resolved) return { status: 400, message: "invalid path" };
  const { base: rootDir, target } = resolved;

  let fileStat;
  try {
    fileStat = await stat(target);
  } catch {
    return { status: 404, message: "file not found" };
  }
  if (!fileStat.isFile()) return { status: 400, message: "not a file" };
  if (fileStat.size > MAX_TEXT_BYTES) return { status: 413, message: "file too large to preview" };

  const ext = extname(target).toLowerCase();
  let buffer;
  try {
    buffer = await readFile(target);
  } catch {
    return { status: 500, message: "failed to read file" };
  }
  if (!TEXT_EXT.has(ext) && !isProbablyText(buffer)) return { status: 415, message: "binary file is not supported" };

  return {
    success: true,
    item: {
      name: basename(target),
      path: relPath(rootDir, target),
      absolutePath: toUnix(target),
      content: buffer.toString("utf8"),
      size: fileStat.size,
      modified: fileStat.mtime.toISOString()
    }
  };
};

const writeTextEntry = async ({ root = "", base = "", path = "", content = "", create = false }) => {
  const resolved = safeTarget({ root, base, path });
  if (!resolved) return { status: 400, message: "invalid path" };
  const { base: rootDir, target } = resolved;
  const ext = extname(target).toLowerCase();
  if (!WRITABLE_EXT.has(ext)) return { status: 400, message: `file type not supported: ${ext || "(none)"}` };

  try {
    const existing = await stat(target);
    if (!existing.isFile()) return { status: 400, message: "not a file" };
    if (create) return { status: 409, message: "file already exists" };
  } catch {
    if (!create) return { status: 404, message: "file not found" };
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, String(content || ""), "utf8");
  const fileStat = await stat(target);
  return {
    success: true,
    item: {
      name: basename(target),
      type: "file",
      path: relPath(rootDir, target),
      size: fileStat.size,
      modified: fileStat.mtime.toISOString()
    }
  };
};

const makeDir = async ({ root = "", base = "", path = "" }) => {
  const resolved = safeTarget({ root, base, path });
  if (!resolved) return { status: 400, message: "invalid path" };
  const { base: rootDir, target } = resolved;
  try {
    await stat(target);
    return { status: 409, message: "directory already exists" };
  } catch {}
  await mkdir(target, { recursive: true });
  return {
    success: true,
    item: {
      name: basename(target),
      type: "dir",
      path: relPath(rootDir, target),
      size: 0
    }
  };
};

const removeEntry = async ({ root = "", base = "", path = "" }) => {
  const resolved = safeTarget({ root, base, path });
  if (!resolved) return { status: 400, message: "invalid path" };
  const { base: rootDir, target } = resolved;
  if (target === rootDir) return { status: 400, message: "cannot delete root" };
  try {
    await stat(target);
  } catch {
    return { status: 404, message: "file not found" };
  }
  await rm(target, { recursive: true, force: false });
  return { success: true };
};

const uploadEntry = async ({ root = "", base = "", dir = "", name = "", data = "" }) => {
  const fileName = String(name || "").trim();
  const base64 = String(data || "").trim();
  if (!fileName || !base64) return { status: 400, message: "name and data are required" };

  const ext = extname(fileName).toLowerCase();
  if (!UPLOADABLE_EXT.has(ext)) return { status: 400, message: `file type not allowed: ${ext || "(none)"}` };

  let buffer;
  try {
    buffer = Buffer.from(base64.replace(/^data:.*;base64,/, ""), "base64");
  } catch {
    return { status: 400, message: "invalid base64 data" };
  }
  if (!buffer.length) return { status: 400, message: "empty file data" };
  if (buffer.length > MAX_UPLOAD_BYTES) return { status: 400, message: "file too large (max 10MB)" };

  const resolved = safeTarget({ root, base, path: dir });
  if (!resolved) return { status: 400, message: "invalid directory" };
  const { base: rootDir, target } = resolved;
  await mkdir(target, { recursive: true });

  const savedName = safeName(fileName);
  const filePath = join(target, savedName);
  await writeFile(filePath, buffer);
  return {
    success: true,
    item: {
      name: savedName,
      type: "file",
      path: relPath(rootDir, filePath),
      absolutePath: toUnix(filePath),
      size: buffer.length
    }
  };
};

const downloadEntry = async (res, { root = "", base = "", path = "" }) => {
  const resolved = safeTarget({ root, base, path });
  if (!resolved) {
    json(res, { success: false, message: "invalid path" }, 400);
    return;
  }
  const { target } = resolved;
  let fileStat;
  try {
    fileStat = await stat(target);
  } catch {
    json(res, { success: false, message: "file not found" }, 404);
    return;
  }
  if (!fileStat.isFile()) {
    json(res, { success: false, message: "not a file" }, 400);
    return;
  }

  const ext = extname(target).toLowerCase();
  const mime = MIME_MAP[ext] || "application/octet-stream";
  const name = basename(target);
  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`
  });
  createReadStream(target).pipe(res);
};

const roots = () => ({
  success: true,
  data: [
    { id: "files", label: "files", base: toUnix(FILES_DIR) },
    { id: "workspace", label: "workspace", base: toUnix(WORKSPACE_DIR) },
    { id: "home", label: "home", base: toUnix(HOME_DIR) },
    { id: "absolute", label: "absolute", base: "/" }
  ]
});

const handleFsApi = async (req, res, path) => {
  if (path === "/api/fs/roots" && req.method === "GET") return json(res, roots());

  if (path === "/api/fs/list" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const data = await listEntries({
      root: url.searchParams.get("root") || "",
      base: url.searchParams.get("base") || "",
      path: url.searchParams.get("path") || "",
      includeHidden: url.searchParams.get("hidden") === "1"
    });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === "/api/fs/read" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const data = await readTextEntry({
      root: url.searchParams.get("root") || "",
      base: url.searchParams.get("base") || "",
      path: url.searchParams.get("path") || ""
    });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === "/api/fs/write" && req.method === "POST") {
    const body = await readBody(req);
    const data = await writeTextEntry(body || {});
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === "/api/fs/mkdir" && req.method === "POST") {
    const body = await readBody(req);
    const data = await makeDir(body || {});
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === "/api/fs/delete" && req.method === "POST") {
    const body = await readBody(req);
    const data = await removeEntry(body || {});
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === "/api/fs/upload" && req.method === "POST") {
    const body = await readBody(req);
    const data = await uploadEntry(body || {});
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === "/api/fs/download" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    await downloadEntry(res, {
      root: url.searchParams.get("root") || "",
      base: url.searchParams.get("base") || "",
      path: url.searchParams.get("path") || ""
    });
    return;
  }

  return json(res, { success: false, message: "API endpoint not found" }, 404);
};

export {
  FILES_DIR,
  handleFsApi
};
