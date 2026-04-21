// 和 /ws/terminals 的连接：auth token 放 query 里（WebSocket 升级握手不能带 Authorization）
import { readToken } from './api';

const handlers = new Map();   // type -> [fn]
let ws = null;
let connectTimer = null;
let shouldConnect = false;

function emit(type, data) {
    const fns = handlers.get(type);
    if (!fns) return;
    for (const fn of fns) {
        try { fn({ type, data }); } catch (err) { console.error(err); }
    }
}

function scheduleReconnect() {
    clearTimeout(connectTimer);
    connectTimer = setTimeout(() => {
        if (shouldConnect) connect();
    }, 2000);
}

function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    const token = readToken();
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/ws/terminals${token ? `?authToken=${encodeURIComponent(token)}` : ''}`;
    ws = new WebSocket(url);
    ws.onopen = () => emit('connection.open', {});
    ws.onclose = () => {
        emit('connection.close', {});
        if (shouldConnect) scheduleReconnect();
    };
    ws.onerror = () => {};
    ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }
        if (!msg?.type) return;
        emit(msg.type, msg.data || {});
    };
}

export function init() {
    shouldConnect = true;
    connect();
}

export function shutdown() {
    shouldConnect = false;
    clearTimeout(connectTimer);
    try { ws?.close(); } catch {}
    ws = null;
}

export function send(type, data = {}) {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, data }));
    }
}

export function on(type, fn) {
    if (!handlers.has(type)) handlers.set(type, []);
    handlers.get(type).push(fn);
    return () => {
        const list = handlers.get(type);
        if (!list) return;
        const i = list.indexOf(fn);
        if (i >= 0) list.splice(i, 1);
    };
}
