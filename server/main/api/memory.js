import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { db } from "../repository/client.js";

const handleMemoryApi = async (req, res, path) => {
  if (path === "/api/memory/list" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const enabled = url.searchParams.get("enabled");
    let rows;
    if (enabled !== null) {
      rows = db.prepare(
        "SELECT id, title, description, creator, pinned, enabled, created_at, updated_at FROM memories WHERE enabled = ? ORDER BY pinned DESC, id DESC"
      ).all(Number(enabled));
    } else {
      rows = db.prepare(
        "SELECT id, title, description, creator, pinned, enabled, created_at, updated_at FROM memories ORDER BY pinned DESC, id DESC"
      ).all();
    }
    return json(res, { success: true, items: rows });
  }

  if (path === "/api/memory/get" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = Number(url.searchParams.get("id") || 0);
    if (!id) return json(res, { success: false, message: "id is required" }, 400);
    const row = db.prepare("SELECT * FROM memories WHERE id = ?").get(id);
    if (!row) return json(res, { success: false, message: "not found" }, 404);
    return json(res, { success: true, item: row });
  }

  if (path === "/api/memory/create" && req.method === "POST") {
    const body = (await readBody(req)) || {};
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const content = String(body.content || "").trim();
    if (!title) return json(res, { success: false, message: "title is required" }, 400);
    if (!content) return json(res, { success: false, message: "content is required" }, 400);
    const creator = String(body.creator || "user").trim();
    const pinned = body.pinned ? 1 : 0;
    const row = db.prepare(
      "INSERT INTO memories (title, description, content, creator, pinned) VALUES (?, ?, ?, ?, ?) RETURNING id"
    ).get(title, description, content, creator, pinned);
    return json(res, { success: true, id: row.id });
  }

  if (path === "/api/memory/update" && req.method === "POST") {
    const body = (await readBody(req)) || {};
    const id = Number(body.id || 0);
    if (!id) return json(res, { success: false, message: "id is required" }, 400);
    const existing = db.prepare("SELECT id FROM memories WHERE id = ?").get(id);
    if (!existing) return json(res, { success: false, message: "not found" }, 404);
    const fields = [];
    const values = [];
    if (body.title !== undefined) { fields.push("title = ?"); values.push(String(body.title).trim()); }
    if (body.description !== undefined) { fields.push("description = ?"); values.push(String(body.description).trim()); }
    if (body.content !== undefined) { fields.push("content = ?"); values.push(String(body.content).trim()); }
    if (body.pinned !== undefined) { fields.push("pinned = ?"); values.push(body.pinned ? 1 : 0); }
    if (body.enabled !== undefined) { fields.push("enabled = ?"); values.push(body.enabled ? 1 : 0); }
    if (!fields.length) return json(res, { success: true });
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE memories SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return json(res, { success: true });
  }

  if (path === "/api/memory/delete" && req.method === "POST") {
    const body = (await readBody(req)) || {};
    const id = Number(body.id || 0);
    if (!id) return json(res, { success: false, message: "id is required" }, 400);
    db.prepare("DELETE FROM memories WHERE id = ?").run(id);
    return json(res, { success: true });
  }

  return json(res, { success: false, message: "not found" }, 404);
};

export { handleMemoryApi };
