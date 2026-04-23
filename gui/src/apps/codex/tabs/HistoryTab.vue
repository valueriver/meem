<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">Prompt History</div>
      <div class="text-[11.5px]" style="color:#6b5a46">来自 <span class="cc-mono">~/.codex/history.jsonl</span> · {{ '共 {n} 条'.replace('{n}', String(data?.total || 0)) }}</div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else-if="!data.items?.length" class="text-[12px]" style="color:#8a7965">暂无历史</div>
    <div v-else class="rounded-xl bg-white border" style="border-color:rgba(140,100,60,0.12)">
      <div v-for="(h, i) in data.items" :key="i" class="px-3 py-2 flex gap-3"
        :style="i < data.items.length - 1 ? 'border-bottom:1px solid rgba(140,100,60,0.06)' : ''">
        <div class="cc-mono shrink-0" style="font-size:10.5px;color:#8a7965;min-width:110px">{{ formatShortTime(h.timestamp) }}</div>
        <div class="min-w-0">
          <div class="text-[12.5px]" style="color:#2a1f13">{{ h.display || '(空)' }}</div>
          <div v-if="h.sessionId" class="cc-mono text-[10px] truncate" style="color:#8a7965">{{ h.sessionId.slice(0, 8) }}...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatShortTime } from '../utils.js';
defineProps({ data: { type: Object, default: null } });
</script>
