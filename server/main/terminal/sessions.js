import { createRequire } from "module";
import path from "path";
import EventEmitter from "events";
import { getDefaultShell, ensureDirectory, getDefaultDirectory } from "./shell.js";

const require = createRequire(import.meta.url);
const pty = require("node-pty");

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 30;

const terminals = new Map();
let activeId = null;

export const bus = new EventEmitter();

const newTerminalId = () =>
  "term-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const getMeta = (terminal) => ({
  id: terminal.id,
  title: terminal.title,
  cwd: terminal.cwd,
  cols: terminal.cols,
  rows: terminal.rows,
  createdAt: terminal.createdAt,
  isActive: terminal.id === activeId
});

export const list = () => [...terminals.values()].map(getMeta);
export const getActiveId = () => activeId;

export const get = (terminalId) => {
  if (terminalId && terminals.has(terminalId)) return terminals.get(terminalId);
  if (activeId && terminals.has(activeId)) return terminals.get(activeId);
  return terminals.values().next().value || null;
};

const attachPty = (terminal, ptyProcess) => {
  terminal.ptyProcess = ptyProcess;
  ptyProcess.onData((data) => {
    if (terminal.ptyProcess !== ptyProcess) return;
    bus.emit("output", { terminalId: terminal.id, output: data });
  });
  ptyProcess.onExit(({ exitCode, signal }) => {
    if (terminal.ptyProcess !== ptyProcess) return;
    console.log(`terminal ${terminal.id} exited: code ${exitCode}, signal ${signal}`);
    if (!terminals.has(terminal.id)) return;
    close(terminal.id, { ensureOne: terminals.size <= 1 }).catch((err) => {
      console.error("close exited terminal failed:", err.message);
    });
  });
};

export const create = async (options = {}) => {
  const cwd = await ensureDirectory(options.cwd);
  const id = options.terminalId || newTerminalId();
  if (terminals.has(id)) return terminals.get(id);
  const cols = options.cols || DEFAULT_COLS;
  const rows = options.rows || DEFAULT_ROWS;
  const shell = getDefaultShell();
  const terminal = {
    id,
    title: options.title || path.basename(cwd) || cwd || "Terminal",
    cwd, cols, rows,
    createdAt: Date.now(),
    ptyProcess: null
  };
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color", cols, rows, cwd, env: process.env
  });
  attachPty(terminal, ptyProcess);
  terminals.set(id, terminal);
  activeId = id;
  bus.emit("created", { terminal: getMeta(terminal), activeTerminalId: activeId });
  bus.emit("init", { terminalId: id, cols, rows });
  return terminal;
};

export const activate = (terminalId) => {
  const terminal = get(terminalId);
  if (!terminal) return null;
  activeId = terminal.id;
  bus.emit("activated", { terminalId: terminal.id });
  bus.emit("init", { terminalId: terminal.id, cols: terminal.cols, rows: terminal.rows });
  return terminal;
};

export const close = async (terminalId, options = {}) => {
  const terminal = get(terminalId);
  if (!terminal) return;
  terminals.delete(terminal.id);
  if (activeId === terminal.id) {
    activeId = terminals.keys().next().value || null;
  }
  terminal.ptyProcess?.kill();
  bus.emit("closed", { terminalId: terminal.id, activeTerminalId: activeId });
  if (!terminals.size && options.ensureOne) {
    const created = await create({ cwd: getDefaultDirectory() });
    bus.emit("activated", { terminalId: created.id });
    return;
  }
  if (activeId) {
    const active = get(activeId);
    if (active) {
      bus.emit("activated", { terminalId: activeId });
      bus.emit("init", { terminalId: active.id, cols: active.cols, rows: active.rows });
    }
  }
};

export const write = (terminalId, input) => {
  const terminal = get(terminalId);
  if (terminal && input) terminal.ptyProcess?.write(input);
};

export const resize = (terminalId, cols, rows) => {
  const terminal = get(terminalId);
  if (!terminal || !cols || !rows) return;
  terminal.cols = cols;
  terminal.rows = rows;
  terminal.ptyProcess?.resize(cols, rows);
};

export const restart = async (terminalId) => {
  const terminal = get(terminalId);
  if (!terminal) return;
  terminal.ptyProcess?.kill();
  const shell = getDefaultShell();
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: terminal.cols,
    rows: terminal.rows,
    cwd: terminal.cwd,
    env: process.env
  });
  attachPty(terminal, ptyProcess);
  bus.emit("init", { terminalId: terminal.id, cols: terminal.cols, rows: terminal.rows });
  console.log(`terminal ${terminal.id} restarted`);
};

export const killAll = () => {
  for (const terminal of terminals.values()) {
    terminal.ptyProcess?.kill();
  }
  terminals.clear();
  activeId = null;
};
