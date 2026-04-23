import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apps } from '../apps.js';

const isDesktop = () => (typeof window !== 'undefined' && window.innerWidth >= 768);

const ICON_PATHS = {
    agent: 'M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4 M9 12h6 M9.5 15.5h5 M9.5 8.5h5',
    shell: 'M4 17l6-6-6-6 M12 19h8',
    files: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    tasks: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    memory: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
    notebook: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z',
    'code-viewer': 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
    codex: 'M10 20l4-16 M4 8l-4 4 4 4 M20 8l4 4-4 4',
    'claude-code': 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z',
    settings: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.22.65.22 1H21a2 2 0 1 1 0 4h-.09c-.36 0-.7.08-1.01.22z',
};

const navItems = apps
    .filter((app) => !app.hidden)
    .map((app) => ({
        path: `/app/${app.id}`,
        label: app.name,
        iconPath: ICON_PATHS[app.id] || 'M12 5v14 M5 12h14',
    }));

export const useViewStore = defineStore('view', () => {
    const drawerOpen = ref(isDesktop());

    function toggleDrawer() { drawerOpen.value = !drawerOpen.value; }
    function closeDrawer() { drawerOpen.value = false; }
    function openDrawer() { drawerOpen.value = true; }

    return { drawerOpen, navItems, toggleDrawer, closeDrawer, openDrawer };
});
