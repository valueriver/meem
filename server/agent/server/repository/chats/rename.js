import { getDb } from "../db.js";
import { getChat } from "./get.js";

const renameChat = (conversationId, title) => {
  const id = String(conversationId || "").trim();
  const nextTitle = String(title || "").trim();
  if (!id) throw new Error("conversationId is required");
  if (!nextTitle) throw new Error("title is required");
  getDb().prepare("UPDATE chats SET title = ? WHERE conversation_id = ?").run(nextTitle, id);
  return getChat(id);
};

export { renameChat };
