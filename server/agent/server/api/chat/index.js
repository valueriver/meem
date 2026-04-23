import { handleChatPost } from "./post.js";

const handleChatApi = async (req, res, deps, path, method) => {
  const { sendJson } = deps;

  if (path === "/api/chat" && method === "POST") {
    await handleChatPost(req, res, deps);
    return;
  }

  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleChatApi };
