<template>
  <div class="relative flex h-full min-h-0 flex-col bg-[#f7f4ef]" @click="closeContextMenu">
    <input ref="uploadInput" type="file" class="hidden" @change="handleUpload" />

    <div class="flex h-9 shrink-0 items-center gap-0 border-b px-4" style="border-color:rgba(0,0,0,0.06);background:rgba(247,244,239,0.9)">
      <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path">
        <button
          class="inline-flex max-w-[160px] items-center gap-[4px] rounded-[7px] px-[7px] py-[3px] text-[12px] font-semibold transition"
          :class="i === breadcrumbs.length - 1
            ? 'cursor-default text-[#2a1f13]'
            : 'text-[rgba(42,31,19,0.5)] hover:bg-black/[0.06] hover:text-[#2a1f13]'"
          @click.stop="i < breadcrumbs.length - 1 && openDirectory(crumb.path)"
        >
          <span class="text-[11px]">{{ crumb.icon }}</span>
          <span class="truncate">{{ crumb.name }}</span>
        </button>
        <span v-if="i < breadcrumbs.length - 1" class="mx-0.5 select-none text-[11px]" style="color:rgba(0,0,0,0.2)">›</span>
      </template>
    </div>

    <div
      class="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]"
      @contextmenu.prevent="onBgContextMenu"
      @click.self="clearSelection"
    >
      <div v-if="loading" class="py-16 text-center text-[13px]" style="color:rgba(0,0,0,0.35)">__T_FILES_LOADING__</div>

      <div v-else-if="!items.length" class="flex h-full flex-col items-center justify-center py-16">
        <div class="text-[40px] opacity-40">📁</div>
        <div class="mt-3 text-[15px] font-semibold" style="color:#2a1f13">__T_FILES_EMPTY_TITLE__</div>
        <div class="mt-1 text-[12.5px]" style="color:rgba(0,0,0,0.4)">__T_FILES_EMPTY_DESC__</div>
      </div>

      <div v-else class="grid content-start justify-start" style="grid-template-columns:repeat(auto-fill,88px);gap:6px 4px">
        <div
          v-for="item in items"
          :key="item.path"
          class="flex select-none flex-col items-center gap-[5px] rounded-[12px] border-[1.5px] px-[6px] py-[10px] text-center transition"
          :style="selectedItem?.path === item.path
            ? 'background:rgba(140,100,60,0.13);border-color:rgba(140,100,60,0.25)'
            : 'border-color:transparent'"
          :class="selectedItem?.path !== item.path && 'hover:bg-[rgba(140,100,60,0.07)]'"
          @click.stop="selectItem(item)"
          @dblclick.stop="handleOpen(item)"
          @contextmenu.prevent.stop="onItemContextMenu($event, item)"
        >
          <div v-if="item.type === 'dir'" class="relative h-10 w-12">
            <div class="absolute left-[2px] top-0 h-2 w-[18px] rounded-t" style="background:linear-gradient(135deg,#c9a56e,#b8904e)"></div>
            <div class="absolute inset-x-0 bottom-0 top-[5px] rounded-[3px_8px_8px_8px]" style="background:linear-gradient(160deg,#d4b07a,#c49a5a);box-shadow:0 2px 8px rgba(150,90,20,0.2),inset 0 1px 0 rgba(255,255,255,0.25)"></div>
            <div class="absolute left-[3px] right-[3px] top-[7px] h-[10px] rounded-[2px_5px_0_0]" style="background:linear-gradient(180deg,rgba(255,255,255,0.22),transparent)"></div>
          </div>
          <div v-else class="relative" style="width:38px;height:46px">
            <div class="absolute inset-0" style="background:#fff;border-radius:4px 10px 4px 4px;box-shadow:0 2px 6px rgba(0,0,0,0.1),0 0 0 1px rgba(0,0,0,0.07)"></div>
            <div class="absolute right-0 top-0" style="width:11px;height:11px;background:#e8e3da;border-radius:0 0 0 5px;box-shadow:inset -1px 1px 0 rgba(0,0,0,0.05)"></div>
            <div class="absolute flex flex-col" style="top:17px;left:7px;right:7px;gap:3.5px">
              <span class="block h-0.5 rounded" style="background:rgba(160,120,80,0.2)"></span>
              <span class="block h-0.5 rounded" style="background:rgba(160,120,80,0.2)"></span>
              <span class="block h-0.5 rounded" style="width:65%;background:rgba(160,120,80,0.2)"></span>
            </div>
          </div>
          <div class="line-clamp-2 break-all text-[11.5px] font-medium leading-[1.3]" style="max-width:78px;color:#2a1f13">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex h-7 shrink-0 items-center border-t px-4" style="border-color:rgba(0,0,0,0.06);background:rgba(238,232,222,0.7)">
      <span class="text-[11px]" style="color:rgba(0,0,0,0.35)">{{ statusText }}</span>
    </div>

    <div
      v-if="contextMenu.visible"
      class="fixed z-50 overflow-hidden border p-1 backdrop-blur"
      style="min-width:180px;border-radius:13px;border-color:rgba(0,0,0,0.1);background:rgba(250,247,242,0.97);box-shadow:0 2px 8px rgba(0,0,0,0.08),0 16px 48px rgba(0,0,0,0.16)"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <template v-if="!contextMenu.item">
        <button class="ctx-row" @click="createDir">📁 __T_FILES_CREATE_DIR__</button>
        <button class="ctx-row" @click="createFile">📄 __T_FILES_CREATE_FILE__</button>
        <div class="ctx-sep"></div>
        <button class="ctx-row" @click="triggerUpload">⬆ __T_FILES_UPLOAD__</button>
      </template>
      <template v-else-if="contextMenu.item.type === 'dir'">
        <button class="ctx-row" @click="handleOpen(contextMenu.item)">📂 __T_FILES_OPEN__</button>
        <div class="ctx-sep"></div>
        <button class="ctx-row" @click="createDir">📁 __T_FILES_CREATE_DIR__</button>
        <button class="ctx-row" @click="createFile">📄 __T_FILES_CREATE_FILE__</button>
        <div class="ctx-sep"></div>
        <button class="ctx-row" @click="triggerUpload">⬆ __T_FILES_UPLOAD__</button>
        <div class="ctx-sep"></div>
        <button class="ctx-row ctx-danger" @click="deleteFile(contextMenu.item)">🗑 __T_FILES_DELETE__</button>
      </template>
      <template v-else>
        <button class="ctx-row" @click="handleOpen(contextMenu.item)">👁 __T_FILES_PREVIEW__</button>
        <button class="ctx-row" @click="downloadFile(contextMenu.item)">⬇ __T_FILES_DOWNLOAD__</button>
        <div class="ctx-sep"></div>
        <button class="ctx-row ctx-danger" @click="deleteFile(contextMenu.item)">🗑 __T_FILES_DELETE__</button>
      </template>
    </div>

    <Transition name="modal-fade">
      <div v-if="modal" class="absolute inset-0 z-50 flex items-center justify-center px-6 py-8">
        <button type="button" class="absolute inset-0 border-none bg-[rgba(28,20,12,0.36)]" @click="cancelModal" />
        <div class="relative z-10 flex w-full max-w-[400px] flex-col overflow-hidden rounded-[18px] border bg-[#fbfaf7] shadow-[0_18px_48px_rgba(0,0,0,0.22)]" style="border-color:rgba(92,67,50,0.16)">
          <div class="px-5 pb-3 pt-5">
            <div class="text-[14.5px] font-semibold" style="color:#2a1f13">{{ modal.title }}</div>
            <input
              v-if="modal.type === 'prompt'"
              ref="modalInputRef"
              v-model="modal.value"
              :placeholder="modal.placeholder"
              class="mt-3 w-full rounded-[9px] border px-3 py-2 text-[13px] outline-none transition-colors"
              style="border-color:rgba(92,67,50,0.18);background:#fff;color:#2a1f13"
              @keydown.enter.prevent="submitModal"
              @keydown.esc.prevent="cancelModal"
            />
          </div>
          <div class="flex items-center justify-end gap-2 border-t px-5 py-3" style="border-color:rgba(92,67,50,0.1)">
            <button
              type="button"
              class="rounded-[9px] border px-4 py-[6px] text-[12px] font-semibold transition-colors hover:bg-black/[0.03]"
              style="border-color:rgba(92,67,50,0.16);background:#fff;color:rgba(61,47,30,0.6)"
              @click="cancelModal"
            >__T_COMMON_CANCEL__</button>
            <button
              type="button"
              class="rounded-[9px] px-4 py-[6px] text-[12px] font-semibold text-white transition-all hover:brightness-110"
              :style="modal.danger ? 'background:#b03a20' : 'background:#5c4332'"
              @click="submitModal"
            >__T_COMMON_CONFIRM__</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { windowManager } from '../../system/windows.js';
import { toast } from '../../stores/toast.js';

const loading = ref(false);
const items = ref([]);
const currentPath = ref('');
const selectedItem = ref(null);
const uploadInput = ref(null);
const contextMenu = ref({ visible: false, x: 0, y: 0, item: null });
const modal = ref(null);
const modalInputRef = ref(null);

const CTX_W = 188;
const CTX_H = 180;
const TEXT_EXT = new Set(['.txt', '.md', '.json', '.csv', '.log']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const FS_ROOT = 'files';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `${res.status}`);
  return data;
};

const openPrompt = ({ title, placeholder = '', defaultValue = '' }) =>
  new Promise((resolve) => {
    modal.value = { type: 'prompt', title, placeholder, value: defaultValue, danger: false, resolve };
    nextTick(() => {
      modalInputRef.value?.focus();
      modalInputRef.value?.select?.();
    });
  });

const openConfirm = ({ title, danger = false }) =>
  new Promise((resolve) => {
    modal.value = { type: 'confirm', title, danger, resolve };
  });

const closeModal = (result) => {
  const fn = modal.value?.resolve;
  modal.value = null;
  if (fn) fn(result);
};

const submitModal = () => {
  if (!modal.value) return;
  if (modal.value.type === 'prompt') closeModal(modal.value.value);
  else closeModal(true);
};

const cancelModal = () => {
  if (!modal.value) return;
  if (modal.value.type === 'prompt') closeModal(null);
  else closeModal(false);
};

const breadcrumbs = computed(() => {
  const parts = String(currentPath.value || '').split('/').filter(Boolean);
  return [
    { name: '__T_FILES_ROOT__', icon: '🗂', path: '' },
    ...parts.map((name, i) => ({
      name,
      icon: '📁',
      path: parts.slice(0, i + 1).join('/')
    }))
  ];
});

const statusText = computed(() => {
  if (loading.value) return '__T_FILES_STATUS_LOADING__';
  const dirs = items.value.filter(i => i.type === 'dir').length;
  const files = items.value.filter(i => i.type === 'file').length;
  const parts = [];
  if (dirs) parts.push(`${dirs} __T_FILES_STATUS_DIRS__`);
  if (files) parts.push(`${files} __T_FILES_STATUS_FILES__`);
  if (selectedItem.value) parts.push(`__T_FILES_STATUS_SELECTED__${selectedItem.value.name}`);
  return parts.join('　·　') || '__T_FILES_STATUS_EMPTY__';
});

const loadItems = async (path = '') => {
  loading.value = true;
  try {
    const data = await request(`/api/fs/list?root=${encodeURIComponent(FS_ROOT)}&path=${encodeURIComponent(path)}`);
    items.value = Array.isArray(data.data) ? data.data : [];
    currentPath.value = data.path ?? '';
    selectedItem.value = null;
    closeContextMenu();
  } finally {
    loading.value = false;
  }
};

const openDirectory = (path = '') => loadItems(path);

const isViewable = (path = '') => {
  const lower = path.toLowerCase();
  return Array.from(TEXT_EXT).some(ext => lower.endsWith(ext))
    || Array.from(IMAGE_EXT).some(ext => lower.endsWith(ext));
};

const handleOpen = async (item) => {
  closeContextMenu();
  if (item.type === 'dir') {
    await openDirectory(item.path);
    return;
  }
  if (isViewable(item.path)) {
    await windowManager.openComponent({
      key: `file-view:${item.path}`,
      appId: 'files',
      title: item.name,
      icon: '📄',
      load: () => import('./viewer.vue'),
      defaultDesktopWindowSize: { w: 560, h: 420 },
      minDesktopWindowSize: { w: 320, h: 240 },
      props: { path: item.path },
      singleton: true
    });
  } else {
    downloadFile(item);
  }
};

const selectItem = (item) => { selectedItem.value = item; closeContextMenu(); };
const clearSelection = () => { selectedItem.value = null; closeContextMenu(); };
const closeContextMenu = () => { contextMenu.value = { visible: false, x: 0, y: 0, item: null }; };

const placeMenu = (event, item = null) => {
  if (item) selectedItem.value = item;
  const x = Math.min(event.clientX + 4, window.innerWidth - CTX_W - 8);
  const y = Math.min(event.clientY + 4, window.innerHeight - CTX_H - 8);
  contextMenu.value = { visible: true, x, y, item };
};

const onBgContextMenu = (event) => {
  if (event.target?.closest?.('[data-item]')) return;
  placeMenu(event, null);
};
const onItemContextMenu = (event, item) => placeMenu(event, item);

const buildPath = (name) => currentPath.value ? `${currentPath.value}/${name}` : name;

const createDir = async () => {
  closeContextMenu();
  const name = await openPrompt({ title: '__T_FILES_CREATE_DIR_PROMPT__' });
  if (!name || !name.trim()) return;
  try {
    await request('/api/fs/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ root: FS_ROOT, path: buildPath(name.trim()) })
    });
    await loadItems(currentPath.value);
  } catch (e) {
    toast.show(e.message || '创建失败', { type: 'error' });
  }
};

const createFile = async () => {
  closeContextMenu();
  const name = await openPrompt({ title: '__T_FILES_CREATE_FILE_PROMPT__' });
  if (!name || !name.trim()) return;
  try {
    await request('/api/fs/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ root: FS_ROOT, path: buildPath(name.trim()), content: '', create: true })
    });
    await loadItems(currentPath.value);
  } catch (e) {
    toast.show(e.message || '创建失败', { type: 'error' });
  }
};

const triggerUpload = () => { closeContextMenu(); uploadInput.value?.click(); };

const handleUpload = async (event) => {
  const file = event.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  await new Promise((res, rej) => { reader.onload = res; reader.onerror = rej; reader.readAsDataURL(file); });
  await request('/api/fs/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ root: FS_ROOT, name: file.name, data: String(reader.result || ''), dir: currentPath.value })
  });
  event.target.value = '';
  await loadItems(currentPath.value);
};

const downloadFile = (item) => {
  closeContextMenu();
  window.open(`/api/fs/download?root=${encodeURIComponent(FS_ROOT)}&path=${encodeURIComponent(item.path)}`, '_blank');
};

const deleteFile = async (item) => {
  closeContextMenu();
  const ok = await openConfirm({
    title: '__T_FILES_DELETE_CONFIRM__'.replace('{name}', item.name),
    danger: true
  });
  if (!ok) return;
  try {
    await request('/api/fs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ root: FS_ROOT, path: item.path })
    });
    const openedViewer = windowManager.state.windows.find(w => w.windowKey === `file-view:${item.path}`);
    if (openedViewer) windowManager.close(openedViewer.id);
    await loadItems(currentPath.value);
  } catch (e) {
    toast.show(e.message || '删除失败', { type: 'error' });
  }
};

onMounted(() => loadItems(''));
</script>

<style scoped>
.ctx-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: #2a1f13;
  text-align: left;
  transition: background 0.1s;
}
.ctx-row:hover { background: rgba(140,100,60,0.1); }
.ctx-danger { color: #b03a20; }
.ctx-danger:hover { background: rgba(176,58,32,0.09); }
.ctx-sep {
  height: 1px;
  margin: 3px 6px;
  background: rgba(0,0,0,0.07);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.14s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
