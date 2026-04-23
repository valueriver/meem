import { getDb } from "../db.js";

const PUBLIC_COLUMNS =
  "id, title, description, content, creator, visibility, enabled, created_at";

const VISIBILITY_ORDER = `CASE visibility
  WHEN 'pinned' THEN 0
  WHEN 'starred' THEN 1
  WHEN 'hidden' THEN 2
  ELSE 3
END`;

const listMemories = ({ enabled, visibility, creator } = {}) => {
  const where = [];
  const params = [];
  if (enabled !== undefined && enabled !== null && enabled !== "") {
    where.push("enabled = ?");
    params.push(Number(enabled) ? 1 : 0);
  }
  if (visibility) {
    where.push("visibility = ?");
    params.push(String(visibility));
  }
  if (creator) {
    where.push("creator = ?");
    params.push(String(creator));
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `SELECT ${PUBLIC_COLUMNS} FROM memories ${whereSql} ORDER BY ${VISIBILITY_ORDER}, id DESC`;
  return getDb().prepare(sql).all(...params);
};

export { listMemories };
