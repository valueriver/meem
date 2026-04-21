<script setup>
import { useTasksStore } from '@/stores/tasks';

const tasks = useTasksStore();

defineEmits(['close']);

const STATUS_META = {
    running:   { label: '运行中', color: 'var(--color-accent)' },
    pending:   { label: '等待',   color: 'var(--color-accent)' },
    completed: { label: '完成',   color: 'var(--color-good)' },
    stopped:   { label: '已停',   color: 'var(--color-muted)' },
    error:     { label: '错误',   color: 'var(--color-bad)' },
};

function statusMeta(s) {
    return STATUS_META[s] || { label: s || '未知', color: 'var(--color-muted)' };
}

function fmtTime(s) {
    if (!s) return '';
    const d = new Date(String(s).replace(' ', 'T') + 'Z');
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function isActive(t) { return t.status === 'running' || t.status === 'pending'; }
</script>

<template>
    <div class="absolute right-0 top-[calc(100%+6px)] z-50 w-[340px] max-h-[440px] rounded-lg border border-line bg-bg-elev flex flex-col overflow-hidden"
        style="box-shadow: 0 8px 24px var(--color-shadow), 0 1px 0 var(--color-line)">
        <div class="shrink-0 flex items-center justify-between px-3 h-10 border-b border-line">
            <div class="text-[12px] font-medium text-ink">任务</div>
            <button
                @click="tasks.fetch"
                class="text-[11px] text-muted hover:text-ink transition-colors"
                title="刷新">
                刷新
            </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto">
            <div v-if="tasks.tasks.length === 0" class="py-10 text-center text-[12px] text-faint">
                {{ tasks.loading ? '加载中…' : '还没有任务' }}
            </div>

            <div v-else class="divide-y divide-line">
                <div v-for="t in tasks.tasks" :key="t.id"
                    class="px-3 py-2.5 text-[12px] hover:bg-bg-hi transition-colors">
                    <div class="flex items-center gap-2">
                        <span
                            class="shrink-0 w-1.5 h-1.5 rounded-full"
                            :class="isActive(t) ? 'pulse' : ''"
                            :style="{ background: statusMeta(t.status).color }"></span>
                        <span class="truncate flex-1 text-ink">
                            {{ t.title || t.prompt?.slice(0, 40) || `#${t.id}` }}
                        </span>
                        <span class="shrink-0 text-[10px] text-faint">{{ fmtTime(t.created_at) }}</span>
                    </div>
                    <div class="mt-1 flex items-center gap-2 pl-3.5 text-[10px] text-muted">
                        <span class="uppercase tracking-wider">{{ t.app }}</span>
                        <span class="text-faint">·</span>
                        <span>{{ t.mode }}</span>
                        <span class="text-faint">·</span>
                        <span :style="{ color: statusMeta(t.status).color }">
                            {{ statusMeta(t.status).label }}
                        </span>
                        <button v-if="isActive(t)"
                            @click="tasks.stop(t.id)"
                            class="ml-auto text-[10px] text-faint hover:text-bad transition-colors">
                            停止
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
