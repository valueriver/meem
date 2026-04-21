import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..", "..", "..");
const dir = join(root, "database", "apps");
mkdirSync(dir, { recursive: true });
const createAppDb = (filename) => {
  const db = new Database(join(dir, filename));
  db.pragma("journal_mode = WAL");
  return db;
};
export {
  createAppDb
};
