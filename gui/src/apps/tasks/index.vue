<template>
  <div class="roam-tasks flex h-full flex-col overflow-hidden bg-[#f7f4ef]" style="color:#2a1f13">

    <!-- ═══ LIST VIEW ═══ -->
    <template v-if="!detailTask">
      <!-- Toolbar -->
      <div class="flex shrink-0 items-center gap-1 border-b px-3 py-2" style="border-color:rgba(0,0,0,0.06);background:rgba(247,244,239,0.9)">
        <button
          v-for="f in filters" :key="f.key"
          class="inline-flex items-center gap-1 rounded-full px-3 py-[3px] text-[11.5px] font-semibold transition"
          :style="activeFilter === f.key
            ? 'background:#5c4332;color:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.12)'
            : 'background:transparent;color:rgba(42,31,19,0.55)'"
          :class="activeFilter !== f.key && 'hover:bg-[rgba(140,100,60,0.08)] hover:text-[#2a1f13]'"
          @click="activeFilter = f.key"
        >
          {{ f.label }}
          <span
            class="inline-block rounded-full px-[6px] text-[9px] font-bold tabular-nums"
            :style="activeFilter === f.key
              ? 'background:rgba(255,255,255,0.22);color:#fff'
              : 'background:rgba(140,100,60,0.12);color:rgba(120,80,40,0.65)'"
          >{{ f.count }}</span>
        </button>
        <span class="flex-1" />
        <button
          class="flex h-[26px] w-[26px] items-center justify-center rounded-full border transition hover:bg-[rgba(140,100,60,0.08)]"
          style="border-color:rgba(0,0,0,0.08);color:#2a1f13;background:#fff"
          @click="loadTasks"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 8a5.5 5.5 0 019.5-3.7M13.5 8a5.5 5.5 0 01-9.5 3.7" stroke-linecap="round"/><path d="M12 1.5v3h-3M4 15.5v-3h3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <!-- Column header -->
      <div class="grid shrink-0 grid-cols-[1fr_64px_78px_88px] gap-1 border-b px-4 py-[7px] text-[9px] font-bold uppercase tracking-[0.08em]"
        style="border-color:rgba(0,0,0,0.05);background:rgba(238,232,222,0.5);color:rgba(120,80,40,0.5)">
        <span>任务</span>
        <span>模式</span>
        <span>状态</span>
        <span>时间</span>
      </div>

      <!-- Error -->
      <div v-if="error" class="mx-3 mt-2 rounded-[10px] border px-3 py-2 text-[12px]" style="border-color:rgba(176,58,32,0.25);background:rgba(176,58,32,0.06);color:#b03a20">{{ error }}</div>

      <!-- Rows -->
      <div class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div v-if="filteredTasks.length === 0" class="flex h-full flex-col items-center justify-center" style="color:rgba(0,0,0,0.35)">
          <div class="mb-1.5 text-[32px] opacity-35">📭</div>
          <div class="text-[12px]">暂无任务</div>
        </div>

        <button
          v-for="task in filteredTasks" :key="task.id"
          class="grid w-full grid-cols-[1fr_64px_78px_88px] items-center gap-1 border-b px-4 py-[9px] text-left transition-colors hover:bg-[rgba(140,100,60,0.06)]"
          style="border-color:rgba(160,120,80,0.08)"
          @click="openDetail(task)"
        >
          <div class="flex min-w-0 items-center gap-[8px]">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full" :style="dotStyle(task.status)" />
            <div class="min-w-0">
              <div class="truncate text-[12.5px] font-semibold" style="color:#2a1f13">{{ task.title || '未命名任务' }}</div>
              <div class="mt-px text-[10px]" style="color:rgba(120,80,40,0.5)">#{{ task.id }} · {{ task.app || '-' }}</div>
            </div>
          </div>
          <div class="text-[10.5px]" style="color:rgba(0,0,0,0.45)">{{ modeLabel(task.mode) }}</div>
          <div>
            <span class="inline-block rounded-full px-2 py-[2px] text-[9.5px] font-semibold" :style="tagStyle(task.status)">{{ statusLabel(task.status) }}</span>
          </div>
          <div class="text-[10px] tabular-nums" style="color:rgba(0,0,0,0.35)">{{ formatCompactDateTime(task.finished_at || task.created_at) }}</div>
        </button>
      </div>
    </template>

    <!-- ═══ DETAIL VIEW ═══ -->
    <template v-else>
      <!-- Detail toolbar -->
      <div class="flex shrink-0 items-center gap-2 border-b px-3 py-2" style="border-color:rgba(0,0,0,0.06);background:rgba(247,244,239,0.9)">
        <button
          class="flex items-center gap-1 rounded-full px-3 py-[3px] text-[11.5px] font-semibold transition hover:bg-[rgba(140,100,60,0.1)]"
          style="color:#5c4332"
          @click="closeDetail"
        >
          <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 3L5 8l5 5"/></svg>
          返回
        </button>
        <div class="min-w-0 flex-1 truncate text-[11.5px] font-semibold" style="color:#2a1f13">{{ detailTask.title || '未命名任务' }}</div>
        <button
          v-if="detailTask.status === 'pending'"
          class="rounded-full px-3 py-[3px] text-[10.5px] font-semibold transition disabled:opacity-50"
          style="background:rgba(176,58,32,0.1);color:#b03a20"
          :disabled="stopping"
          @click="stopTask"
        >
          {{ stopping ? '终止中...' : '终止任务' }}
        </button>
        <button
          class="flex h-[26px] w-[26px] items-center justify-center rounded-full border transition hover:bg-[rgba(140,100,60,0.08)]"
          style="border-color:rgba(0,0,0,0.08);color:#2a1f13;background:#fff"
          @click="loadDetail"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 8a5.5 5.5 0 019.5-3.7M13.5 8a5.5 5.5 0 01-9.5 3.7" stroke-linecap="round"/><path d="M12 1.5v3h-3M4 15.5v-3h3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <!-- Detail error -->
      <div v-if="detailError" class="mx-3 mt-2 rounded-[10px] border px-3 py-2 text-[12px]" style="border-color:rgba(176,58,32,0.25);background:rgba(176,58,32,0.06);color:#b03a20">{{ detailError }}</div>

      <!-- Detail content -->
      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3 [scrollbar-width:thin]">
        <!-- Facts -->
        <div class="mb-3 grid grid-cols-4 gap-2">
          <div v-for="fact in detailFacts" :key="fact.key" class="rounded-[10px] border px-2.5 py-2"
            style="border-color:rgba(160,120,80,0.12);background:rgba(255,255,255,0.7)">
            <div class="text-[9px] uppercase tracking-[0.06em]" style="color:rgba(120,80,40,0.5)">{{ fact.label }}</div>
            <div class="mt-0.5 text-[11px] font-semibold" style="color:#2a1f13">{{ fact.value }}</div>
          </div>
        </div>

        <!-- Prompt -->
        <template v-if="detailTask.prompt">
          <div class="mb-1 text-[9px] font-bold uppercase tracking-[0.08em]" style="color:rgba(120,80,40,0.5)">提示词</div>
          <div class="mb-3 whitespace-pre-wrap break-words rounded-[10px] border px-3 py-2 text-[11.5px] leading-[1.65]"
            style="border-color:rgba(160,120,80,0.12);background:rgba(255,255,255,0.7);color:#3d2f1e">{{ detailTask.prompt }}</div>
        </template>

        <!-- Error -->
        <template v-if="detailTask.error">
          <div class="mb-1 text-[9px] font-bold uppercase tracking-[0.08em]" style="color:rgba(120,80,40,0.5)">错误信息</div>
          <div class="mb-3 whitespace-pre-wrap break-words rounded-[10px] border px-3 py-2 text-[11.5px] leading-[1.65]"
            style="border-color:rgba(176,58,32,0.25);background:rgba(176,58,32,0.05);color:#b03a20">{{ detailTask.error }}</div>
        </template>

        <!-- Messages -->
        <div class="mb-1 text-[9px] font-bold uppercase tracking-[0.08em]" style="color:rgba(120,80,40,0.5)">
          消息记录 · {{ messages.length }}
        </div>

        <div v-if="messages.length === 0" class="rounded-[10px] border border-dashed py-10 text-center text-[12px]"
          style="border-color:rgba(160,120,80,0.2);background:rgba(255,255,255,0.5);color:rgba(0,0,0,0.35)">
          暂无消息
        </div>

        <div v-else class="space-y-1.5">
          <div
            v-for="item in displayMessages" :key="item.id"
            class="rounded-[10px] border px-3 py-[9px]"
            style="border-color:rgba(160,120,80,0.12);background:rgba(255,255,255,0.78)"
          >
            <div class="mb-1.5 flex items-center gap-1.5">
              <span class="rounded-full px-2 py-[1px] text-[9px] font-bold uppercase tracking-[0.05em]" :style="roleStyle(item)">
                {{ roleLabel(item) }}
              </span>
              <span v-if="msgToolName(item)" class="text-[9px]" style="color:rgba(120,80,40,0.5)">{{ msgToolName(item) }}</span>
            </div>

            <template v-if="isToolCall(item)">
              <div
                v-for="(tc, i) in item.message.tool_calls" :key="i"
                class="break-all rounded-[8px] px-2.5 py-1.5 text-[10.5px] leading-[1.6]"
                style="background:rgba(140,100,60,0.08);color:rgba(80,55,30,0.85);font-family:'SF Mono','Fira Code',monospace"
              >{{ formatArgs(tc.function?.arguments) }}</div>
            </template>
            <div v-else class="whitespace-pre-wrap break-words text-[11.5px] leading-[1.65]" style="color:#3d2f1e">
              {{ renderContent(item) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { on } from '../../system/ws.js';

const tasks = ref([]);
const error = ref('');
const activeFilter = ref('all');
const detailTask = ref(null);
const messages = ref([]);
const detailError = ref('');
const stopping = ref(false);

const parseSqlDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return '-';
  return date.toLocaleString();
};

const formatCompactDateTime = (value) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return '-';
  return date.toLocaleString([], {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/* ── filters ── */
const countBy = (s) => {
  if (s === 'error') return tasks.value.filter((t) => t.status === 'error' || t.status === 'aborted').length;
  return tasks.value.filter((t) => t.status === s).length;
};

const filters = computed(() => [
  { key: 'all', label: '全部', count: tasks.value.length },
  { key: 'pending', label: '进行中', count: countBy('pending') },
  { key: 'done', label: '已完成', count: countBy('done') },
  { key: 'error', label: '错误', count: countBy('error') }
]);

const filteredTasks = computed(() => {
  if (activeFilter.value === 'all') return tasks.value;
  if (activeFilter.value === 'error') return tasks.value.filter((t) => t.status === 'error' || t.status === 'aborted');
  return tasks.value.filter((t) => t.status === activeFilter.value);
});

/* ── status helpers ── */
const modeLabel = (mode) => {
  if (mode === 'instant') return '即时';
  if (mode === 'agent') return '代理';
  return mode || '-';
};

const statusLabel = (status) => ({
  pending: '进行中',
  done: '已完成',
  error: '错误',
  aborted: '已终止'
}[status] || status || '-');

const dotStyle = (status) => {
  if (status === 'pending') return 'background:#c9a56e';
  if (status === 'done') return 'background:#7e8d5a';
  if (status === 'error') return 'background:#b03a20';
  if (status === 'aborted') return 'background:rgba(140,100,60,0.35)';
  return 'background:rgba(140,100,60,0.35)';
};

const tagStyle = (status) => {
  if (status === 'pending') return 'background:rgba(201,165,110,0.18);color:#7a5220';
  if (status === 'done') return 'background:rgba(126,141,90,0.18);color:#4a5a28';
  if (status === 'error') return 'background:rgba(176,58,32,0.12);color:#b03a20';
  if (status === 'aborted') return 'background:rgba(140,100,60,0.1);color:rgba(120,80,40,0.55)';
  return 'background:rgba(140,100,60,0.1);color:rgba(120,80,40,0.55)';
};

/* ── API ── */
const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

const loadTasks = async () => {
  error.value = '';
  try {
    const data = await request('/api/task?limit=200');
    tasks.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e.message || '加载失败';
  }
};

/* ── detail ── */
const openDetail = async (task) => {
  detailTask.value = task;
  messages.value = [];
  detailError.value = '';
  stopping.value = false;
  await loadDetail();
};

const loadDetail = async () => {
  if (!detailTask.value) return;
  detailError.value = '';
  try {
    const [td, tm] = await Promise.all([
      request(`/api/task/detail?id=${detailTask.value.id}`),
      request(`/api/task/messages?id=${detailTask.value.id}`)
    ]);
    detailTask.value = td.task || detailTask.value;
    messages.value = Array.isArray(tm.messages) ? tm.messages : [];
  } catch (e) {
    detailError.value = e.message || '加载失败';
  }
};

const closeDetail = () => {
  detailTask.value = null;
  messages.value = [];
};

const stopTask = async () => {
  if (stopping.value || !detailTask.value || detailTask.value.status !== 'pending') return;
  stopping.value = true;
  detailError.value = '';
  try {
    await request('/api/task/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: detailTask.value.id })
    });
    await loadDetail();
  } catch (e) {
    detailError.value = e.message || '终止失败';
  } finally {
    stopping.value = false;
  }
};

/* ── detail computed ── */
const detailFacts = computed(() => {
  if (!detailTask.value) return [];
  return [
    { key: 'created', label: '创建时间：', value: formatDateTime(detailTask.value.created_at) },
    { key: 'finished', label: '完成时间：', value: formatDateTime(detailTask.value.finished_at) },
    { key: 'app', label: '应用：', value: detailTask.value.app || '-' },
    { key: 'mode', label: '模式', value: modeLabel(detailTask.value.mode) }
  ];
});

const displayMessages = computed(() => [...messages.value].reverse());

/* ── message helpers ── */
const isToolCall = (item) => Array.isArray(item?.message?.tool_calls) && item.message.tool_calls.length > 0;

const roleLabel = (item) => {
  const role = item?.message?.role;
  if (role === 'user') return '用户';
  if (role === 'assistant' && isToolCall(item)) return '工具调用';
  if (role === 'assistant') return 'AI';
  if (role === 'tool') return '工具结果';
  return '未知';
};

const roleStyle = (item) => {
  const role = item?.message?.role;
  if (role === 'user') return 'background:rgba(201,165,110,0.2);color:#7a5220';
  if (role === 'assistant' && isToolCall(item)) return 'background:rgba(126,90,140,0.15);color:#5a3a7a';
  if (role === 'assistant') return 'background:rgba(92,67,50,0.12);color:#5c4332';
  if (role === 'tool') return 'background:rgba(126,141,90,0.18);color:#4a5a28';
  return 'background:rgba(140,100,60,0.1);color:rgba(120,80,40,0.6)';
};

const msgToolName = (item) => {
  const msg = item?.message || {};
  if (msg.name) return msg.name;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) return msg.tool_calls[0]?.function?.name || '';
  return '';
};

const renderContent = (item) => {
  const msg = item?.message || {};
  if (typeof msg.content === 'string' && msg.content.trim()) {
    const text = msg.content;
    if (text.length <= 800) return text;
    return `${text.slice(0, 560)}\n\n内容过长，已省略 {count} 字`.replace('{count}', String(text.length - 800)) + `\n\n${text.slice(-240)}`;
  }
  return JSON.stringify(msg, null, 2);
};

const formatArgs = (args) => {
  if (!args) return '';
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;
    if (parsed.command) return parsed.command;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(args);
  }
};

/* ── lifecycle ── */
const unsubs = [];
onMounted(async () => {
  await loadTasks();
  unsubs.push(on('tasks_changed', () => {
    loadTasks();
    if (detailTask.value) loadDetail();
  }));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
