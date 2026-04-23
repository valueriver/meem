const apps = [
  {
    id: 'agent',
    name: 'Agent',
    icon: '\u{1F4AC}',
    load: () => import('./apps/chat/index.vue'),
    intent: () => import('./apps/chat/intent.js')
  },
  {
    id: 'shell',
    name: 'Shell',
    icon: '\u{1F5A5}\u{FE0F}',
    load: () => import('./apps/shell/index.vue')
  },
  {
    id: 'files',
    name: 'Files',
    icon: '\u{1F5C2}',
    load: () => import('./apps/files/index.vue')
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: '\u26A1',
    load: () => import('./apps/tasks/index.vue'),
    intent: () => import('./apps/tasks/intent.js')
  },
  {
    id: 'memory',
    name: 'Memory',
    icon: '\u{1F4AD}',
    load: () => import('./apps/memory/index.vue')
  },
  {
    id: 'notebook',
    name: 'Notebook',
    icon: '\u{1F4D3}',
    load: () => import('./apps/notebook/index.vue')
  },
  {
    id: 'code-viewer',
    name: 'Code Viewer',
    icon: '\u{1F5A5}',
    load: () => import('./apps/code-viewer/index.vue')
  },
  {
    id: 'codex',
    name: 'Codex',
    icon: '\u{1F4BB}',
    load: () => import('./apps/codex/index.vue')
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: '\u{1F9E0}',
    load: () => import('./apps/claude-code/index.vue')
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '\u2699\uFE0F',
    load: () => import('./apps/settings/index.vue'),
    hidden: true
  }
];

const getApp = (appId) => apps.find((item) => item.id === appId) || null;

export {
  apps,
  getApp
};
