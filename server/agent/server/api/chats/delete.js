import { deleteChat } from "../../services/chats/index.js";

const handleChatsDelete = async (_req, res, { sendJson }, url) => {
  const id = url.searchParams.get("id");
  if (!id) {
    sendJson(res, 400, { ok: false, error: "id is required" });
    return;
  }
  deleteChat(id);
  sendJson(res, 200, { ok: true });
};

export { handleChatsDelete };
