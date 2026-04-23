import { db } from "./client.js";

const appendEvent = (conversationId, kind, obj) => {
  const row = db
    .prepare("SELECT COALESCE(MAX(seq), -1) AS max FROM codex_events WHERE conversation_id = ?")
    .get(conversationId);
  const seq = Number(row?.max ?? -1) + 1;
  db
    .prepare("INSERT INTO codex_events (conversation_id, seq, kind, raw_json) VALUES (?, ?, ?, ?)")
    .run(conversationId, seq, kind, JSON.stringify(obj));
  return seq;
};

const listEvents = (conversationId) => {
  return db
    .prepare(
      "SELECT id, seq, kind, raw_json AS rawJson, ts FROM codex_events WHERE conversation_id = ? ORDER BY seq ASC"
    )
    .all(conversationId)
    .map((row) => {
      let payload = null;
      try { payload = JSON.parse(row.rawJson); } catch {}
      return { id: row.id, seq: row.seq, kind: row.kind, payload, ts: row.ts };
    });
};

export { appendEvent, listEvents };
