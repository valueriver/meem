import { parseJson } from "../../utils.js";
import { getMemory, updateMemory } from "../../services/memories/index.js";

const handleMemoriesPatch = async (req, res, { readBody, sendJson }, url) => {
  const id = url.searchParams.get("id");
  if (!id) {
    sendJson(res, 400, { ok: false, error: "id is required" });
    return;
  }
  if (!getMemory(id)) {
    sendJson(res, 404, { ok: false, error: "memory not found" });
    return;
  }
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.memory.patch.body");
  updateMemory(id, body);
  sendJson(res, 200, { ok: true, memory: getMemory(id) });
};

export { handleMemoriesPatch };
