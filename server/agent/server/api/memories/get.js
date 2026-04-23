import { getMemory, listMemories } from "../../services/memories/index.js";

const handleMemoriesGet = async (_req, res, { sendJson }, url) => {
  const id = url.searchParams.get("id");
  if (id) {
    const memory = getMemory(id);
    if (!memory) {
      sendJson(res, 404, { ok: false, error: "memory not found" });
      return;
    }
    sendJson(res, 200, { ok: true, memory });
    return;
  }
  const enabled = url.searchParams.get("enabled");
  const pinned = url.searchParams.get("pinned");
  const visibility = pinned === null ? url.searchParams.get("visibility") : (Number(pinned) ? "pinned" : "hidden");
  const creator = url.searchParams.get("creator");
  const memories = listMemories({ enabled, visibility, creator });
  sendJson(res, 200, { ok: true, memories });
};

export { handleMemoriesGet };
