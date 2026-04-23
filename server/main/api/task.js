import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { requestAgentJson } from "../clients/agent.js";

const mapAgentTask = (task) => ({
  id: task.id,
  app: "agent",
  mode: "agent",
  title: task.name,
  prompt: task.prompt,
  response: task.response,
  status: task.status === "done" ? "completed" : task.status === "aborted" ? "stopped" : task.status,
  error: task.error,
  conversation_id: task.conversation_id,
  created_at: task.created_at,
  finished_at: task.finished_at
});

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
    const result = await requestAgentJson("/api/tasks", {
      method: "POST",
      body: {
        name: String(title || app || "任务").trim(),
        detail: String(prompt || "").trim(),
        messages,
        meta,
        schema,
        tools,
        tool_choice,
        parallel_tool_calls
      }
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
    const result = await requestAgentJson("/api/tasks", {
      method: "POST",
      body: {
        name: String(title || app || "任务").trim(),
        detail: String(prompt || "").trim(),
        meta
      }
    });
    return json(res, result);
  } catch (e) {
    return json(res, { success: false, message: e?.message || "Task execution failed" }, 500);
  }
};
const handleTaskApi = async (req, res, path, url) => {
  if (path === "/api/task" && req.method === "GET") {
    const limit = Number(url.searchParams.get("limit") || 20);
    const data = await requestAgentJson(`/api/tasks?limit=${limit}`);
    return json(res, (data.tasks || []).map(mapAgentTask));
  }
  if (path === "/api/task/detail" && req.method === "GET") {
    const id = Number(url.searchParams.get("id") || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: "Invalid id" }, 400);
    const data = await requestAgentJson(`/api/tasks?id=${id}`);
    return json(res, { success: true, task: mapAgentTask(data.task) });
  }
  if (path === "/api/task/messages" && req.method === "GET") {
    const id = Number(url.searchParams.get("id") || 0);
    if (!Number.isInteger(id) || id <= 0) return json(res, { success: false, message: "Invalid id" }, 400);
    const data = await requestAgentJson(`/api/tasks?id=${id}`);
    const task = data.task;
    if (!task?.conversation_id) return json(res, { success: true, messages: [] });
    const messages = await requestAgentJson(`/api/messages?conversationId=${encodeURIComponent(task.conversation_id)}&limit=100`);
    return json(res, { success: true, messages: messages.messages || [] });
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
    const result = await requestAgentJson(`/api/tasks?id=${id}`, {
      method: "PATCH",
      body: { status: "aborted" }
    });
    return json(res, result);
  }
  json(res, { error: "not found" }, 404);
};
export {
  handleTaskApi
};
