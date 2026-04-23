import { getDb } from "../db.js";

const listChats = (page = 1, limit = 20, search = "") => {
  const db = getDb();
  const offset = (page - 1) * limit;
  const searchLike = search ? `%${search}%` : null;

  const total = Number(
    searchLike
      ? db.prepare(`
          SELECT COUNT(DISTINCT c.conversation_id) AS count
          FROM chats c
          JOIN messages m ON m.conversation_id = c.conversation_id
          WHERE m.message LIKE ?
        `).get(searchLike)?.count
      : db.prepare("SELECT COUNT(*) AS count FROM chats").get()?.count
  ) || 0;

  const rows = searchLike
    ? db.prepare(`
        SELECT c.conversation_id, c.title, c.summary, c.created_at,
               COUNT(m.id) AS messageCount
        FROM chats c
        LEFT JOIN messages m ON m.conversation_id = c.conversation_id
        WHERE m.message LIKE ?
        GROUP BY c.conversation_id
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
      `).all(searchLike, limit, offset)
    : db.prepare(`
        SELECT c.conversation_id, c.title, c.summary, c.created_at,
               COUNT(m.id) AS messageCount
        FROM chats c
        LEFT JOIN messages m ON m.conversation_id = c.conversation_id
        GROUP BY c.conversation_id
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

  const latestStmt = db.prepare(
    "SELECT message FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1"
  );

  return {
    conversations: rows.map((row) => {
      const latest = row.messageCount > 0 ? latestStmt.get(row.conversation_id) : null;
      const content = latest ? JSON.parse(latest.message)?.content : "";
      const preview = typeof content === "string" ? content.slice(0, 50) : "";
      return {
        id: row.conversation_id,
        title: row.title || "",
        summary: row.summary || "",
        createdAt: row.created_at,
        messageCount: row.messageCount,
        preview,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export { listChats };
