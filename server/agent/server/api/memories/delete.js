import { deleteMemory, getMemory } from "../../services/memories/index.js";

const handleMemoriesDelete = async (_req, res, { sendJson }, url) => {
  const id = url.searchParams.get("id");
  if (!id) {
    sendJson(res, 400, { ok: false, error: "id is required" });
    return;
  }
  if (!getMemory(id)) {
    sendJson(res, 404, { ok: false, error: "memory not found" });
    return;
  }
  deleteMemory(id);
  sendJson(res, 200, { ok: true });
};

export { handleMemoriesDelete };
