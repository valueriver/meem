import { handleMessagesGet } from "./get.js";

const handleMessagesApi = async (req, res, deps, path, method, url) => {
  const { sendJson } = deps;
  if (path === "/api/messages" && method === "GET") {
    await handleMessagesGet(req, res, deps, url);
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleMessagesApi };
