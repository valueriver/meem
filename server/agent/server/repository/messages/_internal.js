const INSERT_SQL = `
  INSERT INTO messages (conversation_id, message, memo, usage, meta)
  VALUES (?, ?, ?, ?, ?)
`;

const insertOne = (db, conversationId, message) => {
  const memo = message?.memo ? String(message.memo) : null;
  const usage = message?.usage ? JSON.stringify(message.usage) : null;
  const meta = message?.meta ? JSON.stringify(message.meta) : null;
  const result = db.prepare(INSERT_SQL).run(
    String(conversationId),
    JSON.stringify(message),
    memo,
    usage,
    meta
  );
  const messageId = Number(result.lastInsertRowid);

  if (memo) {
    db.prepare(`
      INSERT INTO memos (conversation_id, message_id, content)
      VALUES (?, ?, ?)
    `).run(String(conversationId), messageId, memo);
  }

  return messageId;
};

const lastSummaryOf = (messages) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.summary) return String(messages[i].summary);
  }
  return null;
};

const updateConversationSummaryStmt = (db, conversationId, summary) => {
  if (summary !== null) {
    db.prepare("UPDATE chats SET summary = ? WHERE conversation_id = ?")
      .run(summary, String(conversationId));
  }
};

export { insertOne, lastSummaryOf, updateConversationSummaryStmt };
