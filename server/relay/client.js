import { WebSocket } from "ws";

export class RelayClient {
  constructor({ wsUrl, token, deviceId, onFrame, onStateChange }) {
    this.wsUrl = wsUrl;
    this.token = token;
    this.deviceId = deviceId;
    this.onFrame = onFrame;
    this.onStateChange = onStateChange;
    this.ws = null;
    this.reconnectMs = 1000;
    this.maxReconnectMs = 30000;
    this.closed = false;
    this.timer = null;
  }

  connect() {
    if (this.closed) return;
    const url = `${this.wsUrl}?device_id=${encodeURIComponent(this.deviceId)}`;
    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    this.ws = new WebSocket(url, {
      headers
    });

    this.ws.on("open", () => {
      this.reconnectMs = 1000;
      this.onStateChange?.("connected");
    });

    this.ws.on("message", (raw) => {
      let frame;
      try { frame = JSON.parse(raw.toString("utf8")); } catch { return; }
      this.onFrame?.(frame);
    });

    this.ws.on("close", (code, reason) => {
      this.onStateChange?.("disconnected", { code, reason: String(reason || "") });
      this.scheduleReconnect();
    });

    this.ws.on("error", (err) => {
      this.onStateChange?.("error", { error: err.message });
      // 'close' also fires; reconnect handled there.
    });
  }

  scheduleReconnect() {
    if (this.closed) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.connect(), this.reconnectMs);
    this.reconnectMs = Math.min(this.reconnectMs * 2, this.maxReconnectMs);
  }

  send(frame) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  close() {
    this.closed = true;
    clearTimeout(this.timer);
    try { this.ws?.close(); } catch {}
  }
}
