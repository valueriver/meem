import { randomUUID } from "crypto";
import { db } from "../repository/client.js";
const createChat = (title = "新对话", scene = "chat", meta = null) => {
  const conversationId = randomUUID();
  db.prepare("INSERT INTO chats (conversation_id, title, scene, meta) VALUES (?, ?, ?, ?)").run(conversationId, title, scene, meta ? JSON.stringify(meta) : null);
  return { conversationId };
};
const hasChat = (conversationId) => {
  const id = String(conversationId || "").trim();
  if (!id) return false;
  return !!db.prepare("SELECT 1 FROM chats WHERE conversation_id = ? LIMIT 1").get(id);
};
export {
  createChat,
  hasChat
};
