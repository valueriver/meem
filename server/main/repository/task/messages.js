import { db } from "../client.js";
const listMessagesByConversationId = (conversationId) => {
  return db.prepare(
    "SELECT id, message, meta, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC"
  ).all(conversationId);
};
export {
  listMessagesByConversationId
};
