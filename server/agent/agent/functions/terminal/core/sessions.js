const sessions = new Map();
let nextSessionId = 1;

const allocateSessionId = () => `terminal_${nextSessionId++}`;

const createSessionRecord = ({
  ptyProcess,
  command,
  cwd,
  timeoutSeconds,
  cols,
  rows,
}) => {
  const sessionId = allocateSessionId();
  const record = {
    sessionId,
    ptyProcess,
    command,
    cwd,
    timeoutSeconds,
    cols,
    rows,
    startedAt: Date.now(),
    endedAt: null,
    exitCode: null,
    signal: null,
    timedOut: false,
    output: "",
    timer: null,
  };

  sessions.set(sessionId, record);
  return record;
};

const getSessionRecord = (sessionId) => sessions.get(String(sessionId || ""));

const closeSessionRecord = (sessionId) => {
  const key = String(sessionId || "");
  const record = sessions.get(key);
  if (!record) return null;

  if (record.timer) {
    clearTimeout(record.timer);
    record.timer = null;
  }

  sessions.delete(key);
  return record;
};

const listSessionRecords = () => Array.from(sessions.values());

const appendSessionOutput = (record, chunk) => {
  if (!record || chunk == null) return;
  record.output += String(chunk);
};

const readSessionOutput = (record) => String(record?.output ?? "");

export {
  appendSessionOutput,
  closeSessionRecord,
  createSessionRecord,
  getSessionRecord,
  listSessionRecords,
  readSessionOutput,
};
