import { closeSessionRecord } from "../core/sessions.js";
import { ensureSession, serializeSession, waitForExit } from "../core/shared.js";

const terminalKill = async ({
  sessionId,
  signal = "SIGTERM",
  maxOutputChars,
} = {}) => {
  const record = ensureSession(sessionId);
  if (record.endedAt == null) {
    try {
      record.ptyProcess.kill(signal);
    } catch {
      record.ptyProcess.kill();
    }
  }

  if (record.endedAt == null) {
    await waitForExit(record);
  }

  const payload = serializeSession(record, { maxOutputChars });
  closeSessionRecord(record.sessionId);

  return {
    ok: true,
    ...payload,
  };
};

export { terminalKill };
