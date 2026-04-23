<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useWsStore } from '@/stores/ws';
import { useViewStore } from '@/stores/view';
import { useThemeStore } from '@/stores/theme';
import { useToastStore } from '@/stores/toast';
import TaskIndicator from './TaskIndicator.vue';

const ws = useWsStore();
const view = useViewStore();
const theme = useThemeStore();
const toast = useToastStore();

const isLight = computed(() => theme.resolved === 'light');

// --- 面板开合 ---
const showConnectionPanel = ref(false);
const rootRef = ref(null);
const editorOpen = ref(false);
const helpOpen = ref(false);
const formDirty = ref(false);

const remoteForm = ref({
    wsUrl: '',
    deviceId: '',
    mainPort: '9508',
    mainHost: '127.0.0.1'
});

// --- 维度 1:当前会话(诊断,只读) ---
const sessionType = computed(() => ws.connection?.type || null);
const sessionTypeLabel = computed(() => {
    if (sessionType.value === 'remote') return '远程';
    if (sessionType.value === 'local') return '本地';
    return '检测中';
});
const sessionDetail = computed(() => ws.connection?.detail || '正在识别当前连接来源');
const sessionHost = computed(() => ws.connection?.relayHost || ws.connection?.host || window.location.host || '');

// --- 维度 2:内置 relay 子系统 ---
const relayConfigured = computed(() => Boolean(ws.relay?.configured));
const relayRunning = computed(() => Boolean(ws.relay?.running));
const relayPending = computed(() => ws.relayPending || 'idle');
const relayState = computed(() => {
    if (relayPending.value !== 'idle') return relayPending.value;
    if (!relayConfigured.value) return 'unconfigured';
    return relayRunning.value ? 'running' : 'idle';
});
const relayStateLabel = computed(() => ({
    unconfigured: '未配置',
    idle: '未开启',
    starting: '启动中',
    stopping: '停止中',
    saving: '保存中',
    running: '运行中'
}[relayState.value] || ''));
const relayDeviceLabel = computed(() => ws.relay?.deviceId || '未命名设备');
const relayConfigSourceLabel = computed(() => {
    const s = ws.relay?.configSource;
    if (s === 'database') return '网页配置';
    if (s === 'env') return '环境变量';
    return 'config.js';
});
const relayPublicUrl = computed(() => ws.relay?.publicUrlHint || ws.relay?.wsUrl || '');

// --- 顶部按钮着色 ---
const headerIconClass = computed(() => {
    if (ws.state === 'connected') return 'text-[var(--color-good)]';
    if (ws.state === 'pending') return 'text-[var(--color-accent)]';
    return 'text-[var(--color-bad)]';
});

// --- 交互 ---
function togglePanel() {
    showConnectionPanel.value = !showConnectionPanel.value;
    if (showConnectionPanel.value) {
        ws.refreshRemote().catch(() => {});
        ws.fetchRemoteConfig().then((config) => {
            if (!formDirty.value) syncRemoteForm(config);
        }).catch(() => {});
        helpOpen.value = false;
        editorOpen.value = !relayConfigured.value;
    }
}

function closePanel() {
    showConnectionPanel.value = false;
}

function onDocPointerDown(e) {
    if (!showConnectionPanel.value) return;
    if (rootRef.value && !rootRef.value.contains(e.target)) closePanel();
}

function onKeydown(e) {
    if (e.key === 'Escape' && showConnectionPanel.value) closePanel();
}

onMounted(() => {
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onDocPointerDown);
    document.removeEventListener('keydown', onKeydown);
});

function syncRemoteForm(config) {
    const next = config || ws.remoteConfig || {};
    remoteForm.value = {
        wsUrl: next.wsUrl || '',
        deviceId: next.deviceId || '',
        mainPort: next.mainPort || '9508',
        mainHost: next.mainHost || '127.0.0.1'
    };
    formDirty.value = false;
}

function markDirty() { formDirty.value = true; }

function toggleEditor() {
    editorOpen.value = !editorOpen.value;
    if (editorOpen.value) helpOpen.value = false;
}

function toggleHelp() {
    helpOpen.value = !helpOpen.value;
    if (helpOpen.value) editorOpen.value = false;
}

async function onSwitchClick() {
    if (relayPending.value !== 'idle') return;
    if (!relayConfigured.value) {
        editorOpen.value = true;
        helpOpen.value = false;
        toast.show('先填 wsUrl 和 deviceId,再开启远程');
        return;
    }
    try {
        if (relayRunning.value) {
            await ws.stopRemote();
            if (!ws.relay?.running) toast.show('远程入口已停止');
            else toast.show('停止超时,请检查 relay 进程', 2400);
        } else {
            await ws.startRemote();
            if (ws.relay?.running) toast.show('远程入口已开启');
            else toast.show('启动超时,请检查 Worker 是否可达', 2400);
        }
    } catch (err) {
        toast.show(err?.body?.message || err.message || '远程操作失败', 2400);
    }
}

async function saveConfig() {
    if (!remoteForm.value.wsUrl || !remoteForm.value.deviceId) {
        toast.show('wsUrl 和 deviceId 都不能为空');
        return;
    }
    try {
        await ws.saveRemoteConfig({
            wsUrl: remoteForm.value.wsUrl,
            deviceId: remoteForm.value.deviceId,
            mainPort: remoteForm.value.mainPort || '9508',
            mainHost: remoteForm.value.mainHost || '127.0.0.1'
        });
        formDirty.value = false;
        editorOpen.value = false;
        toast.show('远程配置已保存');
    } catch (err) {
        toast.show(err?.body?.message || err.message || '保存失败', 2400);
    }
}

async function copyText(text, successMsg) {
    if (!text) { toast.show('没有可复制的内容'); return; }
    try {
        await navigator.clipboard.writeText(text);
        toast.show(successMsg || '已复制');
    } catch { toast.show('复制失败'); }
}
</script>

<template>
    <header class="shrink-0 h-11 flex items-center gap-2 px-2 border-b border-line bg-bg-elev">
        <button @click="view.toggleDrawer"
            class="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-bg-hi transition-colors"
            title="菜单">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
        </button>
        <div class="min-w-0 flex-1 px-1 text-[13px] font-medium text-ink tracking-tight">Roam</div>
        <div class="flex items-center gap-0.5">
            <button @click="theme.toggle"
                class="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-bg-hi transition-colors"
                :title="isLight ? '切到暗色' : '切到亮色'">
                <svg v-if="isLight" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="12" y1="3" x2="12" y2="5"/>
                    <line x1="12" y1="19" x2="12" y2="21"/>
                    <line x1="3" y1="12" x2="5" y2="12"/>
                    <line x1="19" y1="12" x2="21" y2="12"/>
                    <line x1="5.6" y1="5.6" x2="7" y2="7"/>
                    <line x1="17" y1="17" x2="18.4" y2="18.4"/>
                    <line x1="5.6" y1="18.4" x2="7" y2="17"/>
                    <line x1="17" y1="7" x2="18.4" y2="5.6"/>
                </svg>
            </button>
            <TaskIndicator />
            <div ref="rootRef" class="relative">
                <button @click="togglePanel"
                    class="shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg-hi transition-colors"
                    :class="headerIconClass"
                    :title="`连接:${sessionTypeLabel}`">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="5" width="16" height="10" rx="2"/>
                        <path d="M8 19h8"/>
                        <path d="M10 15v4"/>
                        <path d="M14 15v4"/>
                    </svg>
                </button>

                <div v-if="showConnectionPanel"
                    class="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] rounded-xl border border-line bg-bg-elev shadow-[0_18px_48px_var(--color-shadow)] fade-enter overflow-hidden">

                    <!-- ============ 维度 1:本次会话诊断 ============ -->
                    <div class="px-4 pt-3 pb-3 border-b border-line">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0"
                                    :class="sessionType === 'remote'
                                        ? 'bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]'
                                        : sessionType === 'local'
                                            ? 'bg-[color-mix(in_srgb,var(--color-good)_16%,transparent)] text-[var(--color-good)]'
                                            : 'bg-bg-hi text-muted'">
                                    <span class="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
                                    {{ sessionTypeLabel }}
                                </span>
                                <span class="text-[11px] text-muted truncate">{{ ws.statusText }}</span>
                            </div>
                            <button @click="copyText(sessionHost, '访问入口已复制')"
                                class="shrink-0 text-muted hover:text-ink transition-colors p-1 rounded hover:bg-bg-hi"
                                title="复制访问入口">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            </button>
                        </div>
                        <div class="mt-2 text-[12px] text-muted leading-[18px]">{{ sessionDetail }}</div>
                        <div class="mt-1 text-[12px] text-ink break-all">{{ sessionHost || '未知' }}</div>
                    </div>

                    <!-- ============ 维度 2:内置 relay 远程入口 ============ -->
                    <div class="px-4 py-3">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="text-[12px] font-medium text-ink">远程入口</div>
                                <div class="mt-0.5 text-[11px] text-muted leading-[16px]">
                                    {{ relayStateLabel }} · 通过 Worker 把这台机器暴露到公网
                                </div>
                            </div>

                            <!-- Switch -->
                            <button @click="onSwitchClick"
                                :disabled="relayPending !== 'idle'"
                                :title="relayState === 'unconfigured' ? '先填写配置' : (relayRunning ? '点击停止' : '点击开启')"
                                :class="[
                                    'relative shrink-0 inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors',
                                    relayRunning ? 'bg-[var(--color-good)]' : 'bg-bg-hi',
                                    relayState === 'unconfigured' ? 'opacity-50' : '',
                                    relayPending !== 'idle' ? 'cursor-wait' : 'cursor-pointer'
                                ]">
                                <span :class="[
                                    'relative inline-block h-[16px] w-[16px] rounded-full bg-bg-elev shadow transform transition-transform',
                                    relayRunning ? 'translate-x-[21px]' : 'translate-x-[3px]'
                                ]">
                                    <span v-if="relayPending === 'starting' || relayPending === 'stopping'"
                                        class="absolute inset-0 rounded-full border-[2px] border-[var(--color-accent)] border-t-transparent animate-spin"></span>
                                </span>
                            </button>
                        </div>

                        <!-- 运行中:公网地址 + 复制 -->
                        <div v-if="relayRunning && relayPublicUrl"
                            class="mt-3 flex items-center justify-between gap-2 rounded-md border border-line bg-bg-hi/60 px-2.5 py-2">
                            <span class="text-[12px] text-ink break-all min-w-0 flex-1">{{ relayPublicUrl }}</span>
                            <button @click="copyText(relayPublicUrl, '远程地址已复制')"
                                class="shrink-0 text-muted hover:text-ink transition-colors p-1 rounded hover:bg-bg-hi"
                                title="复制">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            </button>
                        </div>

                        <!-- 元信息 + 编辑 / 帮助 -->
                        <div class="mt-3 flex items-center justify-between gap-2">
                            <span class="text-[11px] text-muted truncate">{{ relayConfigSourceLabel }} · {{ relayDeviceLabel }}</span>
                            <div class="flex items-center gap-0.5 shrink-0">
                                <button @click="toggleEditor"
                                    :class="['p-1.5 rounded transition-colors', editorOpen ? 'text-ink bg-bg-hi' : 'text-muted hover:text-ink hover:bg-bg-hi']"
                                    title="编辑配置">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 20h9"/>
                                        <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                                    </svg>
                                </button>
                                <button @click="toggleHelp"
                                    :class="['p-1.5 rounded transition-colors', helpOpen ? 'text-ink bg-bg-hi' : 'text-muted hover:text-ink hover:bg-bg-hi']"
                                    title="如何部署 Worker">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- 编辑区 -->
                        <div v-if="editorOpen" class="mt-3 rounded-lg border border-line bg-bg-hi/40 px-3 py-3 space-y-2.5">
                            <div>
                                <label class="mb-1 block text-[11px] text-muted">wsUrl</label>
                                <input v-model="remoteForm.wsUrl" @input="markDirty"
                                    class="w-full rounded-md border border-line bg-bg px-2.5 py-2 text-[12px] text-ink outline-none focus:border-[var(--color-accent)]"
                                    placeholder="wss://relay.example.com/ws/device" />
                            </div>
                            <div>
                                <label class="mb-1 block text-[11px] text-muted">deviceId</label>
                                <input v-model="remoteForm.deviceId" @input="markDirty"
                                    class="w-full rounded-md border border-line bg-bg px-2.5 py-2 text-[12px] text-ink outline-none focus:border-[var(--color-accent)]"
                                    placeholder="my-mac" />
                            </div>
                            <button @click="saveConfig"
                                :disabled="relayPending === 'saving'"
                                class="w-full rounded-md bg-[var(--color-accent)] px-3 py-2 text-[12px] font-medium text-black hover:bg-[var(--color-accent-hi)] disabled:opacity-60 transition-colors">
                                {{ relayPending === 'saving' ? '保存中...' : '保存配置' }}
                            </button>
                        </div>

                        <!-- 帮助区 -->
                        <div v-if="helpOpen" class="mt-3 rounded-lg border border-line bg-bg-hi/40 px-3 py-3">
                            <div class="text-[11px] leading-[18px] text-muted space-y-1">
                                <div class="text-ink font-medium">如何拿到这两个值</div>
                                <div>1. 进入仓库里的 <code class="text-[11px]">roam-relay-worker/</code>,执行 <code class="text-[11px]">npx wrangler deploy</code> 部署到自己 CF 账号。</div>
                                <div>2. 在 Worker 环境里设置 <code class="text-[11px]">DEVICE_ID</code>(先不配 token 也能跑通)。</div>
                                <div>3. 把 <code class="text-[11px]">wss://relay.你的域/ws/device</code> 填到 wsUrl,设备名填到 deviceId,保存后开启开关即可。</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>
