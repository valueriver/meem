<template>
  <div class="cc-app-root relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <!-- Onboarding: CLI not installed -->
    <Onboarding v-if="cliStatus && !cliStatus.installed" :checking="checkingStatus" @recheck="fetchStatus" />

    <!-- Normal: tabs + content -->
    <template v-else>
    <div class="cc-topbar">
      <div class="cc-titleblock">
        <div class="cc-kicker">Code Agent</div>
        <div class="cc-title">Claude Code</div>
      </div>
      <div class="cc-tabs">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="tab-btn"
          :class="{ 'tab-active': activeTab === t.id }"
          @click="activeTab = t.id"
        >
          <span class="tab-icon">{{ t.icon }}</span>
          <span>{{ t.label }}</span>
        </button>
      </div>
    </div>

    <!-- Tab content -->
    <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
      <ChatTab     v-if="activeTab === 'chat'"     :installed="cliStatus?.installed || false" />
      <ProjectsTab v-else-if="activeTab === 'projects'" :data="projects" :loading="projectsLoading" />
      <AccountTab  v-else-if="activeTab === 'account'"  :data="account" />
      <PluginTab   v-else-if="activeTab === 'plugin'"   :data="plugins" :loading="pluginsLoading" />
      <AgentsTab   v-else-if="activeTab === 'agents'"   :data="agents" />
      <McpTab      v-else-if="activeTab === 'mcp'"      :data="mcp" />
      <StatsTab    v-else-if="activeTab === 'stats'"    :data="stats" />
      <HistoryTab  v-else-if="activeTab === 'history'"  :data="history" />
      <SkillsTab   v-else-if="activeTab === 'skills'"   :data="skills" />
      <PlansTab    v-else-if="activeTab === 'plans'"    :data="plans" />
      <MemoryTab   v-else-if="activeTab === 'memory'"   :data="memory" @refresh="loaders.memory()" />
      <SettingsTab v-else-if="activeTab === 'settings'" :data="settings" @refresh="loaders.settings()" />
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import './ui.css';

import ChatTab from './tabs/ChatTab.vue';
import ProjectsTab from './tabs/ProjectsTab.vue';
import AccountTab from './tabs/AccountTab.vue';
import PluginTab from './tabs/PluginTab.vue';
import AgentsTab from './tabs/AgentsTab.vue';
import McpTab from './tabs/McpTab.vue';
import StatsTab from './tabs/StatsTab.vue';
import HistoryTab from './tabs/HistoryTab.vue';
import SkillsTab from './tabs/SkillsTab.vue';
import PlansTab from './tabs/PlansTab.vue';
import MemoryTab from './tabs/MemoryTab.vue';
import SettingsTab from './tabs/SettingsTab.vue';
import Onboarding from './Onboarding.vue';

const tabs = [
  { id: 'chat',     icon: '💬', label: '聊天' },
  { id: 'projects', icon: '🗂', label: '项目' },
  { id: 'memory',   icon: '🧠', label: 'CLAUDE.md' },
  { id: 'plans',    icon: '🗺', label: '计划' },
  { id: 'history',  icon: '🕐', label: '历史' },
  { id: 'skills',   icon: '✨', label: '技能' },
  { id: 'plugin',   icon: '🧩', label: '插件' },
  { id: 'agents',   icon: '🤖', label: 'Agents' },
  { id: 'mcp',      icon: '🌐', label: 'MCP' },
  { id: 'stats',    icon: '📊', label: '统计' },
  { id: 'settings', icon: '⚙️', label: '设置' },
  { id: 'account',  icon: '👤', label: '账户' }
];

const activeTab = ref('chat');
const cliStatus = ref(null);
const checkingStatus = ref(false);

const stats = ref(null);
const history = ref(null);
const account = ref(null);
const settings = ref(null);
const agents = ref(null);
const mcp = ref(null);
const plans = ref(null);
const skills = ref(null);
const plugins = ref(null);
const pluginsLoading = ref(false);
const memory = ref(null);
const projects = ref(null);
const projectsLoading = ref(false);

const loaders = {
  stats: async () => { stats.value = await (await fetch('/apps/claude-code/stats')).json(); },
  history: async () => { history.value = await (await fetch('/apps/claude-code/history?limit=300')).json(); },
  account: async () => { account.value = await (await fetch('/apps/claude-code/account')).json(); },
  settings: async () => { settings.value = await (await fetch('/apps/claude-code/settings')).json(); },
  agents: async () => { agents.value = await (await fetch('/apps/claude-code/agents')).json(); },
  mcp: async () => { mcp.value = await (await fetch('/apps/claude-code/mcp')).json(); },
  plans: async () => { plans.value = await (await fetch('/apps/claude-code/plans')).json(); },
  skills: async () => { skills.value = await (await fetch('/apps/claude-code/skills')).json(); },
  memory: async () => { memory.value = await (await fetch('/apps/claude-code/memory')).json(); },
  plugin: async () => {
    pluginsLoading.value = true;
    try { plugins.value = await (await fetch('/apps/claude-code/plugins')).json(); }
    finally { pluginsLoading.value = false; }
  },
  projects: async () => {
    projectsLoading.value = true;
    try { projects.value = await (await fetch('/apps/claude-code/projects')).json(); }
    finally { projectsLoading.value = false; }
  }
};

watch(activeTab, (t) => {
  const fn = loaders[t];
  if (fn) fn();
});

const fetchStatus = async () => {
  checkingStatus.value = true;
  try {
    const r = await fetch('/apps/claude-code/status');
    cliStatus.value = await r.json();
  } catch {
    cliStatus.value = { installed: false };
  } finally {
    checkingStatus.value = false;
  }
};

onMounted(fetchStatus);
</script>

<style scoped>
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.tab-btn:hover {
  background: var(--color-bg-hi);
  color: var(--color-ink);
}
.tab-active {
  background: var(--color-bg-hi);
  border-color: var(--color-line-hi);
  color: var(--color-ink);
}
.tab-icon { font-size: 13px; opacity: 0.8; }
</style>
