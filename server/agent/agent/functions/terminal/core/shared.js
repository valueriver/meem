import process from "node:process";
import fs from "node:fs";
import * as pty from "node-pty";

import { truncateOutput } from "./truncate.js";
import {
  appendSessionOutput,
  createSessionRecord,
  getSessionRecord,
  readSessionOutput,
} from "./sessions.js";

const DEFAULT_TIMEOUT_SECONDS = 30;
const MAX_TIMEOUT_SECONDS = 3600;
const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 30;

const normalizeTimeoutSeconds = (value, fallback = DEFAULT_TIMEOUT_SECONDS) => {
  if (value == null || value === "") return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(MAX_TIMEOUT_SECONDS, Math.floor(num)));
};

const normalizeCwd = (cwd) => (cwd ? String(cwd) : process.cwd());

const validateCwd = (cwd) => {
  if (!fs.existsSync(cwd)) {
    throw new Error(`cwd does not exist: ${cwd}`);
  }

  const stat = fs.statSync(cwd);
  if (!stat.isDirectory()) {
    throw new Error(`cwd is not a directory: ${cwd}`);
  }
};

const normalizeChunk = (value) => (value == null ? "" : String(value));

const normalizeDimension = (value, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(20, Math.floor(num));
};

const getShellCommand = () => process.env.SHELL || "/bin/bash";

const getSpawnSpec = (command) => ({
  file: getShellCommand(),
  args: ["-lc", String(command || "")],
});

const buildOutputPayload = (record, maxOutputChars) => {
  const { content, truncated, omittedChars } = truncateOutput(
    readSessionOutput(record),
    maxOutputChars,
  );

  return {
    output: content,
    truncated,
    omittedChars,
  };
};

const serializeSession = (record, { maxOutputChars } = {}) => {
  const outputPayload = buildOutputPayload(record, maxOutputChars);
  return {
    sessionId: record.sessionId,
    command: record.command,
    cwd: record.cwd,
    running: record.endedAt == null,
    exitCode: record.exitCode,
    signal: record.signal,
    timedOut: record.timedOut,
    cols: record.cols,
    rows: record.rows,
    durationMs: (record.endedAt ?? Date.now()) - record.startedAt,
    ...outputPayload,
  };
};

const ensureSession = (sessionId) => {
  const record = getSessionRecord(sessionId);
  if (!record) {
    throw new Error(`terminal session not found: ${sessionId}`);
  }
  return record;
};

const spawnSession = ({
  command,
  cwd,
  timeoutSeconds,
  env,
  input,
  cols,
  rows,
}) => {
  if (!command) {
    throw new Error("command is required");
  }

  const normalizedCwd = normalizeCwd(cwd);
  validateCwd(normalizedCwd);
  const normalizedTimeout = normalizeTimeoutSeconds(timeoutSeconds);
  const normalizedCols = normalizeDimension(cols, DEFAULT_COLS);
  const normalizedRows = normalizeDimension(rows, DEFAULT_ROWS);
  const mergedEnv = {
    ...process.env,
    ...(env || {}),
  };
  const spec = getSpawnSpec(command);
  const ptyProcess = pty.spawn(spec.file, spec.args, {
    name: mergedEnv.TERM || "xterm-256color",
    cols: normalizedCols,
    rows: normalizedRows,
    cwd: normalizedCwd,
    env: mergedEnv,
  });

  const record = createSessionRecord({
    ptyProcess,
    command: String(command),
    cwd: normalizedCwd,
    timeoutSeconds: normalizedTimeout,
    cols: normalizedCols,
    rows: normalizedRows,
  });

  ptyProcess.onData((data) => {
    appendSessionOutput(record, normalizeChunk(data));
  });

  ptyProcess.onExit(({ exitCode, signal }) => {
    record.exitCode = exitCode;
    record.signal = signal == null ? null : String(signal);
    record.endedAt = Date.now();
    if (record.timer) {
      clearTimeout(record.timer);
      record.timer = null;
    }
  });

  if (normalizedTimeout > 0) {
    record.timer = setTimeout(() => {
      if (record.endedAt != null) return;
      record.timedOut = true;
      try {
        ptyProcess.kill("SIGTERM");
      } catch {
        ptyProcess.kill();
      }
    }, normalizedTimeout * 1000);
  }

  if (input != null && input !== "") {
    ptyProcess.write(normalizeChunk(input));
  }

  return record;
};

const waitForExit = (record) =>
  new Promise((resolve) => {
    if (record.endedAt != null) {
      resolve();
      return;
    }

    record.ptyProcess.onExit(() => resolve());
  });

export {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  ensureSession,
  normalizeChunk,
  normalizeDimension,
  serializeSession,
  spawnSession,
  waitForExit,
};
