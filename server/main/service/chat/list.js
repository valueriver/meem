import { listChatRows } from "../../repository/chat/list.js";
const listChats = (scene = null) => {
  return listChatRows(scene);
};
export {
  listChats
};
