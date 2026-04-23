<template>
  <div class="roam-code-viewer flex h-full min-h-0 bg-[#1e1e1e] text-[#d4d4d4]" style="font-family:'SF Pro Display','PingFang SC',sans-serif">
    <aside class="flex min-h-0 w-[320px] shrink-0 flex-col border-r border-[#2d2d30] bg-[#181818]">
      <div class="flex items-center justify-between border-b border-[#2d2d30] px-3 py-2.5">
        <div>
          <div class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b949e]">Workspace</div>
          <div class="mt-1 text-[11px] text-[#6a737d]">{{ workspaces.length }} folder{{ workspaces.length === 1 ? '' : 's' }}</div>
        </div>
        <button
          type="button"
          class="rounded bg-[#2a2d2e] px-2.5 py-1.5 text-[11px] font-medium text-[#d7dae0] transition-colors hover:bg-[#37373d]"
          @click="pickerVisible = true"
        >Add Folder</button>
      </div>

      <div class="min-h-0 flex-1 overflow-auto py-2 [scrollbar-width:thin]">
        <div v-if="!workspaces.length" class="px-3 py-3 text-[12px] text-[#6a737d]">No workspace folders.</div>

        <div v-for="workspace in workspaces" :key="workspace.id" class="mb-2">
          <button
            type="button"
            class="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[#202123]"
            @click="toggleWorkspace(workspace)"
          >
            <span class="mt-[2px] inline-flex w-3 shrink-0 justify-center text-[10px] text-[#8b949e]">
              {{ workspace.expanded ? '▾' : '▸' }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[12px] font-medium text-[#d7dae0]">{{ workspace.name }}</span>
              <span class="mt-0.5 block truncate text-[10px] text-[#6a737d]">{{ workspace.base }}</span>
            </span>
          </button>

          <div v-if="workspace.expanded" class="pb-1">
            <div v-if="workspace.loading" class="px-3 py-2 text-[11px] text-[#6a737d]">Loading workspace...</div>
            <div v-else-if="workspace.error" class="px-3 py-2 text-[11px] text-[#f48771]">{{ workspace.error }}</div>
            <div v-else-if="!workspace.items.length" class="px-3 py-2 text-[11px] text-[#6a737d]">No source files.</div>
            <TreeNode
              v-for="item in workspace.items"
              :key="`${workspace.id}:${item.path}`"
              :item="item"
              :depth="0"
              :expanded-paths="workspaceExpanded(workspace.id)"
              :children-map="workspaceChildren(workspace.id)"
              :active-path="activeWorkspaceId === workspace.id ? activePath : ''"
              :loading-paths="workspaceLoading(workspace.id)"
              @toggle="toggleDir(workspace, $event)"
              @open-file="openFile(workspace, $event)"
            />
          </div>
        </div>
      </div>
    </aside>

    <section class="flex min-h-0 flex-1 flex-col">
      <div class="flex h-10 shrink-0 items-center justify-between border-b border-[#2d2d30] bg-[#252526] px-4">
        <div class="min-w-0 flex-1">
          <div class="truncate text-[12px] font-medium text-[#e6edf3]">{{ fileName }}</div>
          <div class="truncate text-[11px] text-[#8b949e]">{{ activeAbsolutePath || 'Select a file from the left tree' }}</div>
        </div>
        <div class="ml-4 flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="rounded px-2.5 py-1 text-[11px] font-medium text-[#c9d1d9] transition-colors hover:bg-[#2d333b] hover:text-white disabled:cursor-default disabled:opacity-40"
            :disabled="!activeAbsolutePath"
            @click="copyPath"
          >复制路径</button>
          <button
            type="button"
            class="rounded px-2.5 py-1 text-[11px] font-medium text-[#c9d1d9] transition-colors hover:bg-[#2d333b] hover:text-white disabled:cursor-default disabled:opacity-40"
            :disabled="!activePath"
            @click="copyContent"
          >复制内容</button>
          <div class="text-[11px] text-[#8b949e]">{{ metaText }}</div>
        </div>
      </div>

      <div v-if="contentLoading" class="flex flex-1 items-center justify-center text-[12px] text-[#8b949e]">
        Loading file...
      </div>
      <div v-else-if="contentError" class="flex flex-1 items-center justify-center px-8 text-center text-[13px] text-[#f48771]">
        {{ contentError }}
      </div>
      <div v-else-if="!activePath" class="flex flex-1 items-center justify-center px-8 text-center">
        <div>
          <div class="text-[56px] opacity-60">🧭</div>
          <div class="mt-4 text-[15px] font-semibold text-[#d7dae0]">Code Viewer</div>
          <div class="mt-2 text-[12px] text-[#8b949e]">左侧按工作区浏览目录树，右侧只读查看源码。</div>
        </div>
      </div>
      <div v-else class="min-h-0 flex-1 overflow-auto bg-[#1e1e1e] [scrollbar-width:thin]">
        <div class="inline-flex min-w-full font-['SF_Mono','Fira_Code','Menlo',monospace] text-[12.5px] leading-6">
          <div class="shrink-0 border-r border-[#2d2d30] bg-[#1b1b1c] px-3 py-3 text-right text-[#6a737d]">
            <div v-for="(_, idx) in lineCount" :key="idx" class="h-6 tabular-nums">{{ idx + 1 }}</div>
          </div>
          <pre class="w-max min-w-0 whitespace-pre overflow-visible px-4 py-3 text-[#d4d4d4]">{{ displayContent }}</pre>
        </div>
      </div>
    </section>

    <DirectoryPicker
      :visible="pickerVisible"
      :initial-base="pickerInitialBase"
      @close="pickerVisible = false"
      @select="addWorkspace"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import DirectoryPicker from '../../components/DirectoryPicker.vue';
import { toast } from '../../stores/toast.js';
import TreeNode from './TreeNode.vue';

const FS_ROOT = 'absolute';

const workspaces = ref([]);
const pickerVisible = ref(false);
const pickerInitialBase = ref('/');

const treeState = reactive({
  children: {},
  expanded: {},
  loading: {}
});

const activeWorkspaceId = ref('');
const activePath = ref('');
const content = ref('');
const contentLoading = ref(false);
const contentError = ref('');
const fileMeta = ref(null);

const request = async (url) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `${res.status}`);
  return data;
};

const joinPath = (base = '', rel = '') => {
  const cleanBase = String(base || '').replace(/\/+$/, '') || '/';
  const cleanRel = String(rel || '').replace(/^\/+/, '');
  if (!cleanRel) return cleanBase;
  if (cleanBase === '/') return `/${cleanRel}`;
  return `${cleanBase}/${cleanRel}`;
};

const baseName = (path = '/') => {
  const normalized = String(path || '/').replace(/\/+$/, '') || '/';
  if (normalized === '/') return '/';
  return normalized.split('/').pop() || normalized;
};

const makeWorkspace = (base) => ({
  id: `workspace:${base}`,
  name: baseName(base),
  base,
  items: [],
  expanded: true,
  loading: false,
  error: ''
});

const workspaceChildren = (workspaceId) => {
  if (!treeState.children[workspaceId]) treeState.children[workspaceId] = {};
  return treeState.children[workspaceId];
};

const workspaceExpanded = (workspaceId) => {
  if (!treeState.expanded[workspaceId]) treeState.expanded[workspaceId] = {};
  return treeState.expanded[workspaceId];
};

const workspaceLoading = (workspaceId) => {
  if (!treeState.loading[workspaceId]) treeState.loading[workspaceId] = {};
  return treeState.loading[workspaceId];
};

const resetWorkspaceTree = (workspaceId) => {
  treeState.children[workspaceId] = {};
  treeState.expanded[workspaceId] = {};
  treeState.loading[workspaceId] = {};
};

const loadWorkspaceRoot = async (workspace) => {
  workspace.loading = true;
  workspace.error = '';
  try {
    const data = await request(`/api/fs/list?root=${encodeURIComponent(FS_ROOT)}&base=${encodeURIComponent(workspace.base)}&path=&hidden=1`);
    workspace.items = Array.isArray(data.data) ? data.data : [];
    workspace.base = data.base || workspace.base;
    workspace.name = baseName(workspace.base);
  } catch (e) {
    workspace.items = [];
    workspace.error = e.message || 'Failed to load workspace';
  } finally {
    workspace.loading = false;
  }
};

const toggleWorkspace = async (workspace) => {
  workspace.expanded = !workspace.expanded;
  if (workspace.expanded && !workspace.items.length && !workspace.loading && !workspace.error) {
    await loadWorkspaceRoot(workspace);
  }
};

const toggleDir = async (workspace, item) => {
  const expanded = workspaceExpanded(workspace.id);
  const children = workspaceChildren(workspace.id);
  const loading = workspaceLoading(workspace.id);
  const key = item.path;

  if (expanded[key]) {
    expanded[key] = false;
    return;
  }

  expanded[key] = true;
  if (children[key]) return;

  loading[key] = true;
  try {
    const data = await request(`/api/fs/list?root=${encodeURIComponent(FS_ROOT)}&base=${encodeURIComponent(workspace.base)}&path=${encodeURIComponent(item.path)}&hidden=1`);
    children[key] = Array.isArray(data.data) ? data.data : [];
  } finally {
    delete loading[key];
  }
};

const openFile = async (workspace, item) => {
  activeWorkspaceId.value = workspace.id;
  activePath.value = item.path;
  contentLoading.value = true;
  contentError.value = '';

  try {
    const data = await request(`/api/fs/read?root=${encodeURIComponent(FS_ROOT)}&base=${encodeURIComponent(workspace.base)}&path=${encodeURIComponent(item.path)}`);
    content.value = data.item?.content ?? '';
    fileMeta.value = data.item || null;
  } catch (e) {
    content.value = '';
    fileMeta.value = null;
    contentError.value = e.message || 'Failed to read file';
  } finally {
    contentLoading.value = false;
  }
};

const copyText = async (value, successMessage) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    toast.show(successMessage);
  } catch (e) {
    toast.show(e?.message || '复制失败', { type: 'error' });
  }
};

const loadDefaultWorkspaceBase = async () => {
  try {
    const data = await request('/api/fs/roots');
    const workspaceRoot = Array.isArray(data.data)
      ? data.data.find((item) => item.id === 'workspace')
      : null;
    return workspaceRoot?.base || '/';
  } catch {
    return '/';
  }
};

const addWorkspace = async (base) => {
  pickerVisible.value = false;
  const normalized = String(base || '/').replace(/\/+$/, '') || '/';
  const existing = workspaces.value.find((workspace) => workspace.base === normalized);
  if (existing) {
    existing.expanded = true;
    if (!existing.items.length) await loadWorkspaceRoot(existing);
    return;
  }

  const workspace = makeWorkspace(normalized);
  resetWorkspaceTree(workspace.id);
  workspaces.value = [...workspaces.value, workspace];
  await loadWorkspaceRoot(workspace);
};

const activeWorkspace = computed(() => workspaces.value.find((workspace) => workspace.id === activeWorkspaceId.value) || null);
const fileName = computed(() => activePath.value.split('/').pop() || 'Preview');
const activeAbsolutePath = computed(() => {
  if (!activeWorkspace.value || !activePath.value) return '';
  return joinPath(activeWorkspace.value.base, activePath.value);
});
const copyPath = () => copyText(activeAbsolutePath.value, '路径已复制');
const copyContent = () => copyText(displayContent.value, '内容已复制');
const displayContent = computed(() => content.value || '');
const lineCount = computed(() => Math.max(1, displayContent.value.split('\n').length));
const metaText = computed(() => (fileMeta.value ? `${fileMeta.value.size || 0} B` : ''));

onMounted(async () => {
  const workspaceBase = await loadDefaultWorkspaceBase();
  pickerInitialBase.value = workspaceBase;
  await addWorkspace(workspaceBase);
});
</script>
