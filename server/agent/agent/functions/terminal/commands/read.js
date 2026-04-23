import { ensureSession, serializeSession } from "../core/shared.js";

const terminalRead = async ({ sessionId, maxOutputChars } = {}) => {
  const record = ensureSession(sessionId);
  return {
    ok: true,
    ...serializeSession(record, { maxOutputChars }),
  };
};

export { terminalRead };
