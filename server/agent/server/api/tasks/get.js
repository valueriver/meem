import { getTask, listTasks } from "../../services/tasks/index.js";

const handleTasksGet = async (_req, res, { sendJson }, url) => {
  const id = url.searchParams.get("id");
  if (id) {
    const task = getTask(id);
    if (!task) {
      sendJson(res, 404, { ok: false, error: "task not found" });
      return;
    }
    sendJson(res, 200, { ok: true, task });
    return;
  }
  const conversationId = url.searchParams.get("conversationId");
  const rawLimit = Number.parseInt(url.searchParams.get("limit"), 10);
  const limit = Math.max(1, Math.min(500, Number.isFinite(rawLimit) ? rawLimit : 50));
  const tasks = listTasks({ conversationId, limit });
  sendJson(res, 200, { ok: true, tasks });
};

export { handleTasksGet };
