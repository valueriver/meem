<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useViewStore } from '@/stores/view';

const router = useRouter();
const route = useRoute();
const view = useViewStore();

function navigateTo(path) {
    if (route.path !== path) router.push(path);
    if (window.matchMedia('(max-width: 767px)').matches) view.closeDrawer();
}
</script>

<template>
    <!-- Desktop: in-flow sidebar (md+), toggled by view.drawerOpen -->
    <aside
        v-show="view.drawerOpen"
        class="hidden md:flex shrink-0 w-56 flex-col border-r border-line bg-bg-elev">
        <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
            <button v-for="item in view.navItems" :key="item.path"
                @click="navigateTo(item.path)"
                class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left text-[13px] font-medium transition-colors"
                :class="route.path === item.path
                    ? 'bg-bg-hi text-ink'
                    : 'text-muted hover:text-ink hover:bg-bg-hi'">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path :d="item.iconPath" />
                </svg>
                <span>{{ item.label }}</span>
            </button>
        </nav>
    </aside>

    <!-- Mobile: overlay (sits under the global header, above the content) -->
    <div v-if="view.drawerOpen"
        class="md:hidden absolute inset-0 z-40"
        @click.self="view.closeDrawer">
        <div class="fade-enter absolute inset-0 bg-black/60"></div>
        <aside class="drawer-enter absolute left-0 top-0 bottom-0 w-64 max-w-[80vw] bg-bg-elev border-r border-line flex flex-col safe-bottom">
            <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
                <button v-for="item in view.navItems" :key="item.path"
                    @click="navigateTo(item.path)"
                    class="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left text-[13px] font-medium transition-colors"
                    :class="route.path === item.path
                        ? 'bg-bg-hi text-ink'
                        : 'text-muted hover:text-ink hover:bg-bg-hi'">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path :d="item.iconPath" />
                    </svg>
                    <span>{{ item.label }}</span>
                </button>
            </nav>
        </aside>
    </div>
</template>
