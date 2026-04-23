import { handleTasksGet } from "./get.js";
import { handleTasksPatch } from "./patch.js";
import { handleTaskPost } from "./post.js";

const handleTasksApi = async (req, res, deps, path, method, url) => {
  const { sendJson } = deps;
  if (path !== "/api/tasks") {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }
  if (method === "GET") {
    await handleTasksGet(req, res, deps, url);
    return;
  }
  if (method === "POST") {
    await handleTaskPost(req, res, deps);
    return;
  }
  if (method === "PATCH") {
    await handleTasksPatch(req, res, deps, url);
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleTasksApi };
