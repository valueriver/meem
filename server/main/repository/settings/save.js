import { db } from "../client.js";
const saveSetting = (key, value) => {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
};
export {
  saveSetting
};
