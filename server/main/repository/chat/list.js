import { db } from "../client.js";
const listChatRows = (scene = null) => {
  if (scene) {
    return db.prepare(`
      SELECT id, conversation_id, title, description, scene, meta, created_at
      FROM chats
      WHERE scene = ?
      ORDER BY created_at DESC
    `).all(scene);
  }
  return db.prepare(`
    SELECT id, conversation_id, title, description, scene, meta, created_at
    FROM chats
    ORDER BY created_at DESC
  `).all();
};
export {
  listChatRows
};
