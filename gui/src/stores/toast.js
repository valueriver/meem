import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

const state = reactive({
    visible: false,
    message: '',
    type: 'success',
});

let toastTimer = null;

export const toast = {
    state,
    show(message, { type = 'success', duration = 2200 } = {}) {
        clearTimeout(toastTimer);
        state.message = String(message || '').trim();
        state.type = type;
        state.visible = Boolean(state.message);
        if (!state.visible) return;
        toastTimer = setTimeout(() => {
            state.visible = false;
            toastTimer = null;
        }, duration);
    },
    hide() {
        clearTimeout(toastTimer);
        state.visible = false;
    },
};

export const useToastStore = defineStore('toast', () => {
    const message = ref('');
    let timer = null;

    function show(msg, duration = 1600) {
        message.value = msg;
        toast.show(msg, { duration });
        clearTimeout(timer);
        timer = setTimeout(() => { message.value = ''; }, duration);
    }

    return { message, show };
});
