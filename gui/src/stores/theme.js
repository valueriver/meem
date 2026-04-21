import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'roam.theme';
const VALID = new Set(['dark', 'light', 'system']);

function readStored() {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return VALID.has(v) ? v : 'system';
    } catch { return 'system'; }
}

function systemPrefersDark() {
    return typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function applyTheme(mode) {
    const resolved = mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
    const el = document.documentElement;
    el.classList.remove('dark', 'light');
    el.classList.add(resolved);
    return resolved;
}

export const useThemeStore = defineStore('theme', () => {
    const mode = ref(readStored());
    const resolved = ref(applyTheme(mode.value));

    let mql = null;
    function bindSystem() {
        if (!window.matchMedia) return;
        mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (mode.value === 'system') resolved.value = applyTheme('system');
        };
        mql.addEventListener?.('change', handler);
    }
    bindSystem();

    watch(mode, (next) => {
        try { localStorage.setItem(STORAGE_KEY, next); } catch {}
        resolved.value = applyTheme(next);
    });

    function setMode(next) {
        if (VALID.has(next)) mode.value = next;
    }
    function toggle() {
        mode.value = resolved.value === 'dark' ? 'light' : 'dark';
    }

    return { mode, resolved, setMode, toggle };
});
