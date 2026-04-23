<template>
  <div class="roam-memory flex h-full min-h-0 flex-col bg-[var(--bg)] text-[var(--text)]">
    <header class="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
      <div>
        <div class="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-faint)]">Agent Memory</div>
        <h1 class="mt-1 text-[18px] font-semibold">AI 记忆库</h1>
      </div>
      <div class="flex items-center gap-2">
        <button class="rounded-full border border-[var(--border)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]" @click="loadItems">
          刷新
        </button>
        <button class="rounded-full bg-[var(--text)] px-4 py-1.5 text-[12px] font-semibold text-[var(--bg)] transition hover:opacity-90" @click="openEditor(null)">
          新建记忆
        </button>
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <aside class="w-[190px] shrink-0 border-r border-[var(--border)] p-3">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition"
          :class="tab === t.key ? 'bg-[var(--surface-active)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'"
          @click="tab = t.key"
        >
          <span class="font-medium">{{ t.label }}</span>
          <span class="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] tabular-nums text-[var(--text-faint)]">{{ t.count }}</span>
        </button>
      </aside>

      <main class="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
        <div v-if="loading && !items.length" class="flex h-full items-center justify-center">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text)]"></div>
        </div>

        <div v-else-if="!items.length" class="flex h-full items-center justify-center px-6 text-center">
          <div class="max-w-[360px]">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[18px]">M</div>
            <h2 class="text-[16px] font-semibold">还没有 AI 记忆</h2>
            <p class="mt-2 text-[13px] leading-6 text-[var(--text-muted)]">这里存放给 Agent 读取的偏好、项目约定和长期上下文，不是用户便签。</p>
            <button class="mt-5 rounded-full bg-[var(--text)] px-4 py-2 text-[12px] font-semibold text-[var(--bg)]" @click="openEditor(null)">创建第一条</button>
          </div>
        </div>

        <template v-else>
          <div v-if="!filteredItems.length" class="flex h-full items-center justify-center text-[13px] text-[var(--text-muted)]">当前分类下没有记忆</div>
          <div v-else class="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
            <MemoryCard
              v-for="it in filteredItems"
              :key="it.id"
              :item="it"
              @edit="openEditor(it)"
              @toggle-pin="togglePin(it)"
              @toggle-enable="toggleEnable(it)"
              @delete="deleteItem(it)"
            />
          </div>
        </template>
      </main>
    </div>

    <Transition name="modal">
      <div v-if="editorOpen" class="absolute inset-0 z-30 flex items-center justify-center bg-black/35 px-5 py-6 backdrop-blur-sm" @click.self="closeEditor">
        <div class="flex max-h-[88%] w-full max-w-[620px] flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl">
          <div class="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <div class="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-faint)]">Memory Entry</div>
              <div class="mt-1 text-[17px] font-semibold">{{ editId ? '编辑记忆' : '新建记忆' }}</div>
            </div>
            <button class="flex h-8 w-8 items-center justify-center rounded-full text-[18px] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]" @click="closeEditor">×</button>
          </div>

          <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 [scrollbar-width:thin]">
            <label class="block">
              <span class="mb-1.5 block text-[12px] font-semibold text-[var(--text-muted)]">标题</span>
              <input ref="titleInput" v-model="editTitle" placeholder="例如：项目编码约定" class="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] outline-none transition focus:border-[var(--text-muted)]" @keydown.meta.s.prevent="saveEdit" @keydown.ctrl.s.prevent="saveEdit" />
            </label>

            <label class="block">
              <span class="mb-1.5 block text-[12px] font-semibold text-[var(--text-muted)]">描述</span>
              <input v-model="editDescription" placeholder="一句话说明这条记忆什么时候应该被 AI 使用" class="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] outline-none transition focus:border-[var(--text-muted)]" @keydown.meta.s.prevent="saveEdit" @keydown.ctrl.s.prevent="saveEdit" />
              <span class="mt-1.5 block text-[11px] text-[var(--text-faint)]">启用时 AI 默认看到标题和描述；设为必读时才读取完整内容。</span>
            </label>

            <label class="flex min-h-0 flex-1 flex-col">
              <span class="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[var(--text-muted)]">
                <span>内容</span>
                <span class="font-normal tabular-nums text-[var(--text-faint)]">{{ editContent.length }} 字</span>
              </span>
              <textarea v-model="editContent" placeholder="写下需要 Agent 长期记住的上下文..." class="min-h-[220px] w-full flex-1 resize-y rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[13px] leading-6 outline-none transition focus:border-[var(--text-muted)]" @keydown.meta.s.prevent="saveEdit" @keydown.ctrl.s.prevent="saveEdit"></textarea>
            </label>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
            <button class="rounded-full border border-[var(--border)] px-4 py-2 text-[12px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]" @click="closeEditor">取消</button>
            <button class="rounded-full bg-[var(--text)] px-5 py-2 text-[12px] font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35" :disabled="!canSave || saving" @click="saveEdit">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import MemoryCard from './components/MemoryCard.vue';

const loading = ref(false);
const items = ref([]);
const tab = ref('all');
const editorOpen = ref(false);
const editId = ref(null);
const editTitle = ref('');
const editDescription = ref('');
const editContent = ref('');
const saving = ref(false);
const titleInput = ref(null);

const pinned = computed(() => items.value.filter(i => i.pinned && i.enabled));
const enabled = computed(() => items.value.filter(i => !i.pinned && i.enabled));
const disabled = computed(() => items.value.filter(i => !i.enabled));
const canSave = computed(() => editTitle.value.trim() && editContent.value.trim());

const tabs = computed(() => [
  { key: 'all', label: '全部', count: items.value.length },
  { key: 'pinned', label: '必读', count: pinned.value.length },
  { key: 'enabled', label: '启用', count: enabled.value.length },
  { key: 'disabled', label: '停用', count: disabled.value.length },
]);

const filteredItems = computed(() => {
  if (tab.value === 'pinned') return pinned.value;
  if (tab.value === 'enabled') return enabled.value;
  if (tab.value === 'disabled') return disabled.value;
  return items.value;
});

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `${res.status}`);
  return data;
};
const post = (url, body) => request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const loadItems = async () => {
  loading.value = true;
  try {
    const data = await request('/api/memory/list');
    items.value = Array.isArray(data.items) ? data.items : [];
  } finally { loading.value = false; }
};

const togglePin = async (item) => {
  if (!item.enabled) { await post('/api/memory/update', { id: item.id, enabled: true, pinned: true }); item.enabled = 1; item.pinned = 1; }
  else { await post('/api/memory/update', { id: item.id, pinned: !item.pinned }); item.pinned = item.pinned ? 0 : 1; }
};

const toggleEnable = async (item) => {
  const ne = !item.enabled;
  const u = { id: item.id, enabled: ne };
  if (!ne && item.pinned) u.pinned = false;
  await post('/api/memory/update', u);
  item.enabled = ne ? 1 : 0;
  if (!ne) item.pinned = 0;
};

const deleteItem = async (item) => {
  if (!confirm(`确定删除「${item.title}」？此操作不可撤销。`)) return;
  await post('/api/memory/delete', { id: item.id });
  items.value = items.value.filter(i => i.id !== item.id);
};

const openEditor = async (item) => {
  editId.value = item ? item.id : null;
  if (item) {
    editTitle.value = item.title;
    editDescription.value = item.description || '';
    try { const d = await request(`/api/memory/get?id=${item.id}`); editContent.value = d.item.content; editDescription.value = d.item.description || ''; } catch { editContent.value = ''; }
  } else { editTitle.value = ''; editDescription.value = ''; editContent.value = ''; }
  editorOpen.value = true;
  nextTick(() => titleInput.value?.focus());
};

const closeEditor = () => { editorOpen.value = false; };

const saveEdit = async () => {
  if (!canSave.value || saving.value) return;
  saving.value = true;
  try {
    const payload = { title: editTitle.value.trim(), description: editDescription.value.trim(), content: editContent.value.trim() };
    if (editId.value) await post('/api/memory/update', { id: editId.value, ...payload });
    else await post('/api/memory/create', payload);
    editorOpen.value = false;
    await loadItems();
  } finally { saving.value = false; }
};

onMounted(loadItems);
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
