import { getDb } from "../db.js";

const getChat = (conversationId) =>
  getDb()
    .prepare(
      "SELECT conversation_id AS id, title, summary, created_at FROM chats WHERE conversation_id = ?",
    )
    .get(String(conversationId)) || null;

export { getChat };
