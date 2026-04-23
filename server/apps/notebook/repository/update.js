import { db } from "./client.js";
const updateNoteContent = ({ id, content = "" } = {}) => {
  db.prepare("UPDATE notes SET content = ?, updated_at = datetime('now') WHERE id = ?").run(content, id);
};
export {
  updateNoteContent
};
