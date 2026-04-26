function buildHeaders(apiKey, apiUrl) {
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
    };
    if (String(apiUrl || '').includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'https://meem.local';
        headers['X-Title'] = 'meem';
    }
    return headers;
}

function normalizeUsage(usage) {
    if (!usage || typeof usage !== 'object') return null;
    const promptTokens = Math.max(0, Number(usage.prompt_tokens) || 0);
    const completionTokens = Math.max(0, Number(usage.completion_tokens) || 0);
    const totalTokens = Math.max(0, Number(usage.total_tokens) || promptTokens + completionTokens);
    return { promptTokens, completionTokens, totalTokens };
}

function ensureToolCall(toolCalls, index) {
    if (!toolCalls[index]) {
        toolCalls[index] = {
            id: '',
            type: 'function',
            function: { name: '', arguments: '' },
        };
    }
    return toolCalls[index];
}

function parseOpenAiDelta(json, state, onDelta) {
    if (json?.usage) state.usage = normalizeUsage(json.usage);
    const choice = json?.choices?.[0];
    if (!choice) return;
    const delta = choice.delta || {};
    const text = typeof delta.content === 'string' ? delta.content : '';
    if (text) {
        state.content += text;
        onDelta?.(text);
    }
    if (Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
            const idx = Number(tc?.index || 0);
            const target = ensureToolCall(state.toolCalls, idx);
            if (tc?.id) target.id = tc.id;
            if (tc?.type) target.type = tc.type;
            if (tc?.function?.name) target.function.name += tc.function.name;
            if (tc?.function?.arguments) target.function.arguments += tc.function.arguments;
        }
    }
}

async function callLlmStream(apiUrl, apiKey, payload, { signal, onDelta } = {}) {
    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: buildHeaders(apiKey, apiUrl),
        body: JSON.stringify({
            ...payload,
            stream: true,
            stream_options: { include_usage: true },
        }),
        signal,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM ${res.status}: ${text}`);
    }
    if (!res.body) throw new Error('LLM stream body is empty');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    const state = { content: '', toolCalls: [], usage: null };

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep = buffer.indexOf('\n\n');
        while (sep >= 0) {
            const event = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            sep = buffer.indexOf('\n\n');

            const raw = event
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trim())
                .join('\n');

            if (!raw || raw === '[DONE]') continue;
            parseOpenAiDelta(JSON.parse(raw), state, onDelta);
        }
    }

    if (state.toolCalls.length) {
        return {
            role: 'assistant',
            content: state.content || null,
            tool_calls: state.toolCalls.filter(Boolean),
            usage: state.usage,
        };
    }

    return {
        role: 'assistant',
        content: state.content ?? '',
        usage: state.usage,
    };
}

module.exports = { callLlmStream };
