import { randomUUID } from "crypto";
import { getDb } from "../db.js";

const createChat = (title) => {
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("title is required");
  const conversationId = randomUUID();
  getDb()
    .prepare("INSERT INTO chats (conversation_id, title) VALUES (?, ?)")
    .run(conversationId, trimmed);
  return { id: conversationId, title: trimmed };
};

export { createChat };
