import { WebSocketServer } from "ws";
import * as sessions from "./sessions.js";

export const ensureDefault = async () => {
  if (!sessions.list().length) {
    await sessions.create({});
  }
};

export const shutdownTerminals = () => sessions.killAll();

const terminalsWss = new WebSocketServer({ noServer: true });

terminalsWss.on("connection", (ws) => {
  const push = (type, data) => {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify({ type, data }));
  };

  const fwd = (type) => (data) => push(type, data);
  const subs = [
    ["output", fwd("data.output")],
    ["created", fwd("terminal.created")],
    ["closed", fwd("terminal.closed")],
    ["activated", fwd("terminal.activated")],
    ["init", fwd("system.init")],
    ["error", fwd("terminal.error")]
  ];
  for (const [ev, fn] of subs) sessions.bus.on(ev, fn);

  setTimeout(() => {
    push("terminal.list", {
      terminals: sessions.list(),
      activeTerminalId: sessions.getActiveId()
    });
    const active = sessions.get();
    if (active) {
      push("system.init", { terminalId: active.id, cols: active.cols, rows: active.rows });
    }
  }, 0);

  ws.on("message", async (raw) => {
    let msg;
    try {
      const text = typeof raw === "string" ? raw : raw?.toString?.("utf8");
      msg = JSON.parse(text);
    } catch {
      return;
    }
    const t = msg?.type;
    const d = msg?.data || {};
    try {
      switch (t) {
        case "terminal.list":
          push("terminal.list", {
            terminals: sessions.list(),
            activeTerminalId: sessions.getActiveId()
          });
          break;
        case "terminal.create": {
          const term = await sessions.create(d);
          push("terminal.activated", { terminalId: term.id });
          break;
        }
        case "terminal.activate":
          sessions.activate(d.terminalId);
          break;
        case "terminal.close":
          await sessions.close(d.terminalId, { ensureOne: true });
          break;
        case "data.input":
          sessions.write(d.terminalId, d.input);
          break;
        case "system.init":
        case "system.resize":
          sessions.resize(d.terminalId, d.cols, d.rows);
          break;
        case "system.command":
          if (d.command === "restart") await sessions.restart(d.terminalId);
          else if (d.command === "clear") sessions.get(d.terminalId)?.ptyProcess?.write("\x1b[2J\x1b[H");
          else if (d.command === "ctrl_c") sessions.get(d.terminalId)?.ptyProcess?.write("\x03");
          break;
        case "ping":
          push("pong", {});
          break;
        default:
          break;
      }
    } catch (err) {
      push("terminal.error", { terminalId: d.terminalId || null, error: err.message || String(err) });
    }
  });

  ws.on("close", () => {
    for (const [ev, fn] of subs) sessions.bus.off(ev, fn);
  });
});

export const handleTerminalUpgrade = (req, socket, head) => {
  terminalsWss.handleUpgrade(req, socket, head, (ws) => {
    terminalsWss.emit("connection", ws, req);
  });
};
