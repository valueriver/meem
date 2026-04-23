import { getDb } from "../db.js";

const setSettingsRecord = (settings) => {
  const db = getDb();
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  const tx = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      stmt.run(key, JSON.stringify(value));
    }
  });
  tx(settings);
};

export { setSettingsRecord };
