import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "..", "..", "..", "database", "aios.db");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
export {
  db
};
