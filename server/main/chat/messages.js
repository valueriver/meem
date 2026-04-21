import { db } from "../repository/client.js";
import { normalizeContextRounds } from "../service/settings/get.js";

const getMessages = (conversationId, messageLimit = 100) => {
  const limit = normalizeContextRounds(messageLimit);
  const rows = db.prepare("SELECT id, message, meta FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?").all(conversationId, limit);
  return rows.reverse().map((r) => ({
    ...JSON.parse(r.message),
    _id: r.id,
    _meta: r.meta ? JSON.parse(r.meta) : null
  }));
};
const saveMessage = (conversationId, msg, meta = null) => {
  const result = db.prepare("INSERT INTO messages (conversation_id, message, meta) VALUES (?, ?, ?)").run(
    conversationId,
    JSON.stringify(msg),
    meta ? JSON.stringify(meta) : null
  );
  return { id: Number(result.lastInsertRowid) };
};
export {
  getMessages,
  saveMessage
};
