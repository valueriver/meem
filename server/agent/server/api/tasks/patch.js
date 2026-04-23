import { parseJson } from "../../utils.js";
import { abortTask } from "../../services/tasks/index.js";

const handleTasksPatch = async (req, res, { readBody, sendJson }, url) => {
  const id = url.searchParams.get("id");
  if (!id) {
    sendJson(res, 400, { ok: false, error: "id is required" });
    return;
  }
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.task.patch.body");
  if (body.status !== "aborted") {
    sendJson(res, 400, { ok: false, error: "only status='aborted' is supported" });
    return;
  }
  try {
    const task = abortTask(id);
    sendJson(res, 200, { ok: true, task });
  } catch (error) {
    sendJson(res, 404, { ok: false, error: error.message });
  }
};

export { handleTasksPatch };
