<template>
  <div class="flex h-full min-w-0 overflow-hidden bg-bg">
    <div class="flex w-[160px] shrink-0 flex-col border-r border-line py-3 bg-bg-elev">
      <div class="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-faint">设置</div>
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="mx-1.5 mb-0.5 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors"
        :class="activeTab === tab.key ? 'bg-bg-hi text-ink' : 'text-muted hover:bg-bg-hi hover:text-ink'"
        @click="activeTab = tab.key"
      >
        <span class="text-[13px]">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <div class="mx-auto max-w-[520px]">
        <h2 class="mb-4 text-[15px] font-semibold text-ink tracking-tight">{{ currentTabLabel }}</h2>
        <TabContent v-bind="tabContentProps" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import ModelTab from './ModelTab.vue';
import ContextTab from './ContextTab.vue';
import ToolTab from './ToolTab.vue';
import AboutTab from './AboutTab.vue';
import SkillTab from './SkillTab.vue';
import { createProviderCatalog } from '../../data/providers.js';

const tabs = [
  { key: 'model', label: '模型', icon: '🤖' },
  { key: 'tools', label: '工具', icon: '🔧' },
  { key: 'messages', label: '消息', icon: '💬' },
  { key: 'skills', label: '技能', icon: '⚡' },
  { key: 'about', label: '关于', icon: 'ℹ️' }
];

const activeTab = ref('model');
const currentTabLabel = computed(() => tabs.find(t => t.key === activeTab.value)?.label || '');
const saveNotice = ref({ type: '', message: '' });

// 统一传给 TabContent 的 props
const tabContentProps = computed(() => ({
  activeTab: activeTab.value,
  provider: provider.value,
  providerGroups: providerGroups.value,
  providers: providers.value,
  apiUrl: editApiUrl.value,
  apiKey: editApiKey.value,
  model: editModel.value,
  enableToolResultTruncate: enableToolResultTruncate.value,
  toolResultMaxChars: toolResultMaxChars.value,
  enableToolLoopLimit: enableToolLoopLimit.value,
  toolMaxRounds: toolMaxRounds.value,
  contextRounds: editRounds.value,
  skillItems: skillItems.value,
  skillsLoading: skillsLoading.value,
  skillsError: skillsError.value,
  items: skillItems.value,
  loading: skillsLoading.value,
  error: skillsError.value,
  saveNotice: saveNotice.value,
  onSave: save,
  'onUpdate:provider': onProviderChange,
  'onUpdate:apiUrl': v => { editApiUrl.value = v; },
  'onUpdate:apiKey': v => { editApiKey.value = v; },
  'onUpdate:model': v => { editModel.value = v; },
  'onUpdate:enableToolResultTruncate': v => { enableToolResultTruncate.value = v; },
  'onUpdate:toolResultMaxChars': v => { toolResultMaxChars.value = v; },
  'onUpdate:enableToolLoopLimit': v => { enableToolLoopLimit.value = v; },
  'onUpdate:toolMaxRounds': v => { toolMaxRounds.value = v; },
  'onUpdate:contextRounds': v => { editRounds.value = v; },
}));

// TabContent 动态分发到各子 Tab
const TabContent = defineComponent({
  props: { activeTab: String },
  setup(props, { attrs }) {
    return () => {
      const map = {
        model: ModelTab,
        tools: ToolTab,
        messages: ContextTab,
        skills: SkillTab,
      };
      const C = map[props.activeTab] || AboutTab;
      return h(C, attrs);
    };
  }
});

const DEFAULT_PROVIDER = 'deepseek';
const provider = ref(DEFAULT_PROVIDER);
const editRounds = ref(100);
const enableToolResultTruncate = ref(true);
const toolResultMaxChars = ref(12000);
const enableToolLoopLimit = ref(true);
const toolMaxRounds = ref(50);
const editApiUrl = ref('');
const editApiKey = ref('');
const editModel = ref('');
const providerConfigs = ref({});
const providerGroups = ref(createProviderCatalog().groups);
const providers = ref(createProviderCatalog().providers);
const skillItems = ref([]);
const skillsLoading = ref(false);
const skillsError = ref('');

const getProvider = (id) => providers.value.find((item) => item.id === id);

const PROVIDER_CONFIGS_KEY = 'aios.providerConfigs.v1';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `${res.status} ${res.statusText}`);
  return data;
};

const loadProviderConfigs = () => {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIGS_KEY);
    providerConfigs.value = raw ? JSON.parse(raw) : {};
  } catch {
    providerConfigs.value = {};
  }
};

const saveProviderConfigs = () => {
  localStorage.setItem(PROVIDER_CONFIGS_KEY, JSON.stringify(providerConfigs.value));
};

const applyProviderConfig = (providerId) => {
  const saved = providerConfigs.value[providerId];
  if (saved) {
    editApiUrl.value = saved.apiUrl || '';
    editApiKey.value = saved.apiKey || '';
    editModel.value = saved.model || '';
    return;
  }

  const preset = getProvider(providerId);
  if (providerId === 'custom') {
    editApiUrl.value = '';
    editApiKey.value = '';
    editModel.value = '';
    return;
  }
  editApiUrl.value = preset?.apiUrl || '';
  editApiKey.value = '';
  editModel.value = preset?.defaultModel || '';
};

const onProviderChange = (nextProvider) => {
  provider.value = nextProvider;
  applyProviderConfig(nextProvider);
};

const fetchSettings = async () => {
  const data = await request('/api/settings');
  provider.value = getProvider(data.provider) ? data.provider : DEFAULT_PROVIDER;
  editRounds.value = data.contextRounds || 100;
  enableToolResultTruncate.value = data.enableToolResultTruncate !== false;
  toolResultMaxChars.value = Number(data.toolResultMaxChars) || 12000;
  enableToolLoopLimit.value = data.enableToolLoopLimit !== false;
  toolMaxRounds.value = Number(data.toolMaxRounds) || 50;
  editApiUrl.value = data.apiUrl || '';
  editApiKey.value = data.apiKey || '';
  editModel.value = data.model || '';
  providerConfigs.value[provider.value] = {
    apiUrl: editApiUrl.value,
    apiKey: editApiKey.value,
    model: editModel.value
  };
  saveProviderConfigs();
};

const fetchSkills = async () => {
  skillsLoading.value = true;
  skillsError.value = '';
  try {
    const data = await request('/api/settings/skills');
    skillItems.value = Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    skillsError.value = '技能列表加载失败：{message}'.replace('{message}', e.message);
  } finally {
    skillsLoading.value = false;
  }
};

const save = async () => {
  try {
    saveNotice.value = { type: '', message: '' };
    const maxChars = Math.max(1000, Math.min(50000, Number(toolResultMaxChars.value) || 12000));
    const maxRounds = Math.max(1, Math.min(500, Number(toolMaxRounds.value) || 50));
    toolResultMaxChars.value = maxChars;
    toolMaxRounds.value = maxRounds;

    await request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider.value,
        contextRounds: editRounds.value,
        enableToolResultTruncate: enableToolResultTruncate.value,
        toolResultMaxChars: maxChars,
        enableToolLoopLimit: enableToolLoopLimit.value,
        toolMaxRounds: maxRounds,
        apiUrl: editApiUrl.value,
        apiKey: editApiKey.value,
        model: editModel.value
      })
    });

    providerConfigs.value[provider.value] = {
      apiUrl: editApiUrl.value,
      apiKey: editApiKey.value,
      model: editModel.value
    };
    saveProviderConfigs();
    saveNotice.value = { type: 'success', message: '配置已保存' };
  } catch (e) {
    saveNotice.value = {
      type: 'error',
      message: '保存失败：{message}'.replace('{message}', e.message)
    };
  }
};

onMounted(async () => {
  loadProviderConfigs();
  await Promise.all([fetchSettings(), fetchSkills()]);
});
</script>
