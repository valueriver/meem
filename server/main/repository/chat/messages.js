import { db } from "../client.js";
const countChatMessages = (conversationId) => {
  const row = db.prepare("SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?").get(conversationId);
  return Number(row?.count || 0);
};
const listChatMessageRowsPaged = (conversationId, limit, offset) => {
  return db.prepare(
    "SELECT id, message, meta FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ? OFFSET ?"
  ).all(conversationId, limit, offset);
};
export {
  countChatMessages,
  listChatMessageRowsPaged
};
