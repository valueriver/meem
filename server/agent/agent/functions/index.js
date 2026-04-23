import {
  terminalExec,
  terminalKill,
  terminalList,
  terminalRead,
  terminalStart,
  terminalWrite,
} from "./terminal/index.js";
import {
  browserClose,
  browserExec,
  browserList,
  browserOpen,
  browserScreenshot,
  browserScript,
} from "./browser/index.js";
import { screenCapture } from "./screen/index.js";

const terminal_exec = async ({
  command,
  cwd,
  timeoutSeconds,
  env,
  input,
  maxOutputChars,
} = {}, options = {}) =>
  terminalExec({
    command,
    cwd,
    timeoutSeconds,
    env,
    input,
    maxOutputChars,
    signal: options.signal,
  });

const terminal_start = async ({
  command,
  cwd,
  timeoutSeconds,
  env,
  input,
} = {}) =>
  terminalStart({
    command,
    cwd,
    timeoutSeconds,
    env,
    input,
  });

const terminal_read = async ({ sessionId, maxOutputChars } = {}) =>
  terminalRead({
    sessionId,
    maxOutputChars,
  });

const terminal_write = async ({
  sessionId,
  input,
  maxOutputChars,
  closeStdin = false,
} = {}) =>
  terminalWrite({
    sessionId,
    input,
    maxOutputChars,
    closeStdin,
  });

const terminal_kill = async ({
  sessionId,
  signal,
  maxOutputChars,
} = {}) =>
  terminalKill({
    sessionId,
    signal,
    maxOutputChars,
  });

const terminal_list = async ({ maxOutputChars } = {}) =>
  terminalList({
    maxOutputChars,
  });

const browser_script = async (
  { code, headless, timeoutSeconds } = {},
  options = {},
) =>
  browserScript({
    code,
    headless,
    timeoutSeconds,
    signal: options.signal,
  });

const browser_open = async ({ headless, url } = {}) =>
  browserOpen({ headless, url });

const browser_exec = async (
  { sessionId, code, timeoutSeconds } = {},
  options = {},
) =>
  browserExec({
    sessionId,
    code,
    timeoutSeconds,
    signal: options.signal,
  });

const browser_screenshot = async ({ sessionId, selector, fullPage } = {}) =>
  browserScreenshot({ sessionId, selector, fullPage });

const browser_close = async ({ sessionId } = {}) => browserClose({ sessionId });

const browser_list = async () => browserList();

const screen_capture = async ({ mode } = {}) => screenCapture({ mode });

export {
  terminal_exec,
  terminal_kill,
  terminal_list,
  terminal_read,
  terminal_start,
  terminal_write,
  browser_script,
  browser_open,
  browser_exec,
  browser_screenshot,
  browser_close,
  browser_list,
  screen_capture,
};
