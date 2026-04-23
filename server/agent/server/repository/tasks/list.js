import { getDb } from "../db.js";

const listTasks = ({ conversationId, limit = 50 } = {}) => {
  const db = getDb();
  if (conversationId) {
    return db
      .prepare(
        `SELECT * FROM tasks
         WHERE conversation_id = ?
         ORDER BY id DESC LIMIT ?`
      )
      .all(conversationId, limit);
  }
  return db.prepare("SELECT * FROM tasks ORDER BY id DESC LIMIT ?").all(limit);
};

export { listTasks };
