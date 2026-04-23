import { getDb } from "../db.js";

const listMessages = (conversationId, page = 1, limit = 50, order = "asc") => {
  const db = getDb();
  const offset = (page - 1) * limit;
  const normalizedOrder = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";
  const total = Number(
    db.prepare("SELECT COUNT(*) AS count FROM messages WHERE conversation_id = ?")
      .get(String(conversationId))?.count
  ) || 0;

  const rows = db.prepare(`
    SELECT id, message, meta
    FROM messages
    WHERE conversation_id = ?
    ORDER BY id ${normalizedOrder}
    LIMIT ? OFFSET ?
  `).all(String(conversationId), limit, offset);

  return {
    messages: rows.map((row) => ({
      ...JSON.parse(row.message),
      _id: row.id,
      ...(row.meta ? { _meta: JSON.parse(row.meta) } : {}),
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export { listMessages };
