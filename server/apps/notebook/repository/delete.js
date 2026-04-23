import { db } from "./client.js";
const deleteNoteById = (id) => {
  db.prepare("DELETE FROM notes WHERE id = ?").run(id);
};
export {
  deleteNoteById
};
