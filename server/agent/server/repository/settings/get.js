import { getDb } from "../db.js";

const getSettingsRecord = () => {
  const rows = getDb().prepare("SELECT key, value FROM settings").all();
  const settings = {};
  rows.forEach((row) => {
    settings[row.key] = JSON.parse(row.value);
  });
  return settings;
};

export { getSettingsRecord };
