import { db } from "./client.js";
const listNotes = ({ keyword = "", page = 1, pageSize = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;
  const q = String(keyword || "").trim();
  const like = `%${q}%`;
  const where = q ? "WHERE content LIKE ?" : "";
  const totalQuery = `SELECT COUNT(*) AS c FROM notes ${where}`;
  const listQuery = `
    SELECT * FROM notes
    ${where}
    ORDER BY updated_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;
  const total = q ? db.prepare(totalQuery).get(like).c : db.prepare(totalQuery).get().c;
  const items = q ? db.prepare(listQuery).all(like, safePageSize, offset) : db.prepare(listQuery).all(safePageSize, offset);
  return {
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};
export {
  listNotes
};
