import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";
import { router } from "./system/router.js";
import { useThemeStore } from "./stores/theme.js";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
useThemeStore(pinia);
app.mount("#app");
