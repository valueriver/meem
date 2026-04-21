import { db } from "./client.js";

const SYSTEM_MEMORY_SEEDS = [
  {
    title: "__T_MEMORY_SEED_APP_CREATION_GUIDE_TITLE__",
    description: "__T_MEMORY_SEED_APP_CREATION_GUIDE_DESCRIPTION__",
    content: "__T_MEMORY_SEED_APP_CREATION_GUIDE_CONTENT__",
    creator: "system",
    pinned: 0,
    enabled: 1
  }
];

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      title TEXT,
      description TEXT DEFAULT '',
      scene TEXT NOT NULL DEFAULT 'chat',
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      message TEXT NOT NULL,
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT,
      app TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'agent',
      prompt TEXT NOT NULL,
      schema TEXT,
      meta TEXT,
      response TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      creator TEXT NOT NULL DEFAULT 'user',
      pinned INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

const seedMemoriesIfEmpty = () => {
  const count = db.prepare("SELECT COUNT(*) as c FROM memories").get().c;
  if (count !== 0) return;
  try {
    for (const item of SYSTEM_MEMORY_SEEDS) {
      db.prepare(
        "INSERT INTO memories (title, description, content, creator, pinned, enabled) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(
        item.title,
        item.description,
        item.content,
        item.creator || "system",
        item.pinned ? 1 : 0,
        item.enabled === 0 ? 0 : 1
      );
    }
  } catch (error) {
    console.error("[memory-seeds] failed to seed system memories:", error);
  }
};

const initDatabase = () => {
  createTables();
  seedMemoriesIfEmpty();
};

export {
  initDatabase
};
