import { exec } from 'child_process';

const TIMEOUT_DEFAULT_MS = 30 * 1000;
const TIMEOUT_MIN_MS = 1 * 1000;
const TIMEOUT_MAX_MS = 5 * 60 * 1000;

const resolveTimeoutMs = (timeout) => {
  if (timeout == null) return TIMEOUT_DEFAULT_MS;
  const seconds = Number(timeout);
  if (!Number.isFinite(seconds)) return TIMEOUT_DEFAULT_MS;
  return Math.min(Math.max(seconds * 1000, TIMEOUT_MIN_MS), TIMEOUT_MAX_MS);
};

export const shell = ({ command, cwd, timeout }) => {
  return new Promise((resolve) => {
    const options = {
      timeout: resolveTimeoutMs(timeout),
      maxBuffer: 1024 * 1024
    };
    if (String(cwd || '').trim()) {
      options.cwd = String(cwd || '').trim();
    }
    exec(String(command || ''), options, (err, stdout, stderr) => {
      if (err) {
        resolve(`exit code ${err.code}\n${stderr || err.message}`);
        return;
      }
      resolve(stdout || stderr || '(no output)');
    });
  });
};
