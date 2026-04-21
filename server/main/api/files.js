import { createReadStream } from "fs";
import { readdir, readFile, rmdir, stat, unlink, mkdir, writeFile } from "fs/promises";
import { basename, dirname, extname, join, relative, resolve, sep } from "path";
import { fileURLToPath } from "url";
import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..", "..");
const FILES_DIR = join(ROOT, "files");
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set([
  ".txt",
  ".md",
  ".pdf",
  ".doc",
  ".docx",
  ".json",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".log",
  ".pptx",
  ".xlsx"
]);
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
const TEXT_EXT = new Set([".txt", ".md", ".json", ".csv", ".log"]);

const safeName = (name = "file") => String(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
const toUnix = (value = "") => String(value).replace(/\\/g, "/");
const safeFilesPath = (sub = "") => {
  const base = resolve(FILES_DIR);
  const value = String(sub || "").trim();
  const full = value ? resolve(base, value) : base;
  if (full !== base && !full.startsWith(base + sep)) return null;
  return full;
};

const relFilesPath = (fullPath) => {
  const rel = relative(resolve(FILES_DIR), fullPath);
  return rel ? toUnix(rel) : "";
};

const upload = async (body = {}) => {
  const fileName = String(body.name || "").trim();
  const base64 = String(body.data || "").trim();
  const dir = String(body.dir || "").trim();
  if (!fileName || !base64) return { status: 400, message: "name and data are required" };
  const ext = extname(fileName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return { status: 400, message: `file type not allowed: ${ext || "(none)"}` };

  let buffer = null;
  try {
    const normalized = base64.replace(/^data:.*;base64,/, "");
    buffer = Buffer.from(normalized, "base64");
  } catch {
    return { status: 400, message: "invalid base64 data" };
  }
  if (!buffer || buffer.length === 0) return { status: 400, message: "empty file data" };
  if (buffer.length > MAX_SIZE) return { status: 400, message: "file too large (max 10MB)" };

  const targetDir = safeFilesPath(dir);
  if (!targetDir) return { status: 400, message: "invalid directory" };
  await mkdir(targetDir, { recursive: true });
  const savedName = safeName(fileName);
  const absPath = join(targetDir, savedName);
  await writeFile(absPath, buffer);
  return { success: true, file: { name: fileName, path: absPath, size: buffer.length } };
};

const createFile = async (relPath = "", content = "") => {
  const full = safeFilesPath(relPath);
  if (!full) return { status: 400, message: "invalid path" };
  const ext = extname(full).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return { status: 400, message: `file type not allowed: ${ext || "(none)"}` };
  try {
    await stat(full);
    return { status: 409, message: "file already exists" };
  } catch {}
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, String(content || ""), "utf8");
  const fileStat = await stat(full);
  return {
    success: true,
    item: {
      name: basename(full),
      type: "file",
      path: relFilesPath(full),
      size: fileStat.size,
      modified: fileStat.mtime.toISOString()
    }
  };
};

const saveFile = async (relPath = "", content = "") => {
  const full = safeFilesPath(relPath);
  if (!full) return { status: 400, message: "invalid path" };
  const ext = extname(full).toLowerCase();
  if (!TEXT_EXT.has(ext)) return { status: 400, message: "file type not supported" };
  try {
    const existing = await stat(full);
    if (!existing.isFile()) return { status: 400, message: "not a file" };
  } catch {
    return { status: 404, message: "file not found" };
  }
  await writeFile(full, String(content || ""), "utf8");
  const fileStat = await stat(full);
  return {
    success: true,
    item: {
      name: basename(full),
      type: "file",
      path: relFilesPath(full),
      size: fileStat.size,
      modified: fileStat.mtime.toISOString()
    }
  };
};

const createDir = async (relPath = "") => {
  const full = safeFilesPath(relPath);
  if (!full) return { status: 400, message: "invalid path" };
  try {
    await stat(full);
    return { status: 409, message: "directory already exists" };
  } catch {}
  await mkdir(full, { recursive: true });
  return {
    success: true,
    item: {
      name: basename(full),
      type: "dir",
      path: relFilesPath(full),
      size: 0
    }
  };
};

const list = async (dir = "") => {
  const full = safeFilesPath(dir);
  if (!full) return { status: 400, message: "invalid path" };
  let entries;
  try {
    entries = await readdir(full, { withFileTypes: true });
  } catch {
    const fallbackPath = toUnix(String(dir || ""));
    return { success: true, data: [], path: fallbackPath };
  }
  const items = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const itemPath = join(full, entry.name);
    try {
      const entryStat = await stat(itemPath);
      items.push({
        name: entry.name,
        type: entry.isDirectory() ? "dir" : "file",
        path: relFilesPath(itemPath),
        size: entry.isDirectory() ? 0 : entryStat.size,
        modified: entryStat.mtime.toISOString()
      });
    } catch {}
  }
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const normalizedPath = toUnix(String(dir || ""));
  return {
    success: true,
    data: items,
    path: normalizedPath
  };
};

const remove = async (filePath = "") => {
  const full = safeFilesPath(filePath);
  if (!full || full === resolve(FILES_DIR)) return { status: 400, message: "invalid path" };
  let fileStat;
  try {
    fileStat = await stat(full);
  } catch {
    return { status: 404, message: "file not found" };
  }
  if (fileStat.isDirectory()) {
    const children = await readdir(full);
    if (children.length > 0) {
      return { status: 409, message: "directory is not empty" };
    }
    await rmdir(full);
    return { success: true };
  }
  await unlink(full);
  return { success: true };
};

const download = (res, filePath = "") => {
  const full = safeFilesPath(filePath);
  if (!full) {
    json(res, { success: false, message: "invalid path" }, 400);
    return;
  }
  const ext = extname(full).toLowerCase();
  const mime = MIME_MAP[ext] || "application/octet-stream";
  const name = basename(full);
  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`
  });
  createReadStream(full).pipe(res);
};

const readTextFile = async (filePath = "") => {
  const full = safeFilesPath(filePath);
  if (!full) return { status: 400, message: "invalid path" };
  const ext = extname(full).toLowerCase();
  if (!TEXT_EXT.has(ext)) return { status: 400, message: "file type not supported" };
  try {
    const content = await readFile(full, "utf8");
    const fileStat = await stat(full);
    return {
      success: true,
      item: {
        name: basename(full),
        path: relFilesPath(full),
        content,
        modified: fileStat.mtime.toISOString(),
        size: fileStat.size
      }
    };
  } catch {
    return { status: 404, message: "file not found" };
  }
};

const handleFilesApi = async (req, res, path) => {
  if (path === "/api/files/upload" && req.method === "POST") {
    const body = await readBody(req);
    const data = await upload(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/files/list" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const pathParam = url.searchParams.get("path");
    const dirParam = url.searchParams.get("dir");
    const dir = pathParam !== null ? pathParam : dirParam !== null ? dirParam : "";
    const data = await list(dir);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/files/read" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const data = await readTextFile(url.searchParams.get("path") || "");
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/files/delete" && req.method === "POST") {
    const body = await readBody(req);
    const data = await remove(body?.path);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/files/create-file" && req.method === "POST") {
    const body = await readBody(req);
    const data = await createFile(body?.path, body?.content);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/files/save" && req.method === "POST") {
    const body = await readBody(req);
    const data = await saveFile(body?.path, body?.content);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/files/create-dir" && req.method === "POST") {
    const body = await readBody(req);
    const data = await createDir(body?.path);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/files/download" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const filePath = url.searchParams.get("path") || "";
    download(res, filePath);
    return;
  }
  return json(res, { success: false, message: "API endpoint not found" }, 404);
};

export {
  FILES_DIR,
  handleFilesApi
};
