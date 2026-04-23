import { handleMemoriesDelete } from "./delete.js";
import { handleMemoriesGet } from "./get.js";
import { handleMemoriesPatch } from "./patch.js";
import { handleMemoryPost } from "./post.js";

const handleMemoriesApi = async (req, res, deps, path, method, url) => {
  const { sendJson } = deps;
  if (path !== "/api/memories") {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }
  if (method === "GET") {
    await handleMemoriesGet(req, res, deps, url);
    return;
  }
  if (method === "POST") {
    await handleMemoryPost(req, res, deps);
    return;
  }
  if (method === "PATCH") {
    await handleMemoriesPatch(req, res, deps, url);
    return;
  }
  if (method === "DELETE") {
    await handleMemoriesDelete(req, res, deps, url);
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleMemoriesApi };
