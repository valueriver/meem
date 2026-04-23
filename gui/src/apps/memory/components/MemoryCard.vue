<template>
  <article
    class="group flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[color:var(--surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--text-muted)] hover:shadow-md"
    :class="item.enabled ? '' : 'opacity-55'"
  >
    <div class="mb-3 flex items-start gap-3">
      <button
        class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full transition"
        :class="item.enabled ? (item.pinned ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-[var(--text-faint)]'"
        :title="item.enabled ? (item.pinned ? '必读记忆' : '启用记忆') : '已停用'"
        @click="$emit('toggle-enable')"
      />
      <div class="min-w-0 flex-1">
        <button class="block w-full truncate text-left text-[14px] font-semibold text-[var(--text)]" @click="$emit('edit')">
          {{ item.title }}
        </button>
        <p v-if="item.description" class="mt-1 line-clamp-3 text-[12px] leading-5 text-[var(--text-muted)]" @click="$emit('edit')">
          {{ item.description }}
        </p>
        <p v-else class="mt-1 text-[12px] text-[var(--text-faint)]" @click="$emit('edit')">
          无描述
        </p>
      </div>
    </div>

    <div class="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3">
      <span class="text-[11px] tabular-nums text-[var(--text-faint)]">{{ formatTime(item.created_at) }}</span>
      <div class="flex items-center gap-1.5">
        <button
          class="rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
          :class="item.pinned ? 'border-amber-500/30 bg-amber-500/10 text-amber-700' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'"
          @click="$emit('toggle-pin')"
        >
          {{ item.pinned ? '必读' : '设为必读' }}
        </button>
        <button
          class="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]"
          @click="$emit('toggle-enable')"
        >
          {{ item.enabled ? '停用' : '启用' }}
        </button>
        <button
          class="rounded-full px-2.5 py-1 text-[11px] font-medium text-red-500 opacity-70 transition hover:bg-red-500/10 hover:opacity-100"
          @click="$emit('delete')"
        >
          删除
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  item: { type: Object, required: true }
});

defineEmits(['edit', 'toggle-pin', 'toggle-enable', 'delete']);

const formatTime = (v) => {
  if (!v) return '';
  const d = new Date(String(v).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};
</script>
