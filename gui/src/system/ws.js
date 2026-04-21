import { ref } from "vue";

const handlers = /* @__PURE__ */ new Map();
let ws = null;
let pingTimer = null;
let pongTimer = null;
let reconnectTimer = null;
let reconnectBlocked = false;

const wsStatus = ref("disconnected");

const getDefaultWsUrl = () => {
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  const base = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`;
  return token ? `${base}?token=${token}` : base;
};

const wsUrl = ref(getDefaultWsUrl());

const scheduleReconnect = (delay = 3e3) => {
  if (reconnectBlocked) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (wsStatus.value === "disconnected") connect();
  }, delay);
};

const connect = (url) => {
  if (url) {
    wsUrl.value = url;
  }
  reconnectBlocked = false;
  if (ws) {
    ws.onclose = null;
    ws.close();
  }
  clearInterval(pingTimer);
  clearTimeout(pongTimer);
  clearTimeout(reconnectTimer);
  wsStatus.value = "connecting";
  ws = new WebSocket(wsUrl.value);
  ws.onopen = () => {
    wsStatus.value = "connected";
    emit("open");
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
        pongTimer = setTimeout(() => {
          wsStatus.value = "disconnected";
          ws?.close();
        }, 5e3);
      }
    }, 3e4);
  };
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "pong") {
      clearTimeout(pongTimer);
      return;
    }
    emit(data.type, data);
  };
  ws.onclose = (event) => {
    wsStatus.value = "disconnected";
    clearInterval(pingTimer);
    clearTimeout(pongTimer);
    emit("close");
    if (event?.code === 1008) {
      reconnectBlocked = true;
      return;
    }
    scheduleReconnect();
  };
  ws.onerror = () => {
    wsStatus.value = "disconnected";
  };
};

const disconnect = () => {
  reconnectBlocked = true;
  clearInterval(pingTimer);
  clearTimeout(pongTimer);
  clearTimeout(reconnectTimer);
  if (ws) {
    ws.onclose = null;
    ws.close();
  }
  ws = null;
  wsStatus.value = "disconnected";
};

const ensureConnected = () => {
  if (ws?.readyState === WebSocket.OPEN) return Promise.resolve();
  if (wsStatus.value !== "connecting") connect();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("WebSocket 连接超时")), 5e3);
    const unsub = on("open", () => {
      clearTimeout(timeout);
      unsub();
      resolve();
    });
  });
};

const send = (data) => {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
};

const on = (type, fn) => {
  if (!handlers.has(type)) handlers.set(type, []);
  handlers.get(type).push(fn);
  return () => {
    const list = handlers.get(type);
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  };
};

const emit = (type, data) => {
  handlers.get(type)?.forEach((fn) => fn(data));
};

export {
  connect,
  disconnect,
  ensureConnected,
  on,
  send,
  wsStatus,
  wsUrl
};
