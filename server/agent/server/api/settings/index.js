import { handleSettingsGet } from "./get.js";
import { handleSettingsPost } from "./post.js";

const handleSettingsApi = async (req, res, deps, path, method) => {
  const { sendJson } = deps;
  if (path !== "/api/settings") {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }
  if (method === "GET") {
    await handleSettingsGet(req, res, deps);
    return;
  }
  if (method === "POST") {
    await handleSettingsPost(req, res, deps);
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleSettingsApi };
