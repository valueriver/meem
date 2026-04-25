<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWsStore } from '@/stores/ws';
import { useSettingsStore } from '@/stores/settings';
import AppHeader from '@/components/AppHeader.vue';
import AppDrawer from '@/components/AppDrawer.vue';
import ToastHost from '@/components/ToastHost.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import ConnectionGate from '@/components/ConnectionGate.vue';

const ws = useWsStore();
useSettingsStore();
const route = useRoute();
const router = useRouter();

const showChrome = computed(() => route.name !== 'guard');

onMounted(() => {
    ws.init();
});

// 未认证 + 需要密码 → 强制去 /login
watch(
    () => [ws.requiresPassword, ws.authenticated, ws.invalid],
    ([req, authed, invalid]) => {
        if (invalid) return;
        if (req && !authed && route.name !== 'guard') {
            router.replace({ path: '/guard', query: route.query });
        }
    },
    { immediate: true }
);
</script>

<template>
    <AppHeader v-if="showChrome" />
    <AppDrawer v-if="showChrome" />

    <router-view v-slot="{ Component }">
        <keep-alive>
            <component :is="Component" />
        </keep-alive>
    </router-view>

    <SettingsModal />
    <ConnectionGate />
    <ToastHost />
</template>
