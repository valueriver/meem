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
        <div v-else-if="isJsonl" class="px-4 py-3">
          <div v-if="!jsonlEntries.length" class="text-[12px]" style="color:#8a7965">No structured entries.</div>
          <div v-else class="space-y-2">
            <button
              v-for="entry in jsonlEntries"
              :key="entry.key"
              type="button"
              class="w-full rounded-xl border px-3 py-2 text-left transition-colors hover:bg-[#fffaf2]"
              style="border-color:rgba(140,100,60,0.16);background:rgba(255,252,246,0.9)"
              @click="toggleEntry(entry.key)"
            >
              <div class="flex items-start gap-3">
                <div class="cc-mono min-w-[26px] text-[10px]" style="color:#8a7965">{{ entry.index }}</div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]" style="background:rgba(92,67,50,0.1);color:#5c4332">{{ entry.type }}</span>
                    <span v-if="entry.timestamp" class="cc-mono text-[10px]" style="color:#8a7965">{{ entry.timestamp }}</span>
                    <span v-if="entry.sessionId" class="cc-mono text-[10px]" style="color:#8a7965">{{ entry.sessionId }}</span>
                  </div>
                  <div class="mt-1 text-[12px] leading-relaxed" style="color:#2a1f13">{{ entry.summary }}</div>
                  <pre
                    v-if="expandedEntries[entry.key]"
                    class="cc-mono mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg px-3 py-2 text-[11px]"
                    style="background:#f6efe2;color:#4a3826"
                  >{{ entry.pretty }}</pre>
                </div>
                <div class="text-[11px]" style="color:#8a7965">{{ expandedEntries[entry.key] ? '收起' : '展开' }}</div>
              </div>
            </button>
          </div>
        </div>
        <pre v-else class="cc-mono text-[11.5px] px-4 py-3 whitespace-pre"
          style="color:#2a1f13;margin:0;background:#faf6ec">{{ data.content }}</pre>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  path: { type: String, default: '' }
});
const emit = defineEmits(['close']);

const data = ref(null);
const loading = ref(false);
const copied = ref(false);
const expandedEntries = ref({});

watch(() => [props.open, props.path], async ([o, p]) => {
  if (!o || !p) {
    data.value = null;
    copied.value = false;
    expandedEntries.value = {};
    return;
  }
  loading.value = true;
  data.value = null;
  expandedEntries.value = {};
  try {
    const resp = await fetch('/apps/claude-code/projects/file?path=' + encodeURIComponent(p));
    data.value = await resp.json();
  } catch (err) {
    data.value = { ok: false, error: err?.message || String(err) };
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const close = () => emit('close');

const isJsonl = computed(() => String(data.value?.name || props.path || '').toLowerCase().endsWith('.jsonl'));

const extractText = (content) => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((item) => item?.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text)
      .join(' ')
      .trim();
  }
  return '';
};

const summarizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return 'Invalid entry';
  if (entry.type === 'queue_operation') return `${entry.operation || 'operation'} queue`;
  if (entry.type === 'user') return extractText(entry.message?.content) || 'User message';
  if (entry.type === 'assistant') return extractText(entry.message?.content) || entry.message?.model || 'Assistant message';
  if (entry.type === 'last_prompt') return entry.lastPrompt || 'Last prompt';
  if (entry.type === 'ai_title') return entry.aiTitle || 'AI title';
  if (entry.attachment?.type) return `${entry.attachment.type}${entry.attachment.addedNames?.length ? ` · ${entry.attachment.addedNames.join(', ')}` : ''}`;
  if (entry.message?.model) return entry.message.model;
  if (entry.promptId) return `Prompt ${entry.promptId}`;
  return Object.keys(entry).slice(0, 4).join(' · ') || 'Entry';
};

const jsonlEntries = computed(() => {
  if (!isJsonl.value || !data.value?.content) return [];
  return String(data.value.content)
    .split('\n')
    .filter(Boolean)
    .map((line, index) => {
      try {
        const parsed = JSON.parse(line);
        return {
          key: `${index}:${parsed.timestamp || parsed.type || 'entry'}`,
          index: index + 1,
          type: parsed.type || 'entry',
          timestamp: parsed.timestamp || '',
          sessionId: parsed.sessionId ? String(parsed.sessionId).slice(0, 8) : '',
          summary: summarizeEntry(parsed),
          pretty: JSON.stringify(parsed, null, 2)
        };
      } catch {
        return {
          key: `${index}:raw`,
          index: index + 1,
          type: 'raw',
          timestamp: '',
          sessionId: '',
          summary: line.slice(0, 200),
          pretty: line
        };
      }
    });
});

const toggleEntry = (key) => {
  expandedEntries.value = {
    ...expandedEntries.value,
    [key]: !expandedEntries.value[key]
  };
};

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
