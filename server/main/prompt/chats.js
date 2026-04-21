import { db } from "../repository/client.js";
const recentChats = () => {
  return db.prepare(`
    SELECT conversation_id, title, description
    FROM chats
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 3
  `).all().map((row) => ({
    conversationId: row.conversation_id,
    title: String(row.title || "").trim(),
    description: String(row.description || "").trim().slice(0, 100)
  }));
};
const chats = (currentConversationId) => {
  const currentId = String(currentConversationId || "").trim();
  const list = recentChats();
  if (!currentId && (!Array.isArray(list) || list.length === 0)) return "";
  const recentLines = list.slice(0, 3).map((c, i) => `${i + 1}. ${c.title || "未命名"} ｜ ${String(c.description || "").slice(0, 100)}`);
  let block = `

## 会话上下文`;
  if (currentId) {
    block += `
- 当前会话ID：${currentId}`;
  }
  if (recentLines.length) {
    block += `
- 最近 3 次会话（标题｜描述前100字）：
${recentLines.join("\n")}`;
  }
  return block;
};
export {
  chats
};
