import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { listNotebook } from "../service/list.js";
import { createNotebook } from "../service/create.js";
import { updateNotebook } from "../service/update.js";
import { deleteNotebook } from "../service/delete.js";
import { optimizeNotebook } from "../service/optimize.js";
const handleNotebookApi = async (req, res, path) => {
  if (path === "/apps/notebook/list" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams.get("q") || "";
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 10);
    return json(res, listNotebook({ q, page, pageSize }));
  }
  if (path === "/apps/notebook/create" && req.method === "POST") {
    const body = await readBody(req);
    return json(res, await createNotebook(body));
  }
  if (path === "/apps/notebook/update" && req.method === "POST") {
    const body = await readBody(req);
    const data = updateNotebook(body);
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }
  if (path === "/apps/notebook/delete" && req.method === "POST") {
    const body = await readBody(req);
    const data = deleteNotebook(body);
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }
  if (path === "/apps/notebook/optimize" && req.method === "POST") {
    const body = await readBody(req);
    const data = await optimizeNotebook({
      content: body.content,
      prompt: body.prompt,
      taskTitle: body.taskTitle,
      req
    });
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }
  return false;
};
export {
  handleNotebookApi
};
