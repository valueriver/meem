import { parseJson } from "../../utils.js";
import { createChat } from "../../services/chats/index.js";

const handleChatsPost = async (req, res, { readBody, sendJson }) => {
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.chats.body");
  const title = String(body.title || "").trim();
  if (!title) {
    sendJson(res, 400, { ok: false, error: "title is required" });
    return;
  }
  const conversation = createChat(title);
  sendJson(res, 201, { ok: true, conversation });
};

export { handleChatsPost };
