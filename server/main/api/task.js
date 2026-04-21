import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { listTaskRecords } from "../task/list.js";
import { getTaskDetail } from "../task/detail.js";
import { listTaskMessages } from "../task/messages.js";
import { stopTask } from "../task/stop.js";
import { createInstantTask } from "../task/create/instant.js";
import { createAgentTask } from "../task/create/agent.js";
const handleTaskCreateInstantApi = async (req, res, path) => {
  if (path !== "/api/task/create/instant" || req.method !== "POST") return false;
  try {
    const {
      app,
      title = "",
      prompt,
      schema = null,
      meta = null,
      messages = null,
      tools = null,
      tool_choice = void 0,
      parallel_tool_calls = void 0
    } = await readBody(req);
    if (!String(app || "").trim()) return json(res, { success: false, message: "app is required" }, 400);
    if (!String(prompt || "").trim() && (!Array.isArray(messages) || messages.length === 0)) {
      return json(res, { success: false, message: "prompt or messages is required" }, 400);
    }
    const result = await createInstantTask({
      app: String(app || "").trim(),
      title: String(title || "").trim(),
      prompt: String(prompt || "").trim(),
      schema,
      meta,
      messages,
      tools,
      tool_choice,
      parallel_tool_calls
    });
    return json(res, result);
  } catch (e) {
    return json(res, { success: false, message: e?.message || "Task execution failed" }, 500);
  }
};
const handleTaskCreateAgentApi = async (req, res, path) => {
  if (path !== "/api/task/create/agent" || req.method !== "POST") return false;
  try {
    const { app, title = "", prompt, meta = null } = await readBody(req);
    if (!String(app || "").trim()) return json(res, { success: false, message: "app is required" }, 400);
    if (!String(prompt || "").trim()) return json(res, { success: false, message: "prompt is required" }, 400);
    const result = await createAgentTask({
      app: String(app || "").trim(),
      title: String(title || "").trim(),
      prompt: String(prompt || "").trim(),
      meta
    });
    return json(res, result);
  } catch (e) {
    return json(res, { success: false, message: e?.message || "Task execution failed" }, 500);
  }
};
const handleTaskApi = async (req, res, path, url) => {
  if (path === "/api/task" && req.method === "GET") {
    const limit = Number(url.searchParams.get("limit") || 20);
    return json(res, listTaskRecords({ limit }));
  }
  if (path === "/api/task/detail" && req.method === "GET") {
    const id = Number(url.searchParams.get("id") || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: "Invalid id" }, 400);
    const task = getTaskDetail({ id });
    if (!task) return json(res, { success: false, message: "Task not found" }, 404);
    return json(res, { success: true, task });
  }
  if (path === "/api/task/messages" && req.method === "GET") {
    const id = Number(url.searchParams.get("id") || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: "Invalid id" }, 400);
    const task = getTaskDetail({ id });
    if (!task) return json(res, { success: false, message: "Task not found" }, 404);
    return json(res, { success: true, messages: listTaskMessages({ conversationId: task.conversation_id || "" }) });
  }
  if (path.startsWith("/api/task/create")) {
    const handled = await handleTaskCreateInstantApi(req, res, path);
    if (handled !== false) return true;
    const handled2 = await handleTaskCreateAgentApi(req, res, path);
    if (handled2 !== false) return true;
  }
  if (path === "/api/task/stop" && req.method === "POST") {
    const body = await readBody(req);
    const id = Number(body.id || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: "Invalid id" }, 400);
    const result = stopTask({ id });
    if (result?.status) return json(res, { success: false, message: result.message }, result.status);
    return json(res, result);
  }
  json(res, { error: "not found" }, 404);
};
export {
  handleTaskApi
};
