import { parseJson } from "../../utils.js";
import {
  createTask,
  sanitizeTaskName,
} from "../../services/tasks/index.js";

const handleTaskPost = async (req, res, { readBody, sendJson }) => {
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.task.body");
  const taskName = sanitizeTaskName(body.name || body.taskName);

  const result = createTask({
    taskName,
    detail: body.detail,
    messages: body.messages,
    inputOverrides: {
      apiUrl: body.apiUrl,
      apiKey: body.apiKey,
      model: body.model,
      system: body.system,
    },
  });

  sendJson(res, 202, {
    ok: true,
    accepted: true,
    ...result,
  });
};

export { handleTaskPost };
