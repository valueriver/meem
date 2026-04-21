// v3 的 fs 客户端：所有请求走 HTTP，没有 reqId 配对了
import * as api from '@/utils/api';
import { readToken } from '@/utils/api';

export function useFsClient() {

    async function fsRead(path, onProgress) {
        // 流式读：fetch 流式消费，边读边 onProgress
        const token = readToken();
        const res = await fetch('/api/fs/read?' + new URLSearchParams({ path }).toString(), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
            let body = '';
            try { body = (await res.json())?.error; } catch {}
            throw new Error(body || `${res.status} ${res.statusText}`);
        }
        const name = path.split('/').pop() || path;
        const mime = res.headers.get('Content-Type') || 'application/octet-stream';
        const total = parseInt(res.headers.get('Content-Length') || '0', 10) || 0;
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            onProgress?.(received, total);
        }
        const blob = new Blob(chunks, { type: mime });
        return { meta: { name, size: total, mime }, blob };
    }

    async function fsUpload(path, file, onProgress, overwrite = true) {
        // 简化：一次 multipart 上传整份；进度用 XMLHttpRequest 以支持 upload.onprogress
        return await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            // target dir 来自 path 的父目录
            const slash = path.lastIndexOf('/');
            const dir = slash >= 0 ? path.slice(0, slash) : '.';
            xhr.open('POST', '/api/fs/upload?' + new URLSearchParams({ dir }).toString());
            const token = readToken();
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            if (overwrite) {
                // 服务端默认覆盖；留作扩展
            }
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress?.(e.loaded, e.total);
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try { resolve(JSON.parse(xhr.responseText)); }
                    catch { resolve({}); }
                } else {
                    let msg = `${xhr.status}`;
                    try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
                    reject(new Error(msg));
                }
            };
            xhr.onerror = () => reject(new Error('上传失败'));
            const fd = new FormData();
            const name = path.slice(slash + 1);
            fd.append('file', file, name);
            xhr.send(fd);
        });
    }

    return {
        fsHome: () => api.get('/api/fs/home'),
        fsList: (path, showHidden = false) => api.get('/api/fs/list', { query: { path, showHidden } }),
        fsStat: (path) => api.get('/api/fs/stat', { query: { path } }),
        fsDelete: (path, recursive = false) => api.del('/api/fs', { query: { path, recursive } }),
        fsMkdir: (path) => api.post('/api/fs/mkdir', { path }),
        fsRename: (from, to) => api.post('/api/fs/rename', { from, to }),
        fsRead,
        fsUpload,
    };
}
