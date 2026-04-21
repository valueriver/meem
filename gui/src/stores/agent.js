import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '@/utils/api';

function mapToolCall(toolCall, key) {
    const name = toolCall?.function?.name || 'tool';
    const rawArgs = toolCall?.function?.arguments || '';
    let args = null;
    try { args = JSON.parse(rawArgs); } catch {}
    const title = args?.description || args?.reason || name;
    const command = name === 'terminal' ? (args?.command || '') : '';
    const detail = command ? '' : (args ? JSON.stringify(args, null, 2) : rawArgs);
    return {
        type: 'tool_call',
        toolCall,
        title,
        command,
        detail,
        result: null,
        status: 'running',
        _key: key,
    };
}

function parseRows(rows) {
    const list = [];
    for (const row of rows) {
        const base = row._id != null ? `db:${row._id}` : null;
        if (row.role === 'user') {
            list.push({ role: 'user', content: String(row.content || ''), _key: base ? `${base}:user` : undefined });
        } else if (row.role === 'assistant') {
            if (row.content) {
                list.push({ role: 'assistant', content: String(row.content), _key: base ? `${base}:assistant` : undefined });
            }
            if (Array.isArray(row.tool_calls)) {
                row.tool_calls.forEach((tc, i) => {
                    list.push(mapToolCall(tc, base ? `${base}:tc:${i}` : undefined));
                });
            }
        } else if (row.role === 'tool') {
            for (let i = list.length - 1; i >= 0; i--) {
                if (list[i].type === 'tool_call' && list[i].result === null) {
                    list[i].result = String(row.content || '');
                    list[i].status = 'ok';
                    break;
                }
            }
        }
    }
    return list;
}

export const useAgentStore = defineStore('agent', () => {
    const messages = ref([]);
    const input = ref('');
    const running = ref(false);

    const configured = ref(false);
    const model = ref('');
    const apiUrl = ref('');
    const apiKeyMasked = ref('');

    const sessionId = ref('');
    const sessionTitle = ref('新会话');
    const sessions = ref([]);
    const hasMore = ref(false);
    const loadedOffset = ref(0);

    const seen = new Set();
    let currentStream = null;
    let streamingKey = '';
    let ready = false;

    function addUnique(items, { prepend = false } = {}) {
        const uniq = [];
        for (const m of items) {
            if (m?._key && seen.has(m._key)) continue;
            if (m?._key) seen.add(m._key);
            uniq.push(m);
        }
        messages.value = prepend ? [...uniq, ...messages.value] : [...messages.value, ...uniq];
    }

    function resetView() {
        messages.value = [];
        hasMore.value = false;
        loadedOffset.value = 0;
        seen.clear();
        streamingKey = '';
    }

    async function fetchConfig() {
        const c = await api.get('/api/agent/config');
        configured.value = Boolean(c.configured);
        model.value = c.model || '';
        apiUrl.value = c.apiUrl || '';
        apiKeyMasked.value = c.apiKeyMasked || '';
    }

    async function fetchSessions() {
        const r = await api.get('/api/agent/sessions');
        sessions.value = r.sessions || [];
        if (r.activeId) sessionId.value = r.activeId;
    }

    async function loadHistory(id, offset = 0) {
        const data = await api.get(`/api/agent/sessions/${id}/messages`, { query: { offset, limit: 50 } });
        if (offset === 0) {
            resetView();
            sessionId.value = data.session?.id || id;
            sessionTitle.value = data.session?.title || '新会话';
            addUnique(parseRows(data.messages || []));
        } else {
            addUnique(parseRows(data.messages || []), { prepend: true });
        }
        hasMore.value = Boolean(data.hasMore);
        loadedOffset.value = (data.offset || 0) + (data.messages?.length || 0);
    }

    async function initialize() {
        if (ready) return;
        ready = true;
        await fetchConfig();
        await fetchSessions();
        if (sessionId.value) await loadHistory(sessionId.value, 0);
    }

    async function send() {
        const text = String(input.value || '').trim();
        if (!text || running.value) return;
        const key = `client:${Date.now()}:user`;
        seen.add(key);
        messages.value.push({ role: 'user', content: text, _key: key });
        input.value = '';
        running.value = true;
        streamingKey = '';

        currentStream = api.stream('/api/agent/chat', { message: text }, {
            hello: () => {},
            run_state: (ev) => { running.value = Boolean(ev.running); },
            session: (ev) => {
                sessionId.value = ev.id || sessionId.value;
                sessionTitle.value = ev.title || sessionTitle.value;
                fetchSessions().catch(() => {});
            },
            delta: (ev) => {
                const d = ev.delta || '';
                if (!streamingKey) {
                    streamingKey = `ws:${Date.now()}:assistant`;
                    seen.add(streamingKey);
                    messages.value.push({ role: 'assistant', content: '', _key: streamingKey, streaming: true });
                }
                const m = messages.value.find((x) => x._key === streamingKey);
                if (m) m.content += d;
            },
            tool_call: (ev) => {
                if (streamingKey) {
                    const m = messages.value.find((x) => x._key === streamingKey);
                    if (m) m.streaming = false;
                    streamingKey = '';
                }
                const key = `ws:${Date.now()}:tc:${Math.random().toString(36).slice(2, 6)}`;
                seen.add(key);
                messages.value.push(mapToolCall(ev.toolCall, key));
            },
            tool_result: (ev) => {
                for (let i = messages.value.length - 1; i >= 0; i--) {
                    const m = messages.value[i];
                    if (m.type === 'tool_call' && m.result === null) {
                        m.result = String(ev.content || '');
                        m.status = 'ok';
                        return;
                    }
                }
            },
            done: (ev) => {
                if (streamingKey) {
                    const m = messages.value.find((x) => x._key === streamingKey);
                    if (m) m.streaming = false;
                    streamingKey = '';
                } else if (ev.content) {
                    const k = `ws:${Date.now()}:assistant`;
                    seen.add(k);
                    messages.value.push({ role: 'assistant', content: String(ev.content), _key: k });
                }
            },
            error: (ev) => {
                const k = `ws:${Date.now()}:error`;
                seen.add(k);
                messages.value.push({ role: 'error', content: ev.message || '执行失败', _key: k });
                running.value = false;
            },
            end: () => {
                running.value = false;
                currentStream = null;
            },
        });
    }

    async function abort() {
        if (currentStream) currentStream.abort();
        try { await api.post('/api/agent/abort', {}); } catch {}
        running.value = false;
    }

    async function newSession() {
        const r = await api.post('/api/agent/sessions', {});
        sessionId.value = r.session.id;
        sessionTitle.value = r.session.title;
        await fetchSessions();
        resetView();
    }

    async function switchSession(id) {
        if (!id || id === sessionId.value) return;
        await api.patch('/api/agent/active', { id });
        await loadHistory(id, 0);
        await fetchSessions();
    }

    async function deleteSession(id) {
        if (!id) return;
        await api.del(`/api/agent/sessions/${id}`);
        await fetchSessions();
        if (sessionId.value === id) {
            // 被删，fetchSessions 里 activeId 已经换了
            await loadHistory(sessionId.value, 0);
        }
    }

    async function loadMore() {
        if (!hasMore.value || !sessionId.value) return;
        await loadHistory(sessionId.value, loadedOffset.value);
    }

    async function saveConfig(data) {
        const res = await api.put('/api/agent/config', data);
        configured.value = Boolean(res.configured);
        model.value = res.model || '';
        apiUrl.value = res.apiUrl || '';
        apiKeyMasked.value = res.apiKeyMasked || '';
    }

    return {
        messages, input, running,
        configured, model, apiUrl, apiKeyMasked,
        sessionId, sessionTitle, sessions,
        hasMore, loadedOffset,
        initialize, send, abort, saveConfig,
        newSession, switchSession, deleteSession, loadMore,
    };
});
