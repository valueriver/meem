import { spawnSession } from "../core/shared.js";

const terminalStart = async ({
  command,
  cwd,
  timeoutSeconds,
  env,
  input,
  cols,
  rows,
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

  return {
    ok: true,
    sessionId: record.sessionId,
    command: record.command,
    cwd: record.cwd,
    running: true,
    cols: record.cols,
    rows: record.rows,
  };
};

export { terminalStart };
