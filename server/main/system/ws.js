import { WebSocketServer, WebSocket } from "ws";
import { AGENT_ORIGIN } from "../clients/agent.js";
import { parseSseStream } from "../clients/sse.js";
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
  const conversations = new Map();
  const send = (msg) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };
  ws.on("message", async (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    if (data.type === "ping") {
      send({ type: "pong" });
      return;
    }
    if (data.type === "abort") {
      const cid = data.conversationId;
      if (cid && conversations.has(cid)) conversations.get(cid).abort();
      return;
    }
    if (data.type !== "message") return;
    const cid = data.conversationId || null;
    if (!cid) {
      send({ type: "error", content: "Missing conversationId" });
      return;
    }
    if (conversations.has(cid)) {
      conversations.get(cid).abort();
      conversations.delete(cid);
    }
    const controller = new AbortController();
    conversations.set(cid, controller);
    const promptParts = [String(data.content || "")];
    if (Array.isArray(data.attachments) && data.attachments.length) {
      promptParts.push(
        "",
        "<attachments>",
        ...data.attachments.map((item) => `- ${item.name || item.label || "attachment"}: ${item.path || item.content || ""}`),
        "</attachments>"
      );
    }
    try {
      const response = await fetch(`${AGENT_ORIGIN}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: cid, prompt: promptParts.join("\n") }),
        signal: controller.signal
      });
      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => "");
        send({ type: "error", conversationId: cid, content: text || `agent ${response.status}` });
        return;
      }
      await parseSseStream(response.body, (event, payload) => {
        if (event === "delta") {
          send({ type: "delta", conversationId: cid, delta: payload.delta || "" });
        } else if (event === "tool_call") {
          send({ type: "tool_call", conversationId: cid, toolCall: payload.toolCall });
        } else if (event === "tool_result") {
          send({
            type: "tool_result",
            conversationId: cid,
            toolCallId: payload.message?.tool_call_id,
            content: payload.message?.content || ""
          });
        } else if (event === "done") {
          send({ type: "done", conversationId: cid, content: payload.text || payload.message?.content || "" });
        } else if (event === "error") {
          send({ type: "error", conversationId: cid, content: payload.error || payload.message || "Agent error" });
        }
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        send({ type: "aborted", conversationId: cid });
      } else {
        send({ type: "error", conversationId: cid, content: error?.message || "Agent error" });
      }
    } finally {
      conversations.delete(cid);
    }
  });
  ws.on("close", () => {
    clients.delete(ws);
    for (const controller of conversations.values()) controller.abort();
    conversations.clear();
  });
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
