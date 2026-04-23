import { db } from "./client.js";

const initClaudeCodeTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cc_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      cwd TEXT NOT NULL DEFAULT '',
      permission_mode TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL DEFAULT '',
      message_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_cc_convs_updated ON cc_conversations(updated_at DESC);

    CREATE TABLE IF NOT EXISTS cc_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      seq INTEGER NOT NULL,
      kind TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      ts TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES cc_conversations(id)
    );
    CREATE INDEX IF NOT EXISTS idx_cc_events_conv_seq ON cc_events(conversation_id, seq);
  `);
  const cols = db.prepare("PRAGMA table_info(cc_conversations)").all();
  if (!cols.some((col) => col.name === "permission_mode")) {
    db.exec("ALTER TABLE cc_conversations ADD COLUMN permission_mode TEXT NOT NULL DEFAULT 'default'");
  }
};

const initClaudeCodeDatabase = () => {
  initClaudeCodeTables();
};

export { initClaudeCodeDatabase };
