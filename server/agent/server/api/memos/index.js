import { handleMemosGet } from "./get.js";

const handleMemosApi = async (req, res, deps, path, method, url) => {
  const { sendJson } = deps;
  if (path === "/api/memos" && method === "GET") {
    await handleMemosGet(req, res, deps, url);
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleMemosApi };
