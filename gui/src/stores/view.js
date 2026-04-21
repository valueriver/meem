import { defineStore } from 'pinia';
import { ref } from 'vue';

const isDesktop = () => (typeof window !== 'undefined' && window.innerWidth >= 768);

export const useViewStore = defineStore('view', () => {
    const drawerOpen = ref(isDesktop());

    const navItems = [
        {
            path: '/app/agent',
            label: 'Agent',
            iconPath: 'M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4 M9 12h6 M9.5 15.5h5 M9.5 8.5h5',
        },
        {
            path: '/app/shell',
            label: 'Shell',
            iconPath: 'M4 17l6-6-6-6 M12 19h8',
        },
        {
            path: '/app/files',
            label: 'Files',
            iconPath: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
        },
    ];

    function toggleDrawer() { drawerOpen.value = !drawerOpen.value; }
    function closeDrawer() { drawerOpen.value = false; }
    function openDrawer() { drawerOpen.value = true; }

    return { drawerOpen, navItems, toggleDrawer, closeDrawer, openDrawer };
});
