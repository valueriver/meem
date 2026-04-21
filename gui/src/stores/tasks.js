import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as api from '@/utils/api';

export const useTasksStore = defineStore('tasks', () => {
    const tasks = ref([]);
    const loading = ref(false);
    const error = ref('');
    let pollTimer = null;

    const runningCount = computed(
        () => tasks.value.filter((t) => t.status === 'running' || t.status === 'pending').length,
    );

    async function fetch() {
        try {
            loading.value = true;
            error.value = '';
            const data = await api.get('/api/task', { query: { limit: 30 } });
            tasks.value = Array.isArray(data) ? data : [];
        } catch (err) {
            error.value = err?.body?.message || err.message || '';
        } finally {
            loading.value = false;
        }
    }

    async function stop(id) {
        try {
            await api.post('/api/task/stop', { id });
            await fetch();
        } catch (err) {
            error.value = err?.body?.message || err.message || '';
        }
    }

    function startPolling(intervalMs = 4000) {
        stopPolling();
        fetch();
        pollTimer = setInterval(fetch, intervalMs);
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    return { tasks, loading, error, runningCount, fetch, stop, startPolling, stopPolling };
});
