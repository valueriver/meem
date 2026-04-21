import { db } from "../client.js";
const listSettingRows = () => {
  return db.prepare("SELECT key, value FROM settings").all();
};
export {
  listSettingRows
};
