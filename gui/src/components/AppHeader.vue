<script setup>
import { computed } from 'vue';
import { useWsStore } from '@/stores/ws';
import { useViewStore } from '@/stores/view';
import { useThemeStore } from '@/stores/theme';
import TaskIndicator from './TaskIndicator.vue';

const ws = useWsStore();
const view = useViewStore();
const theme = useThemeStore();

const isLight = computed(() => theme.resolved === 'light');
</script>

<template>
    <header class="shrink-0 h-11 flex items-center gap-2 px-2 border-b border-line bg-bg-elev">
        <button @click="view.toggleDrawer"
            class="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-bg-hi transition-colors"
            title="菜单">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
        </button>
        <div class="min-w-0 flex-1 px-1 text-[13px] font-medium text-ink tracking-tight">Roam</div>
        <div class="flex items-center gap-0.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0 mr-1"
                :class="{
                    'bg-emerald-500': ws.state === 'connected',
                    'bg-amber-400 pulse': ws.state === 'pending',
                    'bg-red-500': ws.state === 'offline'
                }"
            ></span>
            <button @click="theme.toggle"
                class="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-bg-hi transition-colors"
                :title="isLight ? '切到暗色' : '切到亮色'">
                <svg v-if="isLight" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="12" y1="3" x2="12" y2="5"/>
                    <line x1="12" y1="19" x2="12" y2="21"/>
                    <line x1="3" y1="12" x2="5" y2="12"/>
                    <line x1="19" y1="12" x2="21" y2="12"/>
                    <line x1="5.6" y1="5.6" x2="7" y2="7"/>
                    <line x1="17" y1="17" x2="18.4" y2="18.4"/>
                    <line x1="5.6" y1="18.4" x2="7" y2="17"/>
                    <line x1="17" y1="7" x2="18.4" y2="5.6"/>
                </svg>
            </button>
            <TaskIndicator />
        </div>
    </header>
</template>
