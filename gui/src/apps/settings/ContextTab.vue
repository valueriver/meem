<template>
  <section class="space-y-4">
    <div class="rounded-[13px] border px-4 py-4" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <div class="mb-3 text-[12px] font-semibold uppercase tracking-wide" style="color:rgba(0,0,0,0.35)">上下文轮数</div>
      <div class="flex gap-2">
        <button
          v-for="n in [30, 100, 500]"
          :key="n"
          class="flex-1 rounded-[9px] border py-2.5 text-[14px] font-semibold transition-all"
          :style="contextRounds === n
            ? 'background:#5c4332;border-color:#5c4332;color:#fff'
            : 'background:#faf8f5;border-color:rgba(0,0,0,0.1);color:rgba(0,0,0,0.4)'"
          @click="$emit('update:context-rounds', n)"
        >{{ n }}</button>
      </div>
    </div>
    <div class="flex justify-end">
      <button
        class="rounded-[9px] bg-[#5c4332] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#3d2a1e]"
        @click="$emit('save')"
      >保存</button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  contextRounds: { type: Number, default: 100 }
});
defineEmits(['update:context-rounds', 'save']);
</script>
