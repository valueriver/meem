import { db } from "../client.js";
const getTaskById = (id) => {
  return db.prepare("SELECT * FROM tasks WHERE id = ? LIMIT 1").get(id) || null;
};
export {
  getTaskById
};
