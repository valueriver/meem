<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[420] flex items-center justify-center bg-black/45 px-6 py-8" @click="emit('close')">
      <div class="flex h-[560px] w-[760px] max-w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b1d] shadow-[0_24px_80px_rgba(0,0,0,0.45)]" @click.stop>
        <div class="border-b border-[#2d2d30] px-5 py-4">
          <div class="text-[15px] font-semibold text-[#f3f4f6]">Select Folder</div>
          <div class="mt-1 text-[12px] text-[#8b949e]">Browse folders and choose one to add into the workspace.</div>
        </div>

        <div class="border-b border-[#2d2d30] px-4 py-3">
          <div class="flex flex-wrap items-center gap-y-1 text-[12px]">
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
              <button
                type="button"
                class="max-w-[180px] rounded px-1.5 py-1 transition-colors"
                :class="index === breadcrumbs.length - 1
                  ? 'cursor-default bg-[#2a2d2e] text-[#f3f4f6]'
                  : 'text-[#9da2a6] hover:bg-[#2a2d2e] hover:text-white'"
                @click="openBreadcrumb(crumb.path)"
              >
                <span class="truncate">{{ crumb.label }}</span>
              </button>
              <span v-if="index < breadcrumbs.length - 1" class="px-1 text-[#5f666d]">/</span>
            </template>
          </div>
          <div class="mt-2 truncate text-[11px] text-[#6a737d]">{{ currentBase || '/' }}</div>
        </div>

        <div class="min-h-0 flex-1 overflow-auto px-3 py-3 [scrollbar-width:thin]">
          <div v-if="loading" class="px-2 py-6 text-[12px] text-[#6a737d]">Loading folders...</div>
          <div v-else-if="error" class="px-2 py-6 text-[12px] text-[#f48771]">{{ error }}</div>
          <div v-else-if="!folders.length" class="px-2 py-6 text-[12px] text-[#6a737d]">No subfolders here.</div>
          <div v-else class="space-y-1">
            <button
              v-for="folder in folders"
              :key="folder.path"
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[12px] transition-colors"
              :class="selectedPath === folderPath(folder)
                ? 'bg-[#2f3540] text-white'
                : 'text-[#d4d4d4] hover:bg-[#252628]'"
              @click="selectedPath = folderPath(folder)"
              @dblclick="enterFolder(folder)"
            >
              <span class="text-[14px]">📁</span>
              <span class="min-w-0 flex-1 truncate">{{ folder.name }}</span>
              <span class="text-[10px] uppercase tracking-[0.12em] text-[#6a737d]">Open</span>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-[#2d2d30] px-4 py-3">
          <button
            type="button"
            class="rounded px-3 py-1.5 text-[12px] text-[#9da2a6] transition-colors hover:bg-[#252628] hover:text-white"
            @click="openParent"
          >Up One Level</button>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded border border-[#3d4044] px-3 py-1.5 text-[12px] text-[#c9d1d9] transition-colors hover:bg-[#252628]"
              @click="emit('close')"
            >Cancel</button>
            <button
              type="button"
              class="rounded bg-[#2f6feb] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3b82f6]"
              @click="selectCurrent"
            >Add Selected Folder</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialBase: { type: String, default: '/' }
});

const emit = defineEmits(['close', 'select']);

const currentBase = ref('/');
const selectedPath = ref('/');
const folders = ref([]);
const loading = ref(false);
const error = ref('');

const request = async (url) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `${res.status}`);
  return data;
};

const normalizePath = (path = '/') => {
  const clean = String(path || '/').replace(/\/+$/, '');
  return clean || '/';
};

const joinPath = (base = '/', rel = '') => {
  const cleanBase = normalizePath(base);
  const cleanRel = String(rel || '').replace(/^\/+/, '');
  if (!cleanRel) return cleanBase;
  if (cleanBase === '/') return `/${cleanRel}`;
  return `${cleanBase}/${cleanRel}`;
};

const parentPath = (path = '/') => {
  const normalized = normalizePath(path);
  if (normalized === '/') return '/';
  const index = normalized.lastIndexOf('/');
  return index <= 0 ? '/' : normalized.slice(0, index);
};

const folderPath = (folder) => joinPath(currentBase.value, folder.path || folder.name || '');

const breadcrumbs = computed(() => {
  const segments = normalizePath(currentBase.value).split('/').filter(Boolean);
  const list = [{ label: '[root]', path: '/' }];
  let current = '';
  for (const segment of segments) {
    current = `${current}/${segment}`;
    list.push({ label: segment, path: current || '/' });
  }
  return list;
});

const loadFolders = async (base) => {
  loading.value = true;
  error.value = '';
  try {
    const data = await request(`/api/fs/list?root=absolute&base=${encodeURIComponent(base)}&path=&hidden=1`);
    currentBase.value = data.base || normalizePath(base);
    selectedPath.value = currentBase.value;
    folders.value = Array.isArray(data.data) ? data.data.filter((item) => item.type === 'dir') : [];
  } catch (e) {
    error.value = e.message || 'Failed to load folders';
    folders.value = [];
  } finally {
    loading.value = false;
  }
};

const openBreadcrumb = async (path) => {
  if (!path || path === currentBase.value) return;
  await loadFolders(path);
};

const openParent = async () => {
  await loadFolders(parentPath(currentBase.value));
};

const enterFolder = async (folder) => {
  await loadFolders(folderPath(folder));
};

const selectCurrent = () => {
  emit('select', normalizePath(selectedPath.value || currentBase.value));
};

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return;
    await loadFolders(normalizePath(props.initialBase || '/'));
  }
);
</script>
