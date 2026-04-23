<template>
  <div class="flex h-full min-h-0 flex-col bg-[#faf8f4]">
    <div v-if="loading" class="flex h-full items-center justify-center text-[12.5px]" style="color:rgba(0,0,0,0.4)">__T_FILES_LOADING__</div>

    <div v-else-if="errorMessage" class="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div class="text-[30px] opacity-40">⚠️</div>
      <div class="text-[13px] font-semibold" style="color:#2a1f13">{{ errorMessage }}</div>
    </div>

    <template v-else-if="mode === 'text'">
      <div class="min-h-0 flex-1 p-4">
        <textarea
          v-model="content"
          class="h-full w-full resize-none rounded-[12px] border px-4 py-3 outline-none"
          style="font-family:'SF Mono','Fira Code',monospace;font-size:12.5px;line-height:1.75;color:#2a1f13;background:#fff;border-color:rgba(160,120,80,0.15)"
          spellcheck="false"
          @input="dirty = content !== original"
        ></textarea>
      </div>
      <div class="flex shrink-0 items-center gap-3 border-t px-4" style="height:32px;border-color:rgba(0,0,0,0.06);background:rgba(234,228,218,0.6)">
        <div class="h-1.5 w-1.5 rounded-full transition-opacity" style="background:#c9a56e" :style="{ opacity: dirty ? 1 : 0 }"></div>
        <span class="text-[10.5px] tabular-nums" style="color:rgba(0,0,0,0.35)">{{ content.length }} 字符</span>
        <div class="flex-1"></div>
        <button
          class="rounded-full px-4 text-[11.5px] font-semibold text-white transition disabled:opacity-40"
          style="height:22px;background:#5c4332;box-shadow:0 1px 3px rgba(0,0,0,0.12)"
          :disabled="saving || !dirty"
          @click="saveFile"
        >{{ saving ? '__T_MEMORY_SAVING__' : '__T_MEMORY_SAVE__' }}</button>
      </div>
    </template>

    <div v-else-if="mode === 'image'" class="flex min-h-0 flex-1 items-center justify-center p-4">
      <img
        :src="`/api/fs/download?root=${encodeURIComponent(FS_ROOT)}&path=${encodeURIComponent(props.path)}`"
        :alt="fileName"
        class="max-h-full max-w-full rounded-[10px]"
        style="object-fit:contain;box-shadow:0 2px 12px rgba(0,0,0,0.1)"
      />
    </div>

    <div v-else class="flex h-full flex-col items-center justify-center gap-3">
      <div class="text-[40px] opacity-40">📄</div>
      <div class="text-[13px] font-semibold" style="color:#2a1f13">{{ fileName }}</div>
      <div class="text-[11.5px]" style="color:rgba(0,0,0,0.4)">此文件类型暂不支持直接查看</div>
      <button class="mt-1 rounded-full px-4 py-1.5 text-[11.5px] font-semibold text-white" style="background:#5c4332;box-shadow:0 1px 4px rgba(0,0,0,0.12)" @click="downloadFile">__T_FILES_DOWNLOAD__</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  path: { type: String, required: true }
});

const TEXT_EXT = ['.txt', '.md', '.json', '.csv', '.log'];
const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp'];
const FS_ROOT = 'files';

const loading = ref(true);
const errorMessage = ref('');
const content = ref('');
const original = ref('');
const dirty = ref(false);
const saving = ref(false);

const fileName = computed(() => props.path.split('/').pop() || props.path);

const ext = computed(() => {
  const name = fileName.value.toLowerCase();
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i) : '';
});

const mode = computed(() => {
  if (TEXT_EXT.includes(ext.value)) return 'text';
  if (IMAGE_EXT.includes(ext.value)) return 'image';
  return 'binary';
});

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `${res.status}`);
  return data;
};

const loadFile = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (mode.value !== 'text') {
      loading.value = false;
      return;
    }
    const data = await request(`/api/fs/read?root=${encodeURIComponent(FS_ROOT)}&path=${encodeURIComponent(props.path)}`);
    content.value = data.item?.content ?? '';
    original.value = content.value;
    dirty.value = false;
  } catch (e) {
    errorMessage.value = e.message || '读取失败';
  } finally {
    loading.value = false;
  }
};

const saveFile = async () => {
  if (!dirty.value || saving.value) return;
  saving.value = true;
  try {
    await request('/api/fs/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ root: FS_ROOT, path: props.path, content: content.value })
    });
    original.value = content.value;
    dirty.value = false;
  } catch (e) {
    errorMessage.value = e.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

const downloadFile = () => {
  window.open(`/api/fs/download?root=${encodeURIComponent(FS_ROOT)}&path=${encodeURIComponent(props.path)}`, '_blank');
};

onMounted(loadFile);
</script>
