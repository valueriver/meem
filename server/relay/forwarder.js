import { WebSocket } from "ws";

const HOP_BY_HOP = new Set([
  "host", "connection", "upgrade", "keep-alive",
  "proxy-connection", "transfer-encoding", "te", "trailer",
  "content-length"
]);

const flattenHeaders = (mapOfArrays) => {
  const out = {};
  for (const [k, values] of Object.entries(mapOfArrays || {})) {
    if (HOP_BY_HOP.has(k.toLowerCase())) continue;
    out[k] = Array.isArray(values) ? values.join(", ") : values;
  }
  return out;
};

export class Forwarder {
  constructor({ localHost, mainPort, send }) {
    this.localHost = localHost;
    this.mainPort = mainPort;
    this.send = send;
    this.streams = new Map(); // stream_id -> WebSocket
  }

  async handle(frame) {
    try {
      switch (frame?.type) {
        case "proxy_request":
          return await this.handleProxyRequest(frame);
        case "ws_open":
          return this.handleWsOpen(frame);
        case "ws_message":
          return this.handleWsMessage(frame);
        case "ws_close":
          return this.handleWsClose(frame);
        default:
          return;
      }
    } catch (err) {
      console.error("[relay.forwarder]", frame?.type, err.message);
    }
  }

  async handleProxyRequest({ request_id, method, path, headers, body_base64 }) {
    const url = `http://${this.localHost}:${this.mainPort}${path}`;
    const body = body_base64 ? Buffer.from(body_base64, "base64") : undefined;
    const init = {
      method: method || "GET",
      headers: flattenHeaders(headers)
    };
    if (body && init.method !== "GET" && init.method !== "HEAD") init.body = body;

    let status = 502;
    let outHeaders = {};
    let bodyB64 = "";
    try {
      const res = await fetch(url, init);
      const buf = Buffer.from(await res.arrayBuffer());
      status = res.status;
      res.headers.forEach((v, k) => {
        if (!outHeaders[k]) outHeaders[k] = [];
        outHeaders[k].push(v);
      });
      bodyB64 = buf.toString("base64");
    } catch (err) {
      status = 502;
      outHeaders = { "content-type": ["text/plain; charset=utf-8"] };
      bodyB64 = Buffer.from(`relay proxy error: ${err.message}`).toString("base64");
    }

    this.send({ type: "proxy_response", request_id, status, headers: outHeaders, body_base64: bodyB64 });
  }

  handleWsOpen({ stream_id, path, headers }) {
    const wsUrl = `ws://${this.localHost}:${this.mainPort}${path || "/"}`;
    const local = new WebSocket(wsUrl, {
      headers: flattenHeaders(headers)
    });
    this.streams.set(stream_id, local);

    local.on("message", (raw, isBinary) => {
      if (isBinary) {
        this.send({
          type: "ws_message",
          stream_id,
          data_base64: Buffer.from(raw).toString("base64"),
          binary: true
        });
      } else {
        this.send({
          type: "ws_message",
          stream_id,
          text: raw.toString("utf8"),
          binary: false
        });
      }
    });

    local.on("close", () => {
      if (this.streams.delete(stream_id)) {
        this.send({ type: "ws_close", stream_id });
      }
    });

    local.on("error", (err) => {
      console.error("[relay.forwarder] ws local error", err.message);
    });
  }

  handleWsMessage({ stream_id, text, data_base64, binary }) {
    const local = this.streams.get(stream_id);
    if (!local || local.readyState !== WebSocket.OPEN) return;
    if (binary && data_base64) {
      local.send(Buffer.from(data_base64, "base64"));
    } else if (typeof text === "string") {
      local.send(text);
    }
  }

  handleWsClose({ stream_id }) {
    const local = this.streams.get(stream_id);
    this.streams.delete(stream_id);
    try { local?.close(); } catch {}
  }

  shutdown() {
    for (const ws of this.streams.values()) {
      try { ws.close(); } catch {}
    }
    this.streams.clear();
  }
}
