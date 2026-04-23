<template>
  <div v-if="view !== 'list'" class="roam-notebook-editor flex h-full w-full flex-col bg-[var(--bg)] text-[var(--text)]">
    <header class="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
      <div class="min-w-0">
        <button class="mb-1 text-[12px] font-medium text-[var(--text-muted)] transition hover:text-[var(--text)]" @click="$emit('back')">← 返回列表</button>
        <h1 class="truncate text-[18px] font-semibold">{{ editingNoteId ? `编辑笔记 #${editingNoteId}` : '新建笔记' }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <button class="rounded-full border border-[var(--border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-35" :disabled="!editorDraft.trim() || aiLoading" @click="$emit('optimize')">
          {{ aiLoading ? '优化中...' : 'AI 优化' }}
        </button>
        <button v-if="editingNoteId" class="rounded-full px-3 py-1.5 text-[12px] font-semibold text-red-500 transition hover:bg-red-500/10" @click="$emit('request-delete')">
          删除
        </button>
        <button class="rounded-full bg-[var(--text)] px-4 py-1.5 text-[12px] font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35" :disabled="saving || !editorDraft.trim()" @click="$emit('save')">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </header>

    <main class="grid min-h-0 flex-1 grid-cols-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        <div class="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <span class="text-[12px] font-semibold text-[var(--text-muted)]">正文</span>
          <span class="text-[11px] tabular-nums text-[var(--text-faint)]">{{ editorDraft.length }} 字 · {{ currentDate }}</span>
        </div>
        <textarea
          ref="editorEl"
          :value="editorDraft"
          class="min-h-0 flex-1 resize-none border-none bg-transparent p-5 text-[14px] leading-7 text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
          placeholder="记录想法、片段、待润色文本..."
          spellcheck="false"
          @input="$emit('update:editorDraft', $event.target.value)"
        ></textarea>
      </section>

      <aside class="flex min-h-[260px] flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        <div class="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <div class="text-[12px] font-semibold">AI 润色</div>
            <div class="mt-0.5 text-[11px] text-[var(--text-faint)]">保留原意，提升表达</div>
          </div>
          <button v-if="aiResult || aiDrawerOpen" class="rounded-full px-2.5 py-1 text-[11px] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]" @click="$emit('close-ai')">关闭</button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          <div v-if="aiLoading" class="flex h-full items-center justify-center gap-2 text-[12px] text-[var(--text-muted)]">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text)]"></div>
            正在优化...
          </div>
          <div v-else-if="aiResult" class="whitespace-pre-wrap text-[13px] leading-6 text-[var(--text)]">{{ aiResult }}</div>
          <div v-else class="flex h-full items-center justify-center px-6 text-center text-[12px] leading-6 text-[var(--text-muted)]">
            点击“AI 优化”后，结果会出现在这里。确认无误后可应用到正文。
          </div>
        </div>

        <div v-if="aiResult && !aiLoading" class="flex shrink-0 gap-2 border-t border-[var(--border)] p-3">
          <button class="flex-1 rounded-full bg-[var(--text)] px-3 py-2 text-[12px] font-semibold text-[var(--bg)] transition hover:opacity-90" @click="$emit('apply-ai')">应用结果</button>
          <button class="rounded-full border border-[var(--border)] px-3 py-2 text-[12px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]" @click="$emit('close-ai')">放弃</button>
        </div>
      </aside>
    </main>

    <Transition name="ai-modal">
      <div v-if="showDeleteConfirm" class="absolute inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm" @click.self="$emit('cancel-delete')">
        <div class="w-full max-w-[360px] rounded-3xl border border-[var(--border)] bg-[var(--bg)] p-5 shadow-2xl">
          <h2 class="text-[16px] font-semibold">删除笔记？</h2>
          <p class="mt-2 text-[13px] leading-6 text-[var(--text-muted)]">此操作不可撤销。</p>
          <div class="mt-5 flex justify-end gap-2">
            <button class="rounded-full border border-[var(--border)] px-4 py-2 text-[12px] font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)]" @click="$emit('cancel-delete')">取消</button>
            <button class="rounded-full bg-red-500 px-4 py-2 text-[12px] font-semibold text-white hover:bg-red-600" @click="$emit('confirm-delete')">删除</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
const props = defineProps({
  view: { type: String, required: true },
  editorDraft: { type: String, required: true },
  editingNoteId: { type: [String, Number, null], default: null },
  saving: { type: Boolean, required: true },
  aiDrawerOpen: { type: Boolean, required: true },
  aiLoading: { type: Boolean, required: true },
  aiResult: { type: String, required: true },
  showDeleteConfirm: { type: Boolean, required: true },
  currentDate: { type: String, required: true }
});

defineEmits([
  'back',
  'optimize',
  'request-delete',
  'cancel-delete',
  'confirm-delete',
  'save',
  'apply-ai',
  'close-ai',
  'update:editorDraft'
]);

const editorEl = ref(null);

watch(
  () => props.view,
  async (nextView) => {
    if (nextView === 'editor') {
      await nextTick();
      editorEl.value?.focus();
    }
  },
  { immediate: true }
);
</script>
