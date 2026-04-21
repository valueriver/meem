import os from "os";
import path from "path";
import fs from "fs";
import { promises as fsp } from "fs";
import { json } from "../../shared/http/json.js";
import { readBody } from "../../shared/http/readBody.js";

const MIME = {
  ".txt": "text/plain", ".md": "text/markdown", ".json": "application/json",
  ".js": "text/javascript", ".mjs": "text/javascript", ".ts": "text/typescript",
  ".tsx": "text/typescript", ".jsx": "text/javascript",
  ".html": "text/html", ".htm": "text/html", ".css": "text/css",
  ".xml": "application/xml", ".yml": "text/yaml", ".yaml": "text/yaml",
  ".toml": "text/plain", ".ini": "text/plain", ".conf": "text/plain",
  ".sh": "text/x-shellscript", ".zsh": "text/x-shellscript", ".bash": "text/x-shellscript",
  ".py": "text/x-python", ".rb": "text/x-ruby", ".go": "text/x-go",
  ".rs": "text/x-rust", ".java": "text/x-java", ".c": "text/x-c",
  ".cpp": "text/x-c++", ".h": "text/x-c", ".hpp": "text/x-c++",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".bmp": "image/bmp", ".ico": "image/x-icon",
  ".pdf": "application/pdf", ".zip": "application/zip",
  ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".mov": "video/quicktime"
};
const guessMime = (name) => MIME[path.extname(name).toLowerCase()] || "application/octet-stream";

const listDir = async (abs, showHidden) => {
  const dir = abs || os.homedir();
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const items = await Promise.all(
    entries
      .filter((e) => showHidden || !e.name.startsWith("."))
      .map(async (e) => {
        const full = path.join(dir, e.name);
        try {
          const st = await fsp.stat(full);
          return {
            name: e.name,
            type: st.isDirectory() ? "dir" : (e.isSymbolicLink() ? "link" : "file"),
            size: st.size,
            mtime: st.mtimeMs
          };
        } catch {
          return { name: e.name, type: "unknown", size: 0, mtime: 0 };
        }
      })
  );
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return { path: dir, entries: items };
};

const statPath = async (p) => {
  const st = await fsp.stat(p);
  return { path: p, type: st.isDirectory() ? "dir" : "file", size: st.size, mtime: st.mtimeMs };
};

const handleFsApi = async (req, res, pathname, url) => {
  try {
    if (pathname === "/api/fs/home" && req.method === "GET") {
      return json(res, { path: os.homedir(), sep: path.sep, platform: os.platform() });
    }
    if (pathname === "/api/fs/list" && req.method === "GET") {
      const p = String(url.searchParams.get("path") || "");
      const showHidden = url.searchParams.get("showHidden") === "true" || url.searchParams.get("showHidden") === "1";
      return json(res, await listDir(p, showHidden));
    }
    if (pathname === "/api/fs/stat" && req.method === "GET") {
      const p = String(url.searchParams.get("path") || "");
      if (!p) return json(res, { error: "缺少 path" }, 400);
      return json(res, await statPath(p));
    }
    if (pathname === "/api/fs/read" && req.method === "GET") {
      const p = String(url.searchParams.get("path") || "");
      if (!p) return json(res, { error: "缺少 path" }, 400);
      const st = await fsp.stat(p);
      if (st.isDirectory()) return json(res, { error: "是目录，不能读取" }, 400);
      const name = path.basename(p);
      res.writeHead(200, {
        "Content-Type": guessMime(name),
        "Content-Length": st.size
      });
      fs.createReadStream(p).pipe(res);
      return;
    }
    if (pathname === "/api/fs" && req.method === "DELETE") {
      const p = String(url.searchParams.get("path") || "");
      const recursive = url.searchParams.get("recursive") === "true" || url.searchParams.get("recursive") === "1";
      if (!p) return json(res, { error: "缺少 path" }, 400);
      const st = await fsp.stat(p);
      if (st.isDirectory()) {
        if (!recursive) return json(res, { error: "是目录，需 recursive=true" }, 400);
        await fsp.rm(p, { recursive: true, force: true });
      } else {
        await fsp.unlink(p);
      }
      return json(res, { ok: true });
    }
    if (pathname === "/api/fs/mkdir" && req.method === "POST") {
      const body = await readBody(req);
      const p = String(body?.path || "");
      if (!p) return json(res, { error: "缺少 path" }, 400);
      await fsp.mkdir(p, { recursive: true });
      return json(res, { ok: true, path: p });
    }
    if (pathname === "/api/fs/rename" && req.method === "POST") {
      const body = await readBody(req);
      const from = String(body?.from || "");
      const to = String(body?.to || "");
      if (!from || !to) return json(res, { error: "缺少 from / to" }, 400);
      await fsp.rename(from, to);
      return json(res, { ok: true, from, to });
    }
    if (pathname === "/api/fs/upload" && req.method === "POST") {
      const targetDir = String(url.searchParams.get("dir") || os.homedir());
      await fsp.mkdir(targetDir, { recursive: true });
      const result = await parseMultipartUpload(req, targetDir);
      return json(res, { ok: true, files: result });
    }
    return json(res, { error: "API endpoint not found" }, 404);
  } catch (err) {
    return json(res, { error: err.message || String(err) }, 500);
  }
};

const parseMultipartUpload = async (req, targetDir) => {
  const ctype = req.headers["content-type"] || "";
  const m = ctype.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!m) throw new Error("缺少 multipart boundary");
  const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buf = Buffer.concat(chunks);
  const out = [];
  let pos = 0;
  while (pos < buf.length) {
    const start = buf.indexOf(boundary, pos);
    if (start < 0) break;
    pos = start + boundary.length;
    if (buf[pos] === 0x2d && buf[pos + 1] === 0x2d) break;
    pos += 2;
    const headerEnd = buf.indexOf(Buffer.from("\r\n\r\n"), pos);
    if (headerEnd < 0) break;
    const headers = buf.slice(pos, headerEnd).toString("utf8");
    pos = headerEnd + 4;
    const nextBoundary = buf.indexOf(boundary, pos);
    if (nextBoundary < 0) break;
    const body = buf.slice(pos, nextBoundary - 2);
    const fnameMatch = headers.match(/filename="([^"]*)"/i);
    if (fnameMatch && fnameMatch[1]) {
      const filename = fnameMatch[1];
      const dest = path.join(targetDir, path.basename(filename));
      await fsp.writeFile(dest, body);
      out.push({ name: filename, path: dest });
    }
    pos = nextBoundary;
  }
  return out;
};

export { handleFsApi };
