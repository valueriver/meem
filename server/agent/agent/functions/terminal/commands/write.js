import { ensureSession, normalizeChunk, serializeSession } from "../core/shared.js";

const terminalWrite = async ({
  sessionId,
  input,
  maxOutputChars,
  closeStdin = false,
} = {}) => {
  const record = ensureSession(sessionId);
  if (record.endedAt != null) {
    throw new Error(`terminal session already exited: ${sessionId}`);
  }

  if (input != null && input !== "") {
    record.ptyProcess.write(normalizeChunk(input));
  }

  if (closeStdin) {
    record.ptyProcess.write("\u0004");
  }

  return {
    ok: true,
    ...serializeSession(record, { maxOutputChars }),
  };
};

export { terminalWrite };
