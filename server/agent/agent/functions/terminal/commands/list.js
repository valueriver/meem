import { listSessionRecords } from "../core/sessions.js";
import { serializeSession } from "../core/shared.js";

const terminalList = async ({ maxOutputChars } = {}) => ({
  ok: true,
  sessions: listSessionRecords().map((record) =>
    serializeSession(record, { maxOutputChars }),
  ),
});

export { terminalList };
