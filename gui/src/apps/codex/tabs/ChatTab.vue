<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-row" style="background:#f5f3ef">
    <aside class="flex w-56 shrink-0 flex-col border-r" style="background:#ede9e2;border-color:rgba(0,0,0,0.07)">
      <div class="border-b px-3 py-2.5" style="border-color:rgba(0,0,0,0.07)">
        <button class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border px-3 py-2 text-[13px] font-semibold"
          style="border-color:rgba(92,67,50,0.14);background:rgba(255,255,255,0.58);color:rgba(61,47,30,0.82)"
          @click="reset">+ 新会话</button>
      </div>
      <div class="flex-1 overflow-y-auto [scrollbar-width:thin] px-1.5 py-1.5">
        <div v-if="!convList.length" class="px-3 py-4 text-center text-[11px]" style="color:rgba(0,0,0,0.35)">还没有会话</div>
        <div v-for="c in convList" :key="c.sessionId"
          class="group mb-1 cursor-pointer rounded-lg px-2.5 py-2"
          :style="currentId === c.sessionId ? 'background:rgba(255,255,255,0.85);box-shadow:0 1px 2px rgba(0,0,0,0.05)' : ''"
          @click="openConversation(c.sessionId)">
          <div class="flex items-center gap-1">
            <div class="truncate text-[12.5px] flex-1" style="color:#2a1f13">
              {{ c.title?.trim() || ('会话 ' + c.sessionId.slice(0, 8)) }}
            </div>
            <button class="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[11px] px-1 cc-mono"
              title="删除" @click.stop="removeConversation(c.sessionId)">✕</button>
          </div>
          <div class="mt-0.5 truncate text-[10.5px] cc-mono" style="color:rgba(0,0,0,0.4)">
            {{ displayCwd(c.cwd) }}
          </div>
          <div class="truncate text-[10px]" style="color:rgba(0,0,0,0.35)">
            {{ '{n} 条 · {time}'.replace('{n}', String(c.messageCount || 0)).replace('{time}', formatTime(c.updatedAt || c.lastTs)) }}
          </div>
        </div>
      </div>
    </aside>

    <div class="flex min-h-0 flex-1 flex-col">
      <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" style="scrollbar-color:rgba(160,120,80,0.2) transparent">
        <div class="mx-auto flex max-w-[720px] flex-col gap-0 px-5 py-6">
          <div v-if="!messages.length && !liveBlocks.length" class="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <div class="mb-4 text-[40px]">🤖</div>
            <h2 class="mb-2 text-xl font-bold" style="color:#2a1f13">Codex</h2>
            <p class="max-w-[320px] text-[13px] leading-relaxed" style="color:rgba(0,0,0,0.4)">
              在下方选目录、输入消息开始
            </p>
          </div>

          <template v-else>
            <div v-for="(m, i) in renderedMessages" :key="m.key || i" class="mb-5">
              <div v-if="m.role === 'user'" class="flex justify-end">
                <div class="max-w-[85%] overflow-x-auto rounded-[18px_18px_4px_18px] px-4 py-3 text-sm leading-relaxed" style="background:#e8e0d4;color:#2a1f13;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
                  <div class="whitespace-pre-wrap [word-break:break-word]">{{ m.content }}</div>
                </div>
              </div>

              <div v-else-if="m.role === 'assistant_text'" class="flex items-start">
                <div class="min-w-0 flex-1">
                  <div class="prose prose-sm max-w-none overflow-x-auto rounded-[18px_18px_18px_4px] px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] prose-headings:text-[#2a1f13] prose-pre:overflow-x-auto prose-pre:border prose-pre:bg-[#f0ece5] prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-blockquote:text-[rgba(0,0,0,0.5)]"
                    style="background:#fff;border:1px solid rgba(160,120,80,0.15);color:#3d2f1e;--tw-prose-pre-border-color:rgba(160,120,80,0.2);--tw-prose-code-bg:rgba(160,120,80,0.1)"
                    v-html="renderMd(m.content)" />
                </div>
              </div>

              <div v-else-if="m.role === 'tool_use'" class="flex items-start gap-2.5">
                <div class="min-w-0 flex-1 overflow-hidden rounded-xl" style="border:1px solid rgba(160,120,80,0.18);background:#fff">
                  <button type="button" class="flex w-full cursor-pointer items-center gap-2 border-none px-3 py-2 text-left transition-colors" style="background:rgba(160,120,80,0.05)" @click="toggleToolExpanded(m.key)">
                    <ChevronRight class="h-3 w-3 shrink-0 transition-transform" :class="isToolExpanded(m.key) ? 'rotate-90' : ''" style="color:rgba(0,0,0,0.35)" />
                    <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs" style="color:#3d2f1e">🔧 {{ m.toolName }}<span v-if="m.summary" style="color:rgba(0,0,0,0.45)">  {{ m.summary }}</span></span>
                    <span v-if="m.result !== undefined" class="shrink-0 text-[11px]" style="color:rgba(0,0,0,0.35)">已完成</span>
                  </button>
                  <div v-if="isToolExpanded(m.key)" style="border-top:1px solid rgba(160,120,80,0.12)">
                    <pre class="overflow-x-auto whitespace-pre px-3 py-2.5 font-mono text-xs" style="background:rgba(160,120,80,0.04);color:#5c7a50;margin:0">{{ m.inputPretty }}</pre>
                    <div v-if="m.result !== undefined" class="max-h-48 overflow-auto whitespace-pre px-3 py-2.5 font-mono text-[11px]" style="border-top:1px solid rgba(160,120,80,0.1);background:rgba(160,120,80,0.03);color:rgba(0,0,0,0.45)">{{ m.result }}</div>
                  </div>
                </div>
              </div>

              <div v-else-if="m.role === 'error'" class="rounded-lg px-3 py-2 text-[12px]" style="background:#fde2e2;color:#8b1a1a">{{ m.content }}</div>
            </div>

            <div v-if="busy" class="flex items-start">
              <div class="py-2 text-sm" style="color:rgba(160,120,80,0.6)">思考中<span class="animate-pulse">...</span></div>
            </div>
          </template>
        </div>
      </div>

      <div class="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-0" style="background:linear-gradient(to top,#f5f3ef 60%,transparent)">
        <div class="mx-auto max-w-[720px]">
          <form
            class="relative flex flex-col rounded-2xl"
            style="border:1px solid rgba(160,120,80,0.18);background:#fff;box-shadow:0 2px 12px rgba(0,0,0,0.05)"
            @submit.prevent="handleSend"
          >
            <textarea
              ref="textarea" v-model="input" rows="1"
              :disabled="busy || !installed"
              :placeholder="busy ? '正在回复...' : (currentId ? '继续对话...' : '在 {cwd} 里开始...'.replace('{cwd}', cwd))"
              class="min-h-[52px] max-h-[200px] w-full resize-none overflow-y-auto border-none bg-transparent px-4 pb-3 pt-3.5 pr-[176px] text-sm leading-relaxed outline-none disabled:opacity-50"
              style="color:#2a1f13"
              @input="autoResize"
              @keydown.enter.exact="onEnter"
              @compositionstart="composing = true"
              @compositionend="composing = false"
            />

            <div v-if="startError" class="px-3.5 pb-2 text-[11px]" style="color:#b03a20">{{ startError }}</div>

            <div class="flex items-center gap-2 px-3.5 pb-2.5">
              <template v-if="!currentId">
                <button v-if="!editingPath" type="button"
                  class="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-2.5 text-xs transition-all"
                  style="color:rgba(160,120,80,0.8);max-width:420px"
                  @mouseover="$event.currentTarget.style.background='rgba(160,120,80,0.08)';$event.currentTarget.style.color='#5c4332'"
                  @mouseleave="$event.currentTarget.style.background='transparent';$event.currentTarget.style.color='rgba(160,120,80,0.8)'"
                  @click="startEditPath"
                  title="点击修改工作目录">
                  <FolderOpen class="h-3.5 w-3.5 shrink-0" />
                  <span class="cc-mono truncate">{{ cwd }}</span>
                </button>
                <input v-else
                  ref="pathInput" v-model="cwd" type="text"
                  class="h-7 cc-mono rounded-lg px-2.5 outline-none"
                  style="border:1px solid rgba(160,120,80,0.3);background:#fff;color:#2a1f13;min-width:320px;max-width:420px;font-size:12px"
                  placeholder="~/Desktop"
                  @blur="editingPath = false"
                  @keydown.enter.prevent="$event.target.blur()"
                  @keydown.esc="editingPath = false" />
              </template>
              <template v-else>
                <div class="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs" style="color:rgba(160,120,80,0.6);max-width:420px">
                  <FolderOpen class="h-3.5 w-3.5 shrink-0" />
                  <span class="cc-mono truncate">{{ currentSession?.cwd }}</span>
                </div>
                <button type="button"
                  class="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold cursor-pointer transition-all"
                  style="color:rgba(160,120,80,0.8)"
                  @mouseover="$event.currentTarget.style.background='rgba(160,120,80,0.08)';$event.currentTarget.style.color='#5c4332'"
                  @mouseleave="$event.currentTarget.style.background='transparent';$event.currentTarget.style.color='rgba(160,120,80,0.8)'"
                  @click="reset">+ 新会话</button>
              </template>
            </div>

            <div class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <div class="relative">
                <button
                  type="button"
                  class="inline-flex h-[28px] items-center rounded-md border-none px-2 text-[11px] font-semibold transition-all"
                  style="background:transparent;color:rgba(160,120,80,0.82)"
                  @mouseover="$event.currentTarget.style.background='rgba(160,120,80,0.08)';$event.currentTarget.style.color='#5c4332'"
                  @mouseleave="$event.currentTarget.style.background='transparent';$event.currentTarget.style.color='rgba(160,120,80,0.82)'"
                  @click="modeMenuOpen = !modeMenuOpen"
                >
                  <span class="cc-mono">{{ activePermissionMode.label }}</span>
                </button>

                <div
                  v-if="modeMenuOpen"
                  class="absolute bottom-[calc(100%+8px)] right-0 z-20 w-[320px] overflow-hidden rounded-xl border shadow-[0_16px_40px_rgba(0,0,0,0.14)]"
                  style="border-color:rgba(160,120,80,0.16);background:#fffaf2"
                >
                  <button
                    v-for="mode in PERMISSION_MODES"
                    :key="mode.id"
                    type="button"
                    class="block w-full border-none px-3 py-2.5 text-left transition-colors hover:bg-[rgba(160,120,80,0.08)]"
                    @click="selectPermissionMode(mode.id)"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <span class="cc-mono text-[11px] font-semibold" style="color:#2a1f13">{{ mode.label }}</span>
                      <span v-if="permissionMode === mode.id" class="text-[10px]" style="color:#5c4332">当前</span>
                    </div>
                    <div class="mt-1 text-[11px] leading-relaxed" style="color:#6b5a46">{{ mode.description }}</div>
                  </button>
                </div>
              </div>
              <button v-if="busy" type="button"
                class="flex h-[34px] w-[34px] items-center justify-center rounded-full border-none text-white"
                style="background:#5c4332" @click="abortStream">
                <Square class="h-3.5 w-3.5 fill-current" />
              </button>
              <button v-else type="submit"
                :disabled="!canSend"
                class="flex h-[34px] w-[34px] items-center justify-center rounded-full border transition-all"
                :style="canSend ? 'cursor:pointer;border-color:transparent;background:#5c4332;color:#fff;box-shadow:0 2px 8px rgba(92,67,50,0.3)' : 'cursor:default;border-color:rgba(160,120,80,0.2);background:rgba(160,120,80,0.06);color:rgba(160,120,80,0.35)'">
                <ArrowUp class="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { marked } from 'marked';
import { ArrowUp, ChevronRight, FolderOpen, Square } from 'lucide-vue-next';

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const props = defineProps({
  installed: { type: Boolean, default: false }
});

const PERMISSION_MODES = [
  { id: 'workspaceWrite', label: 'workspace', description: '可写工作区，按需请求确认，适合大多数改代码场景。' },
  { id: 'readOnly', label: 'readOnly', description: '只读模式，优先查看和分析，不允许直接修改文件。' },
  { id: 'fullAuto', label: 'fullAuto', description: '自动低摩擦执行，等价于 Codex 的 --full-auto。' },
  { id: 'neverAsk', label: 'neverAsk', description: '工作区可写，且尽量不再询问确认。' },
  { id: 'dangerFullAccess', label: 'danger', description: '全盘可写，风险很高，只适合完全受控环境。' },
  { id: 'bypassPermissions', label: 'bypass', description: '跳过审批和沙箱，风险最高。' }
];

const cwd = ref('~/Desktop');
const permissionMode = ref('workspaceWrite');
const modeMenuOpen = ref(false);
const editingPath = ref(false);
const pathInput = ref(null);
const startError = ref('');
const starting = ref(false);

const currentId = ref(null);
const currentSession = ref(null);
const messages = ref([]);
const liveEvents = ref([]);
const input = ref('');
const busy = ref(false);
const msgBox = ref(null);
const textarea = ref(null);
const composing = ref(false);
const convList = ref([]);
const expandedToolKeys = ref({});
let abortController = null;

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return '{n} 分钟前'.replace('{n}', String(Math.floor(diff / 60)));
  if (diff < 86400) return '{n} 小时前'.replace('{n}', String(Math.floor(diff / 3600)));
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const displayCwd = (value) => {
  if (!value) return '';
  const home = (typeof window !== 'undefined' && window?.__ENV__?.HOME) || '';
  if (home && value.startsWith(home)) return `~${value.slice(home.length)}`;
  return value;
};

const fetchConversations = async () => {
  try {
    const r = await fetch('/apps/codex/conversations');
    const data = await r.json();
    convList.value = data.items || [];
  } catch {}
};

const openConversation = async (sid) => {
  if (busy.value) abortStream();
  currentId.value = sid;
  currentSession.value = convList.value.find((c) => c.sessionId === sid) || null;
  permissionMode.value = currentSession.value?.permissionMode || permissionMode.value;
  modeMenuOpen.value = false;
  liveEvents.value = [];
  messages.value = [];
  expandedToolKeys.value = {};
  await fetchMessages(sid);
};

const removeConversation = async (sid) => {
  if (!confirm('确认删除这个会话？')) return;
  await fetch('/apps/codex/conversations/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sid })
  });
  if (currentId.value === sid) reset();
  await fetchConversations();
};

const canSend = computed(() => !!input.value.trim() && !busy.value && props.installed && !starting.value);
const activePermissionMode = computed(() => PERMISSION_MODES.find((item) => item.id === permissionMode.value) || PERMISSION_MODES[0]);

const liveBlocks = computed(() => extractBlocks(liveEvents.value.filter((e) => e.kind === 'codex').map((e) => e.payload)));

const startEditPath = () => {
  editingPath.value = true;
  nextTick(() => pathInput.value?.focus());
};

const reset = () => {
  if (busy.value) abortStream();
  currentId.value = null;
  currentSession.value = null;
  messages.value = [];
  liveEvents.value = [];
  expandedToolKeys.value = {};
  input.value = '';
  startError.value = '';
  editingPath.value = false;
  permissionMode.value = 'workspaceWrite';
  modeMenuOpen.value = false;
};

const ensureSession = async () => {
  if (currentId.value) return true;
  starting.value = true;
  startError.value = '';
  try {
    const r = await fetch('/apps/codex/conversations/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cwd: cwd.value.trim(), permissionMode: permissionMode.value })
    });
    const data = await r.json();
    if (data.error) { startError.value = data.error; return false; }
    if (data.item) {
      currentSession.value = data.item;
      currentId.value = data.item.sessionId;
      permissionMode.value = data.item.permissionMode || permissionMode.value;
      modeMenuOpen.value = false;
      fetchConversations();
      return true;
    }
    return false;
  } catch (err) {
    startError.value = err?.message || String(err);
    return false;
  } finally {
    starting.value = false;
  }
};

const fetchMessages = async (id) => {
  const r = await fetch(`/apps/codex/messages?conversationId=${id}`);
  const data = await r.json();
  messages.value = data.items || [];
  liveEvents.value = [];
  expandedToolKeys.value = {};
  scrollToBottom(false);
};

const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    const el = msgBox.value;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
  });
};

const autoResize = () => {
  const el = textarea.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
};

const onEnter = (e) => {
  if (composing.value) return;
  e.preventDefault();
  handleSend();
};

const abortStream = () => {
  if (abortController) { abortController.abort(); abortController = null; }
  busy.value = false;
};

const handleSend = async () => {
  const text = input.value.trim();
  if (!text || busy.value || !props.installed) return;
  if (!(await ensureSession())) return;

  input.value = '';
  busy.value = true;
  liveEvents.value = [];
  messages.value.push({ id: `local-${Date.now()}`, role: 'user', content: text, meta: {} });
  nextTick(() => { if (textarea.value) textarea.value.style.height = 'auto'; });
  scrollToBottom();
  abortController = new AbortController();
  try {
    const resp = await fetch('/apps/codex/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: currentId.value, message: text, permissionMode: permissionMode.value }), signal: abortController.signal
    });
    if (!resp.body) throw new Error('no body');
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try { const evt = JSON.parse(line); handleStreamEvent(evt); } catch {}
      }
    }
  } catch (err) {
    if (err?.name !== 'AbortError') liveEvents.value.push({ kind: 'error', message: err?.message || String(err) });
  } finally {
    busy.value = false;
    abortController = null;
    if (currentId.value) await fetchMessages(currentId.value);
    fetchConversations();
  }
};

const handleStreamEvent = (evt) => {
  if (evt.type === 'event') liveEvents.value.push({ kind: 'codex', payload: evt.payload });
  else if (evt.type === 'error') liveEvents.value.push({ kind: 'error', message: evt.message });
  scrollToBottom();
};

const renderedMessages = computed(() => {
  const out = [];
  for (const m of messages.value) {
    if (m.role === 'user') out.push({ key: `db-${m.id}`, role: 'user', content: m.content });
    else if (m.role === 'assistant') {
      const blocks = extractBlocks(m.meta?.events || []);
      if (blocks.length) blocks.forEach((b, i) => out.push({ ...b, key: `db-${m.id}-${i}` }));
      else if (m.content) out.push({ key: `db-${m.id}`, role: 'assistant_text', content: m.content });
    } else if (m.role === 'error') out.push({ key: `db-${m.id}`, role: 'error', content: m.content });
  }
  liveBlocks.value.forEach((b, i) => out.push({ ...b, key: `live-${i}` }));
  for (const e of liveEvents.value) {
    if (e.kind === 'error') out.push({ key: `live-err-${out.length}`, role: 'error', content: e.message });
  }
  return out;
});

function extractBlocks(events) {
  const out = []; const toolCalls = new Map();
  for (const e of events) {
    if (!e || typeof e !== 'object') continue;
    if (e.type === 'assistant' && e.message?.content) {
      for (const b of e.message.content) {
        if (b.type === 'text' && b.text) out.push({ role: 'assistant_text', content: b.text });
        else if (b.type === 'tool_use') {
          const entry = { role: 'tool_use', toolName: b.name || 'tool', summary: summarize(b.name, b.input), inputPretty: safeStr(b.input), result: undefined, expanded: false, toolUseId: b.id };
          toolCalls.set(b.id, entry); out.push(entry);
        }
      }
    } else if (e.type === 'user' && e.message?.content) {
      for (const b of e.message.content) {
        if (b.type === 'tool_result' && b.tool_use_id) {
          const t = toolCalls.get(b.tool_use_id);
          if (t) t.result = stringifyResult(b.content);
        }
      }
    }
  }
  return out;
}
function summarize(name, input) {
  if (!input || typeof input !== 'object') return '';
  if (input.description) return String(input.description);
  if (name === 'Bash' && input.command) return String(input.command).slice(0, 120);
  if (input.file_path) return String(input.file_path);
  if (input.path) return String(input.path);
  if (input.pattern) return String(input.pattern);
  return '';
}
function safeStr(o) { try { return JSON.stringify(o, null, 2); } catch { return String(o); } }
function stringifyResult(c) {
  if (!c) return '';
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((x) => x?.type === 'text' ? x.text : safeStr(x)).join('\n');
  return safeStr(c);
}
function toggleToolExpanded(key) {
  expandedToolKeys.value = {
    ...expandedToolKeys.value,
    [key]: !expandedToolKeys.value[key]
  };
}
function isToolExpanded(key) {
  return !!expandedToolKeys.value[key];
}
function selectPermissionMode(mode) {
  permissionMode.value = mode;
  if (currentSession.value) currentSession.value.permissionMode = mode;
  convList.value = convList.value.map((item) => item.sessionId === currentId.value ? { ...item, permissionMode: mode } : item);
  modeMenuOpen.value = false;
}

watch(liveEvents, () => scrollToBottom(), { deep: true });
watch(() => messages.value.length, () => scrollToBottom(false));

onMounted(fetchConversations);
</script>

<style scoped>
textarea::placeholder { color: rgba(160,120,80,0.4); }
</style>
