import { getDb } from "../db.js";

const deleteChat = (conversationId) => {
  const db = getDb();
  const id = String(conversationId);
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(id);
    db.prepare("DELETE FROM memos WHERE conversation_id = ?").run(id);
    db.prepare("DELETE FROM chats WHERE conversation_id = ?").run(id);
  });
  tx();
};

export { deleteChat };
