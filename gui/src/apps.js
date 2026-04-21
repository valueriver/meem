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
