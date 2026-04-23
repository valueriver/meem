import { parseJson } from "../../utils.js";
import { renameChat } from "../../services/chats/index.js";

const handleChatsPatch = async (req, res, { readBody, sendJson }, url) => {
  const id = url.searchParams.get("id");
  if (!id) {
    sendJson(res, 400, { ok: false, error: "id is required" });
    return;
  }
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.chats.patch.body");
  const title = String(body.title || "").trim();
  if (!title) {
    sendJson(res, 400, { ok: false, error: "title is required" });
    return;
  }
  const conversation = renameChat(id, title);
  sendJson(res, 200, { ok: true, conversation });
};

export { handleChatsPatch };
