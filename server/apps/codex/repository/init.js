import { db } from "./client.js";

const initCodexDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS codex_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      cwd TEXT NOT NULL DEFAULT '',
      permission_mode TEXT NOT NULL DEFAULT 'workspaceWrite',
      title TEXT NOT NULL DEFAULT '',
      message_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_codex_conversations_updated
      ON codex_conversations(updated_at DESC);

    CREATE TABLE IF NOT EXISTS codex_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      seq INTEGER NOT NULL,
      kind TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      ts TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES codex_conversations(id)
    );
    CREATE INDEX IF NOT EXISTS idx_codex_events_conversation_seq
      ON codex_events(conversation_id, seq);
  `);
  const cols = db.prepare("PRAGMA table_info(codex_conversations)").all();
  if (!cols.some((col) => col.name === "permission_mode")) {
    db.exec("ALTER TABLE codex_conversations ADD COLUMN permission_mode TEXT NOT NULL DEFAULT 'workspaceWrite'");
  }
};

export { initCodexDatabase };
