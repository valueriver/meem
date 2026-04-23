import { db } from "./client.js";
const createNote = ({ content = "", style = null } = {}) => {
  const s = style ?? Math.floor(Math.random() * 12);
  const r = db.prepare("INSERT INTO notes (content, style, updated_at) VALUES (?, ?, datetime('now'))").run(content, s);
  return Number(r.lastInsertRowid);
};
export {
  createNote
};
