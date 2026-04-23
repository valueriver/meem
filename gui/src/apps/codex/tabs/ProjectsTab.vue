<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <template v-if="!currentPath">
      <div>
        <div class="text-[17px] font-bold">会话存档</div>
        <div class="text-[11.5px]" style="color:#6b5a46">
          {{ '~/.codex/sessions/ 按 年 / 月 / 日 归档 · {n} 个年份'.replace('{n}', String(data?.projects?.length || 0)) }}
        </div>
      </div>

      <div v-if="loading" class="text-[12px]" style="color:#8a7965">加载中...</div>
      <div v-else-if="!data?.projects?.length" class="text-[12px]" style="color:#8a7965">暂无会话</div>
      <div v-else class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
        <button v-for="p in data.projects" :key="p.year"
          class="w-full text-left grid gap-3 items-center px-4 py-3 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
          style="grid-template-columns: 1fr 100px 110px 16px;border-color:rgba(140,100,60,0.08)"
          @click="enterDir([p.year])">
          <div class="cc-mono text-[13px]" style="color:#2a1f13;font-weight:600">📅 {{ p.year }}</div>
          <div class="cc-mono text-right" style="font-size:11.5px;color:#4a3826">{{ '{n} 会话'.replace('{n}', String(p.sessionCount)) }}</div>
          <div class="cc-mono text-right" style="font-size:10.5px;color:#8a7965">{{ formatShortTime(p.lastActivity) }}</div>
          <div style="color:#8a7965">›</div>
        </button>
      </div>
    </template>

    <!-- Level 2+ -->
    <template v-else>
      <div class="flex items-center gap-1 flex-wrap text-[12px]">
        <button class="hover:underline" style="color:#5c4332" @click="openRoot">📁 会话存档</button>
        <template v-for="(seg, i) in currentPath" :key="i">
          <span style="color:#8a7965">/</span>
          <button class="cc-mono truncate max-w-[260px]"
            :style="i === currentPath.length - 1 && !currentFileName ? 'color:#2a1f13;font-weight:600' : 'color:#5c4332'"
            :class="i < currentPath.length - 1 || currentFileName ? 'hover:underline' : ''"
            @click="openBreadcrumb(i)">{{ seg }}</button>
        </template>
        <template v-if="currentFileName">
          <span style="color:#8a7965">/</span>
          <span class="cc-mono truncate max-w-[260px]" style="color:#2a1f13;font-weight:600">{{ currentFileName }}</span>
        </template>
      </div>

      <div v-if="currentFileName">
        <div v-if="fileLoading" class="text-[12px]" style="color:#8a7965">读取中...</div>
        <div v-else-if="!currentFileData?.ok" class="text-[12px]" style="color:#b03a20">{{ currentFileData?.error || '加载失败' }}</div>
        <div v-else class="rounded-xl border overflow-hidden" style="border-color:rgba(140,100,60,0.12);background:#fff">
          <div class="flex items-center gap-3 border-b px-4 py-3" style="border-color:rgba(140,100,60,0.08);background:#fffaf2">
            <div class="min-w-0 flex-1">
              <div class="cc-mono truncate text-[12.5px] font-semibold" style="color:#2a1f13">{{ currentFileData.path }}</div>
              <div class="cc-mono mt-0.5 text-[10.5px]" style="color:#8a7965">
                {{ formatSize(currentFileData.size) }}<span v-if="currentFileData.truncated"> · 已截断显示前 2MB</span>
              </div>
            </div>
            <button class="rounded-md px-2.5 py-1 text-[11px] hover:bg-black/5" style="color:#5c4332" @click="copyCurrentFile" :disabled="!currentFileData?.ok">
              {{ copied ? '已复制 ✓' : '复制' }}
            </button>
          </div>

          <div class="max-h-[720px] overflow-auto cc-thin-scroll">
            <div v-if="isJsonl" class="px-4 py-3">
              <div v-if="!jsonlEntries.length" class="text-[12px]" style="color:#8a7965">没有可结构化展示的记录。</div>
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
                    <div class="text-[11px]" style="color:#8a7965">
                      {{ expandedEntries[entry.key] ? '收起' : '展开' }}
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <pre v-else class="cc-mono whitespace-pre px-4 py-3 text-[11.5px]" style="color:#2a1f13;margin:0;background:#faf6ec">{{ currentFileData.content }}</pre>
          </div>
        </div>
      </div>

      <div v-else-if="dirLoading" class="text-[12px]" style="color:#8a7965">加载中...</div>
      <div v-else-if="!dirContents?.ok" class="text-[12px]" style="color:#b03a20">{{ dirContents?.error || '加载失败' }}</div>
      <template v-else>
        <div v-if="dirContents.subdirs.length">
          <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '子目录 ({n})'.replace('{n}', String(dirContents.subdirs.length)) }}</div>
          <div class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
            <button v-for="d in dirContents.subdirs" :key="d.name"
              class="w-full text-left flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
              style="border-color:rgba(140,100,60,0.08)"
              @click="enterDir([...currentPath, d.name])">
              <span>📁</span>
              <span class="cc-mono text-[12px] truncate flex-1" style="color:#4a3826">{{ d.name }}</span>
              <span class="cc-mono text-[10.5px]" style="color:#8a7965">{{ formatShortTime(d.modified) }}</span>
              <span style="color:#8a7965">›</span>
            </button>
          </div>
        </div>

        <div v-if="dirContents.sessions.length">
          <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '会话 ({n})'.replace('{n}', String(dirContents.sessions.length)) }}</div>
          <div class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
            <button v-for="s in dirContents.sessions" :key="s.name"
              class="w-full text-left grid gap-3 items-center px-4 py-2.5 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
              style="grid-template-columns: 1fr 80px 90px;border-color:rgba(140,100,60,0.08)"
              @click="openFile(s.name)">
              <div class="min-w-0">
                <div class="text-[12.5px] truncate" style="color:#2a1f13;font-weight:500">💬 {{ s.threadName || '(未命名)' }}</div>
                <div class="cc-mono text-[10px] truncate" style="color:#8a7965">{{ s.sessionId.slice(0, 8) }}... · {{ s.name }}</div>
              </div>
              <div class="cc-mono text-right" style="font-size:11px;color:#8a7965">{{ formatSize(s.size) }}</div>
              <div class="cc-mono text-right" style="font-size:10.5px;color:#8a7965">{{ formatShortTime(s.modified) }}</div>
            </button>
          </div>
        </div>

        <div v-if="!dirContents.subdirs.length && !dirContents.sessions.length" class="text-[12px]" style="color:#8a7965">此目录为空</div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatShortTime, formatSize } from '../utils.js';

const props = defineProps({
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false }
});

const currentPath = ref(null);
const dirContents = ref(null);
const dirLoading = ref(false);
const currentFileName = ref('');
const currentFileData = ref(null);
const fileLoading = ref(false);
const copied = ref(false);
const expandedEntries = ref({});

const enterDir = async (segments) => {
  currentFileName.value = '';
  currentFileData.value = null;
  expandedEntries.value = {};
  currentPath.value = segments;
  await loadDir(segments);
};

const loadDir = async (segments) => {
  dirLoading.value = true;
  dirContents.value = null;
  try {
    const url = '/apps/codex/projects/dir?path=' + encodeURIComponent(segments.join('/'));
    dirContents.value = await (await fetch(url)).json();
  } catch (err) {
    dirContents.value = { ok: false, error: err?.message || String(err) };
  } finally {
    dirLoading.value = false;
  }
};

const loadFile = async (segments) => {
  fileLoading.value = true;
  currentFileData.value = null;
  copied.value = false;
  expandedEntries.value = {};
  try {
    const url = '/apps/codex/projects/file?path=' + encodeURIComponent(segments.join('/'));
    currentFileData.value = await (await fetch(url)).json();
  } catch (err) {
    currentFileData.value = { ok: false, error: err?.message || String(err) };
  } finally {
    fileLoading.value = false;
  }
};

const openFile = (name) => {
  if (!currentPath.value) return;
  currentFileName.value = name;
  loadFile([...currentPath.value, name]);
};

const openRoot = () => {
  currentPath.value = null;
  dirContents.value = null;
  currentFileName.value = '';
  currentFileData.value = null;
  expandedEntries.value = {};
};

const openBreadcrumb = async (index) => {
  if (!currentPath.value?.length) return;
  await enterDir(currentPath.value.slice(0, index + 1));
};

const isJsonl = computed(() => String(currentFileData.value?.name || currentFileName.value || '').toLowerCase().endsWith('.jsonl'));

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
  if (!entry || typeof entry !== 'object') return '无效记录';
  if (entry.type === 'queue_operation') return `${entry.operation || 'operation'} queue`;
  if (entry.type === 'user') return extractText(entry.message?.content) || '用户消息';
  if (entry.type === 'assistant') return extractText(entry.message?.content) || entry.message?.model || '助手消息';
  if (entry.type === 'last_prompt') return entry.lastPrompt || '最后一条提示词';
  if (entry.type === 'ai_title') return entry.aiTitle || 'AI 标题';
  if (entry.attachment?.type) {
    return `${entry.attachment.type}${entry.attachment.addedNames?.length ? ` · ${entry.attachment.addedNames.join(', ')}` : ''}`;
  }
  if (entry.message?.model) return entry.message.model;
  if (entry.promptId) return `Prompt ${entry.promptId}`;
  return Object.keys(entry).slice(0, 4).join(' · ') || '记录';
};

const jsonlEntries = computed(() => {
  if (!isJsonl.value || !currentFileData.value?.content) return [];
  return String(currentFileData.value.content)
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

const copyCurrentFile = async () => {
  if (!currentFileData.value?.ok) return;
  try {
    await navigator.clipboard.writeText(currentFileData.value.content);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  } catch {}
};
</script>
