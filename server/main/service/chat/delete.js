import { deleteChatByConversationId } from "../../repository/chat/delete.js";
const deleteChat = (conversationId) => {
  deleteChatByConversationId(conversationId);
  return { ok: true };
};
export {
  deleteChat
};
