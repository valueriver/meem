import { renameChatByConversationId } from "../../repository/chat/rename.js";
const renameChat = (conversationId, title) => {
  renameChatByConversationId(conversationId, title);
  return { ok: true };
};
export {
  renameChat
};
