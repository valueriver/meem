import { parseJson } from "../../utils.js";
import { createMemory, getMemory } from "../../services/memories/index.js";

const handleMemoryPost = async (req, res, { readBody, sendJson }) => {
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.memory.body");
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  if (!title) {
    sendJson(res, 400, { ok: false, error: "title is required" });
    return;
  }
  if (!content) {
    sendJson(res, 400, { ok: false, error: "content is required" });
    return;
  }
  const id = createMemory({
    title,
    description: String(body.description || "").trim(),
    content,
    creator: String(body.creator || "user").trim() || "user",
    visibility: body.pinned ? "pinned" : (body.visibility || "hidden"),
    enabled: body.enabled === undefined ? 1 : (body.enabled ? 1 : 0),
  });
  sendJson(res, 201, { ok: true, memory: getMemory(id) });
};

export { handleMemoryPost };
