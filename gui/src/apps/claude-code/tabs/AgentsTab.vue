<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">Subagents</div>
      <div class="text-[11.5px]" style="color:#6b5a46">数据来自 <span class="cc-mono">claude agents</span> · {{ data?.total || '' }}</div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else-if="!data.available" class="text-[12px]" style="color:#b03a20">{{ data.error || '-' }}</div>
    <div v-else class="space-y-2">
      <div v-for="a in data.agents" :key="a.name" class="cc-chart-card" style="display:grid;grid-template-columns:48px 1fr;gap:12px;align-items:center;padding:12px 16px">
        <div class="cc-icon">🤖</div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[13px] font-bold">{{ a.name }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full cc-mono font-semibold" style="background:rgba(92,67,50,0.12);color:#5c4332">{{ a.model }}</span>
          </div>
          <div class="text-[11px] mt-0.5" style="color:#6b5a46">{{ a.group || 'built-in' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, default: null } });
</script>
