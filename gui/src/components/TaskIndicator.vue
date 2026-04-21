<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useTasksStore } from '@/stores/tasks';
import TaskPanel from './TaskPanel.vue';

const tasks = useTasksStore();
const open = ref(false);
const rootRef = ref(null);

const isBusy = computed(() => tasks.runningCount > 0);

function toggle() { open.value = !open.value; }
function close() { open.value = false; }

function onDocPointerDown(e) {
    if (!open.value) return;
    if (rootRef.value && !rootRef.value.contains(e.target)) close();
}

onMounted(() => {
    tasks.startPolling(4000);
    document.addEventListener('pointerdown', onDocPointerDown);
});

onBeforeUnmount(() => {
    tasks.stopPolling();
    document.removeEventListener('pointerdown', onDocPointerDown);
});
</script>

<template>
    <div ref="rootRef" class="relative">
        <button
            @click="toggle"
            class="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-colors"
            :class="open ? 'bg-bg-hi text-ink' : 'text-muted hover:text-ink hover:bg-bg-hi'"
            title="任务">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                :class="isBusy ? 'task-spin' : ''">
                <circle cx="12" cy="12" r="9"/>
                <polyline points="12 7 12 12 15 14"/>
            </svg>
            <span v-if="tasks.runningCount > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
                style="background:var(--color-accent);color:var(--color-bg)">
                {{ tasks.runningCount }}
            </span>
        </button>

        <TaskPanel v-if="open" @close="close" />
    </div>
</template>

<style scoped>
@keyframes task-spin-anim {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
.task-spin { animation: task-spin-anim 2s linear infinite; transform-origin: 50% 50%; }
</style>
