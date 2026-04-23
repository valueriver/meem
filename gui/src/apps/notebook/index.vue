<template>
  <NotebookListView
    :view="view"
    :notes="notes"
    :page="page"
    :total-pages="totalPages"
    :loading="loading"
    :format-time="formatTime"
    @open-editor="openEditor"
    @delete-note="deleteNote"
    @prev-page="goPrevPage"
    @next-page="goNextPage"
  />
  <NotebookEditorView
    :view="view"
    v-model:editorDraft="editorDraft"
    :editing-note-id="editingNoteId"
    :saving="saving"
    :ai-drawer-open="aiDrawerOpen"
    :ai-loading="aiLoading"
    :ai-result="aiResult"
    :show-delete-confirm="showDeleteConfirm"
    :current-date="currentDate"
    @back="backToList"
    @optimize="startOptimize"
    @request-delete="showDeleteConfirm = true"
    @cancel-delete="showDeleteConfirm = false"
    @confirm-delete="confirmDelete"
    @save="saveEditor"
    @apply-ai="applyAI"
    @close-ai="closeAI"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { LOCALE, LOCALE_FULL } from '../../system/locale.js';
import NotebookEditorView from './NotebookEditorView.vue';
import NotebookListView from './NotebookListView.vue';

const API_BASE = '/apps/notebook';
const PAGE_SIZE = 12;

const view = ref('list');
const notes = ref([]);
const loading = ref(false);
const error = ref('');
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);

const editorDraft = ref('');
const editingNoteId = ref(null);
const saving = ref(false);
const aiDrawerOpen = ref(false);
const aiLoading = ref(false);
const aiResult = ref('');
const showDeleteConfirm = ref(false);

const currentDate = computed(() =>
  new Date().toLocaleDateString(LOCALE_FULL, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '/')
);

const fetchNotes = async () => {
  try {
    loading.value = true;
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(PAGE_SIZE) });
    const res = await fetch(`${API_BASE}/list?${params.toString()}`);
    const data = await res.json();
    notes.value = data.items || [];
    total.value = Number(data.total || 0);
    totalPages.value = Number(data.totalPages || 1);
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
      return fetchNotes();
    }
  } catch (e) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
};

const openEditor = (note) => {
  editingNoteId.value = note?.id || null;
  editorDraft.value = note?.content || '';
  aiDrawerOpen.value = false;
  aiLoading.value = false;
  aiResult.value = '';
  view.value = 'editor';
};

const backToList = () => {
  view.value = 'list';
  editingNoteId.value = null;
  editorDraft.value = '';
  aiDrawerOpen.value = false;
  aiResult.value = '';
};

const saveEditor = async () => {
  const content = editorDraft.value.trim();
  if (!content || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const url = editingNoteId.value ? `${API_BASE}/update` : `${API_BASE}/create`;
    const body = editingNoteId.value ? { id: editingNoteId.value, content } : { content, style: 0 };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    page.value = 1;
    await fetchNotes();
    backToList();
  } catch (e) {
    error.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
  showDeleteConfirm.value = false;
  if (!editingNoteId.value) return;
  await deleteNote(editingNoteId.value);
  backToList();
};

const deleteNote = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchNotes();
  } catch (e) {
    error.value = e.message || '删除失败';
  }
};

const goPrevPage = async () => {
  if (page.value > 1 && !loading.value) {
    page.value--;
    await fetchNotes();
  }
};

const goNextPage = async () => {
  if (page.value < totalPages.value && !loading.value) {
    page.value++;
    await fetchNotes();
  }
};

const buildOptimizePrompt = (lang, content) => [
  '你是一位文字润色专家。',
  '请润色以下文字，使其更通顺、更专业，同时保持原意不变。',
  '只输出润色后的正文，不要解释、不要前缀、不要 markdown。',
  '',
  '原文：',
  content
].join('\n');

const startOptimize = async () => {
  const content = editorDraft.value.trim();
  if (!content || aiLoading.value) return;
  aiLoading.value = true;
  aiResult.value = '';
  aiDrawerOpen.value = true;
  try {
    const lang = LOCALE;
    const res = await fetch(`${API_BASE}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        taskTitle: '笔记润色',
        prompt: buildOptimizePrompt(lang, content)
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
    aiResult.value = data.result || '';
  } catch (e) {
    error.value = e.message || '优化失败';
    aiDrawerOpen.value = false;
  } finally {
    aiLoading.value = false;
  }
};

const applyAI = () => {
  if (aiResult.value) editorDraft.value = aiResult.value;
  closeAI();
};

const closeAI = () => {
  aiDrawerOpen.value = false;
  aiResult.value = '';
};

const formatTime = (v) => {
  if (!v) return '';
  const d = new Date(String(v).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return v;
  const diff = Date.now() - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return '{n}分钟前'.replace('{n}', Math.floor(diff / 60000));
  if (diff < 86400000) return '{n}小时前'.replace('{n}', Math.floor(diff / 3600000));
  if (diff < 604800000) return '{n}天前'.replace('{n}', Math.floor(diff / 86400000));
  return d.toLocaleDateString(LOCALE_FULL, { month: 'short', day: 'numeric' });
};

onMounted(() => {
  fetchNotes();
});
</script>
