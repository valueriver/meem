import { computed, reactive } from 'vue';
import { wallpaperList } from '../components/desktop/wallpapers.js';

const DEFAULT_WALLPAPER_ID = 'wp-sea-mist-blue-bay';

const state = reactive({
  wallpaperId: localStorage.getItem('aios-wallpaper') || DEFAULT_WALLPAPER_ID
});

const wallpaperId = computed(() => state.wallpaperId);

const currentWallpaper = computed(() =>
  wallpaperList.find((item) => item.id === state.wallpaperId) || wallpaperList[0]
);

const desktopTheme = computed(() => currentWallpaper.value?.desktopTheme || 'light');

const setWallpaper = (id) => {
  state.wallpaperId = id;
  localStorage.setItem('aios-wallpaper', id);
};

export {
  wallpaperId,
  currentWallpaper,
  desktopTheme,
  setWallpaper
};
