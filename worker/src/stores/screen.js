import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useWsStore } from './ws';

const pending = new Map();
let handlersBound = false;

function newReqId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function bindHandlers(ws) {
    if (handlersBound) return;
    handlersBound = true;
    ws.onMessage('screen.capture.result', (msg) => {
        const h = pending.get(msg.data?.reqId);
        if (!h) return;
        pending.delete(msg.data.reqId);
        clearTimeout(h.timer);
        if (msg.data.ok) h.resolve(msg.data);
        else h.reject(new Error(msg.data.error || '截图失败'));
    });
}

export const useScreenStore = defineStore('screen', () => {
    const ws = useWsStore();
    bindHandlers(ws);

    const loading = ref(false);
    const errorMsg = ref('');
    const imageUrl = ref('');
    const capturedAt = ref(0);
    const imageSize = ref({ width: 0, height: 0 });

    function clearImage() {
        if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
        imageUrl.value = '';
        imageSize.value = { width: 0, height: 0 };
    }

    function callCapture(timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            const reqId = newReqId();
            const timer = setTimeout(() => {
                pending.delete(reqId);
                reject(new Error('截图响应超时'));
            }, timeoutMs);
            pending.set(reqId, { resolve, reject, timer });
            ws.sendMsg({ type: 'screen.capture', to: 'desktop', data: { reqId } });
        });
    }

    async function capture() {
        loading.value = true;
        errorMsg.value = '';
        try {
            const res = await callCapture();
            const bin = atob(res.data || '');
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            const blob = new Blob([arr], { type: res.mime || 'image/png' });
            clearImage();
            imageUrl.value = URL.createObjectURL(blob);
            capturedAt.value = res.capturedAt || Date.now();
        } catch (err) {
            errorMsg.value = err.message || String(err);
        } finally {
            loading.value = false;
        }
    }

    function setNaturalSize(width, height) {
        imageSize.value = { width, height };
    }

    return {
        loading,
        errorMsg,
        imageUrl,
        capturedAt,
        imageSize,
        capture,
        clearImage,
        setNaturalSize,
    };
});
