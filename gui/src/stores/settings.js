import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
    const showSettings = ref(false);

    function openSettings() { showSettings.value = true; }
    function closeSettings() { showSettings.value = false; }

    return { showSettings, openSettings, closeSettings };
});
