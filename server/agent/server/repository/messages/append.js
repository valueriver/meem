import { getDb } from "../db.js";
import { insertOne, updateConversationSummaryStmt } from "./_internal.js";

const appendMessage = (conversationId, message) => {
  const db = getDb();
  insertOne(db, conversationId, message);
  updateConversationSummaryStmt(db, conversationId, message?.summary ? String(message.summary) : null);
};

export { appendMessage };
