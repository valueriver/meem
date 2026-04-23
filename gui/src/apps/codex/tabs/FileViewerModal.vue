<template>
  <Teleport to=".cc-app-root" :disabled="!open">
    <div v-if="open" class="absolute inset-0 z-50 flex items-center justify-center p-5"
      style="background:rgba(42,31,19,0.42);backdrop-filter:blur(2px)"
      @click.self="close">
    <div class="flex flex-col overflow-hidden w-full max-w-[920px]"
      style="max-height:calc(100% - 24px);background:#faf6ec;border:1px solid rgba(140,100,60,0.22);border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,0.25)">
      <div class="flex items-center gap-3 px-4 py-3 border-b" style="border-color:rgba(140,100,60,0.14);background:#fffaf2">
        <div class="min-w-0 flex-1">
          <div class="cc-mono text-[12.5px] font-semibold truncate" style="color:#2a1f13">{{ path }}</div>
          <div v-if="data?.ok" class="text-[10.5px] cc-mono" style="color:#8a7965">
            {{ formatSize(data.size) }}<span v-if="data.truncated"> · 已截断显示前 2MB</span>
          </div>
          <div v-else-if="loading" class="text-[10.5px]" style="color:#8a7965">加载中...</div>
        </div>
        <button class="text-[11px] px-2.5 py-1 rounded-md hover:bg-black/5" style="color:#5c4332" @click="copy" :disabled="!data?.ok">
          {{ copied ? '已复制 ✓' : '复制' }}
        </button>
        <button class="text-[14px] px-2 py-1 rounded-md hover:bg-black/5" style="color:#5c4332" @click="close">✕</button>
      </div>

      <div class="flex-1 overflow-auto cc-thin-scroll">
        <div v-if="loading" class="p-6 text-[12px]" style="color:#8a7965">读取中...</div>
        <div v-else-if="!data?.ok" class="p-6 text-[12px]" style="color:#b03a20">{{ data?.error || '加载失败' }}</div>
        <pre v-else class="cc-mono text-[11.5px] px-4 py-3 whitespace-pre"
          style="color:#2a1f13;margin:0;background:#faf6ec">{{ data.content }}</pre>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  path: { type: String, default: '' }
});
const emit = defineEmits(['close']);

const data = ref(null);
const loading = ref(false);
const copied = ref(false);

watch(() => [props.open, props.path], async ([o, p]) => {
  if (!o || !p) {
    data.value = null;
    copied.value = false;
    return;
  }
  loading.value = true;
  data.value = null;
  try {
    const resp = await fetch('/apps/codex/projects/file?path=' + encodeURIComponent(p));
    data.value = await resp.json();
  } catch (err) {
    data.value = { ok: false, error: err?.message || String(err) };
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const close = () => emit('close');

const copy = async () => {
  if (!data.value?.ok) return;
  try {
    await navigator.clipboard.writeText(data.value.content);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  } catch {}
};

const formatSize = (n) => {
  if (!n) return '0';
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
  return n + ' B';
};
</script>
