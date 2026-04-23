import { getDb } from "../db.js";

export const listMemos = (conversationId) => {
  const db = getDb();
  if (conversationId) {
    return db
      .prepare(
        `SELECT id, message_id AS messageId, content, created_at AS createdAt
         FROM memos
         WHERE conversation_id = ?
         ORDER BY id ASC`,
      )
      .all(String(conversationId));
  }
  // 跨会话:返回所有便签,左连 chats 取标题(task 的 conversation 没有 chat 条目,title 为 null)
  return db
    .prepare(
      `SELECT m.id,
              m.conversation_id AS conversationId,
              m.message_id AS messageId,
              m.content,
              m.created_at AS createdAt,
              c.title AS chatTitle
       FROM memos m
       LEFT JOIN chats c ON c.conversation_id = m.conversation_id
       ORDER BY m.id DESC`,
    )
    .all();
};

export const listMemosBefore = (conversationId, boundaryId, limit = 30) =>
  getDb()
    .prepare(
      `SELECT id, message_id AS messageId, content, created_at AS createdAt
       FROM memos
       WHERE conversation_id = ? AND message_id < ?
       ORDER BY id DESC LIMIT ?`,
    )
    .all(String(conversationId), Number(boundaryId), Number(limit));
