import { getDb } from "../db.js";

const createTaskRow = ({ conversationId, name, prompt }) => {
  const row = getDb()
    .prepare(
      `INSERT INTO tasks (conversation_id, name, prompt, status)
       VALUES (?, ?, ?, 'pending')
       RETURNING id`
    )
    .get(conversationId, name, prompt);
  return row.id;
};

export { createTaskRow };
