<template>
  <div v-if="view === 'list'" class="roam-notebook-list flex h-full w-full flex-col bg-[var(--bg)] text-[var(--text)]">
    <header class="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
      <div>
        <div class="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-faint)]">Notebook</div>
        <h1 class="mt-1 text-[18px] font-semibold">速记</h1>
      </div>
      <button class="rounded-full bg-[var(--text)] px-4 py-2 text-[12px] font-semibold text-[var(--bg)] transition hover:opacity-90" @click="$emit('open-editor', null)">
        新建笔记
      </button>
    </header>

    <main class="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
      <div v-if="loading && !notes.length" class="flex h-full items-center justify-center">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text)]"></div>
      </div>

      <div v-else-if="!notes.length" class="flex h-full items-center justify-center px-6 text-center">
        <div class="max-w-[360px]">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[18px]">N</div>
          <h2 class="text-[16px] font-semibold">还没有速记</h2>
          <p class="mt-2 text-[13px] leading-6 text-[var(--text-muted)]">这里用于快速记录和 AI 润色短文本，和 Agent Memory 的长期上下文分开。</p>
          <button class="mt-5 rounded-full bg-[var(--text)] px-4 py-2 text-[12px] font-semibold text-[var(--bg)]" @click="$emit('open-editor', null)">创建第一条</button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        <article
          v-for="note in notes"
          :key="note.id"
          class="group flex min-h-[170px] cursor-pointer flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--text-muted)] hover:shadow-md"
          @click="$emit('open-editor', note)"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <span class="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">Note #{{ note.id }}</span>
            <button class="rounded-full px-2 py-1 text-[11px] font-medium text-red-500 opacity-0 transition hover:bg-red-500/10 group-hover:opacity-100" @click.stop="$emit('delete-note', note.id)">
              删除
            </button>
          </div>
          <p class="line-clamp-5 flex-1 whitespace-pre-wrap break-words text-[13px] leading-6 text-[var(--text)]">
            {{ note.content || '（空）' }}
          </p>
          <div class="mt-4 border-t border-[var(--border)] pt-3 text-[11px] tabular-nums text-[var(--text-faint)]">
            {{ formatTime(note.updated_at || note.created_at) }}
          </div>
        </article>
      </div>
    </main>

    <footer v-if="totalPages > 1" class="flex shrink-0 items-center justify-center gap-3 border-t border-[var(--border)] px-4 py-3 text-[12px] text-[var(--text-muted)]">
      <button class="rounded-full border border-[var(--border)] px-3 py-1.5 transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-35" :disabled="page <= 1 || loading" @click="$emit('prev-page')">上一页</button>
      <span class="tabular-nums">{{ page }} / {{ totalPages }}</span>
      <button class="rounded-full border border-[var(--border)] px-3 py-1.5 transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-35" :disabled="page >= totalPages || loading" @click="$emit('next-page')">下一页</button>
    </footer>
  </div>
</template>

<script setup>
defineProps({
  view: { type: String, required: true },
  notes: { type: Array, required: true },
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  loading: { type: Boolean, required: true },
  formatTime: { type: Function, required: true }
});

defineEmits(['open-editor', 'delete-note', 'prev-page', 'next-page']);
</script>
