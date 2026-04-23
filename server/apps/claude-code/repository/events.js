import { db } from "./client.js";

const appendEvent = (conversationId, kind, obj) => {
  const row = db
    .prepare("SELECT COALESCE(MAX(seq), -1) AS max FROM cc_events WHERE conversation_id = ?")
    .get(conversationId);
  const seq = Number(row?.max ?? -1) + 1;
  db
    .prepare("INSERT INTO cc_events (conversation_id, seq, kind, raw_json) VALUES (?, ?, ?, ?)")
    .run(conversationId, seq, kind, JSON.stringify(obj));
  return seq;
};

const listEvents = (conversationId) => {
  return db
    .prepare(
      "SELECT id, seq, kind, raw_json AS rawJson, ts FROM cc_events WHERE conversation_id = ? ORDER BY seq ASC"
    )
    .all(conversationId)
    .map((r) => {
      let payload = null;
      try { payload = JSON.parse(r.rawJson); } catch {}
      return { id: r.id, seq: r.seq, kind: r.kind, payload, ts: r.ts };
    });
};

export { appendEvent, listEvents };
