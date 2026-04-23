import { db } from "./client.js";

const insertConversation = ({ sessionId, cwd, permissionMode = "default", title = "" }) => {
  const info = db
    .prepare(
      "INSERT INTO cc_conversations (session_id, cwd, permission_mode, title) VALUES (?, ?, ?, ?)"
    )
    .run(sessionId, cwd, permissionMode, title);
  return info.lastInsertRowid;
};

const getConversationBySessionId = (sessionId) => {
  return db
    .prepare(
      "SELECT id, session_id AS sessionId, cwd, permission_mode AS permissionMode, title, message_count AS messageCount, created_at AS createdAt, updated_at AS updatedAt FROM cc_conversations WHERE session_id = ?"
    )
    .get(sessionId);
};

const listConversations = () => {
  return db
    .prepare(
      "SELECT id, session_id AS sessionId, cwd, permission_mode AS permissionMode, title, message_count AS messageCount, created_at AS createdAt, updated_at AS updatedAt FROM cc_conversations ORDER BY updated_at DESC"
    )
    .all();
};

const setConversationTitleIfEmpty = (id, title) => {
  db.prepare(
    "UPDATE cc_conversations SET title = ? WHERE id = ? AND (title IS NULL OR title = '')"
  ).run(title, id);
};

const touchConversation = (id, deltaCount = 0) => {
  db.prepare(
    "UPDATE cc_conversations SET message_count = message_count + ?, updated_at = datetime('now') WHERE id = ?"
  ).run(deltaCount, id);
};

const updateConversationPermissionMode = (id, permissionMode) => {
  db.prepare(
    "UPDATE cc_conversations SET permission_mode = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(permissionMode, id);
};

const deleteConversationBySessionId = (sessionId) => {
  const row = db
    .prepare("SELECT id FROM cc_conversations WHERE session_id = ?")
    .get(sessionId);
  if (!row) return;
  db.prepare("DELETE FROM cc_events WHERE conversation_id = ?").run(row.id);
  db.prepare("DELETE FROM cc_conversations WHERE id = ?").run(row.id);
};

export {
  insertConversation,
  getConversationBySessionId,
  listConversations,
  setConversationTitleIfEmpty,
  touchConversation,
  updateConversationPermissionMode,
  deleteConversationBySessionId
};
