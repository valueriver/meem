<template>
  <div class="flex h-[100dvh] w-screen flex-col overflow-hidden bg-bg text-ink font-['Barlow',system-ui,sans-serif]">
    <AppHeader />
    <div class="relative flex min-h-0 min-w-0 flex-1">
      <AppDrawer />
      <div class="flex min-w-0 min-h-0 flex-1 flex-col">
        <Suspense>
          <component :is="currentComponent" v-if="currentComponent" :key="activeAppId" />
        </Suspense>
      </div>
    </div>
    <ConnectionGate />
    <ToastHost />
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppDrawer from '../components/AppDrawer.vue';
import ConnectionGate from '../components/ConnectionGate.vue';
import ToastHost from '../components/ToastHost.vue';
import { apps, getApp } from '../apps.js';
import { useWsStore } from '@/stores/ws';

const route = useRoute();
const ws = useWsStore();
const activeAppId = ref(null);
const currentComponent = shallowRef(null);

async function loadApp(id) {
  const app = getApp(id);
  if (!app) return;
  const mod = await app.load();
  currentComponent.value = mod?.default || mod;
  activeAppId.value = id;
}

watch(
  () => route.params.id,
  (id) => {
    const next = id ? String(id) : (apps[0]?.id || null);
    if (next && next !== activeAppId.value) loadApp(next);
  },
  { immediate: true }
);

onMounted(() => {
  ws.init();
});
</script>
