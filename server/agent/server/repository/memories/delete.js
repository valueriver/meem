import { getDb } from "../db.js";

const deleteMemory = (id) => {
  const info = getDb().prepare("DELETE FROM memories WHERE id = ?").run(id);
  return info.changes > 0;
};

export { deleteMemory };
