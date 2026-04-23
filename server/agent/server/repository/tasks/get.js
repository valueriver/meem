import { getDb } from "../db.js";

const getTask = (id) => getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id) || null;

export { getTask };
