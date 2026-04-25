import { useWsStore } from '@/stores/ws';

const pending = new Map();
let handlersBound = false;

function bindHandlers(ws) {
    if (handlersBound) return;
    handlersBound = true;
    ws.onMessage('fs.result', (msg) => {
        const h = pending.get(msg.data?.reqId);
        if (!h) return;
        if (msg.data.ok) h.resolve?.(msg.data);
        else h.reject?.(new Error(msg.data.error || '未知错误'));
    });
    ws.onMessage('fs.read.meta', (msg) => {
        pending.get(msg.data?.reqId)?.onMeta?.(msg.data);
    });
    ws.onMessage('fs.read.chunk', (msg) => {
        pending.get(msg.data?.reqId)?.onChunk?.(msg.data);
    });
    ws.onMessage('fs.upload.ack', (msg) => {
        pending.get(msg.data?.reqId)?.onAck?.(msg.data);
    });
}

function newReqId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function sliceToBase64(slice) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const r = reader.result;
            const comma = r.indexOf(',');
            resolve(comma >= 0 ? r.substring(comma + 1) : '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(slice);
    });
}

const UPLOAD_CHUNK = 128 * 1024;

export function useFsClient() {
    const ws = useWsStore();
    bindHandlers(ws);

    function call(type, data, timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            const reqId = newReqId();
            const timer = setTimeout(() => {
                pending.delete(reqId);
                reject(new Error('响应超时'));
            }, timeoutMs);
            pending.set(reqId, {
                resolve: (v) => { clearTimeout(timer); pending.delete(reqId); resolve(v); },
                reject: (e) => { clearTimeout(timer); pending.delete(reqId); reject(e); },
            });
            ws.sendMsg({ type, to: 'desktop', data: { reqId, ...data } });
        });
    }

    function waitOnce(reqId, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                pending.delete(reqId);
                reject(new Error('上传超时'));
            }, timeoutMs);
            pending.set(reqId, {
                onAck: (v) => { clearTimeout(timer); pending.delete(reqId); resolve(v); },
                resolve: (v) => { clearTimeout(timer); pending.delete(reqId); resolve(v); },
                reject: (e) => { clearTimeout(timer); pending.delete(reqId); reject(e); },
            });
        });
    }

    function fsRead(path, onProgress) {
        return new Promise((resolve, reject) => {
            const reqId = newReqId();
            const chunks = [];
            let meta = null;
            let total = 0;
            const timer = setTimeout(() => {
                pending.delete(reqId);
                reject(new Error('读取超时'));
            }, 60000);
            pending.set(reqId, {
                onMeta: (m) => { meta = m; },
                onChunk: (c) => {
                    if (c.data) {
                        const bin = atob(c.data);
                        const arr = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
                        chunks.push(arr);
                        total += arr.length;
                    }
                    if (meta && onProgress) onProgress(total, meta.size);
                    if (c.eof) {
                        clearTimeout(timer);
                        pending.delete(reqId);
                        const blob = new Blob(chunks, { type: meta?.mime || 'application/octet-stream' });
                        resolve({ meta: meta || {}, blob });
                    }
                },
                reject: (e) => { clearTimeout(timer); pending.delete(reqId); reject(e); },
            });
            ws.sendMsg({ type: 'fs.read', to: 'desktop', data: { reqId, path } });
        });
    }

    async function fsUpload(path, file, onProgress, overwrite = true) {
        const reqId = newReqId();
        const startP = waitOnce(reqId, 15000);
        ws.sendMsg({ type: 'fs.upload.start', to: 'desktop', data: { reqId, path, size: file.size, overwrite } });
        await startP;

        if (file.size === 0) {
            const eofP = waitOnce(reqId, 15000);
            ws.sendMsg({ type: 'fs.upload.chunk', to: 'desktop', data: { reqId, seq: 0, data: '', eof: true } });
            await eofP;
            onProgress?.(0, 0);
            return;
        }

        let offset = 0;
        let seq = 0;
        while (offset < file.size) {
            const end = Math.min(offset + UPLOAD_CHUNK, file.size);
            const b64 = await sliceToBase64(file.slice(offset, end));
            const eof = end >= file.size;
            const ackP = waitOnce(reqId, 30000);
            ws.sendMsg({ type: 'fs.upload.chunk', to: 'desktop', data: { reqId, seq, data: b64, eof } });
            await ackP;
            offset = end;
            seq++;
            onProgress?.(offset, file.size);
        }
    }

    return {
        fsHome: () => call('fs.home', {}),
        fsList: (path, showHidden = false) => call('fs.list', { path, showHidden }),
        fsStat: (path) => call('fs.stat', { path }),
        fsDelete: (path, recursive = false) => call('fs.delete', { path, recursive }),
        fsMkdir: (path) => call('fs.mkdir', { path }),
        fsRename: (from, to) => call('fs.rename', { from, to }),
        fsRead,
        fsUpload,
    };
}
