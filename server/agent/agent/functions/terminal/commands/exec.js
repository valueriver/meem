import { closeSessionRecord } from "../core/sessions.js";
import { serializeSession, spawnSession, waitForExit } from "../core/shared.js";

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Aborted", "AbortError");
  }
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

const terminalExec = async ({
  command,
  cwd,
  timeoutSeconds,
  env,
  input,
  maxOutputChars,
  cols,
  rows,
  signal,
} = {}) => {
  const record = spawnSession({
    command,
    cwd,
    timeoutSeconds,
    env,
    input,
    cols,
    rows,
  });

  let abortHandler = null;
  try {
    if (signal?.aborted) {
      try {
        record.ptyProcess.kill("SIGKILL");
      } catch {
        record.ptyProcess.kill();
      }
      await waitForExit(record);
      throw createAbortError();
    }

    const completion = waitForExit(record);
    if (signal) {
      await Promise.race([
        completion,
        new Promise((_, reject) => {
          abortHandler = () => {
            try {
              record.ptyProcess.kill("SIGKILL");
            } catch {
              try {
                record.ptyProcess.kill();
              } catch {}
            }
            reject(createAbortError());
          };
          signal.addEventListener("abort", abortHandler, { once: true });
        }),
      ]);
      if (signal.aborted) {
        await completion;
      }
    } else {
      await completion;
    }

    const payload = serializeSession(record, { maxOutputChars });
    return {
      ok: payload.exitCode === 0 && !payload.timedOut,
      ...payload,
    };
  } finally {
    if (signal && abortHandler) {
      signal.removeEventListener("abort", abortHandler);
    }
    closeSessionRecord(record.sessionId);
  }
};

export { terminalExec };
