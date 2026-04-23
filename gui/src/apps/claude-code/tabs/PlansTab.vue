<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">Plans</div>
      <div class="text-[11.5px]" style="color:#6b5a46">来自 <span class="cc-mono">~/.claude/plans/</span></div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else-if="!data.items?.length" class="text-[12px]" style="color:#8a7965">暂无 plan</div>
    <div v-else class="space-y-3">
      <PlanCard v-for="p in data.items" :key="p.slug" :plan="p" />
    </div>
  </div>
</template>

<script setup>
import PlanCard from './PlanCard.vue';
defineProps({ data: { type: Object, default: null } });
</script>
