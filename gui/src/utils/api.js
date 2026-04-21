// 最小 HTTP 客户端：自动带 Bearer token，自动解析 JSON

const TOKEN_KEY = 'roam.token';

export function readToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}
export function writeToken(t) {
    try {
        if (t) localStorage.setItem(TOKEN_KEY, t);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {}
}

function authHeader() {
    const t = readToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle(res) {
    if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? res.json() : res.text();
    }
    const err = new Error(`${res.status} ${res.statusText}`);
    err.status = res.status;
    try { err.body = await res.json(); } catch { try { err.body = await res.text(); } catch {} }
    throw err;
}

export async function get(url, { query } = {}) {
    const q = query ? '?' + new URLSearchParams(
        Object.entries(query)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    const res = await fetch(url + q, { headers: { ...authHeader() } });
    return handle(res);
}

export async function post(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    return handle(res);
}

export async function put(url, body) {
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
    });
    return handle(res);
}

export async function patch(url, body) {
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
    });
    return handle(res);
}

export async function del(url, { query } = {}) {
    const q = query ? '?' + new URLSearchParams(query).toString() : '';
    const res = await fetch(url + q, {
        method: 'DELETE',
        headers: { ...authHeader() },
    });
    return handle(res);
}

export async function postMultipart(url, formData) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { ...authHeader() },
        body: formData,
    });
    return handle(res);
}

/**
 * 消费 SSE 流。事件格式：event: xxx\ndata: {...}\n\n
 * 返回一个带 .abort() 的控制对象。
 */
export function stream(url, body, handlers) {
    const controller = new AbortController();

    (async () => {
        let res;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: controller.signal,
            });
        } catch (err) {
            if (err.name !== 'AbortError') handlers.error?.(err);
            return;
        }
        if (!res.ok) {
            let body = '';
            try { body = await res.text(); } catch {}
            handlers.error?.(new Error(`${res.status}: ${body}`));
            return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buf = '';
        let curEvent = 'message';
        let curData = '';

        function dispatch() {
            if (!curData) { curEvent = 'message'; return; }
            let parsed = curData;
            try { parsed = JSON.parse(curData); } catch {}
            handlers[curEvent]?.(parsed);
            curEvent = 'message';
            curData = '';
        }

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                let idx;
                while ((idx = buf.indexOf('\n')) >= 0) {
                    const line = buf.slice(0, idx);
                    buf = buf.slice(idx + 1);
                    if (!line) { dispatch(); continue; }
                    if (line.startsWith('event:')) curEvent = line.slice(6).trim();
                    else if (line.startsWith('data:')) {
                        const chunk = line.slice(5).trim();
                        curData = curData ? curData + '\n' + chunk : chunk;
                    }
                }
            }
            dispatch();
            handlers.end?.();
        } catch (err) {
            if (err.name !== 'AbortError') handlers.error?.(err);
        }
    })();

    return { abort: () => controller.abort() };
}
