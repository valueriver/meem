import { handleChatsDelete } from "./delete.js";
import { handleChatsGet } from "./get.js";
import { handleChatsPatch } from "./patch.js";
import { handleChatsPost } from "./post.js";

const handleChatsApi = async (req, res, deps, path, method, url) => {
  const { sendJson } = deps;
  if (path !== "/api/chats") {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }
  if (method === "GET") {
    await handleChatsGet(req, res, deps, url);
    return;
  }
  if (method === "POST") {
    await handleChatsPost(req, res, deps);
    return;
  }
  if (method === "PATCH") {
    await handleChatsPatch(req, res, deps, url);
    return;
  }
  if (method === "DELETE") {
    await handleChatsDelete(req, res, deps, url);
    return;
  }
  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleChatsApi };
