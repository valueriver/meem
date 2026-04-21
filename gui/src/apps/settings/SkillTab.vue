<template>
  <section class="space-y-4">
    <div v-if="loading" class="rounded-[13px] border px-4 py-3.5 text-[13px]" style="background:#fff;border-color:rgba(0,0,0,0.08);color:rgba(0,0,0,0.4)">
      正在加载技能列表…
    </div>

    <div v-else-if="error" class="rounded-[13px] border px-4 py-3.5 text-[13px]" style="background:#fff5f5;border-color:#fecaca;color:#dc2626">
      {{ error }}
    </div>

    <div v-else-if="items.length === 0" class="rounded-[13px] border border-dashed px-4 py-3.5 text-[13px]" style="border-color:rgba(0,0,0,0.1);color:rgba(0,0,0,0.35)">
      当前没有可用技能。
    </div>

    <div v-else class="space-y-2">
      <article
        v-for="item in items"
        :key="item.id"
        class="rounded-[13px] border px-4 py-3.5"
        style="background:#fff;border-color:rgba(0,0,0,0.08)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-[13px] font-semibold" style="color:#2a1f13">{{ item.name }}</div>
            <div v-if="item.description" class="mt-1 text-[12px] leading-5" style="color:rgba(0,0,0,0.5)">{{ item.description }}</div>
          </div>
        </div>
        <div class="mt-2 font-mono text-[11px]" style="color:rgba(0,0,0,0.3)">{{ item.path }}</div>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
});
</script>
