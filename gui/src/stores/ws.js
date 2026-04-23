// v3 的 "ws" store —— 其实是"认证 + 连接健康"门面。
// 保留 v2 里视图用到的字段名（showActions / authenticated / authError / authClosed / superseded / invalid）
// 实际数据走 HTTP：/api/me、/api/auth/challenge、/api/auth/submit。

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as api from '@/utils/api';

export const useWsStore = defineStore('ws', () => {
    const state = ref('pending');           // 'pending' | 'connected' | 'offline'
    const statusText = ref('连接中...');

    const authenticated = ref(false);
    const requiresPassword = ref(true);
    const locked = ref(false);
    const email = ref(null);
    const via = ref(null);
    const connection = ref(null);
    const relay = ref(null);
    const remoteConfig = ref({
        wsUrl: '',
        token: '',
        deviceId: '',
        mainPort: '9507',
        mainHost: '127.0.0.1',
        source: 'none'
    });

    const authError = ref('');
    const relayPending = ref('idle');      // 'idle' | 'starting' | 'stopping' | 'saving'
    let challengeNonceId = '';
    let challengeNonce = '';

    // 保留 v2 视图依赖的字段
    const invalid = ref(false);
    const superseded = ref(false);
    const authClosed = computed(() => locked.value);
    const showActions = computed(() => authenticated.value);

    async function refreshMe() {
        try {
            const me = await api.get('/api/me');
            authenticated.value = Boolean(me.authenticated);
            requiresPassword.value = Boolean(me.requiresPassword);
            locked.value = Boolean(me.locked);
            email.value = me.email || null;
            via.value = me.via || null;
            connection.value = me.connection || null;
            relay.value = me.relay || null;
            state.value = 'connected';
            statusText.value = authenticated.value ? '已连接' : '需要认证';
            return me;
        } catch (err) {
            state.value = 'offline';
            statusText.value = '连接失败';
            connection.value = null;
            relay.value = null;
            throw err;
        }
    }

    async function refreshRemote() {
        const data = await api.get('/api/system/remote');
        relay.value = data.relay || null;
        return data.relay || null;
    }

    async function fetchRemoteConfig() {
        const data = await api.get('/api/system/remote/config');
        remoteConfig.value = data.config || remoteConfig.value;
        relay.value = data.relay || relay.value;
        return data.config || null;
    }

    async function saveRemoteConfig(nextConfig) {
        relayPending.value = 'saving';
        try {
            const data = await api.post('/api/system/remote/config', nextConfig);
            remoteConfig.value = data.config || remoteConfig.value;
            relay.value = data.relay || relay.value;
            return data.config || null;
        } finally {
            relayPending.value = 'idle';
        }
    }

    async function pollRelayUntil(predicate, { timeoutMs = 8000, intervalMs = 800 } = {}) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (predicate(relay.value)) return true;
            await new Promise((r) => setTimeout(r, intervalMs));
            try { await refreshRemote(); } catch {}
        }
        return predicate(relay.value);
    }

    async function startRemote() {
        relayPending.value = 'starting';
        try {
            const data = await api.post('/api/system/remote/start');
            relay.value = data.relay || relay.value;
            if (!relay.value?.running) await pollRelayUntil((r) => r?.running === true);
            return relay.value;
        } finally {
            relayPending.value = 'idle';
        }
    }

    async function stopRemote() {
        relayPending.value = 'stopping';
        try {
            const data = await api.post('/api/system/remote/stop');
            relay.value = data.relay || relay.value;
            if (relay.value?.running) await pollRelayUntil((r) => r?.running === false);
            return relay.value;
        } finally {
            relayPending.value = 'idle';
        }
    }

    async function requestChallenge() {
        authError.value = '';
        try {
            const r = await api.post('/api/auth/challenge');
            if (r?.locked) {
                locked.value = true;
                authError.value = `认证已锁定，${r.lockoutMinutes} 分钟后重试`;
                return null;
            }
            if (r?.requiresPassword === false) {
                await refreshMe();
                return null;
            }
            challengeNonceId = r.nonceId || '';
            challengeNonce = r.nonce || '';
            return r;
        } catch (err) {
            authError.value = err?.body?.error || err.message;
            return null;
        }
    }

    async function hmacHex(password, nonceHex) {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw', enc.encode(password),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
        );
        const nonceBytes = new Uint8Array(nonceHex.length / 2);
        for (let i = 0; i < nonceBytes.length; i++) {
            nonceBytes[i] = parseInt(nonceHex.substr(i * 2, 2), 16);
        }
        const sig = await crypto.subtle.sign('HMAC', key, nonceBytes);
        return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    async function submitPassword(password) {
        authError.value = '';
        if (!challengeNonce) {
            const c = await requestChallenge();
            if (!c) return;
        }
        try {
            const proof = await hmacHex(String(password || ''), challengeNonce);
            const res = await api.post('/api/auth/submit', { nonceId: challengeNonceId, proof });
            api.writeToken(res.token);
            challengeNonce = '';
            challengeNonceId = '';
            await refreshMe();
        } catch (err) {
            authError.value = err?.body?.error || err.message || '提交失败';
            if (err?.body?.locked) locked.value = true;
            await requestChallenge();
        }
    }

    async function init() {
        state.value = 'pending';
        statusText.value = '连接中...';
        try {
            const me = await refreshMe();
            if (me.authenticated) return;
            if (me.requiresPassword) await requestChallenge();
        } catch {
            setTimeout(init, 3000);
        }
    }

    // 兼容：有些地方可能还在调 sendMsg/onMessage，保留空壳避免报错
    function sendMsg() {}
    function onMessage() { return () => {}; }

    return {
        state, statusText,
        authenticated, requiresPassword, locked, email, via, connection, relay, remoteConfig,
        authError, relayPending,
        invalid, superseded, authClosed,
        showActions,
        init, refreshMe, refreshRemote, fetchRemoteConfig, saveRemoteConfig, startRemote, stopRemote, requestChallenge, submitPassword,
        sendMsg, onMessage,
    };
});
