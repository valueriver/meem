import { WebSocketServer, WebSocket } from "ws";
import { createSession } from "../chat/index.js";
import { handleTerminalUpgrade } from "../terminal/index.js";

const clients = new Set();

export const broadcast = (msg) => {
  const payload = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
};

const chatWss = new WebSocketServer({ noServer: true });
chatWss.on("connection", (ws) => {
  clients.add(ws);
  const send = (msg) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };
  const { handleMessage } = createSession(send);
  ws.on("message", async (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    await handleMessage(data);
  });
  ws.on("close", () => clients.delete(ws));
});

export const setupWebSocket = (httpServer) => {
  httpServer.on("upgrade", (req, socket, head) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname === "/ws") {
        chatWss.handleUpgrade(req, socket, head, (ws) => {
          chatWss.emit("connection", ws, req);
        });
        return;
      }
      if (url.pathname === "/ws/terminals") {
        handleTerminalUpgrade(req, socket, head);
        return;
      }
      socket.destroy();
    } catch (err) {
      console.error("[ws-upgrade]", err);
      socket.destroy();
    }
  });
};

export { chatWss };
