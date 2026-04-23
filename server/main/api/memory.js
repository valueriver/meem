import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { requestAgentJson } from "../clients/agent.js";

const mapMemory = (item = {}) => ({
  ...item,
  pinned: item.visibility === "pinned" ? 1 : 0,
  updated_at: item.updated_at || item.created_at
});

const handleMemoryApi = async (req, res, path) => {
  if (path === "/api/memory/list" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const enabled = url.searchParams.get("enabled");
    const query = enabled !== null ? `?enabled=${encodeURIComponent(enabled)}` : "";
    const data = await requestAgentJson(`/api/memories${query}`);
    return json(res, { success: true, items: (data.memories || []).map(mapMemory) });
  }

  if (path === "/api/memory/get" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = Number(url.searchParams.get("id") || 0);
    if (!id) return json(res, { success: false, message: "id is required" }, 400);
    const data = await requestAgentJson(`/api/memories?id=${id}`);
    return json(res, { success: true, item: mapMemory(data.memory) });
  }

  if (path === "/api/memory/create" && req.method === "POST") {
    const body = (await readBody(req)) || {};
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const content = String(body.content || "").trim();
    if (!title) return json(res, { success: false, message: "title is required" }, 400);
    if (!content) return json(res, { success: false, message: "content is required" }, 400);
    const creator = String(body.creator || "user").trim();
    const data = await requestAgentJson("/api/memories", {
      method: "POST",
      body: {
        title,
        description,
        content,
        creator,
        visibility: body.pinned ? "pinned" : "hidden",
        enabled: body.enabled === undefined ? 1 : (body.enabled ? 1 : 0)
      }
    });
    return json(res, { success: true, id: data.memory?.id });
  }

  if (path === "/api/memory/update" && req.method === "POST") {
    const body = (await readBody(req)) || {};
    const id = Number(body.id || 0);
    if (!id) return json(res, { success: false, message: "id is required" }, 400);
    const patch = {};
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.description !== undefined) patch.description = String(body.description).trim();
    if (body.content !== undefined) patch.content = String(body.content).trim();
    if (body.pinned !== undefined) patch.visibility = body.pinned ? "pinned" : "hidden";
    if (body.enabled !== undefined) patch.enabled = body.enabled ? 1 : 0;
    await requestAgentJson(`/api/memories?id=${id}`, { method: "PATCH", body: patch });
    return json(res, { success: true });
  }

  if (path === "/api/memory/delete" && req.method === "POST") {
    const body = (await readBody(req)) || {};
    const id = Number(body.id || 0);
    if (!id) return json(res, { success: false, message: "id is required" }, 400);
    await requestAgentJson(`/api/memories?id=${id}`, { method: "DELETE" });
    return json(res, { success: true });
  }

  return json(res, { success: false, message: "not found" }, 404);
};

export { handleMemoryApi };
