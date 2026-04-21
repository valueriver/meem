import { parseJson } from "../../shared/json/parse.js";
import { listMessagesByConversationId } from "../repository/task/messages.js";
const listTaskMessages = ({ conversationId }) => {
  const rows = listMessagesByConversationId(conversationId);
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    message: parseJson(row.message, "tasks.message"),
    meta: row.meta == null ? null : parseJson(row.meta, "tasks.meta")
  }));
};
export {
  listTaskMessages
};
