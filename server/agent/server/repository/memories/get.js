import { getDb } from "../db.js";

const PUBLIC_COLUMNS =
  "id, title, description, content, creator, visibility, enabled, created_at";

const getMemory = (id) =>
  getDb()
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM memories WHERE id = ?`)
    .get(Number(id)) || null;

export { getMemory };
